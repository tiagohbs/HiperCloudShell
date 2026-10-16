# tools/icones/cena_8vistas.py
# Pipeline de 8 Vistas Multi-Angulo (Turnaround 360) com Camera a 24 Graus de Elevacao
import os
import sys
import math

try:
    import bpy
    from mathutils import Vector, Euler
except ImportError:
    bpy = None
    Vector = None
    Euler = None

CAMERA_PITCH_DEG = 24.0
VISTAS_8 = [
    {"deg": 0, "id": "sul", "nome": "0° Sul (Frontal)"},
    {"deg": 45, "id": "sudeste", "nome": "45° Sudeste"},
    {"deg": 90, "id": "leste", "nome": "90° Leste (Direita)"},
    {"deg": 135, "id": "nordeste", "nome": "135° Nordeste"},
    {"deg": 180, "id": "norte", "nome": "180° Norte (Traseira)"},
    {"deg": 225, "id": "noroeste", "nome": "225° Noroeste"},
    {"deg": 270, "id": "oeste", "nome": "270° Oeste (Esquerda)"},
    {"deg": 315, "id": "sudoeste", "nome": "315° Sudoeste"}
]

def configurar_camera_24_graus(distancia=5.0):
    """Cria ou configura camera com elevacao exata de 24 graus (dimetrico RPG 2.5D)."""
    if bpy is None:
        return None
    cam_data = bpy.data.cameras.get("Camera24") or bpy.data.cameras.new("Camera24")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 3.2

    cam_obj = bpy.data.objects.get("Camera24")
    if not cam_obj:
        cam_obj = bpy.data.objects.new("Camera24", cam_data)
        bpy.context.scene.collection.objects.link(cam_obj)

    bpy.context.scene.camera = cam_obj
    return cam_obj

def render_8_vistas(saida_base, resolucao=512, distancia=5.0, salvar_blend_em=None):
    """
    Renderiza as 8 vistas em passos de 45 graus com camera em 24 graus de elevacao.
    Retorna a lista de arquivos renderizados e salva o arquivo .blend se especificado.
    """
    pitch_rad = math.radians(CAMERA_PITCH_DEG)
    resultados = []

    os.makedirs(os.path.dirname(os.path.abspath(saida_base)), exist_ok=True)

    if bpy is not None:
        cam = configurar_camera_24_graus(distancia)

        for v in VISTAS_8:
            deg = v["deg"]
            azimuth_rad = math.radians(deg)

            # Posicionamento esferico: Z elevado por 24 graus
            x = float(distancia * math.sin(azimuth_rad) * math.cos(pitch_rad))
            y = float(-distancia * math.cos(azimuth_rad) * math.cos(pitch_rad))
            z = float(distancia * math.sin(pitch_rad))

            cam.location = Vector((x, y, z))

            # Aponta para a origem
            rot_z = azimuth_rad
            rot_x = math.radians(90.0 - CAMERA_PITCH_DEG)
            cam.rotation_euler = Euler((rot_x, 0.0, rot_z), 'XYZ')

            arq_saida = f"{saida_base}_{v['id']}_{deg}deg.png"
            bpy.context.scene.render.filepath = arq_saida
            bpy.context.scene.render.resolution_x = int(resolucao)
            bpy.context.scene.render.resolution_y = int(resolucao)
            bpy.ops.render.render(write_still=True)

            resultados.append({
                "deg": deg,
                "id": v["id"],
                "nome": v["nome"],
                "pitch": CAMERA_PITCH_DEG,
                "path": arq_saida
            })

        if salvar_blend_em:
            os.makedirs(os.path.dirname(os.path.abspath(salvar_blend_em)), exist_ok=True)
            bpy.ops.wm.save_as_mainfile(filepath=salvar_blend_em)
            print(f"[Blender 8 Vistas] Arquivo .blend salvo em: {salvar_blend_em}")
    else:
        # Mock mode para ambientes sem Blender instalado localmente
        for v in VISTAS_8:
            deg = v["deg"]
            arq_saida = f"{saida_base}_{v['id']}_{deg}deg.png"
            resultados.append({
                "deg": deg,
                "id": v["id"],
                "nome": v["nome"],
                "pitch": CAMERA_PITCH_DEG,
                "path": arq_saida
            })
        print(f"[Mock 8 Vistas] Geradas 8 vistas virtuais (câmera {CAMERA_PITCH_DEG}°)")

    return resultados

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "/tmp/render_8vistas"
    res = int(sys.argv[2]) if len(sys.argv) > 2 else 512
    blend_path = sys.argv[3] if len(sys.argv) > 3 else "dist/game/models/cena_8vistas.blend"
    render_8_vistas(out, res, salvar_blend_em=blend_path)
