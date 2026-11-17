"""Shaders procedurales "pro" para la escena del bosque (Blender 5.3, EEVEE y Cycles).

Sin texturas externas: todo con nodos (Noise, Voronoi, Wave, Bevel, AO, Object Info).
Cada función crea y devuelve un material nuevo:

    stone_arch()      piedra azulada cincelada: bordes gastados, grietas, cavidades cálidas, musgo arriba
    slab_cracked()    losa gris-marrón agrietada con tierra en las juntas y líquenes
    soil_footprints() tierra rojiza con huellas de pisadas, agujas de pino y piedrecitas
    ivy()             hoja de hiedra brillante, color por instancia (hojas jóvenes claras), translúcida
    fern()            helecho saturado con foliolos recortados (alfa) y translucidez
    fir()             follaje de abeto "pintado": agujas, puntas claras, interior oscuro
    flower()          hortensia azul/violeta con florecillas (Voronoi) y SSS
    bark()            corteza con surcos verticales
    grass()           brizna de hierba (base oscura -> punta amarilla), translúcida
    moss()            musgo esponjoso (también se mezcla dentro de stone_arch)
    weathered_wood()  tablones viejos para la casa

Notas de compatibilidad
  - Bevel y AO: en Cycles dan el desgaste de bordes y el tinte de cavidades. En EEVEE el AO
    funciona y el Bevel devuelve la normal sin redondear (el desgaste de bordes queda en 0,
    el material sigue viéndose bien).
  - Desplazamiento: las piedras y la tierra usan displacement_method = "BOTH" (Cycles mueve
    vértices si la malla tiene densidad + bump para el resto). En EEVEE y en Unreal sólo
    cuenta como bump/normal. Para relieve real en la malla exportada usa add_micro_displace().

Qué se hornea para Unreal (bake_pbr)
  - Albedo (Base Color), Normal (tangente, OpenGL -> en Unreal marcar "Flip Green Channel"),
    Roughness, y opcionalmente AO. Todo lo que es ruido/voronoi/bevel/AO/musgo por normal
    queda "congelado" en esas texturas. Lo que NO se hornea bien: translucidez/SSS
    (recrear en Unreal con Subsurface/Two Sided Foliage), alfa de los helechos (hornear la
    máscara aparte con bake_mask_alpha=True) y la variación por instancia de Object Info
    (en Unreal usar PerInstanceRandom en el material de Foliage).
"""
import bpy
import os

# ----------------------------------------------------------------- utilidades


