# Escena: camino del bosque + arco en ruinas (noche con niebla)

`forest_arch_scene.py` (probado con bpy 5.3, headless):
`blender -b -P blender/forest_arch_scene.py -- --out ./unreal_export`
o pegarlo en Scripting / enviarlo por el addon MCP (puerto 9876).

Genera: arco de bloques (pilares + dovelas con hueco de ruina), losas sueltas, hiedra con curvas Bézier
+ hojas, abetos/helechos/flores esparcidos, casa con ventana encendida, luna, niebla volumétrica y cámara.

Salida para Unreal: `SM_Entorno.fbx`, `SM_Abeto/Helecho/Flor.glb` (mallas base) y `vegetacion_puntos.csv`
(mesh, x, y, z en metros, rotZ, escala) para Foliage o PCG (Load CSV -> Spawn Static Mesh).
