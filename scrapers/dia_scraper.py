import requests
import re
import json
import base64
from urllib.parse import urlencode
import mysql.connector


URL_BASE = "https://diaonline.supermercadosdia.com.ar/"
CANT_REG_VTEX = 49
DEFAULT_VTEX_PARAMETERS = {
  "workspace": "master",
  "maxAge": "short",
  "appsEtag": "remove",
  "domain": "store",
  "locale": "es-AR",
  "operationName": "productSearchV3",
  # "variables": {},
  "extensions": {
    "persistedQuery": {
      "version": 1,
      "sha256Hash": "9177ba6f883473505dc99fcf2b679a6e270af6320a157f0798b92efeab98d5d3",
      "sender": "vtex.store-resources@0.x",
      "provider": "vtex.search-graphql@0.x"
    },
    "variables": {
      "hideUnavailableItems": True,
      "skusFilter": "ALL_AVAILABLE", # Puede ser ALL_AVAILABLE o FIRST_AVAILABLE
      "simulationBehavior": "default",
      "installmentCriteria":"MAX_WITHOUT_INTEREST", # Ordena las promociones en cuotas. De aquellas con mas cuotas y menos interes
      "productOriginVtex": True,
      "map": "", # Se modifica
      "query": "", # Se modifica
      # orderBy: "OrderByScoreDESC",
      "from": 0, # Se modifica
      "to": 19, # Se modifica
      "selectedFacets": [], # Se modifica
      "operator": "and"
    }
  }
}

def get_dia_categories():
  print("Obteniendo las categorias de día")

  headers = {
    "Content-Type": "application/json",
    "x-vtex-locale": "es-AR"
  }
  body = {
    "operationName": "getMenus", 
    "extensions": {
       "persistedQuery": {
          "version": 1,
          "sha256Hash": "2781e77265654ec0e828dbef6ef02f1eaeb97d3d2bca80e7d435e1e7d5213c85", 
          "provider": "diaio.extended-mega-menu@0.x", 
          "sender": "diaio.custom-mega-menu@0.x"
       }
    }
  }
  request = requests.post(f"{URL_BASE}_v/private/graphql/v1?workspace=master&maxAge=long&appsEtag=remove&domain=store&locale=es-AR", headers=headers, json=body)
  
  if request.status_code == 200:
    response = request.json()
    menus = response["data"]["menus"]
    menus.pop(0)

    categories = {}
    for menu_item in menus:
      menu_url = menu_item["slug"]
      category = menu_url.replace(URL_BASE, '')
      if "/" not in category:
        categories[category] = []
        for submenu_item in menu_item["menu"]:
          if "/" not in submenu_item["slugRoot"]:
            categories[category].append(submenu_item["slugRoot"])

    return categories
  else:
    print(f"Error: {request.status_code}, {request.text}")
    return None

def get_dia_endpoint(categories, page):
  new_parameters = json.loads(json.dumps(DEFAULT_VTEX_PARAMETERS)) # Copia profunda
  new_parameters["extensions"]["variables"]["from"] = CANT_REG_VTEX * (page - 1)
  new_parameters["extensions"]["variables"]["to"] = CANT_REG_VTEX * page - 1
  new_parameters["extensions"]["variables"]["query"] = "/".join(categories)
  new_parameters["extensions"]["variables"]["map"] = ",".join(["c"] * len(categories))
  new_parameters["extensions"]["variables"]["selectedFacets"] = [{"key": "c", "value": category} for category in categories]

  # Codificar el objeto `variables` en Base64
  json_string = json.dumps(new_parameters["extensions"]["variables"])
  encoded_variables = base64.b64encode(json_string.encode("utf-8")).decode("utf-8")
  new_parameters["extensions"]["variables"] = encoded_variables

  # Construir los parámetros de la URL
  params = {}
  for key, value in new_parameters.items():
      if not isinstance(value, dict):  # Si no es un objeto, agregar directamente
          params[key] = value
      else:  # Si es un objeto, serializarlo
          params[key] = json.dumps(value)

  # Crear la cadena de consulta
  query_string = urlencode(params)

  # Retornar la URL final
  return f"{URL_BASE}_v/segment/graphql/v1?{query_string}"

def get_dia_products_by_categories(categories, page = 1):
  endpoint_url = get_dia_endpoint(categories, page)

  subcategory_products = []
  headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'es-AR,es;q=0.9',
    'Connection': 'keep-alive'
  }
  r = requests.get(endpoint_url, headers=headers)
  
  if r.status_code == 200:
    data = r.json()
    product_returned = data["data"]["productSearch"]["products"]
    if len(product_returned) > 0:
      for product in product_returned:
        ean = product["items"][0]["ean"] if product["items"][0]["ean"] else None
        subcategory_products.append([
          ean,
          product["productName"],
          product["items"][0]["sellers"][0]["commertialOffer"]["Price"],
          product["items"][0]["images"][0]["imageUrl"],
          f"{URL_BASE}{product["linkText"]}/p"
        ])
  
  if len(subcategory_products) == CANT_REG_VTEX:
    more_subcategory_products = get_dia_products_by_categories(categories, page + 1)
    subcategory_products = subcategory_products + more_subcategory_products

  return subcategory_products

def get_dia_products(categories):
  products = []
  for category in categories:
    for subcategory in categories[category]:
      subcategory_products = get_dia_products_by_categories([category, subcategory])
      products = products + subcategory_products
  
  return products


def remove_duplicate_products(products):
  seen = set()
  unique_products = []
  for product in products:
    # product[4] = URL del producto
    if product[4] not in seen:
      unique_products.append(product)
      seen.add(product[4])
    else:
      print('Producto repetido:', product[1])
  return unique_products

if __name__ == "__main__":
  dia_categories = get_dia_categories()
  dia_products = get_dia_products(dia_categories)

  print('Cantidad de productos totales:', len(dia_products))
  dia_products = remove_duplicate_products(dia_products)
  print('Cantidad de productos sin repetidos:', len(dia_products))

  conn = mysql.connector.connect(
    host='127.0.0.1',
    user='root',
    password='12345',
    database='scraper_ejer'
  )
  cursor = conn.cursor()
  cursor.execute("DELETE FROM product WHERE id_supermarket = 5")
  insert_query = "INSERT INTO product (id_supermarket, sku, name, price, img_src, link) VALUES (5, %s, %s, %s, %s, %s)"
  cursor.executemany(insert_query, dia_products)
  conn.commit()

  cursor.close()
  conn.close()

  print("Registros eliminados e insertados exitosamente.")