class G:
    """Mini-constructor de grafos de nodos: menos líneas, misma salida."""

    def __init__(self, name, render_method=None):
        self.m = bpy.data.materials.new(name)
        try:
            self.m.use_nodes = True
        except Exception:
            pass
        self.nt = self.m.node_tree
        self.bsdf = self.nt.nodes["Principled BSDF"]
        self.out = self.nt.nodes["Material Output"]
        if render_method:
            self.m.surface_render_method = render_method
        self._tc = None
        self._geo = None
        self._oi = None

    # nodos básicos ---------------------------------------------------------
    def n(self, kind, **kw):
        nd = self.nt.nodes.new(kind)
        for k, v in kw.items():
            if k.startswith("_"):
                setattr(nd, k[1:], v)
            else:
                self.set(nd.inputs[k], v)
        return nd

    def set(self, sock, v):
        if isinstance(v, bpy.types.Node):
            self.nt.links.new(v.outputs[0], sock)
        elif isinstance(v, bpy.types.NodeSocket):
            self.nt.links.new(v, sock)
        else:
            if isinstance(v, (tuple, list)) and len(v) == 3 and sock.type == "RGBA":
                v = (*v, 1)
            sock.default_value = v

    def link(self, a, b):
        if isinstance(a, bpy.types.Node):
            a = a.outputs[0]
        self.nt.links.new(a, b)

    @property
    def tc(self):
        if not self._tc:
            self._tc = self.n("ShaderNodeTexCoord")
        return self._tc

    @property
    def geo(self):
        if not self._geo:
            self._geo = self.n("ShaderNodeNewGeometry")
        return self._geo

    @property
    def oi(self):
        if not self._oi:
            self._oi = self.n("ShaderNodeObjectInfo")
        return self._oi

    # matemáticas -----------------------------------------------------------
    def math(self, op, a, b=0.0, c=0.0, clamp=False):
        nd = self.n("ShaderNodeMath", _operation=op, _use_clamp=clamp)
        self.set(nd.inputs[0], a)
        self.set(nd.inputs[1], b)
        if len(nd.inputs) > 2:
            self.set(nd.inputs[2], c)
        return nd.outputs[0]

    def vmath(self, op, a, b=(0, 0, 0), scale=None):
        nd = self.n("ShaderNodeVectorMath", _operation=op)
        self.set(nd.inputs[0], a)
        self.set(nd.inputs[1], b)
        if scale is not None:
            self.set(nd.inputs["Scale"], scale)
        return nd.outputs["Value"] if op in ("DOT_PRODUCT", "LENGTH", "DISTANCE") else nd.outputs[0]

    def sep(self, v):
        nd = self.n("ShaderNodeSeparateXYZ")
        self.set(nd.inputs[0], v)
        return nd.outputs

    def comb(self, x=0.0, y=0.0, z=0.0):
        nd = self.n("ShaderNodeCombineXYZ")
        self.set(nd.inputs[0], x)
        self.set(nd.inputs[1], y)
        self.set(nd.inputs[2], z)
        return nd.outputs[0]

    def mr(self, v, a, b, c=0.0, d=1.0, smooth=True):
        """Map Range (smoothstep si smooth)."""
        nd = self.n("ShaderNodeMapRange", _interpolation_type="SMOOTHSTEP" if smooth else "LINEAR")
        self.set(nd.inputs["Value"], v)
        nd.inputs["From Min"].default_value = a
        nd.inputs["From Max"].default_value = b
        nd.inputs["To Min"].default_value = c
        nd.inputs["To Max"].default_value = d
        return nd.outputs["Result"]

    def mix(self, fac, a, b, blend="MIX", clamp=True):
        nd = self.n("ShaderNodeMix", _data_type="RGBA", _blend_type=blend, _clamp_result=clamp)
        self.set(nd.inputs[0], fac)
        self.set(nd.inputs[6], a)
        self.set(nd.inputs[7], b)
        return nd.outputs[2]

    def mixf(self, fac, a, b):
        nd = self.n("ShaderNodeMix", _data_type="FLOAT")
        self.set(nd.inputs[0], fac)
        self.set(nd.inputs[2], a)
        self.set(nd.inputs[3], b)
        return nd.outputs[0]

    def ramp(self, fac, stops):
        nd = self.n("ShaderNodeValToRGB")
        el = nd.color_ramp.elements
        while len(el) < len(stops):
            el.new(0.5)
        for e, (pos, col) in zip(el, stops):
            e.position = pos
            e.color = (*col, 1) if len(col) == 3 else col
        self.set(nd.inputs[0], fac)
        return nd.outputs["Color"]

    # texturas --------------------------------------------------------------
    def noise(self, vec, scale, detail=6.0, rough=0.55, distort=0.0, lac=2.0, out="Fac"):
        nd = self.n("ShaderNodeTexNoise", Scale=scale, Detail=detail, Roughness=rough,
                    Distortion=distort, Lacunarity=lac)
        self.set(nd.inputs["Vector"], vec)
        return nd.outputs[out]

    def voronoi(self, vec, scale, feature="F1", rand=1.0, out="Distance", dim="3D", metric="EUCLIDEAN"):
        nd = self.n("ShaderNodeTexVoronoi", _feature=feature, _voronoi_dimensions=dim,
                    _distance=metric, Scale=scale, Randomness=rand)
        self.set(nd.inputs["Vector"], vec)
        return nd.outputs[out]

    def wave(self, vec, scale, kind="BANDS", direction="Z", distort=4.0, detail=4.0, profile="SIN"):
        nd = self.n("ShaderNodeTexWave", _wave_type=kind, _bands_direction=direction,
                    _wave_profile=profile, Scale=scale, Distortion=distort, Detail=detail)
        self.set(nd.inputs["Vector"], vec)
        return nd.outputs["Fac"]

    def bump(self, height, strength, dist=0.05, normal=None):
        nd = self.n("ShaderNodeBump", Strength=strength, Distance=dist)
        self.set(nd.inputs["Height"], height)
        if normal is not None:
            self.set(nd.inputs["Normal"], normal)
        return nd.outputs["Normal"]

    def seeded(self, vec, k=37.0):
        """Desplaza las coordenadas por el aleatorio del objeto: cada bloque/instancia distinto."""
        r = self.oi.outputs["Random"]
        return self.vmath("ADD", vec, self.comb(self.math("MULTIPLY", r, k),
                                                 self.math("MULTIPLY", r, k * 1.3),
                                                 self.math("MULTIPLY", r, k * 0.7)))

    def displacement(self, height, scale, mid=0.5, method="BOTH"):
        nd = self.n("ShaderNodeDisplacement", Scale=scale, Midlevel=mid)
        self.set(nd.inputs["Height"], height)
        self.link(nd.outputs[0], self.out.inputs["Displacement"])
        self.m.displacement_method = method

    def edge_wear(self, radius=0.04, samples=8):
        """1 en aristas (diferencia entre normal real y normal redondeada por Bevel)."""
        bev = self.n("ShaderNodeBevel", Radius=radius, _samples=samples)
        d = self.vmath("DOT_PRODUCT", bev.outputs[0], self.geo.outputs["Normal"])
        return self.math("MULTIPLY", self.math("SUBTRACT", 1.0, d), 20.0, clamp=True)

    def cavity(self, dist=0.25):
        """1 en huecos (AO local invertido)."""
        ao = self.n("ShaderNodeAmbientOcclusion", Distance=dist, _samples=12, _only_local=True)
        return self.math("SUBTRACT", 1.0, ao.outputs["AO"], clamp=True)

    def up(self):
        """Componente Z de la normal en mundo (1 = mira al cielo)."""
        return self.sep(self.geo.outputs["Normal"])[2]

    def principled(self, color=None, rough=None, normal=None, **kw):
        b = self.bsdf
        if color is not None:
            self.set(b.inputs["Base Color"], color)
        if rough is not None:
            self.set(b.inputs["Roughness"], rough)
        if normal is not None:
            self.set(b.inputs["Normal"], normal)
        for k, v in kw.items():
            self.set(b.inputs[k.replace("_", " ")], v)
        return b

    def translucent_mix(self, color, amount, normal=None):
        """Principled + Translucent (luz que atraviesa la hoja). Vale en EEVEE y Cycles."""
        tr = self.n("ShaderNodeBsdfTranslucent")
        self.set(tr.inputs["Color"], color)
        if normal is not None:
            self.set(tr.inputs["Normal"], normal)
        mx = self.n("ShaderNodeMixShader")
        self.set(mx.inputs[0], amount)
        self.link(self.bsdf.outputs[0], mx.inputs[1])
        self.link(tr.outputs[0], mx.inputs[2])
        self.link(mx.outputs[0], self.out.inputs["Surface"])
        return mx


