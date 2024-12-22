import requests
import time
import re
import mysql.connector
from lxml import html

AMOUNT_PRODUCTS = 100
PROXIES = []


# socks5://<user>:<pass>@<ip>:<port>
def obtainsProxies():
  global PROXIES
  with open("proxies.txt", "r") as archivo:
    proxiesLines = archivo.readlines()

  # Remover el carácter de salto de línea (\n) al final de cada item
  PROXIES = [proxyLine.strip() for proxyLine in proxiesLines]
  PROXIES.append(None)


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
    # product[0] = sku del producto
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

    # Roto el proxy
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
      product_name = product.xpath(f".//*[@id='descrip_full_sku{product_sku}']/text()")[0]
      product_img = product.xpath(".//div[@class='product_info_container']/a/span[@class='atg_store_productImage']/img/@src")[0]
      product_url = product.xpath(".//div[@class='product_info_container']/a/@href")[0]
      
      container_price_regular = product.xpath(f".//div[@id='divProductAddCart_sku{product_sku}']//div[@class='price_regular_container']//span[2]")
      regular_price = product.xpath(".//span[@class='atg_store_productPrice']/span/text()")[0].strip()
      offers = []
      isNormalOffer = True
      
      if len(container_price_regular) > 0:
        # El producto tiene oferta
        container_first_type_offer = product.xpath(f".//div[@id='divProductAddCart_sku{product_sku}']//div[@class='product_discount']//div[@class='first_price_discount_container']/span")
        container_second_type_offer = product.xpath(f".//div[@id='divProductAddCart_sku{product_sku}']//div[@class='product_discount']//div[@class='second_price_discount_container']/span")

        if len(container_first_type_offer) > 0:
          # Oferta para todos pero formato distinto
          isNormalOffer = False
          offer_price = container_first_type_offer[0].text_content().strip()
          offer_price = offer_price.replace('c/u', '')
          offer_text = product.xpath(f".//div[@id='divProductAddCart_sku{product_sku}']//div[@class='product_discount']//div[@class='first_price_discount_container']//span[@class='text_price_discount']/text()")[0]
          
          isDtoNormal = re.search(r'\d+%Dto', offer_text)
          if isDtoNormal:
            offer_text = None
            
          offers.append([offer_text, priceToNumber(offer_price), None])

        
        if len(container_second_type_offer) > 0:
          # Oferta para comunidad coto
          isNormalOffer = False
          offer_price = container_second_type_offer[0].text_content().strip()
          offer_price = offer_price.replace('c/u', '')
          offer_text = product.xpath(f".//div[@id='divProductAddCart_sku{product_sku}']//div[@class='product_discount']//div[@class='second_price_discount_container']//span[@class='text_price_discount']/text()")[0]
          offers.append([offer_text, priceToNumber(offer_price), 'Comunidad coto'])
        
        if isNormalOffer:
          # Oferta "normal"
          offer_price = regular_price
          offers.append([None, priceToNumber(offer_price), None])
          
        #print(offers)
        if container_price_regular[0].text_content().strip():
          regular_price = container_price_regular[0].text_content().strip()
      
      products_scraped.append([product_sku, product_name.strip(), priceToNumber(regular_price), product_img, f'https://www.cotodigital3.com.ar{product_url}', offers])

    if len(products) == AMOUNT_PRODUCTS and not onlyScrapThisPage:
      time.sleep(100) # 60 es muy poco, corta en 18.
      more_products_scraped = get_coto_products(page + 1)
      products_scraped.extend(more_products_scraped)

  except Exception as e:
    print(f"Mensaje de error: {e}")
    if not onlyScrapThisPage:
      print('--- La recolección de la página:', page, 'falló')
      pagesWithProblems.append(page)
      time.sleep(100)
      more_products_scraped = get_coto_products(page + 1)
      products_scraped.extend(more_products_scraped)
    else:
      print('--- La recolección de la página:', page, 'volvió a fallar')

  finally:
    return products_scraped


if __name__ == '__main__':
  obtainsProxies()
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
    VALUES (%s, %s, %s, %s, %s, %s)
  """
  insert_offer_query = """
    INSERT INTO offer (id_product, text, price, is_restricted)
    VALUES (%s, %s, %s, %s)
  """
  for product in coto_products:
    product_sku, product_name, regular_price, product_img, product_url, offers = product

    # Insertar producto
    cursor.execute(insert_product_query, (1, product_sku, product_name, regular_price, product_img, product_url))
    product_id = cursor.lastrowid  # Obtener el ID del producto insertado

    # Insertar ofertas relacionadas (si existen)
    for offer in offers:
      offer_text, offer_price, is_restricted = offer
      cursor.execute(insert_offer_query, (product_id, offer_text, offer_price, is_restricted))

  conn.commit()
  
  cursor.close()
  conn.close()

  print("Registros eliminados e insertados exitosamente.")
