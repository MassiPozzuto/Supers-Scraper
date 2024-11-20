import math
from fastapi import Depends, FastAPI, HTTPException, Query, Path
from pydantic import BaseModel
from typing import Annotated, Tuple
from sqlmodel import Field, Session, SQLModel, create_engine, select, func
from rapidfuzz import fuzz
from fastapi.middleware.cors import CORSMiddleware



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

class ProductSearchResponse(BaseModel):
  id: int
  sku: str | None
  name: str
  price: float
  img_src: str | None
  link: str
  supermarket_img: str

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
  q:str | None = None, 
  order:str = "OrderByPriceASC", 
  supermarket:int | None = None, 
  page: Annotated[int, Query(gt=0)] = 1, 
  limit: Annotated[int, Query(le=100)] = 50
) -> Tuple[list[ProductSearchResponse], int, int]:

  if q:
    statement_products = select(Product.id, Product.sku, Product.name, Product.price, Product.img_src, Product.link, Supermarket.img_src.label("supermarket_img")).join(Supermarket)
    statement_amt_total_products = select(func.count(Product.id))

    splitedQuery = q.split(' ')
    for wordOfQuery in splitedQuery:
      statement_products = statement_products.where(Product.name.like(f"%{wordOfQuery}%"))
      statement_amt_total_products = statement_amt_total_products.where(Product.name.like(f"%{wordOfQuery}%"))

    if supermarket:
      statement_products = statement_products.where(Product.id_supermarket == supermarket)
      statement_amt_total_products = statement_amt_total_products.where(Product.id_supermarket == supermarket)

    if order == "OrderByPriceDESC":
      statement_products = statement_products.order_by(Product.price.desc())
    elif order == "OrderByNameASC":
      statement_products = statement_products.order_by(Product.name)
    elif order == "OrderByNameDESC":
      statement_products = statement_products.order_by(Product.name.desc())
    else:
      # OrderByPriceASC 
      statement_products = statement_products.order_by(Product.price)

    products = session.exec(statement_products.offset((page - 1) * limit).limit(limit)).all()
    amt_total_products = session.exec(statement_amt_total_products).first()
    return products, amt_total_products, math.ceil(amt_total_products / limit)
  
  raise HTTPException(status_code=404, detail=f"No se encontraron resultados para la búsqueda '{q}'")


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
