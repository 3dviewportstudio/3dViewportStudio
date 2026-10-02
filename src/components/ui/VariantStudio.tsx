'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react';
import { Gizmo, orientGizmo } from './Gizmo';
import { Picture } from './Picture';

export const finishIds = ['lila', 'azul', 'grafito', 'verde', 'plata'] as const;
type FinishId = (typeof finishIds)[number];

/** Colores de los cinco acabados del pPhone 17: marco metálico y cristal trasero esmerilado. */
const FINISHES: Record<FinishId, { frame: string; back: string; swatch: string }> = {
  lila: { frame: '#ab94cf', back: '#b39ddb', swatch: '#c3b1e0' },
  azul: { frame: '#5f80ad', back: '#7393c0', swatch: '#7f9cc2' },
  grafito: { frame: '#4b4d53', back: '#3b3d42', swatch: '#46484e' },
  verde: { frame: '#6f8d78', back: '#84a38e', swatch: '#8fa996' },
  plata: { frame: '#c6c8cc', back: '#d6d7da', swatch: '#dcdde0' },
};

type Strings = {
  hud: string;
  finish: string;
  stageLabel: string;
  reset: string;
  colors: Record<FinishId, string>;
};

type Api = { setFinish: (id: FinishId) => void; reset: () => void };

const START_YAW = Math.PI - 0.55; // empieza mostrando el módulo de cámaras, como la película de lanzamiento
const START_PITCH = 0.12;
const TAU = Math.PI * 2;

