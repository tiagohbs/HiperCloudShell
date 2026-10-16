# tools/icones/pintor.py
# Conversor deterministico de render 3D (EXR/PNG) para Pixel Art 16-bit com paleta indexada
import os
import sys
import json
import math

try:
    from PIL import Image, ImageOps
except ImportError:
    Image = None
    ImageOps = None

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hex(rgb):
    return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"

def distance_sq(c1, c2):
    return (c1[0]-c2[0])**2 + (c1[1]-c2[1])**2 + (c1[2]-c2[2])**2

def quantizar_determinista(img, perfil_dict, altura_px=112):
    """Reduz resolucao com resample NEAREST e quantiza as cores na paleta estrita do perfil."""
    if Image is None:
        print("[Pintor Mock] PIL nao disponivel no ambiente.")
        return None

    # Coleta todas as cores hex das rampas do perfil
    paleta_rgb = []
    for peca, cfg in perfil_dict.items():
        if peca == "_global":
            continue
        for h in cfg.get("ramp", []):
            rgb = hex_to_rgb(h)
            if rgb not in paleta_rgb:
                paleta_rgb.append(rgb)

    if not paleta_rgb:
        paleta_rgb = [(14, 34, 66), (24, 58, 106), (37, 84, 142), (58, 114, 176)]

    # Redimensionamento fiel para a resolucao alvo (pixel art)
    w_orig, h_orig = img.size
    aspect = w_orig / float(h_orig)
    largura_px = int(altura_px * aspect)

    pequena = img.resize((largura_px, altura_px), resample=Image.NEAREST)
    pequena = pequena.convert("RGBA")

    pixels = pequena.load()
    for y in range(altura_px):
        for x in range(largura_px):
            r, g, b, a = pixels[x, y]
            if a < 32:
                pixels[x, y] = (0, 0, 0, 0)
                continue
            # Busca a cor mais proxima na paleta
            melhor_c = min(paleta_rgb, key=lambda c: distance_sq((r, g, b), c))
            pixels[x, y] = (melhor_c[0], melhor_c[1], melhor_c[2], 255)

    return pequena

def gerar_prancha_8_vistas(lista_vistas, caminho_prancha, escala=2):
    """Gera prancha comparativa consolidada das 8 vistas em linha horizontal ou grade 4x2."""
    if Image is None or not lista_vistas:
        return
    imagens = []
    for item in lista_vistas:
        p = item.get("path")
        if p and os.path.exists(p):
            im = Image.open(p).convert("RGBA")
            if escala > 1:
                im = im.resize((im.width * escala, im.height * escala), Image.NEAREST)
            imagens.append(im)

    if not imagens:
        return

    largura_item, altura_item = imagens[0].size
    prancha = Image.new("RGBA", (largura_item * 8, altura_item), (0, 0, 0, 0))

    for idx, im in enumerate(imagens):
        prancha.paste(im, (idx * largura_item, 0))

    os.makedirs(os.path.dirname(os.path.abspath(caminho_prancha)), exist_ok=True)
    prancha.save(caminho_prancha)
    print(f"[Pintor] Prancha 360 (8 vistas) salva em: {caminho_prancha}")

def main():
    if len(sys.argv) < 5:
        print("Uso: python pintor.py <in_exr_or_png> <out_png> <altura_px> <perfil_json>")
        return

    in_path = sys.argv[1]
    out_path = sys.argv[2]
    altura_px = int(sys.argv[3])
    perfil_path = sys.argv[4]

    perfil = {}
    if os.path.exists(perfil_path):
        with open(perfil_path, "r", encoding="utf-8") as f:
            perfil = json.load(f)

    if Image is not None and os.path.exists(in_path):
        img = Image.open(in_path)
        px_art = quantizar_determinista(img, perfil, altura_px)
        if px_art:
            os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
            px_art.save(out_path)
            print(f"[Pintor] Pixel art gerado em: {out_path}")
    else:
        print(f"[Pintor Mock] Converteu {in_path} -> {out_path} ({altura_px}px)")

if __name__ == "__main__":
    main()