# ------------------------------------------------------------------- materiales


def moss_layer(g, vec, mask_in):
    """Color, máscara y altura de musgo (reutilizado por piedra y losa)."""
    clumps = g.noise(vec, 9.0, 8, 0.65)
    fine = g.noise(vec, 80.0, 3, 0.5)
    mask = g.math("MULTIPLY", mask_in, g.mr(clumps, 0.42, 0.62), clamp=True)
    col = g.ramp(g.math("ADD", g.math("MULTIPLY", fine, 0.6), g.math("MULTIPLY", clumps, 0.4)),
                 [(0.25, (0.025, 0.05, 0.012)), (0.55, (0.07, 0.13, 0.025)), (0.85, (0.20, 0.27, 0.06))])
    h = g.math("MULTIPLY", mask, g.math("ADD", 0.4, g.math("MULTIPLY", fine, 0.6)))
    return col, mask, h


def stone_arch(name="Piedra_Arco", tint=(0.10, 0.155, 0.25), moss_amount=0.75):
    g = G(name)
    obj = g.seeded(g.tc.outputs["Object"])
    warp = g.vmath("ADD", obj, g.vmath("SCALE", g.noise(obj, 2.5, 3, 0.5, out="Color"), scale=0.18))
    # cincelado: facetas grandes (Voronoi F1 suavizado) + golpes medianos + grano fino
    facets = g.math("POWER", g.voronoi(warp, 6.5, "F1"), 0.7)      # golpes de cincel cóncavos
    chips = g.voronoi(warp, 18.0, "F1")
    grain = g.noise(obj, 70.0, 6, 0.7)
    mid = g.noise(warp, 9.0, 10, 0.62)
    h = g.math("ADD", g.math("MULTIPLY", facets, 0.55), g.math("MULTIPLY", mid, 0.3))
    h = g.math("ADD", h, g.math("MULTIPLY", chips, 0.12))
    h = g.math("ADD", h, g.math("MULTIPLY", grain, 0.08))
    # grietas: borde de Voronoi deformado, sólo donde una máscara de ruido lo permite
    crack_edge = g.voronoi(g.vmath("ADD", obj, g.vmath("SCALE", g.noise(obj, 4, 4, out="Color"), scale=0.35)),
                           1.8, "DISTANCE_TO_EDGE")
    crack = g.math("MULTIPLY", g.mr(crack_edge, 0.012, 0.0), g.mr(g.noise(obj, 1.6, 2), 0.55, 0.65))
    h = g.math("SUBTRACT", h, g.math("MULTIPLY", crack, 0.5))
    # máscaras
    edge = g.math("MULTIPLY", g.edge_wear(0.05), g.mr(g.noise(obj, 22, 4), 0.35, 0.6), clamp=True)
    cav = g.mr(g.cavity(0.3), 0.05, 0.6)
    up = g.math("MULTIPLY", g.mr(g.up(), 0.35, 0.85), moss_amount)
    mcol, mmask, mh = moss_layer(g, obj, g.math("MAXIMUM", up, g.math("MULTIPLY", cav, 0.35)))
    # color: rampa azul-gris por altura, variación por bloque, cavidades cálidas, bordes claros
    r = g.oi.outputs["Random"]
    dark = tuple(c * 0.12 for c in tint)
    light = tuple(min(1, c * 2.1) for c in tint)
    base = g.ramp(h, [(0.2, dark), (0.55, tint), (0.9, light)])
    base = g.mix(g.math("MULTIPLY", r, 0.35), base, (0.33, 0.33, 0.33), "OVERLAY")
    stains = g.mr(g.noise(obj, 3.0, 5, 0.6), 0.45, 0.7)
    base = g.mix(g.math("MULTIPLY", stains, 0.45), base, (0.16, 0.15, 0.12), "MULTIPLY")
    base = g.mix(g.math("MULTIPLY", cav, 0.9), base, (0.30, 0.15, 0.05), "MIX")      # tinte cálido
    base = g.mix(g.math("MULTIPLY", edge, 0.7), base, (0.42, 0.46, 0.50), "MIX")     # desgaste
    base = g.mix(g.math("MULTIPLY", crack, 0.85), base, (0.01, 0.01, 0.012), "MIX")  # grietas
    base = g.mix(mmask, base, mcol, "MIX")
    rough = g.math("ADD", 0.72, g.math("MULTIPLY", grain, 0.25))
    rough = g.mixf(mmask, rough, 0.95)
    rough = g.mixf(edge, rough, 0.6)
    hh = g.math("ADD", h, g.math("MULTIPLY", mh, 0.25))
    nrm = g.bump(hh, 1.0, 0.09)
    nrm = g.bump(grain, 0.35, 0.01, nrm)
    g.principled(base, rough, nrm, Specular_IOR_Level=0.45)
    g.displacement(hh, 0.025)
    return g.m


