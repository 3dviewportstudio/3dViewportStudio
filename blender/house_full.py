"""Casa completa (abandonada, NO derruida) para el bosque de forest_arch_scene.py.

Se construye con MÓDULOS reutilizables (muro, suelo, techo, marco de puerta,
ventana, espejo, props...). Cada módulo es UNA malla; la casa son instancias
enlazadas (comparten malla) con posición/rotación/escala. Así:
  - en Blender pesa poco,
  - cada módulo se exporta UNA vez (FBX + glTF) a <out>/casa/modulos/,
  - casa_layout.json lista cada instancia (metros y también cm de Unreal)
    para montarla en Unreal con un script o a mano.

Coordenadas locales de la casa (metros): X derecha, Y hacia el fondo de la
casa (la fachada mira a -Y, hacia el camino del bosque), Z arriba.
Fachada en y=0, puerta principal en x=0.5.  build(origin=...) la coloca en el mundo.

Uso desde otro script:
    import house_full
    info = house_full.build(origin=(-0.5, 24, 0), out_dir="/ruta")
Uso suelto (genera solo la casa):
    blender -b -P house_full.py -- --out /ruta
"""
import bpy, bmesh, math, random, os, sys, json
from mathutils import Vector, Matrix, Euler, noise

RNG = random.Random(13)
T_INT = 0.1        # grosor de cada cara de muro interior (dos caras = 0.2 m)
T_EXT = 0.2        # grosor del muro exterior (fachada)
F0, H0 = 0.5, 3.0  # planta baja: cota del suelo y altura libre
F1, H1 = 3.7, 2.8  # planta alta
FA = 6.7           # suelo del desván = arranque del tejado
RIDGE_Y, RIDGE_Z = 6.5, 10.1

ORIGIN = Vector((0, 0, 0))
MATS, MODULES, LAYOUT, ROOMS, OPENINGS, LIGHTS = {}, {}, [], [], [], []
COLL = {}


# =================================================================== utilidades
def _coll(name, parent=None):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in (parent or bpy.context.scene.collection).children:
        (parent or bpy.context.scene.collection).children.link(c)
    return c


def W(x, y, z=0.0):
    """local casa -> mundo"""
    return Vector((x, y, z)) + ORIGIN


# ==================================================================== materiales
def _bsdf(m):
    if m.node_tree is None:
        m.use_nodes = True
    return m.node_tree.nodes["Principled BSDF"]


def flat(name, color, rough=0.8, metal=0.0, emit=None, alpha=None, transm=0.0):
    m = bpy.data.materials.new(name)
    b = _bsdf(m)
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if transm:
        b.inputs["Transmission Weight"].default_value = transm
    if emit:
        b.inputs["Emission Color"].default_value = (*emit[0], 1)
        b.inputs["Emission Strength"].default_value = emit[1]
    MATS[name] = m
    return m


def proc(name, a, b, scale=2.0, detail=6, rough=0.85, ramp=(0.42, 0.58), constant=False,
         bands=None, band_scale=3.0, bump=0.25, dust=None, checker=None):
    """Material procedural en coordenadas de MUNDO (no se deforma al escalar
    instancias): ruido -> rampa a/b, bandas opcionales (tablas, rayas, juntas)
    y capa de polvo opcional. En Unreal se sustituye por materiales reales
    (world-aligned / triplanar) — aquí solo es la vista previa."""
    m = bpy.data.materials.new(name)
    bsdf = _bsdf(m)
    nt = m.node_tree
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = scale
    nz.inputs["Detail"].default_value = detail
    rp = nt.nodes.new("ShaderNodeValToRGB")
    if constant:
        rp.color_ramp.interpolation = "CONSTANT"
    rp.color_ramp.elements[0].position = ramp[0]
    rp.color_ramp.elements[1].position = ramp[1]
    rp.color_ramp.elements[0].color = (*a, 1)
    rp.color_ramp.elements[1].color = (*b, 1)
    nt.links.new(geo.outputs["Position"], nz.inputs["Vector"])
    nt.links.new(nz.outputs["Fac"], rp.inputs["Fac"])
    col = rp.outputs["Color"]
    height = nz.outputs["Fac"]
    if checker:  # baldosas en damero (0.3 m), manchadas por el ruido
        ck = nt.nodes.new("ShaderNodeTexChecker")
        ck.inputs["Scale"].default_value = checker
        ck.inputs["Color1"].default_value = (*a, 1)
        ck.inputs["Color2"].default_value = (*b, 1)
        nt.links.new(geo.outputs["Position"], ck.inputs["Vector"])
        cm = nt.nodes.new("ShaderNodeMix")
        cm.data_type = "RGBA"
        cm.blend_type = "MULTIPLY"
        cm.inputs["Factor"].default_value = 0.5
        nt.links.new(ck.outputs["Color"], cm.inputs["A"])
        nt.links.new(rp.outputs["Color"], cm.inputs["B"])
        col = cm.outputs["Result"]
    if bands:
        wv = nt.nodes.new("ShaderNodeTexWave")
        wv.wave_type = "BANDS"
        wv.bands_direction = bands
        wv.inputs["Scale"].default_value = band_scale
        wv.inputs["Distortion"].default_value = 0.5
        nt.links.new(geo.outputs["Position"], wv.inputs["Vector"])
        mx = nt.nodes.new("ShaderNodeMix")
        mx.data_type = "RGBA"
        mx.blend_type = "MULTIPLY"
        mx.inputs["Factor"].default_value = 0.35
        ramp2 = nt.nodes.new("ShaderNodeMapRange")
        ramp2.inputs["To Min"].default_value = 0.55
        nt.links.new(wv.outputs["Fac"], ramp2.inputs["Value"])
        nt.links.new(col, mx.inputs["A"])
        nt.links.new(ramp2.outputs["Result"], mx.inputs["B"])
        col = mx.outputs["Result"]
        height = wv.outputs["Fac"]
    if dust:
        dn = nt.nodes.new("ShaderNodeTexNoise")
        dn.inputs["Scale"].default_value = 0.8
        dn.inputs["Detail"].default_value = 3
        nt.links.new(geo.outputs["Position"], dn.inputs["Vector"])
        dmx = nt.nodes.new("ShaderNodeMix")
        dmx.data_type = "RGBA"
        dmx.inputs["B"].default_value = (*dust, 1)
        dr = nt.nodes.new("ShaderNodeMapRange")
        dr.inputs["From Min"].default_value = 0.45
        dr.inputs["From Max"].default_value = 0.7
        dr.inputs["To Max"].default_value = 0.55
        nt.links.new(dn.outputs["Fac"], dr.inputs["Value"])
        nt.links.new(dr.outputs["Result"], dmx.inputs["Factor"])
        nt.links.new(col, dmx.inputs["A"])
        col = dmx.outputs["Result"]
    nt.links.new(col, bsdf.inputs["Base Color"])
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = bump
    nt.links.new(height, bp.inputs["Height"])
    nt.links.new(bp.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = rough
    MATS[name] = m
    return m


def materials():
    DUST = (0.33, 0.31, 0.28)
    # fachada: pintura gris verdosa desconchada sobre madera oscura, en tablas horizontales
    proc("M_Fachada_Desconchada", (0.07, 0.05, 0.035), (0.46, 0.48, 0.44), scale=5, detail=12,
         ramp=(0.0, 0.37), constant=True, bands="Z", band_scale=4.5, bump=0.4)
    proc("M_Piedra_Cimiento", (0.08, 0.08, 0.085), (0.25, 0.25, 0.24), scale=4, bump=0.6)
    proc("M_Tejas", (0.03, 0.035, 0.04), (0.11, 0.11, 0.12), scale=6, bands="Z", band_scale=8, bump=0.5)
    proc("M_Papel_Pintado", (0.17, 0.12, 0.09), (0.36, 0.30, 0.22), scale=1.2, bands="X",
         band_scale=9, dust=DUST, bump=0.08)
    proc("M_Papel_Infantil", (0.30, 0.22, 0.24), (0.52, 0.45, 0.42), scale=1.0, bands="Y",
         band_scale=12, dust=DUST, bump=0.05)
    proc("M_Azulejo", (0.32, 0.34, 0.31), (0.55, 0.56, 0.52), scale=2.5, bands="Z", band_scale=14,
         rough=0.35, dust=DUST, bump=0.15)
    proc("M_Bloque_Garaje", (0.16, 0.16, 0.15), (0.30, 0.29, 0.27), scale=3, bands="Z", band_scale=5)
    proc("M_Suelo_Madera", (0.06, 0.035, 0.02), (0.18, 0.11, 0.06), scale=0.7, bands="X",
         band_scale=12, dust=DUST, rough=0.7)
    proc("M_Baldosa", (0.10, 0.10, 0.10), (0.42, 0.40, 0.36), scale=1.5, dust=DUST, rough=0.5,
         checker=3.33)
    proc("M_Hormigon", (0.10, 0.10, 0.10), (0.22, 0.21, 0.20), scale=3, dust=DUST)
    proc("M_Techo_Yeso", (0.20, 0.18, 0.15), (0.40, 0.38, 0.34), scale=0.9, detail=8, bump=0.1)
    proc("M_Madera_Oscura", (0.04, 0.025, 0.015), (0.12, 0.07, 0.04), scale=3, bands="X",
         band_scale=20, rough=0.6)
    proc("M_Sabana", (0.35, 0.34, 0.31), (0.55, 0.53, 0.48), scale=2, dust=DUST, rough=0.95, bump=0.3)
    proc("M_Ladrillo", (0.14, 0.06, 0.04), (0.30, 0.15, 0.10), scale=4, bands="Z", band_scale=20)
    proc("M_Carton", (0.25, 0.17, 0.09), (0.38, 0.27, 0.15), scale=5, rough=0.95)
    flat("M_Espejo", (0.92, 0.92, 0.9), rough=0.02, metal=1.0)
    flat("M_Cristal", (0.55, 0.6, 0.55), rough=0.15, transm=0.8)
    flat("M_Cristal_Sucio", (0.08, 0.09, 0.09), rough=0.35)
    flat("M_Cinta_Policial", (0.85, 0.65, 0.02), rough=0.5)
    flat("M_Marcador", (0.9, 0.75, 0.05), rough=0.4)
    flat("M_Metal", (0.25, 0.25, 0.26), rough=0.45, metal=1.0)
    flat("M_Bombilla", (1, 0.75, 0.4), emit=((1, 0.6, 0.25), 25.0))
    flat("M_Cable", (0.02, 0.02, 0.02), rough=0.6)
    flat("M_Tela_Sillon", (0.16, 0.03, 0.03), rough=0.9)
    flat("M_Cortina", (0.30, 0.20, 0.17), rough=0.95)
    flat("M_Cortina_Luz", (0.6, 0.35, 0.15), emit=((1.0, 0.5, 0.18), 3.0))
    flat("M_Lienzo", (0.03, 0.025, 0.02), rough=0.9)
    flat("M_Ceramica", (0.6, 0.6, 0.57), rough=0.25)
    flat("M_Juguete_Rojo", (0.35, 0.03, 0.02), rough=0.6)
    flat("M_Juguete_Azul", (0.03, 0.07, 0.25), rough=0.6)
    flat("M_Peluche", (0.22, 0.13, 0.07), rough=1.0)


# ====================================================== constructor de mallas
class MB:
    """Pequeño constructor de mallas con bmesh (cajas, cilindros, esferas)."""

    def __init__(self):
        self.bm = bmesh.new()
        self.mats = []

    def _mi(self, mat):
        m = MATS[mat]
        if m not in self.mats:
            self.mats.append(m)
        return self.mats.index(m)

    def _tag(self, verts, mat):
        i = self._mi(mat)
        for f in {f for v in verts for f in v.link_faces}:
            f.material_index = i

    def box(self, x0, x1, y0, y1, z0, z1, mat, rot=None):
        mtx = Matrix.Translation(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)) @ \
            Matrix.Diagonal((x1 - x0, y1 - y0, z1 - z0, 1))
        if rot:
            mtx = rot.to_matrix().to_4x4() @ mtx
        r = bmesh.ops.create_cube(self.bm, size=1, matrix=mtx)
        self._tag(r["verts"], mat)
        return r["verts"]

    def cyl(self, cx, cy, z0, z1, r, mat, seg=12, r2=None):
        res = bmesh.ops.create_cone(self.bm, cap_ends=True, segments=seg, radius1=r,
                                    radius2=r if r2 is None else r2, depth=z1 - z0,
                                    matrix=Matrix.Translation((cx, cy, (z0 + z1) / 2)))
        self._tag(res["verts"], mat)
        return res["verts"]

    def sphere(self, c, r, mat, seg=12):
        res = bmesh.ops.create_uvsphere(self.bm, u_segments=seg, v_segments=seg // 2 + 2,
                                        radius=r, matrix=Matrix.Translation(c))
        self._tag(res["verts"], mat)
        return res["verts"]

    def finish(self, name, smooth=False):
        me = bpy.data.meshes.new(name)
        self.bm.to_mesh(me)
        self.bm.free()
        for m in self.mats:
            me.materials.append(m)
        if smooth:
            for p in me.polygons:
                p.use_smooth = True
        MODULES[name] = me
        return me


