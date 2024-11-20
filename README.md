# Supers-Scraper

Este proyecto consta de tres partes.

#### Scrapers
Dos scripts de python los cuales, uno extrae los datos de los productos del supermercado Coto y el otro extrae los datos de los supermercados Cencosud (Jumbo, Disco, Vea). Ambos guardan los datos en una base de datos MySQL

#### API
Hecha en python, utilizando FastAPI, su función es devolver los datos recolectados por los scrapers y solicitados por la pagina.

#### Página
Es un simple frontend que utiliza HTML, CSS y JavaScript. El usuario realiza determinada busqueda y se le devolverá los productos que matcheen con la misma.

## Requisitos

Para poder correr este proyecto, antes, necesitás: 

- Tener instalado [Python](https://www.python.org/downloads/)
- Tener instalado [Node](https://nodejs.org/en/download/package-manager)
- Tener instalado [MySQL](https://dev.mysql.com/downloads/mysql/)

## Modo de uso - Scrapers

En ambos scrapers es necesario tener una copia de la BD. Obviamente, en ambos archivos deberán configurar la parte de la conexión con MySQL con los datos que correspondan (host, user, pass y database). 

También tendrán que instalar todas las librerias mencionadas en `requirements.txt` para que pueda funcionar.

### Scraper de Coto

Para extraer los datos de coto utilizo la librerias requests y lxml.

Para que este script funcione, hay un paso más. Deberán crear un archivo `proxies.txt`, en este tendrán que colocar todos los proxies que vayan a utilizar (uno por linea), pueden ser SOCKS o HTTP, en el formato: `<Protocol>://<user>:<pass>@<ip>:<port>`. ¿Por qué proxies? Son necesarios ya que este supermercado bloquea nuestra IP si realizamos muchas consultas desde la misma en poco tiempo. En mi caso utilizo 5 proxies (sumado mi IP) y, para que funcione, entre cada consulta hay un sleep de 120 segundos; si tienen más proxies o un proxy que rote sus IPs, este número variará, es cuestión de probar.

Con esto listo, podrán ejecutar el script y al cabo de cierto tiempo habrán obtenido y guardado en la BD todos los productos de Coto.

### Scraper de Cencosud

En este scraper, los datos los obtenemos con la libreria selenium. Primero, abrirá una ventana de Chrome en la página del supermercado cencosud y extraerá todas sus categorias, para luego, a partir de ellas, recorrer cada una y obtener sus productos. Finalmente, lo obtenido se guarda en la BD.

Antes de ejecutarlo, deberán definir el supermercado cencosud a scrapear (Vea, Jumbo o Disco) en `SUPERMARKET_NAME`.

## Modo de uso - Api

Para la api, como ya comenté, use [FastAPI](https://fastapi.tiangolo.com/). Evidentemente, antes de poder ejecutarla tendrán que instalar los requirements, para esto es recomendable crear un entorno virtual. 

Ingresando el comando `fastapi dev main.py` en la terminal, se iniciará el programa y comenzará a escuchar las solicitudes.

## Modo de uso - Página

Antes que nada, deben ejecutar, en la terminal, el comando `npm install` seguido del comando `npm start` o `http-server`. Claramente, la página necesitará de la api para poder funcionar correctamente.

Ya en la página, podrán buscar el producto que se les plazca. Tienen la posibilidad de ordenarlo por su nombre o por su precio.
