"""Genera los iconos de la app (iconos/): una mancuerna menta sobre fondo oscuro.

Solo usa la biblioteca estándar de Python (escribe los PNG a mano).
Uso (desde la carpeta plan-fuerza):  python tools/generar_iconos.py
"""
import struct
import zlib
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

FONDO_ARRIBA = (24, 28, 35)
FONDO_ABAJO = (11, 13, 16)
MENTA = (61, 220, 151)
MENTA_OSCURA = (38, 168, 113)
BARRA = (226, 232, 238)


def escribir_png(ruta, ancho, alto, color_en):
    """Escribe un PNG RGB. `color_en(x, y)` devuelve (r, g, b) para cada píxel."""
    filas = bytearray()
    for y in range(alto):
        filas.append(0)  # cada fila empieza con su byte de filtro: 0 = sin filtro
        for x in range(ancho):
            filas += bytes(color_en(x, y))

    def trozo(tipo, datos):
        crc = zlib.crc32(tipo + datos) & 0xFFFFFFFF
        return struct.pack(">I", len(datos)) + tipo + datos + struct.pack(">I", crc)

    cabecera = struct.pack(">IIBBBBB", ancho, alto, 8, 2, 0, 0, 0)  # 8 bits, color RGB
    Path(ruta).write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + trozo(b"IHDR", cabecera)
        + trozo(b"IDAT", zlib.compress(bytes(filas), 9))
        + trozo(b"IEND", b"")
    )


def mezclar(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def dentro_rect(u, v, x0, x1, y0, y1, radio):
    """¿El punto (u, v) cae dentro de un rectángulo con esquinas redondeadas?"""
    if not (x0 <= u <= x1 and y0 <= v <= y1):
        return False
    cx = min(max(u, x0 + radio), x1 - radio)
    cy = min(max(v, y0 + radio), y1 - radio)
    return (u - cx) ** 2 + (v - cy) ** 2 <= radio ** 2


def color_icono(u, v):
    """Color en el punto (u, v), ambos entre 0 y 1. La figura cabe en el 70 % central
    para que iOS/Android puedan recortar el icono en círculo o cuadro redondeado."""
    color = mezclar(FONDO_ARRIBA, FONDO_ABAJO, v)
    d = abs(u - 0.5)                                   # la mancuerna es simétrica
    if dentro_rect(d, v, -0.1, 0.25, 0.465, 0.535, 0.02):
        color = BARRA                                  # barra
    if dentro_rect(d, v, 0.30, 0.34, 0.45, 0.55, 0.015):
        color = BARRA                                  # topes de los extremos
    if dentro_rect(d, v, 0.14, 0.21, 0.27, 0.73, 0.03):
        color = MENTA                                  # discos grandes
    if dentro_rect(d, v, 0.22, 0.29, 0.34, 0.66, 0.03):
        color = MENTA_OSCURA                           # discos chicos
    return color


def dibujar_icono(ruta, lado):
    muestras = 3  # 3x3 puntos por píxel: bordes suaves

    def color_en(x, y):
        suma = [0, 0, 0]
        for sy in range(muestras):
            for sx in range(muestras):
                c = color_icono((x + (sx + 0.5) / muestras) / lado, (y + (sy + 0.5) / muestras) / lado)
                for i in range(3):
                    suma[i] += c[i]
        return tuple(s // (muestras * muestras) for s in suma)

    escribir_png(ruta, lado, lado, color_en)


def main():
    carpeta = RAIZ / "iconos"
    carpeta.mkdir(exist_ok=True)
    dibujar_icono(carpeta / "icon-512.png", 512)
    dibujar_icono(carpeta / "icon-192.png", 192)
    dibujar_icono(carpeta / "apple-touch-icon.png", 180)  # el tamaño que usa iOS
    print("Iconos listos en", carpeta)


if __name__ == "__main__":
    main()