def unit_box(name, mat):
    mb = MB()
    mb.box(0, 1, 0, 1, 0, 1, mat)
    return mb.finish(name)


# =================================================================== módulos
def build_modules():
    # --- estructura: cajas unidad (origen en la esquina mín.), se escalan al colocar
    unit_box("SM_Muro_Exterior", "M_Fachada_Desconchada")
    unit_box("SM_Muro_Papel", "M_Papel_Pintado")
    unit_box("SM_Muro_Infantil", "M_Papel_Infantil")
    unit_box("SM_Muro_Azulejo", "M_Azulejo")
    unit_box("SM_Muro_Garaje", "M_Bloque_Garaje")
    unit_box("SM_Suelo_Madera", "M_Suelo_Madera")
    unit_box("SM_Suelo_Baldosa", "M_Baldosa")
    unit_box("SM_Suelo_Hormigon", "M_Hormigon")
    unit_box("SM_Techo", "M_Techo_Yeso")
    unit_box("SM_Cimentacion", "M_Piedra_Cimiento")
    unit_box("SM_Tejado", "M_Tejas")
    unit_box("SM_Escalon", "M_Madera_Oscura")
    unit_box("SM_Tapiado", "M_Ladrillo")
    unit_box("SM_Alfombra", "M_Cortina")
    # hastial (triángulo en YZ, prisma en X), unidad
    bm = bmesh.new()
    v = [bm.verts.new(p) for p in ((0, 0, 0), (0, 1, 0), (0, .5, 1), (1, 0, 0), (1, 1, 0), (1, .5, 1))]
    for f in ((0, 2, 1), (3, 4, 5), (0, 1, 4, 3), (1, 2, 5, 4), (2, 0, 3, 5)):
        bm.faces.new([v[i] for i in f])
    me = bpy.data.meshes.new("SM_Hastial")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(MATS["M_Fachada_Desconchada"])
    MODULES["SM_Hastial"] = me

    # --- marco de puerta: hueco estándar 0.9 x 2.1, profundidad unidad (y -0.5..0.5)
    mb = MB()
    t = 0.07
    mb.box(-0.45 - t, -0.45, -0.5, 0.5, 0, 2.1 + t, "M_Madera_Oscura")
    mb.box(0.45, 0.45 + t, -0.5, 0.5, 0, 2.1 + t, "M_Madera_Oscura")
    mb.box(-0.45, 0.45, -0.5, 0.5, 2.1, 2.1 + t, "M_Madera_Oscura")
    mb.finish("SM_MarcoPuerta")
    # --- hoja de puerta: bisagra en x=0, hacia +x, 0.88 x 2.08
    mb = MB()
    mb.box(0, 0.88, -0.022, 0.022, 0.01, 2.08, "M_Madera_Oscura")
    for zz in (0.35, 1.25):  # cuarterones
        mb.box(0.12, 0.76, -0.032, 0.032, zz, zz + 0.65, "M_Madera_Oscura")
    mb.sphere((0.78, -0.06, 1.0), 0.03, "M_Metal", 8)
    mb.sphere((0.78, 0.06, 1.0), 0.03, "M_Metal", 8)
    mb.finish("SM_Puerta")
    # --- ventana: hueco unidad 1x1 (x -0.5..0.5, z 0..1), profundidad unidad
    mb = MB()
    f = 0.06
    mb.box(-0.5, -0.5 + f, -0.5, 0.5, 0, 1, "M_Madera_Oscura")
    mb.box(0.5 - f, 0.5, -0.5, 0.5, 0, 1, "M_Madera_Oscura")
    mb.box(-0.5, 0.5, -0.5, 0.5, 0, f, "M_Madera_Oscura")
    mb.box(-0.5, 0.5, -0.5, 0.5, 1 - f, 1, "M_Madera_Oscura")
    mb.box(-0.02, 0.02, -0.08, 0.08, 0, 1, "M_Madera_Oscura")      # parteluz
    mb.box(-0.5, 0.5, -0.08, 0.08, 0.6, 0.64, "M_Madera_Oscura")  # travesaño
    mb.box(-0.5 + f, 0.5 - f, -0.01, 0.01, f, 1 - f, "M_Cristal")
    mb.finish("SM_Ventana")
    # --- puerta de garaje (seccional cerrada, se deja 0.35 m abierta abajo)
    mb = MB()
    for i in range(5):
        mb.box(0, 1, -0.03, 0.03, i * 0.2 + 0.005, i * 0.2 + 0.195, "M_Metal")
    mb.finish("SM_Puerta_Garaje")
    # --- poste del porche, barandilla (tramo de 1 m), pasamanos
    mb = MB()
    mb.box(-0.08, 0.08, -0.08, 0.08, 0, 1, "M_Madera_Oscura")
    mb.finish("SM_Poste")
    mb = MB()
    mb.box(0, 1, -0.04, 0.04, 0.9, 0.96, "M_Madera_Oscura")
    mb.box(0, 1, -0.03, 0.03, 0.08, 0.13, "M_Madera_Oscura")
    for i in range(6):
        x = 0.08 + i * 0.168
        mb.box(x - 0.02, x + 0.02, -0.02, 0.02, 0.13, 0.9, "M_Madera_Oscura")
    mb.finish("SM_Barandilla")
    # --- trampilla del desván + escalera plegable (largo unidad en +Y local)
    mb = MB()
    mb.box(0, 1, 0, 1, 0, 0.04, "M_Madera_Oscura")
    mb.finish("SM_Trampilla")
    mb = MB()
    for x in (0.0, 0.42):
        mb.box(x, x + 0.06, 0, 1, -0.03, 0.03, "M_Madera_Oscura")
    for i in range(10):
        y = 0.05 + i * 0.1
        mb.box(0.06, 0.42, y, y + 0.025, -0.02, 0.02, "M_Madera_Oscura")
    mb.finish("SM_Escalera_Plegable")
    build_prop_modules()


