import math
from fastapi import Depends, FastAPI, HTTPException, Query
from pydantic import BaseModel, field_validator
from typing import Annotated, Tuple
from sqlmodel import Field, Session, SQLModel, create_engine, select, func, case
from fastapi.middleware.cors import CORSMiddleware
import json



class Product(SQLModel, table=True):
  id: int = Field(primary_key=True)
  id_supermarket: int = Field(foreign_key="supermarket.id")
  sku: str | None = Field(default=None)
  name: str
  price: float
  img_src: str | None
  link: str

class Supermarket(SQLModel, table=True):
  id: int = Field(primary_key=True)
  name: str
  url: str
  img_src: str
  active: int | None = Field(default=None)

class Offer(SQLModel, table=True):
  id: int = Field(primary_key=True)
  id_product: int = Field(foreign_key="product.id")
  text: str | None
  price: float
  is_restricted: str | None


class OfferResponse(BaseModel):
  id: int
  text: str | None
  price: float
  is_restricted: str | None

class ProductSearchResponse(BaseModel):
  id: int
  sku: str | None
  name: str
  price: float
  img_src: str | None
  link: str
  supermarket_img: str
  offers: list[OfferResponse] | None

  @field_validator('offers', mode='before')
  def parse_offers(cls, v):
    # Si el campo 'offers' es una cadena JSON, la deserializamos
    if isinstance(v, str):
      return json.loads(v)  # Convierte la cadena JSON en una lista de diccionarios
    return v



user = "root"
password = "12345"
db_name = "scraper_ejer"
engine = create_engine(f"mysql+mysqldb://{user}:{password}@localhost:3306/{db_name}")

# Se crea una dependencia de FastAPI con yield para usar una nueva Session en cada solicitud. Esto es lo que garantiza que utilicemos una única sesión por solicitud
def get_session():
  with Session(engine) as session:
    yield session

SessionDep = Annotated[Session, Depends(get_session)]


app = FastAPI()

# Permitir CORS desde cualquier origen (esto puede ajustarse según sea necesario)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todos los orígenes (ajustar según sea necesario)
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos HTTP (GET, POST, etc.)
    allow_headers=["*"],  # Permite todos los encabezados
)

@app.on_event("startup")
def on_startup():
  SQLModel.metadata.create_all(engine)


@app.get("/")
async def root():
  return {
    "products": "http://127.0.0.1:8000/products",
    "search": "http://127.0.0.1:8000/search",
    "supermarkets": "http://127.0.0.1:8000/supermarkets",
    "docs": "http://127.0.0.1:8000/docs"
  }

# Obtener todos los productos
@app.get("/products", tags=['Products'])
async def get_products(session: SessionDep, page: Annotated[int, Query(gt=0)] = 1, limit: Annotated[int, Query(le=100)] = 50) -> list[Product]:
  statement = select(Product).offset((page - 1) * limit).limit(limit)
  products = session.exec(statement).all()
  return products


@app.get("/products/{id}", tags=['Products'])
async def get_product(id : int, session: SessionDep) -> Product:
  product = session.get(Product, id)
  if not product:
    raise HTTPException(status_code=404, detail=f"Producto con id '{id}' no encontrado")
  return product

@app.get("/search", tags=['Products'])
async def search_product(
  session: SessionDep, 
  q: Annotated[str, Query(min_length=1)], 
  order:str = "OrderByPriceASC", 
  supermarket:int | None = None, 
  onlyWithOffers:bool = False, 
  page: Annotated[int, Query(gt=0)] = 1, 
  limit: Annotated[int, Query(le=100)] = 50
) -> Tuple[list[ProductSearchResponse], int, int]:

  statement_products = (
    select(
      Product.id, 
      Product.sku, 
      Product.name, 
      Product.price, 
      Product.img_src, 
      Product.link, 
      Supermarket.img_src.label("supermarket_img"),
      case(
        (func.count(Offer.id) == 0, None),  # No hay ofertas
        else_=func.json_arrayagg(
          func.json_object(
            'id', Offer.id,
            'text', Offer.text,
            'price', Offer.price,
            'is_restricted', Offer.is_restricted
          )
        )
      ).label("offers")
    )
    .join(Supermarket) # INNER JOIN
    .join(Offer, isouter=not onlyWithOffers)  # isouter=True --> LEFT JOIN || isouter=False --> INNER JOIN
    .group_by(Product.id)
    .offset((page - 1) * limit).limit(limit)
  )
  statement_amt_total_products = select(func.count(Product.id)).join(Offer, isouter=not onlyWithOffers)


  splitedQuery = q.split(' ')
  for wordOfQuery in splitedQuery:
    statement_products = statement_products.where(Product.name.like(f"%{wordOfQuery}%"))
    statement_amt_total_products = statement_amt_total_products.where(Product.name.like(f"%{wordOfQuery}%"))


  if supermarket:
    statement_products = statement_products.where(Product.id_supermarket == supermarket)
    statement_amt_total_products = statement_amt_total_products.where(Product.id_supermarket == supermarket)


  if order == "OrderByPriceDESC":
    statement_products = statement_products.order_by(func.coalesce(func.min(Offer.price), Product.price).desc(), Product.id)
  elif order == "OrderByNameASC":
    statement_products = statement_products.order_by(Product.name, Product.id)
  elif order == "OrderByNameDESC":
    statement_products = statement_products.order_by(Product.name.desc(), Product.id)
  else:
    # OrderByPriceASC 
    statement_products = statement_products.order_by(func.coalesce(func.min(Offer.price), Product.price), Product.id)

  products = session.exec(statement_products).all()
  amt_total_products = session.exec(statement_amt_total_products).first()

  return products, amt_total_products, math.ceil(amt_total_products / limit)
  


# No se si son necesarios, pero...
@app.get("/supermarkets", tags=['Supermarkets'])
async def get_supermarkets(session: SessionDep) -> list[Supermarket]:
  supermarkets = session.exec(select(Supermarket).where(Supermarket.active == 1)).all()
  return supermarkets

@app.get("/supermarkets/{id}", tags=['Supermarkets'])
async def get_supermarket(id : int, session: SessionDep)  -> Supermarket:
  supermarket = session.get(Supermarket, id)
  if not supermarket:
    raise HTTPException(status_code=404, detail=f"Supermercado con id '{id}' no encontrado")
  return supermarket
