# Supers-Scraper

Este proyecto consta de tres partes principales:

### Scrapers
Tres scripts en Python utilizados para extraer datos de productos de los supermercados Coto, Día y Cencosud (Jumbo, Disco, Vea). Todos almacenan los datos en una base de datos MySQL.

### API
Desarrollada en Python con FastAPI, su función es devolver los datos recopilados por los scrapers en respuesta a las solicitudes de la página web.

### Página Web
Desarrollada en React, permite a los usuarios buscar productos y recibir resultados coincidentes con su consulta.

## Requisitos

Para ejecutar este proyecto, necesitas:

- Tener instalado [Python](https://www.python.org/downloads/).
- Tener instalado [Node.js](https://nodejs.org/en/download/package-manager).
- Tener instalado [MySQL](https://dev.mysql.com/downloads/mysql/).

## Modo de uso - Scrapers

Es necesario contar con una copia de la base de datos. Además, en los archivos correspondientes, debes configurar la conexión con MySQL (host, usuario, contraseña y base de datos).

También debes instalar todas las librerías mencionadas en `scrapers/requirements.txt` para que el sistema funcione correctamente.

### Antiguo Scraper de Coto

Para extraer los datos de Coto, este script utiliza las librerías `requests` y `lxml`.

Para que funcione, es necesario crear un archivo `proxies.txt`, donde se listarán los proxies a utilizar (uno por línea). Pueden ser SOCKS o HTTP, en el formato:

```
<Protocol>://<user>:<pass>@<ip>:<port>
```

¿Por qué usar proxies? Coto bloquea las IPs que realizan muchas solicitudes en poco tiempo. En mi caso, utilizo cinco proxies más mi IP, con un tiempo de espera de 120 segundos entre consultas. Si tienes más proxies o un proxy con IP rotativa, este número puede ajustarse.

Una vez configurado, puedes ejecutar el script y, tras un tiempo, todos los productos de Coto estarán almacenados en la base de datos.

### Nuevo Scraper de Coto

A diferencia del antiguo, este scraper obtiene los datos de la nueva versión del sitio de Coto utilizando la URL estándar, pero agregando el parámetro `format=json`. Esto devuelve la información en formato JSON, que luego se procesa para extraer los datos relevantes.

No es necesario utilizar proxies, ya que, hasta la fecha (26/02/2025), este nuevo sitio no bloquea IPs.

### Scraper de Cencosud

Este scraper utiliza la librería `selenium`. Primero, abre una ventana de Chrome en la página del supermercado Cencosud y extrae todas sus categorías. Luego, recorre cada una de ellas para obtener los productos y los guarda en la base de datos.

Antes de ejecutarlo, debes definir el supermercado de Cencosud a scrapear (Vea, Jumbo o Disco) en `SUPERMARKET_NAME`.

### Scraper de Día

Para obtener los datos de los productos de Día, se utilizan los endpoints de [VTEX](https://vtex.com/es-ar/), la plataforma en la que está basada la web del supermercado.

Primero, se recuperan las categorías del sitio y luego se extraen los productos de cada una de ellas.

No es necesario modificar nada, simplemente ejecuta el script y espera a que finalice el proceso.

## Modo de uso - API

La API fue desarrollada con [FastAPI](https://fastapi.tiangolo.com/). Antes de ejecutarla, instala las librerías requeridas en `api/requirements.txt`. Se recomienda [crear un entorno virtual](https://docs.python.org/es/3/tutorial/venv.html) para aislar las dependencias.

Para iniciar la API, ejecuta en la terminal:

```
fastapi dev main.py
```

Esto levantará el servidor y comenzará a procesar solicitudes.

## Modo de uso - Página Web

La aplicación se encuentra en la carpeta `ProductSearcher`. Para ejecutarla, abre una terminal en dicha carpeta y corre los siguientes comandos:

```
npm install
npm run dev
```

La página web requiere que la API esté en funcionamiento para poder obtener y mostrar la información.

### Funcionalidades de la página

- Permite buscar productos en la base de datos.
- Posibilidad de ordenar los resultados por nombre o precio.
- Posibilidad de filtrar los productos por si tienen o no ofertas.
- Cuenta con un carrito de compras donde los usuarios pueden armar una lista de productos de su interés.
