# Escena: bosque, arco en ruinas y la casa del caso (noche con niebla)

Dos scripts (probados con bpy 5.3 headless, `python3 -I` + `pip install bpy`):

| Script | Qué hace |
|---|---|
| `forest_arch_scene.py` | Escena completa: suelo, camino de losas, arco en ruinas con hiedra, abetos/helechos/flores, niebla, luna, linterna, cámara del jugador **y la casa** (importa `house_full.py`). |
| `house_full.py` | La casa entera, modular: exterior, interior, espejos, props del caso, luces y cámaras de vista previa. Se puede usar sola. |

## Cómo ejecutarlo

```bash
# Escena completa (bosque + casa)
blender -b -P blender/forest_arch_scene.py -- --out ./unreal_export
# o sin Blender instalado, con bpy de pip:
python3 -I -c "import sys,runpy;sys.argv=['x','--','--out','./unreal_export'];runpy.run_path('blender/forest_arch_scene.py')"

# Solo la casa (en el origen)
blender -b -P blender/house_full.py -- --out ./unreal_export
```

Desde la interfaz: abrir `forest_arch_scene.py` en Scripting y Run Script (con `house_full.py` en la
misma carpeta que el script o que el `.blend`). Tarda unos 8 s y guarda `forest_arch.blend` en `--out`.

## Qué genera

**Bosque que lleva a la casa.** El camino de losas (eje Y) cruza el arco y llega hasta los escalones del
porche. La puerta principal está en x=0, así que el camino, el arco y la cámara apuntan a ella.
Hay un claro llano frente a la fachada y alrededor de la casa (`CLEARING`). Los árboles lo rodean y la
ventana cálida del primer piso se ve desde el camino.
(Además se corrigió un fallo anterior: las copias de la vegetación heredaban `hide_render` del prototipo y
no salían en el render.)

**Casa abandonada pero en pie.** Nadie ha entrado desde que se archivó el caso: no hay muros caídos.
Hay polvo, pintura desconchada, cortinas, muebles tapados con sábanas, cinta policial, cajas de pruebas
y marcadores numerados.

- **Exterior** (`Casa_Exterior`): fachada de tablas con pintura desconchada, cimiento de piedra, porche con
  barandilla y tejadillo, tejado a dos aguas con **buhardilla**, ventanucos del desván, **garaje adosado**
  (puerta seccional a 35 cm del suelo y precintada), 12 ventanas (una con **luz cálida**) y la
  **puerta principal entreabierta** con cinta cruzada.
- **Planta baja**: **recibidor** con escalera y bombilla desnuda; salón con todo tapado; **cocina**
  (encimeras, fregadero, fogón, nevera, silla volcada, marcadores); garaje con coche tapado y estanterías de pruebas.
- **Pasillos sin sentido**: del recibidor sale un pasillo de 7 m que termina en un **espejo**, gira a la
  izquierda, vuelve hacia la fachada... y acaba en el salón, que estaba al lado del recibidor. Tiene una puerta
  tapiada con ladrillo y otra que da a la pared.
- **Habitaciones extrañas**: cuarto infantil **sin ventanas** (con una ventana falsa contra el muro, una torre
  de bloques y un osito mirando a la esquina); cuarto **diminuto** (1,2 × 1,4 m, techo a 1,9 m, puerta de
  1,5 m) con una silla mirando a la esquina; un hueco **sellado** sin puertas; **sala vacía de doble altura
  (6,2 m) con un solo sillón** frente a un espejo enorme; cuarto del primer piso con los **muebles pegados
  al techo**; **sala de puertas** con 11 puertas que dan a pared y un "espejo-puerta".
- **Planta alta y desván**: dormitorio con tocador y espejo. Al **desván** se sube por una **trampilla con
  escalera plegable** desde el pasillo superior; dentro hay cajas, un baúl, una mecedora tapada y un espejo apoyado.
- **Espejos** (`Casa_Espejos`, 9 objetos): recibidor, fondo del pasillo, cuarto infantil, baño, sala del sillón,
  tocador, espejo-puerta y desván. Usan el material `M_Espejo` (metálico, rugosidad 0,02) para la vista previa.
- **Luces** (`Casa_Luces`): bombilla desnuda del recibidor (22 W, cálida), luz de la ventana cálida, rellenos
  lunares muy tenues en tres ventanas y `Linterna_Jugador_Casa` (foco). La niebla y la luna del bosque no cambian.
