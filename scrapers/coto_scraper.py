import requests
import time
import re
import mysql.connector
from lxml import html

AMOUNT_PRODUCTS = 100

# socks5://<user>:<pass>@<ip>:<port>
PROXIES = [
  "socks5://14a596aa03cf7:16415a7002@200.26.190.84:12324",
  "socks5://14a596aa03cf7:16415a7002@23.26.52.168:12324",
  "socks5://14a596aa03cf7:16415a7002@64.40.148.245:12324",
  "socks5://14a596aa03cf7:16415a7002@136.175.227.96:12324",
  "socks5://14a596aa03cf7:16415a7002@194.147.220.211:12324",
  None # Mi IP
]


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
      if product[0] not in seen:
        unique_products.append(product)
        seen.add(product[0])
      else:
        print('Producto repetido:', product[1])
  print('Cantidad de productos totales sin repetidos:', len(unique_products))
  return unique_products


pagesWithProblems = []
proxyIndex = 0

def get_coto_products(page = 1):
  global proxyIndex
  global pagesWithProblems

  products_scraped = []
  try :
    print('Página:', page)
    from_product = (page - 1) * AMOUNT_PRODUCTS
    link = f'https://www.cotodigital3.com.ar/sitios/cdigi/browse?Dy=1&Nf=product.endDate%7CGTEQ+1.7285184E12%7C%7Cproduct.startDate%7CLTEQ+1.7285184E12&No={from_product}&Nr=AND%28product.language%3Aespa%C3%B1ol%2Cproduct.sDisp_200%3A1004%2Cproduct.siteId%3ACotoDigital%2COR%28product.siteId%3ACotoDigital%29%29&Nrpp={AMOUNT_PRODUCTS}&Nty=1&_D%3AidSucursal=+&_D%3AsiteScope=+&atg_store_searchInput=sku00000000&idSucursal=200&siteScope=ok'

    print("Turno del proxy:", PROXIES[proxyIndex])
    r = requests.get(
      link, 
      headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36' },
      proxies={"http": PROXIES[proxyIndex], "https": PROXIES[proxyIndex]}
    )
    print('Status code:', r.status_code)

    if(proxyIndex == len(PROXIES) - 1):
      proxyIndex = 0
    else:
      proxyIndex = proxyIndex + 1
    
    tree = html.fromstring(r.content)
    products = tree.xpath("//ul[@id='products']//li[@id]") # Pareciera que el HTML que devuelve esta malformado, por eso: '...//li[@id]' y no '.../li'

    print('Cant. de productos:', len(products))
    print('---')
    for product in products:
      product_id = product.xpath("./@id")[0]
      product_sku = product_id.replace('li_prod', '')
      product_name = product.xpath(f".//*[@id='descrip_full_sku{product_sku}']/text()")[0] # Arreglar problema de codificación
      product_price = product.xpath(".//span[@class='atg_store_productPrice']/span/text()")[0].strip()
      product_img = product.xpath(".//div[@class='product_info_container']/a/span[@class='atg_store_productImage']/img/@src")[0]
      product_url = product.xpath(".//div[@class='product_info_container']/a/@href")[0]
      
      formatted_price = priceToNumber(product_price)
      products_scraped.append([product_sku, product_name, formatted_price, product_img, f'https://www.cotodigital3.com.ar{product_url}'])

    if len(products) == AMOUNT_PRODUCTS:
      time.sleep(120) # 60 es muy poco, corta en 18.
      more_products_scraped = get_coto_products(page + 1)
      products_scraped.extend(more_products_scraped)
  except:
    print('--- La recolección de la página:', page, 'falló')
    pagesWithProblems.append(page)
    time.sleep(120)
    more_products_scraped = get_coto_products(page + 1)
    products_scraped.extend(more_products_scraped)

  finally:
    return products_scraped


if __name__ == '__main__':
  coto_products = get_coto_products()
  print('Cantidad de productos totales:', len(coto_products))
  #coto_products = remove_duplicate_products(coto_products)
  print('Páginas con problemas:', pagesWithProblems)

  conn = mysql.connector.connect(
    host='127.0.0.1',
    user='root',
    password='12345',
    database='scraper_ejer'
  )
  cursor = conn.cursor()
  cursor.execute("DELETE FROM product WHERE id_supermarket = 1")
  insert_query = "INSERT INTO product (id_supermarket, sku, name, price, img_src, link) VALUES (1, %s, %s, %s, %s, %s)"
  cursor.executemany(insert_query, coto_products)
  conn.commit()

  cursor.close()
  conn.close()

  print("Registros eliminados e insertados exitosamente.")
