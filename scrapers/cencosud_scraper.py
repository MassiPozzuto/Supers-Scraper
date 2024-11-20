import time
import re
import mysql.connector
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.actions.wheel_input import ScrollOrigin



AMOUNT_PRODUCTS = 20
SUPERMARKET_NAME = 'Vea' # Cambiar según el supermercado cencosud que se quiera scrapear


def priceToNumber(price):
  # Regex para identificar si los precios estan en el formato español
  regex_es = r"^\d{1,3}(\.\d{3})*(,\d+)?$"

  number = price.replace('$', '')
  if re.match(regex_es, number):
    # Si estan en formato español, los cambiamos
    number = number.replace('.', '').replace(',', '.')
  return float(number)


def extract_amount_products(string):
    match = re.search(r'\d+', string)
    if match:
      return int(match.group())
    else:
      return 0


def get_super_cencosud_categories(driver, url):
  driver.get(url)
  # Espero a que este el boton de categorias para obtenerlo y luego le hago un hover
  menu = WebDriverWait(driver, 10).until(
    EC.visibility_of_element_located((By.CSS_SELECTOR, 'li.vtex-menu-2-x-menuItem--category-menu .vtex-menu-2-x-menuItem'))
  )
  ActionChains(driver).move_to_element(menu).perform()
  
  # Espero a que aparezca el menu
  WebDriverWait(driver, 10).until(
    EC.visibility_of_element_located((By.XPATH, "//nav/ul/li//li/div/a"))
  )

  categories = []
  menuItems = driver.find_elements(By.XPATH, "//nav/ul/li//li/div/a")
  for menuItem in menuItems:
    category = menuItem.get_attribute("href")
    categories.append(category.replace(url, ''))

  return categories



def get_cencosud_products(driver, url_base, url_category, page = 1):
  wait = WebDriverWait(driver, 10)

  sender_supermarket = 'veaargentina'
  if url_base.find('jumbo') != -1:
    sender_supermarket = 'jumboargentinaio'
  elif url_base.find('disco') != -1:
    sender_supermarket = 'discoargentina'

  driver.get(f"{url_base + url_category}?page={page}")
  wait.until(EC.presence_of_element_located((By.ID, 'search-result-anchor')))

  products_scraped = []
  total_products = driver.find_element(By.CLASS_NAME, 'vtex-search-result-3-x-totalProducts--layout').text
  total_products = extract_amount_products(total_products)
  
  if page == 1 and total_products > (AMOUNT_PRODUCTS * 50):
    # Como estos supermercados solo paginan hatsa 50 páginas, de 20 productos cada una. Si una categoria tiene más de 1000 productos, nunca podriamos obtener todos ya que la #
    # paginación nos limita. Por eso, tengo que recorrer sus subcategorias recursivamente y obtener los productos de ellas.
    type_category = len(url_category.split('/')) # 2 = categoria. 3 = subcategoria

    view_more_button = driver.find_elements(By.XPATH, f"//div[contains(@class, 'vtex-search-result-3-x-filter__container--category-{type_category}')]/div[2]//button")
    if view_more_button:
      time.sleep(0.5)
      view_more_button[0].click()
    else:
      # Hay algunas paginas que aunque no haya boton, no cargan todas las subcategorias de una, hay que scrollear dentro del elemento que los contiene
      # Solo lo vi en disco igual. Jumbo y Vea son practicamente iguales
      container_subcategories = driver.find_element(By.XPATH, f"//div[contains(@class, 'vtex-search-result-3-x-filter__container--category-{type_category}')]/div[2]")    
      ActionChains(driver).move_to_element(container_subcategories).perform()
      time.sleep(0.5)
      ActionChains(driver).scroll_from_origin(ScrollOrigin.from_element(container_subcategories), 0, 100).perform()
      time.sleep(0.5)

    subcategories_elements = driver.find_elements(By.XPATH, f"//div[contains(@class, 'vtex-search-result-3-x-filter__container--category-{type_category}')]//div[contains(@class, 'vtex-search-result-3-x-filterItem')]") # Al ser varios (find_elements), /@alt, no funciona, debo recorrerlos y obtener el alt individualmente
    url_subcategories = []
    for subcategory_element in subcategories_elements:
      subcategory_name = subcategory_element.get_attribute('alt')
      url_subcategories.append(re.sub(r'[,\s]+', '-', subcategory_name)) # Reemplazo comas (',') y espacios (' ') por '-'
    print(url_subcategories)

    # Tengo que hacerlos en distintos for, ya que get_cencosud_products() cambia el url, por lo tanto, en la nueva url, no existen los elementos de subcategories_elements y no puedo # obtener su atributo alt
    for url_subcategory in url_subcategories:
      print(f'{url_category}/{url_subcategory}')
      more_products_scraped = get_cencosud_products(driver, url_base, f'{url_category}/{url_subcategory}')
      products_scraped.extend(more_products_scraped)
  
  else:
    ActionChains(driver).scroll_by_amount(0, 500).perform() # Scrolleo un poco hacia abajo para que carguen todos los productos (20)
    time.sleep(1)

    products = driver.find_elements(By.XPATH, "//div[@id='gallery-layout-container']/div")
    print(f'Productos de la página {page}:', len(products))
    for product in products:
      # No hay SKU
      product_name = product.find_element(By.CSS_SELECTOR, "h2.vtex-product-summary-2-x-productNameContainer").text
      product_price = product.find_elements(By.CSS_SELECTOR, f".{sender_supermarket}-store-theme-1dCOMij_MzTzZOCohX1K7w")
      product_img = product.find_element(By.CSS_SELECTOR, "img.vtex-product-summary-2-x-image").get_attribute("src")
      product_url = product.find_element(By.XPATH, f"./section/a").get_attribute("href")
      if product_price:
        formatted_price = priceToNumber(product_price[0].text)
        products_scraped.append([product_name, formatted_price, product_img, product_url])

    if len(products) == AMOUNT_PRODUCTS:
      more_products_scraped = get_cencosud_products(driver, url_base, url_category, page + 1)
      products_scraped.extend(more_products_scraped)
  return products_scraped