def slab_cracked(name="Piedra_Losa", tint=(0.13, 0.12, 0.105)):
    g = G(name)
    obj = g.seeded(g.tc.outputs["Object"], 53)
    wrp = g.vmath("ADD", obj, g.vmath("SCALE", g.noise(obj, 3, 4, out="Color"), scale=0.25))
    cracks = g.mr(g.voronoi(wrp, 2.2, "DISTANCE_TO_EDGE"), 0.018, 0.0)
    cracks = g.math("MULTIPLY", cracks, g.mr(g.noise(obj, 1.2, 2), 0.38, 0.5))
    hair = g.mr(g.voronoi(wrp, 9.0, "DISTANCE_TO_EDGE"), 0.012, 0.0)
    hair = g.math("MULTIPLY", hair, g.mr(g.noise(obj, 2.5, 2), 0.5, 0.6))
    crack = g.math("MAXIMUM", cracks, hair)
    surf = g.noise(obj, 7.0, 10, 0.6)
    pits = g.mr(g.voronoi(obj, 40, "F1"), 0.12, 0.0)
    h = g.math("SUBTRACT", g.math("MULTIPLY", surf, 0.6), g.math("MULTIPLY", crack, 0.6))
    h = g.math("SUBTRACT", h, g.math("MULTIPLY", pits, 0.1))
    edge = g.math("MULTIPLY", g.edge_wear(0.02), g.mr(g.noise(obj, 25, 3), 0.4, 0.6), clamp=True)
    cav = g.mr(g.cavity(0.15), 0.05, 0.5)
    r = g.oi.outputs["Random"]
    base = g.ramp(surf, [(0.2, tuple(c * 0.4 for c in tint)), (0.55, tint), (0.9, tuple(min(1, c * 1.4) for c in tint))])
    base = g.mix(g.math("MULTIPLY", r, 0.5), base, (0.11, 0.13, 0.15), "MIX")     # algunas más frías
    dirt = g.math("MAXIMUM", crack, g.math("MULTIPLY", cav, 0.8))
    base = g.mix(dirt, base, (0.10, 0.055, 0.03), "MIX")                         # tierra en juntas
    base = g.mix(g.math("MULTIPLY", edge, 0.5), base, (0.32, 0.31, 0.29))
    lichen = g.mr(g.noise(obj, 14, 4, 0.5), 0.62, 0.7)
    base = g.mix(g.math("MULTIPLY", lichen, 0.7), base, (0.32, 0.34, 0.22))
    mcol, mmask, mh = moss_layer(g, obj, g.math("MULTIPLY", cracks, 0.8))
    base = g.mix(mmask, base, mcol)
    rough = g.mixf(dirt, g.math("ADD", 0.6, g.math("MULTIPLY", surf, 0.3)), 0.95)
    g.principled(base, rough, g.bump(h, 0.9, 0.04))
    g.displacement(h, 0.01)
    return g.m


def _footprints(g, x, y, offset=0.0, stride=0.36, gauge=0.13, seed=0.0, wander=0.35):
    """Pisadas alternas (izq/der) a lo largo de Y. Devuelve 0..1 (1 = dentro de la huella)."""
    yy = g.math("DIVIDE", g.math("ADD", y, seed * stride), stride)
    cell = g.math("FLOOR", yy)
    f = g.math("SUBTRACT", g.math("FRACT", yy), 0.5)
    side = g.math("SUBTRACT", g.math("MULTIPLY", g.math("FLOORED_MODULO", cell, 2.0), 2.0), 1.0)
    cx = g.math("ADD", g.math("MULTIPLY", side, gauge),
                g.math("ADD", offset, g.math("MULTIPLY", g.math("SINE", g.math("MULTIPLY", y, 0.21)), wander)))
    wn = g.n("ShaderNodeTexWhiteNoise", _noise_dimensions="1D")
    g.set(wn.inputs["W"], g.math("ADD", cell, seed * 13.1))
    jitter = g.math("MULTIPLY", g.math("SUBTRACT", wn.outputs["Value"], 0.5), 0.05)
    dx = g.math("DIVIDE", g.math("SUBTRACT", g.math("SUBTRACT", x, cx), jitter), 0.052)
    # suela: elipse algo más ancha en la punta (f>0) que en el talón
    fy = g.math("MULTIPLY", f, stride)                        # metros a lo largo del paso
    # suela: elipse de 28 cm con cintura estrecha y puntera algo más ancha
    wfac = g.math("ADD", 0.72, g.math("MULTIPLY", g.math("ABSOLUTE", g.math("SUBTRACT", fy, 0.015)), 3.4))
    wfac = g.math("ADD", wfac, g.math("MULTIPLY", g.math("GREATER_THAN", fy, 0.02), 0.15))
    dxs = g.math("DIVIDE", dx, wfac)
    dy = g.math("DIVIDE", fy, 0.14)
    d = g.math("SQRT", g.math("ADD", g.math("MULTIPLY", dxs, dxs), g.math("MULTIPLY", dy, dy)))
    d = g.math("ADD", d, g.math("MULTIPLY", g.math("SUBTRACT", g.noise(g.comb(x, y), 18, 3), 0.5), 0.35))
    keep = g.mr(wn.outputs["Value"], 0.15, 0.25)                 # algunas pisadas se pierden
    return g.math("MULTIPLY", g.mr(d, 1.0, 0.65), keep)


