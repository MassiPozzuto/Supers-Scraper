import json
import requests
import re
import mysql.connector

URL_BASE = "https://www.cotodigital.com.ar/sitios/cdigi"
AMOUNT_PRODUCTS = 100

def priceToNumber(price):
  # Regex para identificar si los precios estan en el formato español
  regex_es = r"^\d{1,3}(\.\d{3})*(,\d+)?$"

  number = price.replace('$', '')
  if re.match(regex_es, number):
    # Si estan en formato español, los cambiamos
    number = number.replace('.', '').replace(',', '.')
  return float(number)


def remove_duplicate_products(products):
  seen = set()
  unique_products = []
  for product in products:
    # product[0] = ean del producto
    if product[0] not in seen:
      unique_products.append(product)
      seen.add(product[0])
    else:
      print('Producto repetido:', product[1])
  print('Cantidad de productos totales sin repetidos:', len(unique_products))
  return unique_products


pagesWithProblems = []
proxyIndex = 0

def get_coto_products(page = 1, onlyScrapThisPage = False):
    global proxyIndex
    global pagesWithProblems

    products_scraped = []
    try :
        print('---')
        print('Página:', page)
        from_product = (page - 1) * AMOUNT_PRODUCTS
        link = f"{URL_BASE}/categoria?Dy=1&No={from_product}&Nrpp={AMOUNT_PRODUCTS}&Nf=product.startDate%7CLTEQ+1.740528E12%7C%7Cproduct.endDate%7CGTEQ+1.740528E12&Nr=AND%28product.sDisp_200%3A1004%2Cproduct.language%3Aespa%C3%B1ol%2COR%28product.siteId%3ACotoDigital%29%29&format=json"
        print(link)

        r = requests.get(
            link, 
            headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36' }
        )
        print('Status code:', r.status_code)
        
        data = r.json()
        products_returned = data["contents"][0]["Main"][2]["contents"][0]["records"]

        if len(products_returned) > 0:
            for product in products_returned:
                product_attributes = product["records"][0]["attributes"]
                if "sku.activePrice" not in product_attributes:
                    continue

                ean = product_attributes["product.eanPrincipal"][0]
                name = product_attributes["sku.displayName"][0].strip()
                regular_price = priceToNumber(product_attributes["sku.activePrice"][0])
                img_url = product_attributes["product.largeImage.url"][0]
                link_url = product["records"][0]["detailsAction"]["recordState"].split("?")[0]

                data_offers = json.loads(product_attributes["product.dtoDescuentos"][0])
                offers = []
                if len(data_offers) > 0:
                    for offer in data_offers:
                        #print(offer)
                        offer_text = offer["textoDescuento"]
                        offer_price = priceToNumber(offer["precioDescuento"].replace('c/u', ''))
                        offer_restriction = None
                        
                        isDtoNormal = re.search(r'\d+%Dto', offer_text)
                        if isDtoNormal:
                            offer_text = None

                        if offer["imagenDescuento"].find("comunidad") != -1: 
                            offer_restriction = "Exclusivo Comunidad Coto"
                            
                        offers.append([offer_text, offer_price, offer_restriction])
                
                products_scraped.append([
                    ean, 
                    name, 
                    regular_price, 
                    img_url, 
                    f"{URL_BASE}/productos{link_url}", 
                    offers
                ])
        
        print("Cantidad de productos retornados:", len(products_returned))
        if len(products_returned) == AMOUNT_PRODUCTS and not onlyScrapThisPage:
            more_products_scraped = get_coto_products(page + 1)
            products_scraped.extend(more_products_scraped)
        
    
    except Exception as e:
        print(f"Mensaje de error: {e}")
        if not onlyScrapThisPage:
            print('--- La recolección de la página:', page, 'falló')
            pagesWithProblems.append(page)
            more_products_scraped = get_coto_products(page + 1)
            products_scraped.extend(more_products_scraped)
        else:
            print('--- La recolección de la página:', page, 'volvió a fallar')

    finally:
        return products_scraped
        


if __name__ == '__main__':
  coto_products = get_coto_products()

  print('Páginas con problemas:', pagesWithProblems)
  if len(pagesWithProblems) > 0:
    for pageWithProblem in pagesWithProblems:
      productsWithProblems = get_coto_products(pageWithProblem, True)
      coto_products.extend(productsWithProblems)
  
  print('Cantidad de productos totales:', len(coto_products))
  coto_products = remove_duplicate_products(coto_products)
  print('Cantidad de productos sin repetidos:', len(coto_products))

  conn = mysql.connector.connect(
    host='127.0.0.1',
    user='root',
    password='12345',
    database='scraper_ejer'
  )
  cursor = conn.cursor()
  cursor.execute("DELETE FROM product WHERE id_supermarket = 1")

  insert_product_query = """
    INSERT INTO product (id_supermarket, sku, name, price, img_src, link)
    VALUES (1, %s, %s, %s, %s, %s)
  """
  insert_offer_query = """
    INSERT INTO offer (id_product, text, price, is_restricted)
    VALUES (%s, %s, %s, %s)
  """
  for product in coto_products:
    product_ean, product_name, regular_price, product_img, product_url, offers = product

    # Insertar producto
    cursor.execute(insert_product_query, (product_ean, product_name, regular_price, product_img, product_url))
    product_id = cursor.lastrowid  # Obtener el ID del producto insertado

    # Insertar ofertas relacionadas (si existen)
    for offer in offers:
      offer_text, offer_price, is_restricted = offer
      cursor.execute(insert_offer_query, (product_id, offer_text, offer_price, is_restricted))

  conn.commit()
  
  cursor.close()
  conn.close()

  print("Registros eliminados e insertados exitosamente.")