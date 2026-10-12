---
name: blender-product-cgi
description: Use when building, lighting, rendering, or exporting product CGI in Blender (packshots, turntables, configurators, hero renders), including headless batch rendering from the command line and handing renders to this repo's media pipeline (AVIF/JPEG stills, H.264 video).
---

# Blender Product CGI

Workflow for photoreal product renders in Blender, with repeatable batch output for the web.

## Core principles

- **Build once, render many.** Keep one master `.blend` per product. Variants (colors, materials, angles) are driven by collections, material slots, or a Python script, never by copying the file.
- **Real-world units.** Model in meters at true scale. Product shots break when a 30 cm object is 30 m.
- **Color management first.** Set *View Transform* to **AgX** (Blender 4.x default) or **Filmic** for product work, and never use *Standard* for hero images. Set *Look* to *None* unless a look is deliberately chosen.
- **Lighting carries the product.** Studio setups beat HDRIs for packshots. Use large soft area lights, a gradient or sweep backdrop, and reflectors. Use HDRIs only for environment-reflective products (chrome, glass, car paint).
- **Render settings are part of the deliverable.** Record samples, resolution, and denoiser in the scene so every render matches.

## Scene setup checklist

1. Collections: `PRODUCT`, `BACKDROP`, `LIGHTS`, `CAMERA`, `SHADOW_CATCHER` (optional).
2. Apply all transforms on the product (`Ctrl+A` → All Transforms). Origin at the product's base center.
3. Camera: 50–85 mm equivalent focal length for product work. Avoid wide lenses (distortion). Lock the camera to a *Track To* empty or set a fixed orthographic camera for turntables.
4. Backdrop: a curved plane (sweep) with a shader that is *seamless* into the floor. Use Shadow Catcher for compositing onto other backgrounds.
5. Lights: a key (large area, 45°, 1–2 m away), a fill (weaker, opposite), a rim/kicker (behind, separates the silhouette). Use light linking if one light must affect only specific objects.
6. Floor: roughness 0.3–0.6 for a soft contact reflection, or a pure matte floor for clean packshots.

## Materials

- Use the **Principled BSDF** and keep PBR maps (base color, roughness, metallic, normal) in linear/non-color as appropriate. Color data (albedo) is sRGB; roughness, metallic, normal, and displacement are Non-Color.
- Measure real values where possible: plastics roughly 0.3–0.5 roughness, brushed metal 0.2–0.4 with metallic 1, glass IOR 1.45–1.52 with Transmission.
- Add a subtle bevel (0.5–2 mm, 2–4 segments) to hard edges so they catch highlights. Use the Bevel node with Normal output.

## Render settings

| Use | Engine | Samples | Denoise | Resolution |
|---|---|---|---|---|
| Quick preview | EEVEE or Cycles (low) | 64 | Off | 1280×1280 |
| Final still | Cycles | 512–1024 | OpenImageDenoise | 3000×3000 (square) or 3840×2160 |
| Turntable frame | Cycles | 256–512 | OpenImageDenoise | 2048×2048 |

- Use **Film → Transparent** only when you need a PNG with alpha for compositing.
- Enable **Adaptive Sampling** with a noise threshold around 0.01 for final stills.
- Cycles GPU: set the device in Preferences → System, and check the headless machine actually has a supported GPU before assuming it's used.

## Headless batch rendering

Render from the command line so output is reproducible and scriptable.

```bash
# Single still
blender -b product.blend -S PRODUCT_CAM -o //renders/product_#### -F PNG -x 1 -f 1

# Turntable frames 1–120
blender -b product.blend -o //renders/turntable_#### -F PNG -s 1 -e 120 -a
```

- `-b` runs in background; `-S` sets the scene camera by name; `-a` renders the animation range; `-x 1` honors output path with `#` padding.
- Override settings from a Python script rather than editing the .blend by hand:

```python
# scripts/render_variants.py
# Run with: blender -b product.blend -P scripts/render_variants.py
import bpy, os

VARIANTS = {
    "matte-black": (0.02, 0.02, 0.02),
    "ivory": (0.85, 0.80, 0.70),
}

out_dir = bpy.path.abspath("//renders")
os.makedirs(out_dir, exist_ok=True)

scene = bpy.context.scene
mat = bpy.data.materials["Body"]
bsdf = mat.node_tree.nodes["Principled BSDF"]

for name, rgb in VARIANTS.items():
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    scene.render.filepath = os.path.join(out_dir, f"{name}.png")
    bpy.ops.render.render(write_still=True)
```

- Keep scripts in `scripts/` inside the Blender project folder, not inside the Next.js `src/`.
- Use `bpy.ops.render.render(animation=True)` for frame sequences.

## Post-processing and delivery

Match the repo's existing media conventions (see `npm run media`):

1. **Stills**: export PNG from Blender at full resolution, then convert to **AVIF 4:4:4** and **JPEG 4:4:4** (quality ~80–85 for JPEG, lossless-ish for AVIF). Use `ffmpeg` or `avifenc`. Keep the source PNG outside `public/`.
2. **Turntables and video**: encode with `ffmpeg` to **H.264, no audio**, 1080p and 720p, `-pix_fmt yuv420p` and `-movflags +faststart` for web playback. Example:

```bash
ffmpeg -framerate 30 -i renders/turntable_%04d.png \
  -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -movflags +faststart \
  -an -vf scale=1920:1920 turntable_1080.mp4
```

3. Check color after export: compare the render against the viewport on a calibrated monitor, and verify the sRGB output in the browser.

## Verification before delivering

- Look at the render at 100% crop around edges, highlights, and contact shadows. Look for banding in gradients, fireflies, and clipped highlights.
- Confirm the product's dimensions match the reference drawing or spec.
- Check the transparent PNG (if used) on both a light and dark background.
- Confirm the file names and resolution match what the web page expects before updating any references.

## Common pitfalls

- Mismatched units (scene scale not 1.0) causing wrong depth of field and shadow softness.
- Forgetting to apply transforms, so the product's origin and rotation for turntables are wrong.
- Using Standard view transform, which causes oversaturated, clipped colors.
- Hard shadow edges from small light sources. Enlarge the light or move it farther away.
- Fireflies from caustics or glossy-on-diffuse paths. Clamp indirect light (Clamp Indirect ≈ 5–10) rather than cranking samples.
- Over-saturated base colors. Product albedo rarely exceeds ~0.8 in linear.

## Asking the user

Before starting a new product, confirm: the product's real dimensions, the required angles or variants, the target resolution and format, whether a transparent background is needed, and the brand's color references.