def soil_footprints(name="Tierra", path_halfwidth=2.2):
    g = G(name)
    w = g.tc.outputs["Object"]
    x, y, _ = g.sep(w)
    on_path = g.mr(g.math("ABSOLUTE", x), path_halfwidth, path_halfwidth * 0.5)
    # huellas: dos caminantes, con el borde un poco levantado (barro empujado)
    fp = g.math("MAXIMUM", _footprints(g, x, y, 0.0, 0.36, 0.13, 0.0),
                _footprints(g, x, y, 0.75, 0.42, 0.12, 0.37, 0.25))
    fp = g.math("MAXIMUM", fp, _footprints(g, x, y, -0.8, 0.33, 0.12, 0.71, 0.3))
    fp = g.math("MULTIPLY", fp, on_path)
    rim = g.math("MULTIPLY", g.math("MULTIPLY", fp, g.math("SUBTRACT", 1.0, fp)), 4.0)
    tread = g.mr(g.wave(g.vmath("MULTIPLY", w, (1, 1, 1)), 60, "BANDS", "Y", 0.0, 0.0), 0.3, 0.7)
    # agujas de pino: varias capas de ruido estirado y rotado
    needles = None
    for i, ang in enumerate((0.3, 1.25, 2.2, 2.85)):
        rot = g.n("ShaderNodeVectorRotate", _rotation_type="Z_AXIS", Angle=ang)
        g.set(rot.inputs["Vector"], g.vmath("ADD", w, (i * 7.1, i * 3.3, 0)))
        st = g.vmath("MULTIPLY", rot.outputs[0], (2.5, 90.0, 1.0))
        ln = g.mr(g.math("ABSOLUTE", g.math("SUBTRACT", g.noise(st, 1.0, 1, 0.5), 0.5)), 0.03, 0.0)
        ln = g.math("MULTIPLY", ln, g.mr(g.noise(w, 6 + i, 2), 0.45, 0.58))
        needles = ln if needles is None else g.math("MAXIMUM", needles, ln)
    needles = g.math("MULTIPLY", needles, g.mixf(on_path, 1.0, 0.45))
    pebbles = g.mr(g.voronoi(w, 28, "F1"), 0.16, 0.08)
    pebbles = g.math("MULTIPLY", pebbles, g.mr(g.noise(w, 5, 2), 0.55, 0.65))
    clods = g.noise(w, 5.0, 12, 0.65)
    ruts = g.noise(w, 0.6, 3, 0.5)
    h = g.math("ADD", g.math("MULTIPLY", clods, 0.5), g.math("MULTIPLY", ruts, 0.3))
    h = g.math("SUBTRACT", h, g.math("MULTIPLY", fp, g.math("ADD", 0.35, g.math("MULTIPLY", tread, 0.08))))
    h = g.math("ADD", h, g.math("MULTIPLY", rim, 0.08))
    h = g.math("ADD", h, g.math("MULTIPLY", needles, 0.06))
    h = g.math("ADD", h, g.math("MULTIPLY", pebbles, 0.12))
    damp = g.mr(g.noise(w, 0.9, 4, 0.5), 0.45, 0.65)
    base = g.ramp(clods, [(0.25, (0.075, 0.035, 0.02)), (0.55, (0.17, 0.085, 0.05)), (0.85, (0.27, 0.15, 0.09))])
    base = g.mix(g.math("MULTIPLY", damp, 0.6), base, (0.05, 0.03, 0.02), "MIX")
    base = g.mix(g.math("MULTIPLY", fp, 0.7), base, (0.07, 0.04, 0.025))      # fondo de huella húmedo
    base = g.mix(g.math("MULTIPLY", rim, 0.4), base, (0.30, 0.18, 0.11))
    ndl = g.ramp(g.noise(w, 30, 2), [(0.3, (0.32, 0.14, 0.05)), (0.7, (0.55, 0.32, 0.14))])
    base = g.mix(needles, base, ndl)
    base = g.mix(pebbles, base, (0.30, 0.29, 0.28))
    off = g.math("SUBTRACT", 1.0, on_path)                                    # fuera del camino: hojarasca oscura
    base = g.mix(g.math("MULTIPLY", off, 0.5), base, (0.06, 0.05, 0.02))
    rough = g.mixf(g.math("MAXIMUM", damp, fp), 0.92, 0.62)
    nrm = g.bump(h, 0.9, 0.04)
    nrm = g.bump(g.noise(w, 120, 3), 0.2, 0.005, nrm)
    g.principled(base, rough, nrm)
    g.displacement(h, 0.03)
    return g.m


