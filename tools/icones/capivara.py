# tools/icones/capivara.py
# Modelo 3D Procedural da Capivara (Mascote / Montaria RPG) modelado a partir da PLANTA
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

def construir_capivara_da_planta(comprimento=1.8, largura=1.1, altura=1.0, tem_sela=True):
    """
    Modelagem procedural da Capivara Mascote a partir da PLANTA dimensional:
    - Corpo robusto e curvilineo (semi-cilindrico)
    - Focinho com perfil quadrado e orelhas pequenas
    - 4 patas robustas de apoio
    - Sela acolchoada de montaria de aventureiro com fivelas douradas
    """
    nova()

    # Materiais definidos de acordo com o perfil Capybound (tools/icones/perfis/capivara.json)
    mat_corpo = mat("corpo", cor=(0.48, 0.29, 0.15, 1.0), rugosidade=0.85, metalico=0.0)
    mat_focinho = mat("focinho", cor=(0.34, 0.20, 0.11, 1.0), rugosidade=0.9, metalico=0.0)
    mat_patas = mat("patas", cor=(0.30, 0.18, 0.10, 1.0), rugosidade=0.9, metalico=0.0)
    mat_sela = mat("sela", cor=(0.14, 0.26, 0.46, 1.0), rugosidade=0.6, metalico=0.0)
    mat_fivelas = mat("fivelas", cor=(0.85, 0.68, 0.15, 1.0), rugosidade=0.25, metalico=0.9)

    # 1. Corpo principal
    c_corpo = add(
        tipo="CUBO",
        nome="Capivara_Corpo",
        loc=(0.0, 0.0, 0.7),
        escala=(float(largura * 0.9), float(comprimento * 0.9), float(altura * 0.75)),
        material=mat_corpo
    )

    # 2. Cabeca e Focinho (perfil caracteristico da capivara)
    c_focinho = add(
        tipo="CUBO",
        nome="Capivara_Focinho",
        loc=(0.0, float(comprimento * 0.55), 0.85),
        escala=(float(largura * 0.65), float(comprimento * 0.45), float(altura * 0.6)),
        material=mat_focinho
    )

    # 3. Orelhas arredondadas no topo da cabeca
    add(
        tipo="ESFERA",
        nome="Capivara_Orelha_E",
        loc=(-0.35, float(comprimento * 0.45), 1.2),
        escala=(0.15, 0.12, 0.18),
        material=mat_focinho
    )
    add(
        tipo="ESFERA",
        nome="Capivara_Orelha_D",
        loc=(0.35, float(comprimento * 0.45), 1.2),
        escala=(0.15, 0.12, 0.18),
        material=mat_focinho
    )

    # 4. Quatro Patas
    pos_patas = [
        (-0.4, float(comprimento * 0.35), 0.25),
        (0.4, float(comprimento * 0.35), 0.25),
        (-0.4, float(-comprimento * 0.35), 0.25),
        (0.4, float(-comprimento * 0.35), 0.25),
    ]
    for idx, pos in enumerate(pos_patas):
        add(
            tipo="CILINDRO",
            nome=f"Capivara_Pata_{idx+1}",
            loc=pos,
            escala=(0.22, 0.22, 0.5),
            material=mat_patas
        )

    # 5. Sela e Fivelas (quando habilitado)
    if tem_sela:
        add(
            tipo="CUBO",
            nome="Capivara_Sela",
            loc=(0.0, -0.05, 1.15),
            escala=(float(largura * 0.95), 0.7, 0.15),
            material=mat_sela
        )
        add(
            tipo="CILINDRO",
            nome="Capivara_Fivela_E",
            loc=(-0.5, -0.05, 1.05),
            rot=(0.0, float(math.radians(90)), 0.0),
            escala=(0.08, 0.08, 0.06),
            material=mat_fivelas
        )
        add(
            tipo="CILINDRO",
            nome="Capivara_Fivela_D",
            loc=(0.5, -0.05, 1.05),
            rot=(0.0, float(math.radians(90)), 0.0),
            escala=(0.08, 0.08, 0.06),
            material=mat_fivelas
        )

def main():
    parser = argparse.ArgumentParser(description="Modelagem e Renderizacao 3D da Capivara (8 Vistas / Camera 24)")
    parser.add_argument("saida", nargs="?", default="/tmp/capivara_render.png", help="Caminho do arquivo de saida")
    parser.add_argument("resolucao", nargs="?", type=int, default=512, help="Resolucao do render em pixels")
    parser.add_argument("--comprimento", type=float, default=1.8, help="Comprimento da capivara")
    parser.add_argument("--largura", type=float, default=1.1, help="Largura da capivara")
    parser.add_argument("--altura", type=float, default=1.0, help="Altura da capivara")
    parser.add_argument("--sem-sela", action="store_true", help="Desativa a sela de montaria")
    parser.add_argument("--vistas8", action="store_true", help="Renderiza as 8 vistas em 360 graus com camera 24")
    parser.add_argument("--salvar-blend", type=str, default="dist/game/models/capivara_8vistas.blend", help="Exporta cena em .blend")

    args, _ = parser.parse_known_args()

    construir_capivara_da_planta(
        comprimento=args.comprimento,
        largura=args.largura,
        altura=args.altura,
        tem_sela=not args.sem_sela
    )

    if args.vistas8 and render_8_vistas is not None:
        render_8_vistas(args.saida.replace(".png", ""), resolucao=args.resolucao, salvar_blend_em=args.salvar_blend)
    else:
        render(args.saida, args.resolucao)

if __name__ == "__main__":
    main()
