# tools/icones/cena.py
# Helper de construcao de cena Blender (bpy) para o pipeline deterministico 3D -> Pixel Art
import sys
import math
try:
    import bpy
    import bmesh
    from mathutils import Vector, Euler, Matrix
except ImportError:
    bpy = None
    bmesh = None
    Vector = None
    Euler = None
    Matrix = None

def nova():
    """Reseta a cena do Blender removendo todos os objetos anteriores e inicializa configuracao limpa."""
    if bpy is None:
        return
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES' if hasattr(bpy.types, 'CYCLES') else 'BLENDER_EEVEE'
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'

def mat(nome, cor=(0.8, 0.8, 0.8, 1.0), rugosidade=0.4, metalico=0.0):
    """Cria ou recupera um material baseado no Principled BSDF."""
    if bpy is None:
        return None
    m = bpy.data.materials.get(nome) or bpy.data.materials.new(nome)
    m.use_nodes = True
    nodes = m.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = cor
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = rugosidade
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metalico
    return m

def add(tipo="CUBO", nome=None, loc=(0.0, 0.0, 0.0), rot=(0.0, 0.0, 0.0), escala=(1.0, 1.0, 1.0), material=None):
    """Adiciona um primitivo 3D na cena e aplica transformacoes e material."""
    if bpy is None:
        return None
    if tipo.upper() == "CUBO":
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc, rotation=rot)
    elif tipo.upper() == "CILINDRO":
        bpy.ops.mesh.primitive_cylinder_add(radius=0.5, depth=1.0, location=loc, rotation=rot)
    elif tipo.upper() == "ESFERA":
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=loc, rotation=rot)
    elif tipo.upper() == "CONE":
        bpy.ops.mesh.primitive_cone_add(radius1=0.5, depth=1.0, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc, rotation=rot)

    obj = bpy.context.active_object
    if nome:
        obj.name = nome
    obj.scale = escala
    if material:
        if isinstance(material, str):
            material = mat(material)
        obj.data.materials.append(material)
    return obj

def obj(nome):
    """Recupera um objeto pelo nome."""
    if bpy is None:
        return None
    return bpy.data.objects.get(nome)

def render(caminho_saida, resolucao=512, camera=None):
    """Executa o render da cena e salva no caminho de saida (EXR ou PNG)."""
    if bpy is None:
        print(f"[Cena Mock] render -> {caminho_saida} ({resolucao}x{resolucao})")
        return
    scene = bpy.context.scene
    scene.render.resolution_x = int(resolucao)
    scene.render.resolution_y = int(resolucao)
    scene.render.filepath = caminho_saida
    if camera:
        scene.camera = camera
    bpy.ops.render.render(write_still=True)