def remove_duplicate_products(products):
  seen = set()
  unique_products = []
  for product in products:
    if product[3] not in seen:
      unique_products.append(product)
      seen.add(product[3])
    else:
      print(f"Producto repetido ({product[3]}): {product[0]}")

  return unique_products



if __name__ == '__main__':

  conn = mysql.connector.connect(
    host='127.0.0.1',
    user='root',
    password='12345',
    database='scraper_ejer'
  )
  cursor = conn.cursor()
  
  # Obtengo la informacion del supermercado de cencosud deseado, en este caso Vea
  cursor.execute(f"SELECT id, url FROM supermarket WHERE name = '{SUPERMARKET_NAME}'")
  result = cursor.fetchone()
  if result:
    supermarket_id = result[0]
    supermarket_url = result[1]

    print(f"Supermarket ID: {supermarket_id}")
    print(f"Supermarket URL: {supermarket_url}")
  else:
    print(f"No se encontró el supermercado 'Vea'.")


  driver = webdriver.Chrome()
  driver.set_window_size(1200, 1500) # Maximizo la ventana porque las páginas tienen dos formatos dependiendo su tamaño y varian algunas cosas

  categories = get_super_cencosud_categories(driver, supermarket_url)
  print('Categorias:', categories)
  supermarket_products = []
  for category in categories:
    some_products = get_cencosud_products(driver, supermarket_url, category)
    supermarket_products.extend(some_products)
    print(f'---\nCantidad total de productos de {category}:', len(some_products))
 
  print('------------\nCantidad total de productos:', len(supermarket_products))
  supermarket_products = remove_duplicate_products(supermarket_products)
  
  driver.quit()

  # Elimino todos los registros de este supermercado en la base de datos y posteriori, agrego todos los productos scrapeados
  cursor.execute(f"DELETE FROM product WHERE id_supermarket = {supermarket_id}")
  insert_query = f"INSERT INTO product (id_supermarket, name, price, img_src, link) VALUES ({supermarket_id}, %s, %s, %s, %s)"
  cursor.executemany(insert_query, supermarket_products)
  conn.commit()

  cursor.close()
  conn.close()

  print("Registros eliminados e insertados exitosamente.")