- **Cámaras de vista previa** (`Casa_Camaras`): exterior, recibidor, pasillo, cocina, sala del sillón y cuarto del techo.

Recuento: 17 espacios (incluye pasillos, garaje, desván y el hueco sellado), 47 módulos, unas 480 instancias.

## Vistas previas

Se renderizaron con Cycles CPU (24 muestras, 960×540, exposición +1,5) y están en `blender/previews/`:
`casa_exterior.png`, `casa_recibidor.png`, `casa_pasillo.png`, `casa_cocina.png`, `casa_sala_sillon.png`,
`casa_cuarto_techo.png`.

## Exportación a Unreal

Todo está en metros, con Z hacia arriba. Al importar, Unreal multiplica por 100 (cm).

```
<out>/SM_Entorno.fbx, SM_Abeto/Helecho/Flor.glb, vegetacion_puntos.csv   (bosque)
<out>/casa/modulos/SM_*.fbx + SM_*.glb                                   (un archivo por módulo)
<out>/casa/casa_layout.json                                              (dónde va cada pieza)
```

- **Módulos**: muros (`SM_Muro_Exterior/Papel/Infantil/Azulejo/Garaje`), suelos, techo, cimiento, tejado,
  hastial, marco de puerta, puerta, ventana, puerta de garaje, escalón, barandilla, poste, trampilla, escalera
  plegable, espejo y props. Cada uno se exporta **una vez** con su origen en (0,0,0).
  Las piezas de estructura son cajas de 1 m que se escalan al colocarlas. En Unreal conviene usar materiales
  *world-aligned* o triplanares para que la textura no se estire.
- **`casa_layout.json`**: cada instancia trae `modulo`, `coleccion`, `pos_m`, `rot_grados_xyz` y `escala`, y
  también `unreal_pos_cm` y `unreal_rot` (Roll/Pitch/Yaw) ya convertidos (Unreal invierte Y: `y_ue = -y*100`,
  `Roll = rx`, `Pitch = -ry`, `Yaw = -rz`). Incluye además las luces, las habitaciones (cajas mín/máx), la lista de espejos y los huecos.
  Montaje: importar los FBX en `/Game/Casa/Modulos`. Después, un Editor Utility (Python) recorre el JSON y crea
  un `StaticMeshActor` por instancia (o un `InstancedStaticMeshComponent` por módulo, que es más ligero).
  Las instancias con `material_override` necesitan un material distinto en ese actor.
- Las colecciones (`Casa_Exterior`, `Casa_Interior`, `Casa_Espejos`, `Casa_Props`) se corresponden con carpetas
  del Outliner o con *Data Layers* (por ejemplo, cargar el interior solo al cruzar la puerta).

## Espejos en Unreal

El material de Blender (metálico, rugosidad 0,02) solo sirve para la vista previa. En Unreal hay dos opciones:

1. **Lumen** (Reflection Method = Lumen, con *Hardware Ray Tracing* activado si se puede): el material del
   espejo lleva Metallic 1 y Roughness 0–0,05. Con *High Quality Translucency Reflections* y
   *Ray Lighting Mode = Hit Lighting for Reflections* el reflejo sale nítido. Es barato y vale para la
   mayoría de espejos, pero el jugador no se ve reflejado si no tiene malla visible en reflejos
   (`bVisibleInRayTracing`, *Owner No See* desactivado para la sombra/reflejo).
2. **Planar Reflection** (actor *Planar Reflection* pegado al plano del espejo; activar
   *Support global clip plane for Planar Reflections* en Project Settings). El reflejo es perfecto, incluido
   el personaje, pero vuelve a renderizar la escena: úsalo solo en 1–2 espejos "de susto" (el del fondo del
   pasillo y el de la sala del sillón) y actívalo por cercanía o *trigger*.

Truco de terror: con un Scene Capture o un Planar Reflection se puede mostrar en el espejo algo que no está
en la sala (otra versión de la habitación o una figura), cambiando su *Show Only / Hidden Actors*.

## Pendiente / límites conocidos

- Los materiales son procedurales (solo vista previa) y no pasan al FBX/glTF: en Unreal hay que asignar
  materiales reales por nombre (`M_Fachada_Desconchada`, `M_Papel_Pintado`, etc.).
- La buhardilla es un volumen pegado al faldón: el tejado no tiene agujero debajo (desde dentro del desván
  se ve el faldón atravesándola).
- La sombra de la hiedra del arco que proyecta la linterna del bosque llega a la fachada (efecto, no fallo).