export function VariantStudio({ strings, posterAlt }: { strings: Strings; posterAlt: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const gizmoRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const [finish, setFinish] = useState<FinishId>('lila');
  const [status, setStatus] = useState<'idle' | 'ready' | 'failed'>('idle');

  useEffect(() => {
    orientGizmo(gizmoRef.current, START_YAW, START_PITCH);
    const stage = stageRef.current;
    const host = hostRef.current;
    if (!stage || !host) return;

    let disposed = false;
    let teardown: (() => void) | null = null;

    const start = async () => {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      // El contexto de prueba se libera enseguida: los móviles limitan cuántos contextos WebGL puede haber a la vez
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      if (!gl) {
        setStatus('failed');
        return;
      }
      try {
        const THREE = await import('three');
        const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
        if (disposed) return;
        teardown = buildScene(THREE, RoomEnvironment, stage, host, gizmoRef.current, apiRef, () => setStatus('ready'));
      } catch {
        if (!disposed) setStatus('failed');
      }
    };

    // Solo se carga cuando el visor se acerca a la pantalla
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          io.disconnect();
          void start();
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(stage);

    return () => {
      disposed = true;
      io.disconnect();
      teardown?.();
      apiRef.current = null;
    };
  }, []);

  const choose = useCallback((id: FinishId) => {
    setFinish(id);
    apiRef.current?.setFinish(id);
  }, []);

  // Grupo de radio accesible: flechas para moverse entre acabados
  const onSwatchKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const i = finishIds.indexOf(finish);
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % finishIds.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + finishIds.length) % finishIds.length;
    if (next < 0) return;
    e.preventDefault();
    const id = finishIds[next] as FinishId;
    choose(id);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-finish="${id}"]`)?.focus();
  };

  const ready = status === 'ready';

  return (
    <div className="vp-frame" style={{ ['--vp-color' as string]: 'rgb(241 239 234 / 0.35)' }}>
      <div className="vp-corners" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="vp-media">
        <div
          ref={stageRef}
          className="studio-stage relative aspect-square md:aspect-[4/5]"
          data-ready={ready}
          role="slider"
          aria-orientation="horizontal"
          tabIndex={ready ? 0 : -1}
          aria-label={strings.stageLabel}
          aria-valuemin={0}
          aria-valuemax={359}
          aria-valuenow={Math.round(((START_YAW % TAU) * 180) / Math.PI)}
          aria-valuetext={`${Math.round(((START_YAW % TAU) * 180) / Math.PI)}°`}
        >
          <div ref={hostRef} className="absolute inset-0" />
          {status === 'failed' ? (
            <Picture
              id="pphone-lila"
              alt={posterAlt}
              sizes="(min-width: 768px) 40vw, 92vw"
              className="studio-poster absolute inset-0 block h-full w-full"
              imgClassName="h-full w-full object-cover"
            />
          ) : null}
        </div>

        {/* Superposiciones fuera del slider: no deben interceptar el arrastre ni anidarse en un control */}
        <p className="vp-hud pointer-events-none absolute left-4 top-4 flex items-center gap-2" aria-hidden="true">
          <span className={`inline-block h-1.5 w-1.5 rounded-full transition-colors duration-300 ${ready ? 'bg-ok' : 'bg-fg-3'}`} />
          {strings.hud}
        </p>
        <div ref={gizmoRef} className="pointer-events-none absolute right-3 top-3">
          <Gizmo size={64} yaw={START_YAW} pitch={START_PITCH} />
        </div>
        {ready ? (
          <button
            type="button"
            className="icon-btn absolute bottom-3 right-3 z-[4] h-10 bg-bg/50 px-3.5 text-[0.8125rem] backdrop-blur-md"
            onClick={() => apiRef.current?.reset()}
          >
            {strings.reset}
          </button>
        ) : null}
      </div>

      {status !== 'failed' ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p className="label" id="finish-label">
            {strings.finish}: <span className="text-fg">{strings.colors[finish]}</span>
          </p>
          <div role="radiogroup" aria-labelledby="finish-label" className="-mx-1 flex items-center" onKeyDown={onSwatchKey}>
            {finishIds.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                data-finish={id}
                aria-checked={finish === id}
                aria-label={strings.colors[id]}
                tabIndex={finish === id ? 0 : -1}
                className="swatch"
                style={{ ['--swatch' as string]: FINISHES[id].swatch }}
                onClick={() => choose(id)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ───────────────────────── Escena three.js ───────────────────────── */

type Three = typeof import('three');
type RoomEnvCtor = typeof import('three/examples/jsm/environments/RoomEnvironment.js').RoomEnvironment;

function roundedRect(THREE: Three, w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function buildScene(
  THREE: Three,
  RoomEnvironment: RoomEnvCtor,
  stage: HTMLDivElement,
  host: HTMLDivElement,
  gizmo: HTMLDivElement | null,
  apiRef: RefObject<Api | null>,
  onReady: () => void,
): () => void {
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envTex = pmrem.fromScene(room, 0.04).texture;
  scene.environment = envTex;

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 4, 5);
  const rim = new THREE.DirectionalLight(0xffb066, 1.6); // luz de recorte ámbar, el color de la marca
  rim.position.set(-4, 1.5, -3);
  const fill = new THREE.DirectionalLight(0xbfd4ff, 0.5);
  fill.position.set(4, -1, -4);
  scene.add(key, rim, fill);

  /* Modelo */
  const W = 0.74;
  const H = 1.52;
  const D = 0.07;
  const R = 0.115;
  const BT = 0.012;
  const DT = D + BT * 2;
  const disposables: Array<{ dispose: () => void }> = [renderer, pmrem, envTex];
  const track = <T extends { dispose: () => void }>(o: T) => {
    disposables.push(o);
    return o;
  };

  const initial = FINISHES.lila;
  const frameMat = track(new THREE.MeshPhysicalMaterial({ color: initial.frame, metalness: 0.92, roughness: 0.26, clearcoat: 0.3 }));
  const backMat = track(
    new THREE.MeshPhysicalMaterial({ color: initial.back, metalness: 0.05, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.32 }),
  );
  const plateauMat = track(
    new THREE.MeshPhysicalMaterial({ color: initial.back, metalness: 0.1, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08 }),
  );
  const screenMat = track(new THREE.MeshPhysicalMaterial({ color: '#050506', metalness: 0, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02 }));
  const glassMat = track(new THREE.MeshPhysicalMaterial({ color: '#07080b', metalness: 0.2, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 }));
  const lensMat = track(new THREE.MeshPhysicalMaterial({ color: '#1b2233', metalness: 1, roughness: 0.12 }));
  const flashMat = track(new THREE.MeshStandardMaterial({ color: '#f3efe2', roughness: 0.35, emissive: '#3a3528' }));
  const matteBlack = track(new THREE.MeshStandardMaterial({ color: '#030303', roughness: 0.6 }));

  const phone = new THREE.Group();

  const bodyGeo = track(
    new THREE.ExtrudeGeometry(roundedRect(THREE, W, H, R), {
      depth: D,
      bevelEnabled: true,
      bevelThickness: BT,
      bevelSize: BT,
      bevelSegments: 5,
      curveSegments: 32,
    }),
  );
  bodyGeo.center();
  phone.add(new THREE.Mesh(bodyGeo, frameMat));

  const screenGeo = track(new THREE.ShapeGeometry(roundedRect(THREE, W - 0.03, H - 0.03, R - 0.015), 24));
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.z = DT / 2 + 0.0015;
  phone.add(screen);

  const islandGeo = track(new THREE.ShapeGeometry(roundedRect(THREE, 0.2, 0.056, 0.028), 12));
  const island = new THREE.Mesh(islandGeo, matteBlack);
  island.position.set(0, H / 2 - 0.075, DT / 2 + 0.0025);
  phone.add(island);

  const backGeo = track(new THREE.ShapeGeometry(roundedRect(THREE, W - 0.026, H - 0.026, R - 0.013), 24));
  const back = new THREE.Mesh(backGeo, backMat);
  back.rotation.y = Math.PI;
  back.position.z = -DT / 2 - 0.0015;
  phone.add(back);

  // Meseta de cámaras (arriba a la izquierda vista desde detrás: X positiva por el espejo)
  const PX = W / 2 - 0.2;
  const PY = H / 2 - 0.2;
  const plateauGeo = track(
    new THREE.ExtrudeGeometry(roundedRect(THREE, 0.34, 0.34, 0.085), {
      depth: 0.016,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 4,
      curveSegments: 20,
    }),
  );
  plateauGeo.center();
  const plateau = new THREE.Mesh(plateauGeo, plateauMat);
  plateau.position.set(PX, PY, -DT / 2 - 0.012);
  phone.add(plateau);

  const ringGeo = track(new THREE.CylinderGeometry(0.06, 0.06, 0.024, 48));
  const glassGeo = track(new THREE.CylinderGeometry(0.047, 0.047, 0.026, 48));
  const lensGeo = track(new THREE.SphereGeometry(0.03, 32, 16));
  const lensSpots: Array<[number, number]> = [
    [-0.075, 0.075],
    [-0.075, -0.075],
    [0.08, 0],
  ];
  for (const [vx, vy] of lensSpots) {
    const x = PX - vx; // espejo: vista desde detrás
    const y = PY + vy;
    const z = -DT / 2 - 0.032;
    const ring = new THREE.Mesh(ringGeo, frameMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, y, z);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.rotation.x = Math.PI / 2;
    glass.position.set(x, y, z - 0.002);
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.scale.set(1, 1, 0.35);
    lens.position.set(x, y, z - 0.012);
    phone.add(ring, glass, lens);
  }
  const flashGeo = track(new THREE.CylinderGeometry(0.022, 0.022, 0.01, 24));
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.rotation.x = Math.PI / 2;
  flash.position.set(PX - 0.08, PY + 0.1, -DT / 2 - 0.022);
  phone.add(flash);

  // Botones laterales
  const btnGeo = track(new THREE.BoxGeometry(0.014, 1, 0.03));
  const sideButtons: Array<[number, number, number]> = [
    [W / 2 + BT, 0.26, 0.2],
    [-(W / 2 + BT), 0.4, 0.1],
    [-(W / 2 + BT), 0.25, 0.1],
  ];
  for (const [x, y, len] of sideButtons) {
    const b = new THREE.Mesh(btnGeo, frameMat);
    b.scale.y = len;
    b.position.set(x, y, 0);
    phone.add(b);
  }

  const pivot = new THREE.Group();
  pivot.add(phone);
  scene.add(pivot);

  // Sombra de contacto suave
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 128;
  const sctx = shadowCanvas.getContext('2d');
  if (sctx) {
    const g = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 128, 128);
  }
  const shadowTex = track(new THREE.CanvasTexture(shadowCanvas));
  const shadowMat = track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  const shadowGeo = track(new THREE.PlaneGeometry(1.3, 0.5));
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -H / 2 - 0.16;
  scene.add(shadow);

  /* Estado de la interacción */
  let yaw = START_YAW;
  let pitch = START_PITCH;
  let targetYaw = yaw;
  let targetPitch = pitch;
  let velocity = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;
  let lastInteraction = performance.now();
  let visible = true;
  let running = false;
  let lastFrame = performance.now();
  let announced = -1;
  const frameTarget = new THREE.Color(initial.frame);
  const backTarget = new THREE.Color(initial.back);

  const fit = () => {
    const w = stage.clientWidth || 1;
    const h = stage.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vFov = (camera.fov * Math.PI) / 180;
    const needH = H + 0.55;
    const needW = (W + 0.5) / camera.aspect;
    const dist = Math.max(needH, needW) / 2 / Math.tan(vFov / 2);
    camera.position.set(0, 0.02, dist);
    camera.lookAt(0, -0.02, 0);
    camera.updateProjectionMatrix();
    renderOnce();
  };

  const colorsSettled = () => frameMat.color.equals(frameTarget) && backMat.color.equals(backTarget);

  const tick = () => {
    const now = performance.now();
    const dt = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    const reduce = reduceQuery.matches;
    const idle = now - lastInteraction > 2800;

    if (!dragging) {
      if (Math.abs(velocity) > 0.00005) {
        targetYaw += velocity;
        velocity *= Math.pow(0.9, dt * 60);
      } else {
        velocity = 0;
      }
      // Vuelve suavemente a la inclinación de reposo
      targetPitch += (START_PITCH - targetPitch) * (1 - Math.exp(-dt * 2));
      if (idle && !reduce) targetYaw += dt * 0.22;
    }

    const k = reduce ? 1 : 1 - Math.exp(-dt * 14);
    yaw += (targetYaw - yaw) * k;
    pitch += (targetPitch - pitch) * k;
    pivot.rotation.set(pitch, yaw, 0, 'XYZ');

    const ck = reduce ? 1 : 1 - Math.exp(-dt * 9);
    frameMat.color.lerp(frameTarget, ck);
    backMat.color.lerp(backTarget, ck);
    plateauMat.color.copy(backMat.color);
    if (Math.abs(frameMat.color.r - frameTarget.r) + Math.abs(frameMat.color.g - frameTarget.g) + Math.abs(frameMat.color.b - frameTarget.b) < 0.002) {
      frameMat.color.copy(frameTarget);
      backMat.color.copy(backTarget);
      plateauMat.color.copy(backTarget);
    }

    renderer.render(scene, camera);
    orientGizmo(gizmo, yaw, pitch);

    const deg = Math.round((((yaw % TAU) + TAU) % TAU) * (180 / Math.PI)) % 360;
    if (deg !== announced && !dragging) {
      announced = deg;
      stage.setAttribute('aria-valuenow', String(deg));
      stage.setAttribute('aria-valuetext', `${deg}°`);
    }

    const settled =
      !dragging &&
      velocity === 0 &&
      Math.abs(targetYaw - yaw) < 0.0005 &&
      Math.abs(targetPitch - pitch) < 0.0005 &&
      colorsSettled() &&
      (reduce || !idle);
    // Con rotación automática el bucle sigue mientras el visor está en pantalla
    if ((settled && (reduce || !idle)) || !visible || document.hidden) stop();
  };

  function loop() {
    if (running) return;
    running = true;
    lastFrame = performance.now();
    renderer.setAnimationLoop(tick);
  }
  function stop() {
    if (!running) return;
    running = false;
    renderer.setAnimationLoop(null);
  }
  function renderOnce() {
    pivot.rotation.set(pitch, yaw, 0, 'XYZ');
    renderer.render(scene, camera);
  }
  const wake = () => {
    if (visible && !document.hidden) loop();
  };

  // Tras unos segundos quieto, la rotación automática necesita que el bucle vuelva a arrancar
  const idleTimer = window.setInterval(() => {
    if (!running && visible && !document.hidden && !reduceQuery.matches && performance.now() - lastInteraction > 2800) loop();
  }, 1000);

  /* Arrastre */
  const onDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if ((e.target as Element).closest('button')) return;
    if (dragging) return; // ignora un segundo dedo
    dragging = true;
    stage.dataset.dragging = 'true';
    stage.setPointerCapture(e.pointerId);
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = performance.now();
    velocity = 0;
    lastInteraction = lastT;
    wake();
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging || !stage.hasPointerCapture(e.pointerId)) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const w = stage.clientWidth || 1;
    const delta = (dx / w) * Math.PI * 1.4;
    targetYaw += delta;
    targetPitch = Math.max(-0.45, Math.min(0.55, targetPitch + (dy / w) * Math.PI * 0.8));
    const elapsed = Math.max(now - lastT, 1);
    velocity = (delta / elapsed) * 16; // radianes por fotograma a 60 Hz
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = now;
    lastInteraction = now;
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    stage.dataset.dragging = 'false';
    if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
    // Un gesto rápido basta para lanzar el giro; si el dedo se detuvo antes de soltar, no hay inercia
    if (performance.now() - lastT > 80) velocity = 0;
    velocity = Math.max(-0.25, Math.min(0.25, velocity));
    lastInteraction = performance.now();
    wake();
  };

  /* Teclado (slider): flechas giran 15°, Inicio centra */
  const onKey = (e: KeyboardEvent) => {
    const step = (15 * Math.PI) / 180;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') targetYaw += step;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') targetYaw -= step;
    else if (e.key === 'Home') api.reset();
    else return;
    e.preventDefault();
    velocity = 0;
    lastInteraction = performance.now();
    wake();
  };

  const api: Api = {
    setFinish(id) {
      const f = FINISHES[id];
      frameTarget.set(f.frame);
      backTarget.set(f.back);
      lastInteraction = performance.now();
      wake();
    },
    reset() {
      // Camino más corto hasta la vista inicial
      const base = START_YAW + Math.round((targetYaw - START_YAW) / TAU) * TAU;
      targetYaw = base;
      targetPitch = START_PITCH;
      velocity = 0;
      lastInteraction = performance.now();
      wake();
    },
  };
  apiRef.current = api;

  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
  stage.addEventListener('keydown', onKey);

  const ro = new ResizeObserver(fit);
  ro.observe(stage);

  const vis = new IntersectionObserver(
    ([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible) wake();
      else stop();
    },
    { threshold: 0.01 },
  );
  vis.observe(stage);

  const onVisibility = () => (document.hidden ? stop() : wake());
  document.addEventListener('visibilitychange', onVisibility);

  fit();
  renderOnce();
  onReady();
  wake();

  return () => {
    stop();
    window.clearInterval(idleTimer);
    ro.disconnect();
    vis.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    stage.removeEventListener('pointerdown', onDown);
    stage.removeEventListener('pointermove', onMove);
    stage.removeEventListener('pointerup', onUp);
    stage.removeEventListener('pointercancel', onUp);
    stage.removeEventListener('keydown', onKey);
    room.dispose();
    disposables.forEach((d) => d.dispose());
    renderer.domElement.remove();
  };
}