def ivy(name="Hiedra"):
    g = G(name)
    loc = g.tc.outputs["Object"]
    r = g.oi.outputs["Random"]
    lx, ly, _ = g.sep(loc)
    young = g.mr(r, 0.86, 0.97)                        # ~12 % hojas jóvenes claras
    # tallos: las curvas tienen el origen en el mundo -> coordenadas grandes; hojas < 0.15 m
    stem = g.mr(g.vmath("LENGTH", loc), 0.25, 0.4)
    base = g.ramp(r, [(0.0, (0.004, 0.018, 0.006)), (0.6, (0.010, 0.040, 0.010)), (1.0, (0.03, 0.07, 0.014))])
    base = g.mix(young, base, (0.12, 0.26, 0.035))
    # nervios: línea central + laterales en V
    mid = g.mr(g.math("ABSOLUTE", lx), 0.004, 0.0)
    lat = g.math("FRACT", g.math("MULTIPLY", g.math("SUBTRACT", ly, g.math("ABSOLUTE", lx)), 40.0))
    lat = g.math("MULTIPLY", g.mr(g.math("ABSOLUTE", g.math("SUBTRACT", lat, 0.5)), 0.08, 0.0), 0.6)
    veins = g.math("MAXIMUM", mid, lat)
    base = g.mix(g.math("MULTIPLY", veins, 0.5), base, (0.20, 0.30, 0.12))
    spots = g.mr(g.noise(g.seeded(loc), 40, 3), 0.62, 0.7)
    base = g.mix(g.math("MULTIPLY", spots, 0.4), base, (0.10, 0.07, 0.02))   # manchas secas
    base = g.mix(stem, base, g.mix(g.noise(loc, 40, 3), (0.03, 0.02, 0.012), (0.08, 0.06, 0.035)))
    nrm = g.bump(g.math("SUBTRACT", 0.0, veins), 0.3, 0.004)
    g.principled(base, g.mixf(stem, g.mixf(young, 0.22, 0.38), 0.75), nrm,
                 Coat_Weight=g.mixf(stem, 0.6, 0.0), Coat_Roughness=0.12,
                 Specular_IOR_Level=0.7)
    g.translucent_mix(g.mix(0.3, base, (0.10, 0.22, 0.02)), 0.15, nrm)
    return g.m


def fern(name="Helecho"):
    g = G(name, "DITHERED")
    loc = g.tc.outputs["Object"]
    x, y, z = g.sep(loc)
    rr = g.math("SQRT", g.math("ADD", g.math("MULTIPLY", x, x), g.math("MULTIPLY", y, y)))
    ang = g.math("ARCTAN2", y, x)
    n_fronds = 9.0
    u = g.math("DIVIDE", ang, 6.283185 / n_fronds)
    lat = g.math("MULTIPLY", g.math("SUBTRACT", g.math("FRACT", g.math("ADD", u, 0.5)), 0.5),
                 g.math("MULTIPLY", rr, 6.283185 / n_fronds))
    t = g.math("DIVIDE", rr, 0.7)
    width = g.math("ADD", g.math("MULTIPLY", g.math("SUBTRACT", 1.0, t), 0.09), 0.02)
    rel = g.math("DIVIDE", g.math("ABSOLUTE", lat), width)        # 0 nervio central .. 1 borde
    stripe = g.math("ADD", 0.5, g.math("MULTIPLY", g.math("SINE", g.math("MULTIPLY", rr, 280.0)), 0.5))
    leaflet = g.mr(g.math("SUBTRACT", rel, g.math("ADD", 0.12, g.math("MULTIPLY", stripe, 0.95))), 0.04, -0.04)
    alpha = g.math("MAXIMUM", leaflet, g.mr(rel, 0.08, 0.04))
    r = g.oi.outputs["Random"]
    base = g.ramp(g.math("ADD", g.math("MULTIPLY", t, 0.6), g.math("MULTIPLY", r, 0.4)),
                  [(0.0, (0.012, 0.06, 0.010)), (0.5, (0.03, 0.13, 0.015)), (1.0, (0.10, 0.24, 0.02))])
    base = g.mix(g.mr(rel, 0.12, 0.0), base, (0.12, 0.2, 0.05))
    base = g.mix(g.math("MULTIPLY", g.mr(t, 0.8, 1.0), 0.6), base, (0.22, 0.17, 0.05))  # puntas secas
    nrm = g.bump(stripe, 0.25, 0.01)
    g.principled(base, 0.45, nrm, Alpha=alpha, Sheen_Weight=0.25, Specular_IOR_Level=0.55)
    g.translucent_mix(g.mix(0.5, base, (0.3, 0.55, 0.05)), 0.3, nrm)
    return g.m


