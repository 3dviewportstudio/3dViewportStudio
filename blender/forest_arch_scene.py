"""Camino del bosque + arco de piedra en ruinas (noche con niebla).

Uso:
  - En Blender: Scripting > abrir > Run Script, o enviarlo por el addon MCP (puerto 9876).
  - Sin interfaz:  blender -b -P forest_arch_scene.py -- --out /ruta/salida

Genera colecciones separadas para exportar a Unreal (FBX/glTF) y esparcir
la vegetación allí con Foliage o PCG: la vegetación se exporta como
MALLAS BASE (una de cada) y sus posiciones como CSV de puntos.
"""
import bpy, bmesh, math, random, sys, os, csv
from mathutils import Vector, Matrix

SEED = 7
random.seed(SEED)
OUT = "//unreal_export"
if "--" in sys.argv:
    a = sys.argv[sys.argv.index("--") + 1:]
    if "--out" in a:
        OUT = a[a.index("--out") + 1]


# ---------------------------------------------------------------- utilidades
def clean():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)


def coll(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c


def link(obj, c):
    for old in obj.users_collection:
        old.objects.unlink(obj)
    c.objects.link(obj)
    return obj


def mat(name, color, rough=0.9, metal=0.0, emit=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = (*emit[0], 1)
        b.inputs["Emission Strength"].default_value = emit[1]
    return m


def rock_mat(name, tint):
    """Piedra procedural: ruido + bump, para ver relieve sin texturas externas."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n1 = nt.nodes.new("ShaderNodeTexNoise")
    n1.inputs["Scale"].default_value = 6
    n1.inputs["Detail"].default_value = 12
    n2 = nt.nodes.new("ShaderNodeTexVoronoi")
    n2.inputs["Scale"].default_value = 18
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*[c * 0.35 for c in tint], 1)
    ramp.color_ramp.elements[1].color = (*tint, 1)
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.8
    nt.links.new(tc.outputs["Object"], n1.inputs["Vector"])
    nt.links.new(tc.outputs["Object"], n2.inputs["Vector"])
    nt.links.new(n1.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(n2.outputs["Distance"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.92
    return m


M = {}


def materials():
    M["stone"] = rock_mat("Piedra_Arco", (0.34, 0.37, 0.42))
    M["slab"] = rock_mat("Piedra_Losa", (0.28, 0.29, 0.30))
    M["soil"] = mat("Tierra", (0.09, 0.065, 0.045), 1.0)
    M["ivy"] = mat("Hiedra", (0.03, 0.12, 0.03), 0.6)
    M["fir"] = mat("Abeto", (0.02, 0.09, 0.04), 0.8)
    M["bark"] = mat("Corteza", (0.06, 0.04, 0.03), 1.0)
    M["fern"] = mat("Helecho", (0.04, 0.17, 0.05), 0.55)
    M["flower"] = mat("Flor", (0.08, 0.2, 0.75), 0.5)
    M["house"] = mat("Casa", (0.05, 0.045, 0.04), 1.0)
    M["window"] = mat("Ventana", (1, 0.55, 0.2), 0.5, emit=((1, 0.55, 0.2), 6.0))


# ------------------------------------------------------------------- suelo
def ground(c):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=120, y_subdivisions=120, size=90)
    g = bpy.context.active_object
    g.name = "Suelo"
    for v in g.data.vertices:  # ondulaciones suaves; camino (eje Y) más plano
        x, y = v.co.x, v.co.y
        path = math.exp(-(x / 2.6) ** 2)
        v.co.z = (1 - path) * (0.6 * math.sin(x * 0.17) * math.cos(y * 0.13)
                               + 0.15 * random.random()) - 0.02 * path
    g.data.materials.append(M["soil"])
    bpy.ops.object.shade_smooth()
    link(g, c)
    return g


def ground_z(x, y):
    path = math.exp(-(x / 2.6) ** 2)
    return (1 - path) * (0.6 * math.sin(x * 0.17) * math.cos(y * 0.13)) - 0.02 * path


# -------------------------------------------------------------------- arco
def arch(c, radius=1.7, block_h=0.55, depth=1.1, n_arc=11, pillar_rows=6,
         origin=Vector((0, 0, 0))):
    """Arco de bloques: pilares apilados + dovelas en semicircunferencia.
    Cada bloque tiene su propia pequeña rotación/desgaste (aspecto en ruinas)."""
    objs = []

    def block(loc, rot_z, rot_y, size, name):
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
        o = bpy.context.active_object
        o.name = name
        o.scale = size
        o.rotation_euler = (0, rot_y, rot_z)
        bpy.ops.object.transform_apply(scale=True)
        bev = o.modifiers.new("Bisel", "BEVEL")
        bev.width = 0.05
        bev.segments = 2
        dis = o.modifiers.new("Desgaste", "DISPLACE")
        tex = bpy.data.textures.new(name + "_t", "CLOUDS")
        tex.noise_scale = 0.35
        dis.texture = tex
        dis.strength = 0.06
        sub = o.modifiers.new("Sub", "SUBSURF")
        sub.levels = 2
        sub.render_levels = 2
        o.data.materials.append(M["stone"])
        link(o, c)
        objs.append(o)

    wall_w = 0.95
    # pilares
    for side in (-1, 1):
        for r in range(pillar_rows):
            jx = random.uniform(-0.04, 0.04)
            hh = block_h * random.uniform(0.9, 1.05)
            block(origin + Vector((side * radius + jx, 0, r * block_h + hh / 2)),
                  random.uniform(-0.03, 0.03), 0, Vector((wall_w, depth, hh)),
                  f"Pilar_{side}_{r}")
    # dovelas
    top = pillar_rows * block_h
    arc_len = math.pi * (radius + wall_w * 0.5) / n_arc
    for i in range(n_arc):
        a = math.pi * (i + 0.5) / n_arc  # 0..pi
        # el arco "lo come" la ruina: se saltan 2 dovelas (hueco arriba-derecha)
        if i in (8, 9):
            continue
        x = math.cos(a) * radius
        z = top + math.sin(a) * radius
        block(origin + Vector((x, 0, z)), 0, -a,
              Vector((wall_w, depth, arc_len * 1.05)), f"Dovela_{i}")
    # dovelas caídas
    for k in range(2):
        block(origin + Vector((radius + 1.2 + k * 0.9, -1.6 - k, 0.25)),
              random.uniform(0, 3), random.uniform(-0.3, 0.3),
              Vector((wall_w, depth, 0.5)), f"Dovela_caida_{k}")
    return objs, top + radius


# ------------------------------------------------------------ losas sueltas
def slabs(c, length=18, start_y=-14):
    out = []
    y = start_y
    while y < start_y + length:
        for col in range(-2, 3):
            if random.random() < 0.35:  # huecos: losas que faltan
                continue
            sx, sy = random.uniform(0.55, 0.85), random.uniform(0.55, 0.85)
            x = col * 0.85 + random.uniform(-0.12, 0.12)
            bpy.ops.mesh.primitive_cube_add(size=1,
                                            location=(x, y + random.uniform(-0.1, 0.1),
                                                      ground_z(x, y) + 0.04))
            o = bpy.context.active_object
            o.name = "Losa"
            o.scale = (sx, sy, 0.08)
            o.rotation_euler = (random.uniform(-0.06, 0.06), random.uniform(-0.06, 0.06),
                                random.uniform(-0.35, 0.35))
            bev = o.modifiers.new("Bisel", "BEVEL")
            bev.width = 0.015
            o.data.materials.append(M["slab"])
            link(o, c)
            out.append(o)
        y += 0.9
    return out


# ------------------------------------------------------------- hiedra (curvas)
def ivy(c, arch_top, radius, n=26):
    """Hiedra 'dibujada' con curvas Bézier sobre la superficie del arco,
    con bisel (tallo) + hojas instanciadas pequeñas a lo largo."""
    leaf_mesh = bpy.data.meshes.new("Hoja")
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in ((0, 0, 0), (0.05, 0.05, 0), (0, 0.13, 0), (-0.05, 0.05, 0))]
    bm.faces.new(vs)
    bm.to_mesh(leaf_mesh)
    bm.free()
    leaf_mesh.materials.append(M["ivy"])
    leaves = []
    for i in range(n):
        cu = bpy.data.curves.new(f"Hiedra_{i}", "CURVE")
        cu.dimensions = "3D"
        cu.bevel_depth = 0.012
        cu.bevel_resolution = 2
        sp = cu.splines.new("BEZIER")
        side = random.choice((-1, 1))
        x0 = side * (radius + random.uniform(-0.2, 0.5))
        y_front = random.choice((-0.57, 0.57))
        pts = []
        steps = random.randint(5, 9)
        x, z = x0, random.uniform(0, 1.2)
        for _ in range(steps):
            pts.append(Vector((x, y_front + random.uniform(-0.03, 0.03), z)))
            z += random.uniform(0.3, 0.7)
            x += random.uniform(-0.25, 0.25) - side * 0.05 * (z / arch_top)
        sp.bezier_points.add(len(pts) - 1)
        for bp, p in zip(sp.bezier_points, pts):
            bp.co = p
            bp.handle_left_type = bp.handle_right_type = "AUTO"
        o = bpy.data.objects.new(f"Hiedra_{i}", cu)
        cu.materials.append(M["ivy"])
        c.objects.link(o)
        # hojas a lo largo del trazo
        for p in pts:
            for _ in range(random.randint(3, 6)):
                l = bpy.data.objects.new("Hoja", leaf_mesh)
                l.location = p + Vector((random.uniform(-.08, .08), -0.01 * (1 if p.y > 0 else -1) * -1,
                                         random.uniform(-.1, .1)))
                l.rotation_euler = (math.pi / 2 * (1 if p.y < 0 else -1) + random.uniform(-.5, .5),
                                    random.uniform(0, 6.28), 0)
                l.scale = [random.uniform(0.7, 1.6)] * 3
                c.objects.link(l)
                leaves.append(l)
    return leaves


# --------------------------------------------------- mallas base de vegetación
def make_fir(c):
    parts = []
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=1.2, location=(0, 0, 0.6))
    t = bpy.context.active_object
    t.data.materials.append(M["bark"])
    parts.append(t)
    for i in range(6):
        r = 1.1 - i * 0.17
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=0.02, depth=1.1,
                                        location=(0, 0, 1.0 + i * 0.75), vertices=10)
        k = bpy.context.active_object
        k.data.materials.append(M["fir"])
        parts.append(k)
    bpy.ops.object.select_all(action="DESELECT")
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    o = bpy.context.active_object
    o.name = "SM_Abeto"
    o.scale = (1.0, 1.0, 1.0)
    link(o, c)
    return o


def make_fern(c):
    bm = bmesh.new()
    for i in range(9):
        a = i * math.tau / 9
        pts = []
        for s in range(5):
            t = s / 4
            pts.append(Vector((math.cos(a) * t * 0.7, math.sin(a) * t * 0.7,
                               0.05 + 0.45 * math.sin(t * 2.2) - 0.18 * t * t)))
        for s in range(4):
            w = 0.09 * (1 - s / 4) + 0.02
            n = Vector((-math.sin(a), math.cos(a), 0)) * w
            v = [bm.verts.new(pts[s] - n), bm.verts.new(pts[s] + n),
                 bm.verts.new(pts[s + 1] + n * 0.7), bm.verts.new(pts[s + 1] - n * 0.7)]
            bm.faces.new(v)
    me = bpy.data.meshes.new("SM_Helecho")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(M["fern"])
    o = bpy.data.objects.new("SM_Helecho", me)
    c.objects.link(o)
    return o


def make_flower(c):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.015, radius2=0.01, depth=0.35)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, 0.175))
    me = bpy.data.meshes.new("SM_Flor")
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new("SM_Flor", me)
    me.materials.append(M["fern"])
    c.objects.link(o)
    # cabeza de la flor (hortensia azul, como en la referencia)
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.09, subdivisions=2, location=(0, 0, 0.38))
    h = bpy.context.active_object
    h.data.materials.append(M["flower"])
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    h.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.join()
    o.name = "SM_Flor"
    return o


# ---------------------------------------------------- esparcido tipo pincel
def scatter(proto, count, area, c, scale=(0.8, 1.3), keep_out=None, tag=""):
    """Instancias enlazadas (Alt+D) -> ligeras en Blender; las posiciones
    quedan listas para el CSV que Unreal usa en PCG/Foliage."""
    pts = []
    tries = 0
    while len(pts) < count and tries < count * 20:
        tries += 1
        x = random.uniform(*area[0])
        y = random.uniform(*area[1])
        if keep_out and keep_out(x, y):
            continue
        z = ground_z(x, y)
        s = random.uniform(*scale)
        rz = random.uniform(0, math.tau)
        o = proto.copy()
        o.location = (x, y, z)
        o.rotation_euler = (0, 0, rz)
        o.scale = (s, s, s * random.uniform(0.9, 1.15))
        c.objects.link(o)
        pts.append((proto.name, x, y, z, rz, s))
    return pts


# -------------------------------------------------------------------- casa
def house(c, y=22):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, y, 2.5))
    h = bpy.context.active_object
    h.name = "Casa"
    h.scale = (7, 5, 5)
    h.data.materials.append(M["house"])
    link(h, c)
    bpy.ops.mesh.primitive_cone_add(radius1=5.4, radius2=0.1, depth=3, vertices=4,
                                    location=(0, y, 6.5), rotation=(0, 0, math.pi / 4))
    r = bpy.context.active_object
    r.name = "Tejado"
    r.data.materials.append(M["house"])
    link(r, c)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.0, y - 2.52, 1.6))
    w = bpy.context.active_object
    w.name = "Ventana_luz"
    w.scale = (0.8, 0.05, 1.1)
    w.data.materials.append(M["window"])
    link(w, c)
    pl = bpy.data.lights.new("LuzVentana", "POINT")
    pl.energy = 800
    pl.color = (1, 0.55, 0.2)
    pl.shadow_soft_size = 0.3
    po = bpy.data.objects.new("LuzVentana", pl)
    po.location = (0, y - 3.4, 1.7)
    c.objects.link(po)


# --------------------------------------------------- ambiente: noche + niebla
def atmosphere(c):
    sc = bpy.context.scene
    w = bpy.data.worlds.new("Noche")
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.004, 0.008, 0.02, 1)
    bg.inputs["Strength"].default_value = 0.6
    # niebla volumétrica
    out = w.node_tree.nodes["World Output"]
    vol = w.node_tree.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Color"].default_value = (0.35, 0.42, 0.55, 1)
    vol.inputs["Density"].default_value = 0.02
    vol.inputs["Anisotropy"].default_value = 0.4
    w.node_tree.links.new(vol.outputs["Volume"], out.inputs["Volume"])
    # luz de luna: tenue, fría, baja
    moon = bpy.data.lights.new("Luna", "SUN")
    moon.energy = 0.6
    moon.color = (0.55, 0.65, 1.0)
    mo = bpy.data.objects.new("Luna", moon)
    mo.rotation_euler = (math.radians(58), 0, math.radians(35))
    c.objects.link(mo)
    # linterna del jugador (spot) apuntando al arco — se sustituye en Unreal
    sp = bpy.data.lights.new("Linterna", "SPOT")
    sp.energy = 600
    sp.spot_size = math.radians(40)
    sp.spot_blend = 0.6
    sp.color = (1, 0.9, 0.75)
    so = bpy.data.objects.new("Linterna", sp)
    so.location = (0.3, -9, 1.6)
    so.rotation_euler = (math.radians(88), 0, 0)
    c.objects.link(so)
    # cámara a la altura de los ojos, mirando por el arco hacia la casa
    cam = bpy.data.cameras.new("Cam")
    cam.lens = 24
    co = bpy.data.objects.new("Cam_Jugador", cam)
    co.location = (0, -11, 1.65)
    co.rotation_euler = (math.radians(89), 0, 0)
    c.objects.link(co)
    sc.camera = co
    # render
    sc.render.engine = "BLENDER_EEVEE"
    try:
        sc.eevee.use_volumetric_shadows = True
    except Exception:
        pass
    sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Medium Low Contrast"
    sc.view_settings.exposure = 0.0


# ------------------------------------------------------------------ export
def export(arch_objs, slab_objs, veg_protos, points):
    base = bpy.path.abspath(OUT)
    os.makedirs(base, exist_ok=True)

    def sel(objs):
        bpy.ops.object.select_all(action="DESELECT")
        for o in objs:
            o.select_set(True)
        if objs:
            bpy.context.view_layer.objects.active = objs[0]

    # entorno fijo: FBX (escala 1 = 1m -> Unreal aplica x100 con ajuste de unidades)
    sel(arch_objs + slab_objs + [bpy.data.objects["Suelo"], bpy.data.objects["Casa"],
                                 bpy.data.objects["Tejado"]])
    bpy.ops.export_scene.fbx(filepath=os.path.join(base, "SM_Entorno.fbx"), use_selection=True,
                             apply_scale_options="FBX_SCALE_ALL", mesh_smooth_type="FACE")
    # vegetación: una malla base por tipo (glTF, para Foliage / PCG)
    for p in veg_protos:
        sel([p])
        bpy.ops.export_scene.gltf(filepath=os.path.join(base, p.name + ".glb"), use_selection=True,
                                  export_format="GLB")
    # puntos de esparcido
    with open(os.path.join(base, "vegetacion_puntos.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["mesh", "x_m", "y_m", "z_m", "rot_z_rad", "scale"])
        w.writerows(points)
    return base


# -------------------------------------------------------------------- main
def main():
    clean()
    materials()
    c_env = coll("Entorno")
    c_veg = coll("Vegetacion")
    c_ivy = coll("Hiedra")
    c_light = coll("Luces_Ambiente")
    c_proto = coll("Prototipos_Vegetacion")

    ground(c_env)
    arch_objs, top = arch(c_env)
    slab_objs = slabs(c_env)
    ivy(c_ivy, top, 1.7)
    house(c_env)
    atmosphere(c_light)

    fir, fern, flower = make_fir(c_proto), make_fern(c_proto), make_flower(c_proto)
    for p in (fir, fern, flower):
        p.hide_render = True  # los prototipos no salen en el render (solo sus copias)

    on_path = lambda x, y: abs(x) < 2.3 and -15 < y < 20      # camino libre
    under_arch = lambda x, y: abs(x) < 3.2 and abs(y) < 1.5
    pts = []
    pts += scatter(fir, 70, ((-22, 22), (-16, 30)), c_veg, (0.9, 1.6),
                   lambda x, y: on_path(x, y) or under_arch(x, y), "fir")
    pts += scatter(fern, 160, ((-9, 9), (-15, 18)), c_veg, (0.7, 1.3),
                   lambda x, y: abs(x) < 1.6 or under_arch(x, y), "fern")
    pts += scatter(flower, 40, ((-6, 6), (-13, 14)), c_veg, (0.8, 1.2),
                   lambda x, y: abs(x) < 1.8 or under_arch(x, y), "flower")

    base = export(arch_objs, slab_objs, [fir, fern, flower], pts)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(bpy.path.abspath(OUT), "forest_arch.blend"))
    print("OK ->", base, "| bloques:", len(arch_objs), "| losas:", len(slab_objs),
          "| puntos vegetación:", len(pts))


main()
