# tools/icones/espada_bambu.py
# Modelo 3D Procedural da Espada de Bambu com suporte a 8 vistas (Camera 24)
import sys
import math
import argparse

from cena import nova, mat, add, obj, render
try:
    import bpy
    from mathutils import Vector, Euler
except ImportError:
    bpy = None
    Vector = None
    Euler = None

try:
    from cena_8vistas import render_8_vistas, CAMERA_PITCH_DEG
except ImportError:
    render_8_vistas = None
    CAMERA_PITCH_DEG = 24.0

def construir_espada_bambu(curvatura=1.0, comprimento_cabo=1.0, largura_lamina=1.0):
    """Constroi a espada de bambu procedural com materiais segmentados para pintura deterministica."""
    nova()

    mat_lamina = mat("lamina", cor=(0.75, 0.8, 0.85, 1.0), rugosidade=0.2, metalico=0.8)
    mat_cabo = mat("cabo", cor=(0.4, 0.65, 0.35, 1.0), rugosidade=0.6, metalico=0.0)
    mat_fita = mat("fita", cor=(0.6, 0.4, 0.25, 1.0), rugosidade=0.8, metalico=0.0)
    mat_tsuba = mat("tsuba", cor=(0.3, 0.32, 0.35, 1.0), rugosidade=0.4, metalico=0.5)

    # Lamina de aco
    add(
        tipo="CUBO",
        nome="Lamina",
        loc=(0.0, 0.0, 1.2),
        rot=(0.0, float(math.radians(curvatura * 5.0)), 0.0),
        escala=(float(largura_lamina * 0.12), 0.04, 1.8),
        material=mat_lamina
    )

    # Tsuba (Guarda)
    add(
        tipo="CILINDRO",
        nome="Tsuba",
        loc=(0.0, 0.0, 0.25),
        rot=(float(math.radians(90)), 0.0, 0.0),
        escala=(0.4, 0.4, 0.05),
        material=mat_tsuba
    )

    # Cabo de Bambu
    add(
        tipo="CILINDRO",
        nome="Cabo",
        loc=(0.0, 0.0, -0.3),
        escala=(0.1, 0.1, float(comprimento_cabo * 0.9)),
        material=mat_cabo
    )

    # Enrolamento de Fita
    add(
        tipo="CILINDRO",
        nome="Fita_Cabo",
        loc=(0.0, 0.0, -0.28),
        escala=(0.11, 0.11, float(comprimento_cabo * 0.45)),
        material=mat_fita
    )

def main():
    parser = argparse.ArgumentParser(description="Espada de Bambu Procedural (8 Vistas / Camera 24)")
    parser.add_argument("saida", nargs="?", default="/tmp/espada_render.png", help="Caminho de saida")
    parser.add_argument("resolucao", nargs="?", type=int, default=512, help="Resolucao em pixels")
    parser.add_argument("--curvatura", type=float, default=1.0, help="Fator de curvatura")
    parser.add_argument("--cabo", type=float, default=1.0, help="Comprimento do cabo")
    parser.add_argument("--largura", type=float, default=1.0, help="Largura da lamina")
    parser.add_argument("--vistas8", action="store_true", help="Renderiza 8 vistas em 360 graus")
    parser.add_argument("--salvar-blend", type=str, default="dist/game/models/espada_bambu_8vistas.blend", help="Salva cena em .blend")

    args, _ = parser.parse_known_args()

    construir_espada_bambu(
        curvatura=args.curvatura,
        comprimento_cabo=args.cabo,
        largura_lamina=args.largura
    )

    if args.vistas8 and render_8_vistas is not None:
        render_8_vistas(args.saida.replace(".png", ""), resolucao=args.resolucao, salvar_blend_em=args.salvar_blend)
    else:
        render(args.saida, args.resolucao)

if __name__ == "__main__":
    main()