def fir(name="Abeto"):
    g = G(name)
    loc = g.tc.outputs["Object"]
    sl = g.seeded(loc, 11)
    x, y, z = g.sep(loc)
    # agujas: ruido muy estirado en vertical + grumos de ramillas
    nd = g.noise(g.vmath("MULTIPLY", sl, (60, 60, 6)), 1.0, 4, 0.6)
    clumps = g.voronoi(g.vmath("MULTIPLY", sl, (1, 1, 1.6)), 9.0, "SMOOTH_F1")
    tier = g.math("FRACT", g.math("DIVIDE", g.math("SUBTRACT", z, 0.45), 0.75))  # 0 base del cono .. 1 punta
    tips = g.mr(clumps, 0.35, 0.05)
    inner = g.math("MULTIPLY", g.mr(tier, 0.35, 0.0), 0.8)
    base = g.ramp(g.math("ADD", g.math("MULTIPLY", nd, 0.5), g.math("MULTIPLY", tips, 0.5)),
                  [(0.1, (0.006, 0.025, 0.012)), (0.5, (0.02, 0.07, 0.025)), (0.9, (0.09, 0.18, 0.05))])
    base = g.mix(inner, base, (0.004, 0.012, 0.008))
    r = g.oi.outputs["Random"]
    base = g.mix(g.math("MULTIPLY", r, 0.3), base, (0.06, 0.08, 0.04))
    h = g.math("ADD", g.math("MULTIPLY", tips, 0.6), g.math("MULTIPLY", nd, 0.4))
    nrm = g.bump(h, 1.0, 0.08)
    g.principled(base, 0.7, nrm, Sheen_Weight=0.4, Sheen_Tint=(0.4, 0.6, 0.3))
    g.translucent_mix(g.mix(0.5, base, (0.1, 0.25, 0.04)), 0.12, nrm)
    g.displacement(h, 0.06, method="BUMP")
    return g.m


def flower(name="Flor"):
    g = G(name)
    loc = g.seeded(g.tc.outputs["Object"], 17)
    florets = g.voronoi(loc, 38.0, "F1")
    cells = g.voronoi(loc, 38.0, "F1", out="Color")
    r = g.oi.outputs["Random"]
    hue = g.math("ADD", g.math("MULTIPLY", g.sep(cells)[0], 0.5), g.math("MULTIPLY", r, 0.5))
    base = g.ramp(hue, [(0.0, (0.05, 0.10, 0.55)), (0.5, (0.10, 0.18, 0.80)), (1.0, (0.30, 0.16, 0.65))])
    base = g.mix(g.mr(florets, 0.12, 0.0), base, (0.75, 0.82, 0.95))          # centro de florecilla
    base = g.mix(g.mr(florets, 0.32, 0.45), base, (0.01, 0.02, 0.06))          # hueco entre florecillas
    nrm = g.bump(g.mr(florets, 0.45, 0.0), 0.8, 0.02)
    g.principled(base, 0.5, nrm, Subsurface_Weight=0.25, Subsurface_Radius=(0.3, 0.3, 1.0),
                 Subsurface_Scale=0.01, Sheen_Weight=0.3)
    return g.m


def bark(name="Corteza"):
    g = G(name)
    loc = g.seeded(g.tc.outputs["Object"], 5)
    st = g.vmath("MULTIPLY", loc, (6, 6, 0.8))
    ridges = g.voronoi(st, 3.0, "DISTANCE_TO_EDGE")
    fine = g.noise(g.vmath("MULTIPLY", loc, (30, 30, 6)), 1.0, 8, 0.6)
    h = g.math("ADD", g.mr(ridges, 0.0, 0.12, 0, 1), g.math("MULTIPLY", fine, 0.3))
    base = g.ramp(h, [(0.1, (0.012, 0.008, 0.006)), (0.6, (0.07, 0.045, 0.03)), (1.0, (0.16, 0.12, 0.09))])
    lichen = g.mr(g.noise(loc, 8, 4), 0.62, 0.7)
    base = g.mix(g.math("MULTIPLY", lichen, 0.6), base, (0.25, 0.30, 0.20))
    g.principled(base, 0.9, g.bump(h, 1.0, 0.05))
    return g.m


def grass(name="Hierba"):
    g = G(name)
    z = g.sep(g.tc.outputs["Object"])[2]
    r = g.oi.outputs["Random"]
    t = g.mr(z, 0.0, 0.35, smooth=False)
    base = g.ramp(g.math("ADD", g.math("MULTIPLY", t, 0.8), g.math("MULTIPLY", r, 0.2)),
                  [(0.0, (0.01, 0.03, 0.008)), (0.6, (0.06, 0.20, 0.03)), (1.0, (0.30, 0.38, 0.08))])
    g.principled(base, 0.5, Specular_IOR_Level=0.5)
    g.translucent_mix(g.mix(0.5, base, (0.3, 0.5, 0.05)), 0.3)
    return g.m