def sheet_lump():
    """Mueble tapado con sábana: cubo subdividido con pliegues y faldón (unidad)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=7, use_grid_fill=True)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, 0.5))
    for v in bm.verts:
        x, y, z = v.co
        k = 1.0
        if z > 0.85:
            k *= 1 - (z - 0.85) * 0.5              # hombros redondeados
        if z < 0.18:
            k *= 1 + (0.18 - z) * 0.45             # faldón que cae al suelo
        ang = math.atan2(y, x)
        fold = 0.018 * math.sin(ang * 14 + z * 3) * (1 - z) ** 0.5
        v.co.x, v.co.y = x * k + math.cos(ang) * fold, y * k + math.sin(ang) * fold
        v.co.z = max(0.0, z + noise.noise(v.co * 3.0) * 0.025 * z)
    me = bpy.data.meshes.new("SM_Sabana_Bulto")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(MATS["M_Sabana"])
    for p in me.polygons:
        p.use_smooth = True
    MODULES["SM_Sabana_Bulto"] = me


def curtain():
    bm = bmesh.new()
    nx, nz = 28, 6
    vs = [[bm.verts.new((i / nx - 0.5, -0.035 * math.sin(i / nx * math.tau * 5) - 0.04, j / nz))
           for j in range(nz + 1)] for i in range(nx + 1)]
    for i in range(nx):
        for j in range(nz):
            bm.faces.new((vs[i][j], vs[i + 1][j], vs[i + 1][j + 1], vs[i][j + 1]))
    me = bpy.data.meshes.new("SM_Cortina")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(MATS["M_Cortina"])
    for p in me.polygons:
        p.use_smooth = True
    MODULES["SM_Cortina"] = me


def build_prop_modules():
    """Props. Convención: centrados en X, base en z=0. Los de pared tienen la
    espalda en y=0 y el frente hacia -Y (se colocan con wall_mount)."""
    sheet_lump()
    curtain()
    WD, MT = "M_Madera_Oscura", "M_Metal"
    # espejo de pared (unidad 1x1, frente -Y). El vidrio usa M_Espejo.
    mb = MB()
    mb.box(-0.5, 0.5, -0.03, 0, 0, 1, WD)
    for b in ((-0.5, -0.44, 0, 1), (0.44, 0.5, 0, 1), (-0.5, 0.5, 0, 0.06), (-0.5, 0.5, 0.94, 1)):
        mb.box(b[0], b[1], -0.06, -0.03, b[2], b[3], WD)
    mb.box(-0.44, 0.44, -0.045, -0.03, 0.06, 0.94, "M_Espejo")
    mb.finish("SM_Espejo")
    # cuadro (unidad)
    mb = MB()
    mb.box(-0.5, 0.5, -0.04, 0, 0, 1, WD)
    mb.box(-0.42, 0.42, -0.045, -0.04, 0.08, 0.92, "M_Lienzo")
    mb.finish("SM_Cuadro")
    # sillón (frente -Y)
    mb = MB()
    mb.box(-0.42, 0.42, -0.42, 0.3, 0.12, 0.45, "M_Tela_Sillon")
    mb.box(-0.42, 0.42, 0.18, 0.42, 0.12, 1.05, "M_Tela_Sillon")
    for sx in (-1, 1):
        mb.box(sx * 0.42 - 0.07, sx * 0.42 + 0.07, -0.42, 0.42, 0.12, 0.68, "M_Tela_Sillon")
        for sy in (-1, 1):
            mb.cyl(sx * 0.36, sy * 0.36, 0, 0.12, 0.03, WD, 8)
    mb.finish("SM_Sillon")
    # mesa 1.2 x 0.8
    mb = MB()
    mb.box(-0.6, 0.6, -0.4, 0.4, 0.72, 0.76, WD)
    for sx in (-1, 1):
        for sy in (-1, 1):
            mb.box(sx * 0.54 - 0.03, sx * 0.54 + 0.03, sy * 0.34 - 0.03, sy * 0.34 + 0.03, 0, 0.72, WD)
    mb.finish("SM_Mesa")
    # silla (respaldo en +Y)
    mb = MB()
    mb.box(-0.22, 0.22, -0.22, 0.22, 0.43, 0.47, WD)
    for sx in (-1, 1):
        for sy in (-1, 1):
            mb.box(sx * 0.19 - 0.02, sx * 0.19 + 0.02, sy * 0.19 - 0.02, sy * 0.19 + 0.02, 0, 0.43, WD)
        mb.box(sx * 0.19 - 0.02, sx * 0.19 + 0.02, 0.17, 0.21, 0.47, 0.95, WD)
    mb.box(-0.21, 0.21, 0.17, 0.21, 0.8, 0.92, WD)
    mb.finish("SM_Silla")
    # cama 1.0 x 2.0 (cabecero en +Y), centrada
    mb = MB()
    mb.box(-0.5, 0.5, -1.0, 1.0, 0.2, 0.32, WD)
    mb.box(-0.47, 0.47, -0.97, 0.97, 0.32, 0.5, "M_Sabana")
    mb.box(-0.5, 0.5, 0.95, 1.0, 0, 1.0, WD)
    mb.box(-0.5, 0.5, -1.0, -0.95, 0, 0.6, WD)
    mb.box(-0.35, 0.35, 0.55, 0.9, 0.5, 0.62, "M_Sabana")
    mb.finish("SM_Cama")
    # armario (frente -Y)
    mb = MB()
    mb.box(-0.5, 0.5, -0.55, 0, 0, 2.0, WD)
    mb.box(-0.005, 0.005, -0.56, -0.55, 0.1, 1.9, MT)
    mb.finish("SM_Armario")
    # cocina: encimera, fregadero, fogón, nevera (frente -Y, 1 m / 0.6 / 0.7)
    mb = MB()
    mb.box(-0.5, 0.5, -0.6, 0, 0, 0.86, WD)
    mb.box(-0.5, 0.5, -0.62, 0, 0.86, 0.9, "M_Ceramica")
    mb.finish("SM_Encimera")
    mb = MB()
    mb.box(-0.5, 0.5, -0.6, 0, 0, 0.86, WD)
    mb.box(-0.5, 0.5, -0.62, 0, 0.86, 0.9, "M_Ceramica")
    mb.box(-0.3, 0.3, -0.5, -0.12, 0.9, 0.92, MT)
    mb.cyl(0, -0.08, 0.9, 1.15, 0.015, MT, 8)
    mb.finish("SM_Fregadero")
    mb = MB()
    mb.box(-0.3, 0.3, -0.6, 0, 0, 0.9, "M_Ceramica")
    for sx in (-0.13, 0.13):
        for sy in (-0.42, -0.18):
            mb.cyl(sx, sy, 0.9, 0.92, 0.08, MT, 12)
    mb.box(-0.3, 0.3, -0.05, 0, 0.9, 1.05, "M_Ceramica")
    mb.finish("SM_Fogon")
    mb = MB()
    mb.box(-0.35, 0.35, -0.7, 0, 0, 1.8, "M_Ceramica")
    mb.box(0.25, 0.28, -0.73, -0.7, 0.9, 1.4, MT)
    mb.finish("SM_Nevera")
    # caso: caja de pruebas, cinta policial (1 m en +X), marcador numerado
    mb = MB()
    mb.box(-0.23, 0.23, -0.17, 0.17, 0, 0.3, "M_Carton")
    mb.box(-0.235, 0.235, -0.18, 0.18, 0.27, 0.31, "M_Carton")
    mb.box(-0.1, 0.1, -0.181, -0.17, 0.12, 0.22, "M_Sabana")  # etiqueta
    mb.finish("SM_Caja_Pruebas")
    mb = MB()
    mb.box(0, 1, -0.002, 0.002, -0.035, 0.035, "M_Cinta_Policial")
    mb.finish("SM_Cinta_Policial")
    bm = bmesh.new()
    v = [bm.verts.new(p) for p in ((-0.05, -0.04, 0), (0.05, -0.04, 0), (0, 0, 0.1),
                                   (-0.05, 0.04, 0), (0.05, 0.04, 0))]
    bm.faces.new((v[0], v[1], v[2]))
    bm.faces.new((v[4], v[3], v[2]))
    bm.faces.new((v[1], v[4], v[2]))
    bm.faces.new((v[3], v[0], v[2]))
    me = bpy.data.meshes.new("SM_Marcador_Pruebas")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(MATS["M_Marcador"])
    MODULES["SM_Marcador_Pruebas"] = me
    # bombilla desnuda (origen en el techo, cuelga hacia -Z)
    mb = MB()
    mb.cyl(0, 0, -0.62, 0, 0.004, "M_Cable", 6)
    mb.cyl(0, 0, -0.68, -0.6, 0.018, MT, 10)
    mb.sphere((0, 0, -0.72), 0.04, "M_Bombilla", 12)
    mb.finish("SM_Bombilla")
    # baño
    mb = MB()
    mb.box(-0.8, 0.8, -0.75, 0, 0, 0.55, "M_Ceramica")
    mb.box(-0.72, 0.72, -0.68, -0.07, 0.25, 0.56, "M_Cristal_Sucio")
    mb.finish("SM_Banera")
    mb = MB()
    mb.cyl(0, -0.2, 0, 0.75, 0.08, "M_Ceramica", 12)
    mb.box(-0.28, 0.28, -0.45, 0, 0.75, 0.88, "M_Ceramica")
    mb.finish("SM_Lavabo")
    # garaje / desván
    mb = MB()
    for zz in (0.05, 0.7, 1.35, 1.95):
        mb.box(-0.5, 0.5, -0.4, 0, zz, zz + 0.03, MT)
    for sx in (-0.48, 0.48):
        for sy in (-0.38, -0.02):
            mb.box(sx - 0.02, sx + 0.02, sy - 0.02, sy + 0.02, 0, 2.0, MT)
    mb.finish("SM_Estanteria")
    mb = MB()
    mb.box(-1.0, 1.0, -0.7, 0, 0.82, 0.9, WD)
    for sx in (-0.95, 0.95):
        mb.box(sx - 0.04, sx + 0.04, -0.66, -0.04, 0, 0.82, WD)
    mb.finish("SM_Banco_Trabajo")
    mb = MB()
    mb.box(-0.45, 0.45, -0.25, 0.25, 0, 0.45, WD)
    mb.box(-0.47, 0.47, -0.27, 0.27, 0.42, 0.5, MT)
    mb.finish("SM_Baul")
    # juguetes
    mb = MB()
    mb.box(-0.04, 0.04, -0.04, 0.04, 0, 0.08, "M_Juguete_Rojo")
    mb.finish("SM_Bloque_Juguete")
    mb = MB()
    mb.sphere((0, 0, 0.11), 0.11, "M_Peluche")
    mb.sphere((0, 0, 0.29), 0.08, "M_Peluche")
    for sx in (-1, 1):
        mb.sphere((sx * 0.06, 0, 0.36), 0.03, "M_Peluche", 8)
        mb.sphere((sx * 0.09, -0.06, 0.03), 0.04, "M_Peluche", 8)
    mb.sphere((0, -0.07, 0.28), 0.02, "M_Juguete_Azul", 8)
    mb.finish("SM_Osito", smooth=True)


# =========================================================== parte 3: props
def R(name):
    return next(r for r in ROOMS if r["name"] == name)


def wall_mount(module, room_name, edge, s, z=None, scale=(1, 1, 1), d=0.0, coll="Casa_Props",
               name=None):
    """Coloca un módulo de pared (espalda en y=0, frente -Y) contra la cara
    interior de un muro de la habitación. s = posición a lo largo del muro."""
    r = R(room_name)
    z = r["fz"] if z is None else z
    if edge == "N":
        loc, rz = (s, r["y1"] - T_INT - d, z), 0
    elif edge == "S":
        loc, rz = (s, r["y0"] + T_INT + d, z), 180
    elif edge == "W":
        loc, rz = (r["x0"] + T_INT + d, s, z), 90
    else:
        loc, rz = (r["x1"] - T_INT - d, s, z), -90
    return place(module, loc, (0, 0, rz), scale, coll, name)


def tape(p0, p1, name="Cinta_Policial"):
    p0, p1 = Vector(p0), Vector(p1)
    dv = p1 - p0
    yaw = math.degrees(math.atan2(dv.y, dv.x))
    pitch = math.degrees(math.atan2(dv.z, dv.xy.length))
    return place("SM_Cinta_Policial", tuple(p0), (0, -pitch, yaw), (dv.length, 1, 1),
                 "Casa_Props", name)


def lump(x, y, z, sx, sy, sz, rz=0, name="Mueble_Tapado"):
    return place("SM_Sabana_Bulto", (x, y, z), (0, 0, rz), (sx, sy, sz), "Casa_Props", name)


def marker(x, y, z, rz=0):
    return place("SM_Marcador_Pruebas", (x, y, z), (0, 0, rz), (1, 1, 1), "Casa_Props",
                 "Marcador_Pruebas")


def boxes(x, y, z, n, rz=0, name="Caja_Pruebas"):
    for i in range(n):
        place("SM_Caja_Pruebas", (x + RNG.uniform(-0.03, 0.03), y + RNG.uniform(-0.03, 0.03),
                                  z + i * 0.31), (0, 0, rz + RNG.uniform(-8, 8)), (1, 1, 1),
              "Casa_Props", name)


def build_interior_props():
    P, ES = "Casa_Props", "Casa_Espejos"
    # cortinas en las ventanas de fachada (la de luz cálida, con tela que brilla)
    for o in OPENINGS:
        if o["kind"] != "window" or o["name"] in ("V_Buhardilla",):
            continue
        a = o["coord"] + o["inward"] * (T_INT + 0.12)
        rz = (0 if o["axis"] == "y" else 90) + (0 if o["inward"] > 0 else 180)
        rz = rz if o["axis"] == "y" else rz - 180
        loc = (o["s"], a, o["zb"] - 0.25) if o["axis"] == "y" else (a, o["s"], o["zb"] - 0.25)
        cur = place("SM_Cortina", loc, (0, 0, rz), (o["w"] + 0.5, 1, o["zt"] - o["zb"] + 0.45),
                    P, f"Cortina_{o['name']}")
        if o["lit"]:
            cur.material_slots[0].link = "OBJECT"
            cur.material_slots[0].material = MATS["M_Cortina_Luz"]
            LAYOUT[-1]["material_override"] = "M_Cortina_Luz"

    # --- RECIBIDOR: bombilla desnuda, espejo, cajas de pruebas, cinta en el pasillo
    place("SM_Bombilla", (0.6, 3.0, F0 + H0), (0, 0, 0), (1, 1, 1), P, "Bombilla_Recibidor")
    wall_mount("SM_Espejo", "Recibidor", "E", 1.3, F0 + 0.9, (0.7, 1, 1.3), coll=ES,
               name="Espejo_Recibidor")
    wall_mount("SM_Cuadro", "Recibidor", "W", 3.2, F0 + 2.4, (0.6, 1, 0.5), d=0.0)
    place_box("SM_Alfombra", -0.6, 1.7, 1.0, 4.8, F0, F0 + 0.01, P, "Alfombra_Recibidor")
    boxes(1.35, 5.35, F0, 2, 10)
    boxes(1.0, 5.45, F0, 1, -20)
    tape((0.35, 5.85, F0 + 1.0), (1.25, 5.85, F0 + 1.7))
    tape((0.35, 5.85, F0 + 1.75), (1.25, 5.85, F0 + 1.05))
    # cinta en la puerta principal (por fuera) y en la del garaje
    tape((-0.05, -0.26, F0 + 0.5), (1.05, -0.26, F0 + 2.0))
    tape((-0.05, -0.26, F0 + 1.9), (1.05, -0.26, F0 + 0.6))
    tape((6.9, -0.25, 1.2), (10.3, -0.25, 1.5))

    # --- SALÓN: todo tapado con sábanas
    lump(-4.0, 4.6, F0, 2.1, 0.95, 0.9, 0, "Sofa_Tapado")
    lump(-5.1, 1.7, F0, 0.95, 0.95, 1.05, 35, "Sillon_Tapado")
    lump(-2.9, 1.7, F0, 0.95, 0.95, 1.05, -35, "Sillon_Tapado")
    lump(-4.0, 2.9, F0, 1.0, 0.6, 0.45, 0, "Mesita_Tapada")
    lump(-5.55, 4.8, F0, 0.6, 1.5, 1.3, 0, "Piano_Tapado")
    lump(-2.45, 5.45, F0, 0.5, 0.4, 2.0, 0, "Reloj_Tapado")
    place_box("SM_Alfombra", -5.3, -2.7, 1.2, 4.2, F0, F0 + 0.01, P, "Alfombra_Salon")

    # --- COCINA
    k = "Cocina"
    wall_mount("SM_Nevera", k, "N", 2.5)
    wall_mount("SM_Encimera", k, "N", 3.35)
    wall_mount("SM_Fregadero", k, "N", 4.35)
    wall_mount("SM_Fogon", k, "N", 5.15)
    wall_mount("SM_Encimera", k, "N", 5.67, scale=(0.44, 1, 1))
    for s in (0.65, 1.65, 2.65):
        wall_mount("SM_Encimera", k, "E", s)
    place("SM_Mesa", (3.9, 2.7, F0), (0, 0, 8), (1, 1, 1), P)
    place("SM_Silla", (3.1, 2.6, F0), (0, 0, 95), (1, 1, 1), P)
    place("SM_Silla", (3.9, 3.45, F0), (0, 0, 0), (1, 1, 1), P)
    place("SM_Silla", (4.5, 1.55, F0 + 0.22), (90, 0, 150), (1, 1, 1), P, "Silla_Volcada")
    for i, (mx, my, mz) in enumerate(((3.6, 2.6, F0 + 0.76), (4.3, 2.9, F0 + 0.76),
                                      (4.9, 1.0, F0), (3.0, 1.2, F0), (5.2, 4.2, F0))):
        marker(mx, my, mz, i * 37)
    b = place("SM_Bombilla", (3.9, 2.7, F0 + H0), (0, 0, 0), (1, 1, 1), P, "Bombilla_Cocina_Fundida")
    for sl in b.material_slots:  # fundida: el cristal no emite
        if sl.material and sl.material.name == "M_Bombilla":
            sl.link = "OBJECT"
            sl.material = MATS["M_Cristal_Sucio"]
    LAYOUT[-1]["material_override"] = "M_Cristal_Sucio (bombilla fundida)"

    # --- PASILLOS sin sentido
    wall_mount("SM_Espejo", "Pasillo_A", "N", 0.8, F0 + 0.02, (0.95, 1, 2.4), coll=ES,
               name="Espejo_Fondo_PasilloA")
    fake_door("x", 0.2, 8.0, +1, F0, bricked=True, swing=-20, name="PasilloA_Tapiada")
    wall_mount("SM_Cuadro", "Pasillo_A", "E", 7.4, F0 + 1.5, (0.4, 1, 0.55))
    wall_mount("SM_Cuadro", "Pasillo_A", "E", 10.0, F0 + 1.4, (0.4, 1, 0.55))
    tape((0.3, 9.2, F0 + 1.1), (1.3, 9.0, F0 + 1.5))
    wall_mount("SM_Cuadro", "Pasillo_B", "S", -2.5, F0 + 1.5, (0.5, 1, 0.4))
    fake_door("y", 11.6, -0.7, -1, F0, bricked=False, swing=0, name="PasilloB_Falsa")
    wall_mount("SM_Cuadro", "Pasillo_C", "W", 8.3, F0 + 1.5, (0.5, 1, 0.6))
    marker(-5.4, 9.0, F0)

    # --- CUARTO INFANTIL (sin ventanas: tiene una ventana falsa contra el muro)
    ci = "Cuarto_Infantil"
    place("SM_Cama", (-1.2, 9.5, F0), (0, 0, 0), (0.8, 0.8, 0.8), P, "Cama_Infantil")
    wall_mount("SM_Armario", ci, "S", -2.8, scale=(0.9, 1, 0.85))
    place("SM_Ventana", (0.2 - T_INT - 0.025, 7.6, F0 + 1.0), (0, 0, 90), (1.0, 0.05, 1.1), P,
          "Ventana_Falsa_Infantil")
    wall_mount("SM_Espejo", ci, "S", -0.7, F0 + 0.9, (0.35, 1, 0.5), coll=ES, name="Espejo_Infantil")
    place("SM_Osito", (-4.35, 6.5, F0), (0, 0, 200), (1, 1, 1), P, "Osito_Mirando_Esquina")
    for i in range(9):
        place("SM_Bloque_Juguete", (-2.6 + RNG.uniform(-0.6, 0.6), 7.6 + RNG.uniform(-0.5, 0.5),
                                    F0), (0, 0, RNG.uniform(0, 90)), (1, 1, 1), P)
    for b in range(4):  # torre de bloques perfecta: alguien la ha montado
        place("SM_Bloque_Juguete", (-3.6, 8.9, F0 + b * 0.08), (0, 0, 0), (1, 1, 1), P,
              "Torre_Bloques")
    marker(-1.0, 8.4, F0)
    marker(-2.4, 7.1, F0, 40)
    tape((-1.7, 8.6, F0 + 0.9), (-0.7, 10.2, F0 + 0.9))

    # --- BAÑO
    wall_mount("SM_Banera", "Bano", "N", -5.1)
    wall_mount("SM_Lavabo", "Bano", "E", 12.3)
    wall_mount("SM_Espejo", "Bano", "E", 12.3, F0 + 1.15, (0.5, 1, 0.7), coll=ES,
               name="Espejo_Bano")
    # --- CUARTO DIMINUTO: una silla mirando a la esquina
    place("SM_Silla", (-2.05, 12.55, F0), (0, 0, 180 + 25), (1, 1, 1), P, "Silla_Esquina")
    # --- SALA DEL SILLÓN: vacía, doble altura, un sillón frente a un espejo enorme
    place("SM_Sillon", (3.7, 8.4, F0), (0, 0, 180), (1, 1, 1), P, "Sillon_Unico")
    wall_mount("SM_Espejo", "Sala_Sillon", "N", 3.7, F0 + 0.2, (1.7, 1, 2.9), coll=ES,
               name="Espejo_Sala_Sillon")
    # --- GARAJE: coche tapado, estanterías y cajas de pruebas precintadas
    g = "Garaje"
    lump(8.6, 3.0, 0.05, 1.9, 4.4, 1.45, 0, "Coche_Tapado")
    wall_mount("SM_Estanteria", g, "N", 7.3)
    wall_mount("SM_Estanteria", g, "N", 10.2)
    for s in (7.3, 10.2):
        for zz in (0.08, 0.73, 1.38):
            if RNG.random() < 0.8:
                place("SM_Caja_Pruebas", (s, 6.4 - 0.2, 0.05 + zz), (0, 0, RNG.uniform(-10, 10)),
                      (1, 1, 1), P)
    boxes(9.0, 5.8, 0.05, 3, 5)
    boxes(8.5, 5.85, 0.05, 2, -12)
    wall_mount("SM_Banco_Trabajo", g, "E", 5.3)
    place_box("SM_Escalon", 6.1, 6.7, 4.1, 5.1, 0.05, F0 - 0.22, "Casa_Interior", "Escalon_Garaje")
    tape((6.15, 4.15, 1.0), (6.15, 5.05, 1.9))

    # --- PLANTA ALTA
    lump(-4.0, 4.85, F1, 1.6, 2.1, 0.75, 0, "Cama_Tapada")
    lump(-2.6, 3.3, F1, 0.6, 1.1, 2.0, 0, "Armario_Tapado")
    wall_mount("SM_Mesa", "Dormitorio", "W", 4.9, scale=(0.8, 0.5, 1), d=-0.4)
    wall_mount("SM_Espejo", "Dormitorio", "W", 4.9, F1 + 0.95, (0.8, 1, 0.9), coll=ES,
               name="Espejo_Tocador")
    place_box("SM_Alfombra", -5.2, -2.8, 1.0, 3.6, F1, F1 + 0.01, P, "Alfombra_Dormitorio")
    boxes(1.5, 5.4, F1, 2, 15)
    wall_mount("SM_Cuadro", "Pasillo_Superior", "S", -1.2, F1 + 1.4, (0.5, 1, 0.6))
    # cuarto con muebles PEGADOS AL TECHO (boca abajo)
    top = F1 + H1
    place("SM_Cama", (4.5, 4.4, top), (180, 0, 0), (1, 1, 1), P, "Cama_Techo")
    place("SM_Silla", (2.9, 2.4, top), (180, 0, 30), (1, 1, 1), P, "Silla_Techo")
    place("SM_Mesa", (3.6, 1.7, top), (180, 0, 0), (0.8, 0.8, 1), P, "Mesa_Techo")
    place("SM_Armario", (5.9 - 0.0, 2.2, top), (180, 0, 90), (1, 1, 1), P, "Armario_Techo")
    place_box("SM_Alfombra", 2.6, 5.4, 0.8, 5.0, top - 0.01, top, P, "Alfombra_Techo")
    place("SM_Osito", (3.6, 1.7, top - 0.76), (180, 0, 0), (1, 1, 1), P, "Osito_Techo")
    # sala de puertas: puertas que dan a pared (cerradas, entreabiertas, tapiadas)
    sp = [("y", 13, -2.6, -1, False, 0), ("y", 13, -1.0, -1, True, 70), ("y", 13, 0.5, -1, False, 0),
          ("x", -6, 7.5, 1, False, -15), ("x", -6, 9.5, 1, True, -80), ("x", -6, 11.5, 1, False, 0),
          ("x", 1.4, 8.5, -1, False, 0), ("x", 1.4, 12.2, -1, True, 60),
          ("y", 6, -4.5, 1, False, 0), ("y", 6, -2.8, 1, False, -10)]
    for i, (ax, co, s, inw, br, sw) in enumerate(sp):
        fake_door(ax, co, s, inw, F1, bricked=br, swing=sw, name=f"SalaPuertas_{i}")
    fake_door("x", 1.4, 10.4, -1, F1, w=0.45, h=1.1, name="SalaPuertas_Pequena")
    # un "espejo-puerta": marco de puerta con espejo dentro
    wall_mount("SM_MarcoPuerta", "Sala_Puertas", "S", -1.2, F1, (1, 0.06, 1), coll=ES,
               name="Marco_Espejo_Puerta", d=0.03)
    wall_mount("SM_Espejo", "Sala_Puertas", "S", -1.2, F1 + 0.01, (0.9, 1, 2.08), coll=ES,
               name="Espejo_Puerta")
    # --- DESVÁN
    boxes(-4.5, 9.5, FA, 3, 20)
    boxes(-3.9, 9.9, FA, 2, -5)
    boxes(3.8, 6.0, FA, 2, 40)
    place("SM_Baul", (2.5, 8.5, FA), (0, 0, 15), (1, 1, 1), P)
    lump(-1.5, 9.0, FA, 0.8, 0.9, 1.1, 20, "Mecedora_Tapada")
    place("SM_Espejo", (-5.0, 4.0, FA), (-12, 0, 160), (0.7, 1, 1.6), ES, "Espejo_Desvan")
    place("SM_Bombilla", (0.9, 6.5, RIDGE_Z - 0.2), (0, 0, 0), (1, 1, 1), P, "Bombilla_Desvan")


# ======================================================= luces y cámaras
def light(name, kind, loc, energy, color, size=0.05, rot=None, spot=None):
    ld = bpy.data.lights.new(name, kind)
    ld.energy = energy
    ld.color = color
    if kind in ("POINT", "SPOT"):
        ld.shadow_soft_size = size
    if kind == "AREA":
        ld.size = size
    if spot:
        ld.spot_size = math.radians(spot[0])
        ld.spot_blend = spot[1]
    o = bpy.data.objects.new(name, ld)
    COLL["Casa_Luces"].objects.link(o)
    o.location = W(*loc)
    if rot:
        o.rotation_euler = Euler([math.radians(a) for a in rot])
    LIGHTS.append(o)
    return o


def camera(name, loc, target, lens=18):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.clip_start = 0.05
    o = bpy.data.objects.new(name, cd)
    COLL["Casa_Camaras"].objects.link(o)
    o.location = W(*loc)
    d = W(*target) - o.location
    o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return o


def build_lights_and_cameras():
    warm = (1.0, 0.58, 0.26)
    # bombilla desnuda del recibidor (única luz eléctrica que funciona)
    light("Luz_Bombilla_Recibidor", "POINT", (0.6, 3.0, F0 + H0 - 0.72), 22, warm, 0.03)
    # la ventana de luz cálida (cuarto con muebles en el techo), se ve desde el camino
    light("Luz_Ventana_Calida", "POINT", (4.0, 1.4, F1 + 1.5), 90, warm, 0.25)
    # claridad lunar fría que entra por algunas ventanas (relleno muy tenue)
    cold = (0.55, 0.65, 1.0)
    light("Luna_Ventana_Cocina", "AREA", (4.0, 0.25, F0 + 1.6), 6, cold, 1.0, (90, 0, 0))
    light("Luna_Ventana_SalaSillon", "AREA", (5.75, 9.5, 4.6), 10, cold, 1.0, (90, 0, 90))
    light("Luna_Buhardilla", "AREA", (-3.0, 1.2, 7.9), 5, cold, 0.8, (90, 0, 0))
    # linterna del jugador (para las vistas previas; en Unreal va en el Pawn)
    light("Linterna_Jugador_Casa", "SPOT", (0.5, -3.0, 1.6 + F0), 70, (1, 0.92, 0.8), 0.04,
          (90, 0, 0), spot=(38, 0.55))
    camera("Cam_Casa_Exterior", (1.3, -13.5, 1.7), (1.6, 3.0, 4.0), 20)
    camera("Cam_Recibidor", (1.6, 0.45, F0 + 1.65), (-0.6, 5.5, F0 + 1.6), 16)
    camera("Cam_Pasillo", (0.8, 6.35, F0 + 1.6), (0.8, 13.0, F0 + 1.2), 20)
    camera("Cam_Cocina", (2.35, 0.4, F0 + 1.65), (5.0, 5.0, F0 + 0.9), 16)
    camera("Cam_Sala_Sillon", (2.0, 6.5, F0 + 1.7), (4.6, 12.8, F0 + 1.6), 16)
    camera("Cam_Cuarto_Techo", (2.3, 0.4, F1 + 1.4), (4.8, 4.5, F1 + 2.2), 16)


# ============================================================== colocación
def place(module, loc, rot=(0, 0, 0), scale=(1, 1, 1), coll="Casa_Interior", name=None,
          tag=None):
    """Crea una instancia (malla compartida) y la apunta en el layout JSON.
    loc en coordenadas locales de la casa; rot en grados."""
    me = MODULES[module]
    o = bpy.data.objects.new(name or module.replace("SM_", ""), me)
    COLL[coll].objects.link(o)
    o.location = W(*loc)
    o.rotation_euler = Euler([math.radians(a) for a in rot])
    o.scale = scale
    LAYOUT.append({"obj": o, "modulo": module, "coleccion": coll, "tag": tag})
    return o


def place_box(module, x0, x1, y0, y1, z0, z1, coll="Casa_Interior", name=None):
    if x1 - x0 < 1e-4 or y1 - y0 < 1e-4 or z1 - z0 < 1e-4:
        return None
    return place(module, (x0, y0, z0), (0, 0, 0), (x1 - x0, y1 - y0, z1 - z0), coll, name)


# ======================================================== huecos (puertas/ventanas)
def opening(kind, axis, coord, s, w, zb, zt, inward=0, room=None, swing=0.0, lit=False,
            frame=True, name=""):
    """axis='y': el hueco está en una pared de y=coord (s es x).
       axis='x': pared de x=coord (s es y).
       kind: door | window | open | garage.   inward: +1/-1 (solo fachada: hacia dentro)."""
    OPENINGS.append(dict(kind=kind, axis=axis, coord=coord, s=s, w=w, zb=zb, zt=zt,
                         inward=inward, swing=swing, lit=lit, frame=frame, name=name))


def wall_run(axis, coord, s0, s1, a0, a1, z0, z1, module, coll, name):
    """Muro a lo largo de una línea, troceado alrededor de los huecos que caen
    en esa línea (y se solapan en altura). a0..a1 = espesor (coordenada perpendicular)."""
    ops = [o for o in OPENINGS if o["axis"] == axis and abs(o["coord"] - coord) < 1e-3
           and o["s"] - o["w"] / 2 < s1 - 1e-3 and o["s"] + o["w"] / 2 > s0 + 1e-3
           and o["zb"] < z1 - 1e-3 and o["zt"] > z0 + 1e-3]

    def piece(sa, sb, za, zb):
        if sb - sa < 1e-3 or zb - za < 1e-3:
            return
        if axis == "y":
            place_box(module, sa, sb, a0, a1, za, zb, coll, name)
        else:
            place_box(module, a0, a1, sa, sb, za, zb, coll, name)

    # cortes a lo largo del muro en cada borde de hueco; en cada tramo se
    # rellena en altura lo que no ocupan los huecos (admite huecos apilados)
    cuts = sorted({s0, s1} | {min(max(o["s"] + k * o["w"] / 2, s0), s1) for o in ops
                              for k in (-1, 1)})
    spans = []
    for sa, sb in zip(cuts, cuts[1:]):
        mid = (sa + sb) / 2
        cov = tuple(sorted(i for i, o in enumerate(ops)
                           if o["s"] - o["w"] / 2 <= mid <= o["s"] + o["w"] / 2))
        if spans and spans[-1][2] == cov:
            spans[-1][1] = sb
        else:
            spans.append([sa, sb, cov])
    for sa, sb, cov in spans:
        cur = z0
        for o in sorted((ops[i] for i in cov), key=lambda o: o["zb"]):
            piece(sa, sb, cur, min(z1, o["zb"]))
            cur = max(cur, o["zt"])
        piece(sa, sb, cur, z1)


# ================================================================ habitaciones
def rect_minus(r, h):
    """rectángulo r=(x0,x1,y0,y1) menos el agujero h -> lista de rectángulos"""
    x0, x1, y0, y1 = r
    hx0, hx1, hy0, hy1 = max(h[0], x0), min(h[1], x1), max(h[2], y0), min(h[3], y1)
    if hx0 >= hx1 or hy0 >= hy1:
        return [r]
    out = [(x0, x1, y0, hy0), (x0, x1, hy1, y1), (x0, hx0, hy0, hy1), (hx1, x1, hy0, hy1)]
    return [q for q in out if q[1] - q[0] > 1e-3 and q[3] - q[2] > 1e-3]


def room(name, x0, x1, y0, y1, fz, h, wall="SM_Muro_Papel", floor="SM_Suelo_Madera",
         floor_holes=(), ceil_holes=(), ceiling=True, skip_walls=()):
    r = dict(name=name, x0=x0, x1=x1, y0=y0, y1=y1, fz=fz, h=h, wall=wall, floor=floor,
             floor_holes=floor_holes, ceil_holes=ceil_holes, ceiling=ceiling, skip=skip_walls)
    ROOMS.append(r)
    return r


def build_room(r):
    n, x0, x1, y0, y1, fz, h = r["name"], r["x0"], r["x1"], r["y0"], r["y1"], r["fz"], r["h"]
    c = "Casa_Interior"
    fl = [(x0, x1, y0, y1)]
    for hole in r["floor_holes"]:
        fl = [q for f in fl for q in rect_minus(f, hole)]
    for q in fl:
        place_box(r["floor"], q[0], q[1], q[2], q[3], fz - 0.05, fz, c, f"Suelo_{n}")
    if r["ceiling"]:
        cl = [(x0, x1, y0, y1)]
        for hole in r["ceil_holes"]:
            cl = [q for f in cl for q in rect_minus(f, hole)]
        for q in cl:
            place_box("SM_Techo", q[0], q[1], q[2], q[3], fz + h, fz + h + 0.05, c, f"Techo_{n}")
    m, z0, z1 = r["wall"], fz, fz + h
    if "S" not in r["skip"]:
        wall_run("y", y0, x0, x1, y0, y0 + T_INT, z0, z1, m, c, f"Muro_{n}_S")
    if "N" not in r["skip"]:
        wall_run("y", y1, x0, x1, y1 - T_INT, y1, z0, z1, m, c, f"Muro_{n}_N")
    if "W" not in r["skip"]:
        wall_run("x", x0, y0 + T_INT, y1 - T_INT, x0, x0 + T_INT, z0, z1, m, c, f"Muro_{n}_O")
    if "E" not in r["skip"]:
        wall_run("x", x1, y0 + T_INT, y1 - T_INT, x1 - T_INT, x1, z0, z1, m, c, f"Muro_{n}_E")


def check_overlaps():
    """Ninguna habitación puede solaparse en volumen con otra."""
    bad = []
    for i, a in enumerate(ROOMS):
        for b in ROOMS[i + 1:]:
            ox = min(a["x1"], b["x1"]) - max(a["x0"], b["x0"])
            oy = min(a["y1"], b["y1"]) - max(a["y0"], b["y0"])
            oz = min(a["fz"] + a["h"], b["fz"] + b["h"]) - max(a["fz"], b["fz"])
            if ox > 1e-3 and oy > 1e-3 and oz > 1e-3:
                bad.append((a["name"], b["name"]))
    if bad:
        raise RuntimeError("Habitaciones solapadas: %s" % bad)


STAIR_HOLE = (-1.9, -0.8, 1.0, 5.0)   # hueco de escalera (planta baja -> alta)
HATCH = (0.4, 1.4, 2.0, 3.2)          # trampilla del desván


def define_plan():
    """Planta. Todo en metros, coordenadas locales de la casa."""
    # ---------------- planta baja (suelo 0.5, altura 3.0)
    room("Recibidor", -2, 2, 0, 6, F0, H0, ceil_holes=[STAIR_HOLE])
    room("Salon", -6, -2, 0, 6, F0, H0)
    room("Cocina", 2, 6, 0, 6, F0, H0, wall="SM_Muro_Azulejo", floor="SM_Suelo_Baldosa")
    # pasillos sin sentido: del recibidor hacia el fondo, giran a la izquierda,
    # vuelven hacia delante... y acaban en el salón, que estaba al lado del recibidor
    room("Pasillo_A", 0.2, 1.4, 6, 13, F0, H0)          # 7 m recto, acaba en un espejo
    room("Pasillo_B", -6, 0.2, 10.4, 11.6, F0, H0)      # gira al oeste
    room("Pasillo_C", -6, -4.8, 6, 10.4, F0, H0)        # vuelve hacia la fachada
    room("Cuarto_Infantil", -4.8, 0.2, 6, 10.4, F0, H0, wall="SM_Muro_Infantil")  # sin ventanas
    room("Bano", -6, -2.6, 11.6, 13, F0, H0, wall="SM_Muro_Azulejo", floor="SM_Suelo_Baldosa")
    room("Cuarto_Diminuto", -2.6, -1.4, 11.6, 13, F0, 1.9)   # 1.2 x 1.4 x 1.9 m, puerta de 1.5 m
    room("Hueco_Sellado", -1.4, 0.2, 11.6, 13, F0, H0)       # sin puertas: no se entra nunca
    room("Sala_Sillon", 1.4, 6, 6, 13, F0, FA - F0)          # doble altura (6.2 m), un sillón
    room("Garaje", 6, 11, 0, 6.5, 0.05, 3.0, wall="SM_Muro_Garaje", floor="SM_Suelo_Hormigon")
    # ---------------- planta alta (suelo 3.7, altura 2.8)
    room("Pasillo_Superior", -2, 2, 0, 6, F1, H1, floor_holes=[STAIR_HOLE], ceil_holes=[HATCH])
    room("Dormitorio", -6, -2, 0, 6, F1, H1)
    room("Cuarto_Techo", 2, 6, 0, 6, F1, H1)                 # muebles pegados al techo
    room("Sala_Puertas", -6, 1.4, 6, 13, F1, H1)             # puertas que dan a pared
    # ---------------- desván (suelo 6.7, sin muros: los hace el tejado)
    room("Desvan", -6, 6, 0, 13, FA, 0.01, floor_holes=[HATCH], ceiling=False,
         skip_walls=("S", "N", "W", "E"))

    D = lambda axis, coord, s, w=0.9, h=2.1, fz=F0, **k: opening("door", axis, coord, s, w, fz,
                                                                 fz + h, **k)
    # puertas planta baja
    D("y", 0, 0.5, 1.0, 2.2, inward=1, swing=-38, name="Puerta_Principal")  # entreabierta
    D("x", 2, 3.0, swing=-95, name="Recibidor_Cocina")
    D("y", 6, 0.8, swing=-80, name="Recibidor_PasilloA")
    D("y", 6, -5.4, swing=-70, name="PasilloC_Salon")
    D("x", -4.8, 8.2, swing=60, name="PasilloC_Infantil")
    D("y", 11.6, -4.3, 0.8, swing=-75, name="PasilloB_Bano")
    D("y", 11.6, -2.0, 0.6, 1.5, swing=20, name="PasilloB_Diminuto")
    D("x", 1.4, 9.5, 0.9, 2.4, swing=-30, name="PasilloA_SalaSillon")
    D("x", 6, 4.6, swing=85, name="Cocina_Garaje")
    opening("open", "x", 0.2, 11.0, 1.2, F0, F0 + H0, name="PasilloA_B")
    opening("open", "y", 10.4, -5.4, 1.2, F0, F0 + H0, name="PasilloB_C")
    # puertas planta alta
    D("x", -2, 0.55, 0.8, fz=F1, swing=-70, name="PasilloSup_Dormitorio")
    D("x", 2, 3.0, fz=F1, swing=40, name="PasilloSup_CuartoTecho")
    D("y", 6, 0.8, fz=F1, swing=85, name="PasilloSup_SalaPuertas")
    # ventanas (fachada: inward = hacia el interior de la casa)
    Wn = lambda axis, coord, s, w, zb, zt, inward, **k: opening("window", axis, coord, s, w, zb,
                                                                 zt, inward, **k)
    Wn("y", 0, -4, 1.2, F0 + 0.9, F0 + 2.3, 1, name="V_Salon")
    Wn("y", 0, 4, 1.2, F0 + 0.9, F0 + 2.3, 1, name="V_Cocina")
    Wn("x", -6, 3, 1.2, F0 + 0.9, F0 + 2.3, 1, name="V_Salon_Lateral")
    Wn("y", 0, -4, 1.2, F1 + 0.9, F1 + 2.3, 1, name="V_Dormitorio")
    Wn("y", 0, 4, 1.2, F1 + 0.9, F1 + 2.3, 1, lit=True, name="V_CuartoTecho_Luz")
    Wn("y", 0, 0.6, 0.7, F1 + 1.1, F1 + 2.2, 1, name="V_PasilloSup")
    Wn("x", -6, 3, 1.2, F1 + 0.9, F1 + 2.3, 1, name="V_Dormitorio_Lateral")
    Wn("x", 6, 9.5, 0.9, 3.2, 5.9, -1, name="V_SalaSillon_Alta")
    Wn("y", 13, -4.3, 0.6, F0 + 1.4, F0 + 2.2, -1, name="V_Bano")
    Wn("y", 13, -4.5, 1.0, F1 + 0.9, F1 + 2.1, -1, name="V_SalaPuertas")
    Wn("x", 11, 3.2, 1.0, 1.3, 2.2, -1, name="V_Garaje")
    opening("garage", "y", 0, 8.6, 3.2, 0.05, 2.45, inward=1, name="Puerta_Garaje")


def build_structure():
    check_overlaps()
    for r in ROOMS:
        build_room(r)
    c = "Casa_Exterior"
    E = "SM_Muro_Exterior"
    # fachada (muro exterior por fuera de la planta)
    wall_run("y", 0, -6.2, 6.2, -T_EXT, 0, F0, FA, E, c, "Fachada_Frontal")
    wall_run("y", 13, -6.2, 6.2, 13, 13 + T_EXT, F0, FA, E, c, "Fachada_Trasera")
    wall_run("x", -6, 0, 13, -6 - T_EXT, -6, F0, FA, E, c, "Fachada_Oeste")
    wall_run("x", 6, 6.5, 13, 6, 6 + T_EXT, F0, FA, E, c, "Fachada_Este")
    wall_run("x", 6, 0, 6.5, 6, 6 + T_EXT, 3.05, FA, E, c, "Fachada_Este_SobreGaraje")
    # garaje
    wall_run("y", 0, 6.2, 11.2, -T_EXT, 0, 0.0, 3.05, E, c, "Garaje_Frontal")
    wall_run("x", 11, -0.2, 6.7, 11, 11 + T_EXT, 0.0, 3.05, E, c, "Garaje_Este")
    wall_run("y", 6.5, 6.2, 11.0, 6.5, 6.5 + T_EXT, 0.0, 3.05, E, c, "Garaje_Trasero")
    place_box(E, 6, 6.2, -0.2, 0, 0, F0, c, "Esquina_Garaje")
    # cimentación de piedra
    place_box("SM_Cimentacion", -6.3, 6.0, -0.3, 6.5, -0.3, F0 - 0.05, c, "Cimentacion_A")
    place_box("SM_Cimentacion", -6.3, 6.3, 6.5, 13.3, -0.3, F0 - 0.05, c, "Cimentacion_B")


# ============================================================ parte 2: exterior
def slab(x, y, z, rot, sx, sy, sz=0.15, coll="Casa_Exterior", name="Tejado", module="SM_Tejado"):
    return place(module, (x, y, z), rot, (sx, sy, sz), coll, name)


def build_exterior():
    c = "Casa_Exterior"
    # --- tejado a dos aguas (cumbrera en X) + hastiales laterales
    a = math.atan2(RIDGE_Z - FA, RIDGE_Y + T_EXT)
    ad = math.degrees(a)
    run = RIDGE_Y + T_EXT
    ls = run / math.cos(a) + 0.55
    ov = 0.55
    slab(-6.7, -T_EXT - ov * math.cos(a), FA - ov * math.sin(a), (ad, 0, 0), 13.4, ls,
         name="Tejado_Delantero")
    slab(6.7, 13 + T_EXT + ov * math.cos(a), FA - ov * math.sin(a), (ad, 0, 180), 13.4, ls,
         name="Tejado_Trasero")
    place_box("SM_Tejado", -6.7, 6.7, RIDGE_Y - 0.22, RIDGE_Y + 0.22, RIDGE_Z - 0.02,
              RIDGE_Z + 0.3, c, "Cumbrera")
    place_box("SM_Hastial", -6 - T_EXT, -6, -T_EXT, 13 + T_EXT, FA, RIDGE_Z, c, "Hastial_Oeste")
    place_box("SM_Hastial", 6, 6 + T_EXT, -T_EXT, 13 + T_EXT, FA, RIDGE_Z, c, "Hastial_Este")
    for sx, nm in ((-6 - T_EXT - 0.04, "Oeste"), (6 + T_EXT + 0.04, "Este")):
        place("SM_Ventana", (sx, RIDGE_Y, 7.5), (0, 0, 90), (0.8, 0.12, 0.9), c,
              f"Ventanuco_Desvan_{nm}")
    # --- buhardilla (dormer) en el faldón delantero
    E = "SM_Muro_Exterior"
    opening("window", "y", 1.0, -3, 1.0, 7.45, 8.35, inward=1, name="V_Buhardilla")
    wall_run("y", 1.0, -4.2, -1.8, 0.8, 1.0, 6.9, 8.6, E, c, "Buhardilla_Frente")
    place_box(E, -4.2, -4.0, 1.0, 3.6, 6.9, 8.6, c, "Buhardilla_Lado")
    place_box(E, -2.0, -1.8, 1.0, 3.6, 6.9, 8.6, c, "Buhardilla_Lado")
    place("SM_Hastial", (-1.75, 0.8, 8.6), (0, 0, 90), (0.2, 2.5, 0.6), c, "Buhardilla_Hastial")
    b = math.atan2(0.65, 1.35)
    lb = 1.35 / math.cos(b) + 0.1
    slab(-4.4, 3.9, 8.55 - 0.05, (math.degrees(b), 0, -90), 3.3, lb, 0.1, name="Buhardilla_Tejado")
    slab(-1.6, 0.6, 8.55 - 0.05, (math.degrees(b), 0, 90), 3.3, lb, 0.1, name="Buhardilla_Tejado")
    # --- porche: tarima, escalones, postes, barandilla y tejadillo
    place_box("SM_Suelo_Madera", -2.6, 3.6, -2.6, -T_EXT, F0 - 0.12, F0, c, "Porche_Tarima")
    place_box(E, -2.6, 3.6, -2.6, -2.5, 0, F0 - 0.12, c, "Porche_Zocalo")
    place_box("SM_Escalon", -0.5, 1.5, -3.4, -2.6, 0, 0.17, c, "Porche_Escalon")
    place_box("SM_Escalon", -0.5, 1.5, -3.0, -2.6, 0.17, 0.34, c, "Porche_Escalon")
    for px in (-2.5, -0.55, 1.55, 3.5):
        place("SM_Poste", (px, -2.5, F0), (0, 0, 0), (1, 1, 3.2 - F0), c, "Porche_Poste")
    for x0, x1 in ((-2.5, -0.55), (1.55, 3.5)):
        place("SM_Barandilla", (x0, -2.5, F0), (0, 0, 0), (x1 - x0, 1, 1), c, "Porche_Barandilla")
    for px in (-2.5, 3.5):
        place("SM_Barandilla", (px, -2.5, F0), (0, 0, 90), (2.3, 1, 1), c, "Porche_Barandilla")
    pc = math.atan2(0.3, 2.7)
    slab(-2.8, -2.95, 3.15, (math.degrees(pc), 0, 0), 6.6, 2.75 / math.cos(pc), 0.1,
         name="Porche_Tejadillo")
    # --- tejado del garaje (a un agua, cae hacia el bosque lateral)
    d = math.atan2(0.53, 5.5)
    slab(11.5, -0.4, 3.0, (math.degrees(d), 0, 90), 7.3, 5.5 / math.cos(d) + 0.05, 0.12,
         name="Garaje_Tejado")


def build_stairs():
    c = "Casa_Interior"
    x0, x1, y0, y1 = STAIR_HOLE
    n = 18
    rise, run = (F1 - F0) / n, (y1 - y0) / n
    for k in range(n):
        place_box("SM_Escalon", x0, x1, y0 + k * run, y0 + (k + 1) * run, F0,
                  F0 + (k + 1) * rise, c, "Escalera_Peldano")
    e = math.degrees(math.atan2(F1 - F0, y1 - y0))
    L = math.hypot(F1 - F0, y1 - y0)
    place("SM_Barandilla", (x1 + 0.04, y0, F0 + rise), (0, -e, 90), (L, 1, 1), c,
          "Escalera_Barandilla")
    place("SM_Barandilla", (x1 + 0.04, y0, F1), (0, 0, 90), (y1 - y0, 1, 1), c,
          "Rellano_Barandilla")
    place("SM_Barandilla", (x0, y0 - 0.04, F1), (0, 0, 0), (x1 - x0 + 0.04, 1, 1), c,
          "Rellano_Barandilla")
    # trampilla abierta + escalera plegable al desván
    hx0, hx1, hy0, hy1 = HATCH
    place("SM_Trampilla", (hx0, hy1, FA), (100, 0, 0), (hx1 - hx0, hy1 - hy0, 1), c,
          "Trampilla_Desvan")
    ang = math.atan2(FA - 0.15 - F1, 2.0)
    place("SM_Escalera_Plegable", (0.66, hy0 - 1.0, F1), (math.degrees(ang), 0, 0),
          (1, math.hypot(FA - 0.15 - F1, 2.0), 1), c, "Escalera_Plegable")


def build_openings():
    for o in OPENINGS:
        rz = 0 if o["axis"] == "y" else 90
        if o["inward"]:
            a0 = o["coord"] - o["inward"] * T_EXT
            a1 = o["coord"] + o["inward"] * T_INT
        else:
            a0, a1 = o["coord"] - T_INT, o["coord"] + T_INT
        ctr, depth = (a0 + a1) / 2, abs(a1 - a0) + 0.02
        s, w, zb, zt = o["s"], o["w"], o["zb"], o["zt"]
        P = (lambda s_, a_, z_: (s_, a_, z_)) if o["axis"] == "y" else \
            (lambda s_, a_, z_: (a_, s_, z_))
        ext = bool(o["inward"])
        coll = "Casa_Exterior" if ext else "Casa_Interior"
        nm = o["name"]
        if o["kind"] == "door":
            place("SM_MarcoPuerta", P(s, ctr, zb), (0, 0, rz), (w / 0.9, depth, (zt - zb) / 2.1),
                  coll, f"Marco_{nm}")
            place("SM_Puerta", P(s - w / 2 + 0.01, ctr, zb), (0, 0, rz + o["swing"]),
                  (w / 0.9, 1, (zt - zb) / 2.1), coll, f"Puerta_{nm}")
        elif o["kind"] == "window":
            place("SM_Ventana", P(s, ctr, zb), (0, 0, rz), (w, depth, zt - zb), coll,
                  f"Ventana_{nm}")
        elif o["kind"] == "garage":
            place("SM_Puerta_Garaje", P(s - w / 2, o["coord"] - 0.1 * o["inward"], zb + 0.35),
                  (0, 0, rz), (w, 1, zt - zb - 0.35), coll, nm)


def fake_door(axis, coord, s, inward, fz, bricked=False, swing=0.0, w=0.9, h=2.1, name="Falsa"):
    """Puerta que da a una pared: marco + hoja sobre un muro macizo.
    inward = lado de la habitación desde el que se ve (+1/-1)."""
    rz = 0 if axis == "y" else 90
    face = coord + inward * T_INT
    P = (lambda s_, a_, z_: (s_, a_, z_)) if axis == "y" else (lambda s_, a_, z_: (a_, s_, z_))
    place("SM_MarcoPuerta", P(s, face + inward * 0.02, fz), (0, 0, rz), (w / 0.9, 0.06, h / 2.1),
          "Casa_Interior", f"Marco_{name}")
    hinge_a = face + inward * 0.05
    place("SM_Puerta", P(s - w / 2 + 0.01, hinge_a, fz), (0, 0, rz + swing), (w / 0.9, 1, h / 2.1),
          "Casa_Interior", f"Puerta_{name}")
    if bricked:  # ladrillo detrás de la hoja abierta: "tapiada"
        if axis == "y":
            place_box("SM_Tapiado", s - w / 2, s + w / 2, min(face, face + inward * 0.01),
                      max(face, face + inward * 0.01), fz, fz + h, "Casa_Interior",
                      f"Tapiado_{name}")
        else:
            place_box("SM_Tapiado", min(face, face + inward * 0.01),
                      max(face, face + inward * 0.01), s - w / 2, s + w / 2, fz, fz + h,
                      "Casa_Interior", f"Tapiado_{name}")


# ============================================================ parte 4: export
def _ue(o):
    """Blender (m, dextrógiro, Z arriba) -> Unreal (cm, levógiro): Y se invierte.
    Rotador de Unreal equivalente: Roll = rx, Pitch = -ry, Yaw = -rz (grados)."""
    x, y, z = o.location
    rx, ry, rz = (math.degrees(a) for a in o.rotation_euler)
    return [round(x * 100, 2), round(-y * 100, 2), round(z * 100, 2)], \
        {"roll": round(rx, 3), "pitch": round(-ry, 3), "yaw": round(-rz, 3)}


def export(out_dir):
    base = os.path.join(bpy.path.abspath(out_dir), "casa")
    mdir = os.path.join(base, "modulos")
    os.makedirs(mdir, exist_ok=True)
    vl = bpy.context.view_layer
    protos = []
    for name, me in MODULES.items():
        p = bpy.data.objects.new(name, me)
        COLL["Casa_Modulos"].objects.link(p)
        protos.append(p)
    vl.update()
    for p in protos:
        bpy.ops.object.select_all(action="DESELECT")
        p.select_set(True)
        vl.objects.active = p
        bpy.ops.export_scene.fbx(filepath=os.path.join(mdir, p.name + ".fbx"), use_selection=True,
                                 apply_scale_options="FBX_SCALE_ALL", mesh_smooth_type="FACE",
                                 bake_space_transform=True)
        bpy.ops.export_scene.gltf(filepath=os.path.join(mdir, p.name + ".glb"),
                                  use_selection=True, export_format="GLB")
    for p in protos:
        p.hide_render = True
        p.hide_set(True)
    bpy.ops.object.select_all(action="DESELECT")
    # layout para montar en Unreal
    inst = []
    for e in LAYOUT:
        o = e["obj"]
        pos_ue, rot_ue = _ue(o)
        d = {"nombre": o.name, "modulo": e["modulo"], "coleccion": e["coleccion"],
             "pos_m": [round(v, 4) for v in o.location],
             "rot_grados_xyz": [round(math.degrees(a), 3) for a in o.rotation_euler],
             "escala": [round(v, 4) for v in o.scale],
             "unreal_pos_cm": pos_ue, "unreal_rot": rot_ue}
        if e.get("material_override"):
            d["material_override"] = e["material_override"]
        inst.append(d)
    lights = []
    for o in LIGHTS:
        pos_ue, rot_ue = _ue(o)
        lights.append({"nombre": o.name, "tipo": o.data.type, "pos_m": [round(v, 4) for v in o.location],
                       "rot_grados_xyz": [round(math.degrees(a), 3) for a in o.rotation_euler],
                       "potencia_w": o.data.energy, "color": list(o.data.color),
                       "unreal_pos_cm": pos_ue, "unreal_rot": rot_ue})
    rooms = [{"nombre": r["name"], "min_m": [r["x0"] + ORIGIN.x, r["y0"] + ORIGIN.y, r["fz"] + ORIGIN.z],
              "max_m": [r["x1"] + ORIGIN.x, r["y1"] + ORIGIN.y, r["fz"] + r["h"] + ORIGIN.z]}
             for r in ROOMS]
    data = {
        "unidades": "metros (pos_m) / centímetros (unreal_pos_cm)",
        "conversion_unreal": "x_ue=x*100, y_ue=-y*100, z_ue=z*100; Roll=rx, Pitch=-ry, Yaw=-rz",
        "origen_casa_m": list(ORIGIN),
        "modulos": {n: f"modulos/{n}.fbx" for n in MODULES},
        "instancias": inst, "luces": lights, "habitaciones": rooms,
        "espejos": [e["obj"].name for e in LAYOUT if e["coleccion"] == "Casa_Espejos"],
        "huecos": [{k: v for k, v in o.items()} for o in OPENINGS],
    }
    with open(os.path.join(base, "casa_layout.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    return base


# ===================================================================== build
def build(origin=(0, 0, 0), out_dir=None, mats_existing=None):
    global ORIGIN
    ORIGIN = Vector(origin)
    for L in (MATS, MODULES, COLL):
        L.clear()
    for L in (LAYOUT, ROOMS, OPENINGS, LIGHTS):
        L.clear()
    root = _coll("Casa")
    for n in ("Casa_Exterior", "Casa_Interior", "Casa_Espejos", "Casa_Props", "Casa_Luces",
              "Casa_Camaras", "Casa_Modulos"):
        COLL[n] = _coll(n, root)
    materials()
    build_modules()
    define_plan()
    build_structure()
    build_exterior()
    build_stairs()
    build_openings()
    build_interior_props()
    build_lights_and_cameras()
    info = dict(habitaciones=len(ROOMS), modulos=len(MODULES), instancias=len(LAYOUT),
                huecos=len(OPENINGS))
    if out_dir:
        info["export"] = export(out_dir)
    return info


if __name__ == "__main__":
    out = None
    if "--" in sys.argv:
        a = sys.argv[sys.argv.index("--") + 1:]
        if "--out" in a:
            out = a[a.index("--out") + 1]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    print("CASA:", build(out_dir=out))
