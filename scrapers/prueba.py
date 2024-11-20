import requests
from requests.exceptions import ProxyError, ConnectTimeout


# IP:Puerto:User:Pass ---> SOCKS5
PROXIES = [
    "socks5://14a596aa03cf7:16415a7002@194.147.220.211:12324",
    "socks5://14a596aa03cf7:16415a7002@200.26.190.84:12324",
    "socks5://14a596aa03cf7:16415a7002@23.26.52.168:12324",
    "socks5://14a596aa03cf7:16415a7002@64.40.148.245:12324",
    "socks5://14a596aa03cf7:16415a7002@136.175.227.96:12324",
    None
]

for proxy in PROXIES:
    print(f"Probando proxy: {proxy}")
    try:
        response = requests.get(
            "http://httpbin.org/ip",
            proxies={"http": proxy, "https": proxy},  # Proxy para HTTP y HTTPS
            timeout=10  # Tiempo máximo de espera
        )
        print(f"Proxy válido! Respuesta: {response.json()}")
    except ProxyError:
        print(f"Proxy inválido: {proxy}")
    except ConnectTimeout:
        print(f"Proxy no responde (timeout): {proxy}")
    except Exception as e:
        print(f"Error al probar el proxy {proxy}: {e}")