def moss(name="Musgo"):
    g = G(name)
    loc = g.tc.outputs["Object"]
    col, mask, h = moss_layer(g, loc, 1.0)
    fuzz = g.noise(loc, 200, 2)
    g.principled(col, 0.95, g.bump(g.math("ADD", h, g.math("MULTIPLY", fuzz, 0.3)), 0.8, 0.02),
                 Sheen_Weight=0.6, Sheen_Tint=(0.5, 0.7, 0.3))
    return g.m


def weathered_wood(name="Casa", tint=(0.06, 0.05, 0.042)):
    g = G(name)
    loc = g.tc.outputs["Object"]
    planks = g.wave(loc, 2.2, "BANDS", "Z", 0.0, 0.0, "SAW")
    grain = g.wave(g.vmath("MULTIPLY", loc, (25, 25, 1.5)), 1.0, "BANDS", "X", 8.0, 6.0)
    gaps = g.mr(planks, 0.04, 0.0)
    h = g.math("SUBTRACT", g.math("MULTIPLY", grain, 0.3), gaps)
    base = g.ramp(grain, [(0.0, tuple(c * 0.5 for c in tint)), (1.0, tuple(min(1, c * 1.8) for c in tint))])
    base = g.mix(gaps, base, (0.005, 0.004, 0.003))
    rot = g.mr(g.noise(loc, 1.5, 5), 0.55, 0.7)
    base = g.mix(g.math("MULTIPLY", rot, 0.6), base, (0.03, 0.04, 0.02))
    g.principled(base, 0.85, g.bump(h, 0.8, 0.03))
    return g.m


# ----------------------------------------------------------- utilidades export


def add_micro_displace(obj, strength=0.03, scale=0.25, levels=1):
    """Relieve REAL en la malla (sí viaja a Unreal en el FBX): Subdivision + Displace.
    Con levels=1 un bloque del arco pasa de ~400 a ~1.600 tris: barato. Subir a 2 sólo en primer plano."""
    sub = obj.modifiers.new("MicroSub", "SUBSURF")
    sub.levels = sub.render_levels = levels
    tex = bpy.data.textures.new(obj.name + "_micro", "VORONOI")
    tex.noise_scale = scale
    d = obj.modifiers.new("MicroDisp", "DISPLACE")
    d.texture = tex
    d.texture_coords = "OBJECT"
    d.strength = strength
    d.mid_level = 0.5
    return d


def bake_pbr(obj, folder, resolution=1024, passes=("albedo", "normal", "roughness", "ao"),
             samples=16, margin=8):
    """Hornea el material del objeto a PNG (Cycles). Crea UVs (Smart UV) si no tiene.
    Devuelve {pase: ruta}. Requiere Cycles; deja el motor como estaba."""
    sc = bpy.context.scene
    old_engine = sc.render.engine
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    old_samples = sc.cycles.samples
    sc.cycles.samples = samples
    os.makedirs(folder, exist_ok=True)
    for o in bpy.context.selected_objects:
        o.select_set(False)
    obj.hide_render = False
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    if obj.type == "MESH" and not obj.data.uv_layers:
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.02)
        bpy.ops.object.mode_set(mode="OBJECT")
    kinds = {"albedo": ("DIFFUSE", False), "normal": ("NORMAL", True),
             "roughness": ("ROUGHNESS", True), "ao": ("AO", True)}
    mats = [s.material for s in obj.material_slots if s.material]
    results = {}
    base = bpy.path.clean_name(obj.name)
    for p in passes:
        bake_type, noncolor = kinds[p]
        img = bpy.data.images.new(f"{base}_{p}", resolution, resolution, alpha=False,
                                  float_buffer=False, is_data=noncolor)
        added = []
        for m in mats:
            tn = m.node_tree.nodes.new("ShaderNodeTexImage")
            tn.image = img
            m.node_tree.nodes.active = tn
            added.append((m, tn))
        kw = dict(type=bake_type, margin=margin, use_clear=True)
        if bake_type == "DIFFUSE":
            kw["pass_filter"] = {"COLOR"}
        if bake_type == "NORMAL":
            kw["normal_space"] = "TANGENT"
        bpy.ops.object.bake(**kw)
        path = os.path.join(folder, f"T_{base}_{p}.png")
        img.filepath_raw = path
        img.file_format = "PNG"
        img.save()
        results[p] = path
        for m, tn in added:
            m.node_tree.nodes.remove(tn)
    sc.cycles.samples = old_samples
    sc.render.engine = old_engine
    return results


def all_materials():
    """Diccionario con las claves que usa forest_arch_scene.py (más extras)."""
    return {
        "stone": stone_arch(),
        "slab": slab_cracked(),
        "soil": soil_footprints(),
        "ivy": ivy(),
        "fir": fir(),
        "bark": bark(),
        "fern": fern(),
        "flower": flower(),
        "grass": grass(),
        "moss": moss(),
        "house": weathered_wood(),
    }
