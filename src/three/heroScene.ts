/*
 * QADAM 3D hero сахнасы (three.js).
 * Орталықта — жарқыраған білім шарына апаратын «қадамдар» баспалдағы,
 * айналасында ұшып жүрген кітаптар, әріптер, шарлар және бөлшектер.
 * Тек көрініп тұрғанда ғана рендерленеді; жойылғанда барлық ресурс босатылады.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export interface HeroSceneHandle {
  dispose: () => void;
}

const STEP_COLORS = ['#243B80', '#34479C', '#4A4FC4', '#6555E8', '#7C8BF4'];

function letterSprite(text: string, color: string) {
  const size = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.roundRect(8, 8, size - 16, size - 16, 30);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = `800 ${text.length > 1 ? 44 : 64}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2 + 4);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
  const sp = new THREE.Sprite(mat);
  sp.scale.setScalar(0.62);
  return sp;
}

function makeBook(cover: string) {
  const g = new THREE.Group();
  const coverMat = new THREE.MeshPhysicalMaterial({ color: cover, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const pagesMat = new THREE.MeshStandardMaterial({ color: '#F6F8FF', roughness: 0.8 });
  const c = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.14, 0.66, 3, 0.04), coverMat);
  const p = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.1, 0.6), pagesMat);
  p.position.set(0.03, 0, 0);
  g.add(c, p);
  return g;
}

export function createHeroScene(canvas: HTMLCanvasElement, opts: { dark: boolean }): HeroSceneHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 1.1, 9);

  // Жарық
  scene.add(new THREE.HemisphereLight('#dfe6ff', opts.dark ? '#1a1f4d' : '#c9d3ff', 1.15));
  const key = new THREE.DirectionalLight('#ffffff', 2.2);
  key.position.set(4, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#8B7CF6', 1.6);
  rim.position.set(-5, 2, -4);
  scene.add(rim);

  const world = new THREE.Group();
  scene.add(world);

  // Қадамдар баспалдағы
  const stairs = new THREE.Group();
  STEP_COLORS.forEach((col, i) => {
    const m = new THREE.Mesh(
      new RoundedBoxGeometry(1.25, 0.42 + i * 0.36, 1.25, 4, 0.16),
      new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.18 }),
    );
    const h = 0.42 + i * 0.36;
    m.position.set(-2.4 + i * 1.2, -1.6 + h / 2, 0.2 - i * 0.08);
    stairs.add(m);
  });
  world.add(stairs);

  // Білім шары
  const orbMat = new THREE.MeshPhysicalMaterial({
    color: '#FFCA70',
    emissive: '#FFB340',
    emissiveIntensity: 0.55,
    roughness: 0.15,
    clearcoat: 1,
    transmission: 0.1,
  });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 48, 48), orbMat);
  orb.position.set(2.4, 1.55, 0);
  world.add(orb);
  const glow = new THREE.PointLight('#FFCA70', 6, 6, 2);
  glow.position.copy(orb.position);
  world.add(glow);

  // Прогресс сақиналары
  const ringMat = new THREE.MeshPhysicalMaterial({ color: '#38BDF8', emissive: '#2aa6c9', emissiveIntensity: 0.4, roughness: 0.2, clearcoat: 1 });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.045, 16, 96), ringMat);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.03, 16, 96), new THREE.MeshPhysicalMaterial({ color: '#8B7CF6', roughness: 0.3, clearcoat: 1 }));
  ring1.position.copy(orb.position);
  ring2.position.copy(orb.position);
  ring1.rotation.x = 1.2;
  ring2.rotation.set(0.4, 0.6, 0);
  world.add(ring1, ring2);

  // Кітаптар
  const books = [
    { b: makeBook('#8B7CF6'), p: new THREE.Vector3(-3.1, 1.5, -0.6), r: 0.4 },
    { b: makeBook('#35C98A'), p: new THREE.Vector3(0.2, 2.3, -1.2), r: -0.3 },
    { b: makeBook('#38BDF8'), p: new THREE.Vector3(3.4, -0.9, 0.6), r: 0.8 },
  ];
  books.forEach(({ b, p, r }) => {
    b.position.copy(p);
    b.rotation.set(0.5, r, 0.25);
    world.add(b);
  });

  // Әріптер мен белгілер
  const glyphs: [string, string, THREE.Vector3][] = [
    ['Ә', '#243B80', new THREE.Vector3(-1.4, 2.3, 0.8)],
    ['+', '#35C98A', new THREE.Vector3(1.2, -1.9, 1.4)],
    ['π', '#38BDF8', new THREE.Vector3(-3.6, -0.4, 1.0)],
    ['ABC', '#8B7CF6', new THREE.Vector3(3.9, 2.4, -0.8)],
    ['?', '#C27A12', new THREE.Vector3(0.9, 0.6, 2.2)],
  ];
  const sprites = glyphs.map(([t, c, p]) => {
    const s = letterSprite(t, c);
    s.position.copy(p);
    world.add(s);
    return s;
  });

  // Ұсақ шарлар
  const orbs = [
    ['#38BDF8', new THREE.Vector3(-2.2, 2.6, -1.5), 0.12],
    ['#8B7CF6', new THREE.Vector3(1.6, 2.8, 0.4), 0.09],
    ['#35C98A', new THREE.Vector3(-0.5, -2.2, 1.2), 0.1],
    ['#38BDF8', new THREE.Vector3(4.2, 0.8, -1.4), 0.14],
  ].map(([c, p, r]) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r as number, 24, 24),
      new THREE.MeshStandardMaterial({ color: c as string, emissive: c as string, emissiveIntensity: 0.7, roughness: 0.3 }),
    );
    m.position.copy(p as THREE.Vector3);
    world.add(m);
    return m;
  });

  // Бөлшектер
  const N = 220;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ color: opts.dark ? '#b8c6ff' : '#7f8cff', size: 0.04, transparent: true, opacity: 0.75, depthWrite: false }),
  );
  scene.add(points);

  // Өлшем
  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 1.2 ? 12.5 : 10.2;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // Тышқан мен айналдыру (parallax)
  const target = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  let scrollY = window.scrollY;
  const onScroll = () => (scrollY = window.scrollY);
  window.addEventListener('scroll', onScroll, { passive: true });

  // Тек көрінгенде рендерлеу
  let visible = true;
  const io = new IntersectionObserver((e) => (visible = e.some((x) => x.isIntersecting)));
  io.observe(canvas);

  const clock = new THREE.Clock();
  let entrance = 0;
  let raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (!visible || document.hidden) {
      clock.getDelta();
      return;
    }
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    entrance = Math.min(1, entrance + dt * 0.9);
    const e = 1 - Math.pow(1 - entrance, 3);

    world.scale.setScalar((0.85 + 0.15 * e) * 0.84);
    world.position.y = -0.6 * (1 - e) - Math.min(1.2, scrollY / 600);
    world.rotation.y += ((target.x * 0.35 - 0.18) - world.rotation.y) * 0.04;
    world.rotation.x += ((target.y * 0.12 + 0.06 + scrollY / 3000) - world.rotation.x) * 0.04;

    stairs.children.forEach((m, i) => (m.position.y += Math.sin(t * 1.2 + i * 0.6) * 0.0012));
    orb.position.y = 1.55 + Math.sin(t * 1.4) * 0.12;
    glow.position.y = orb.position.y;
    ring1.position.y = ring2.position.y = orb.position.y;
    ring1.rotation.z = t * 0.6;
    ring2.rotation.y = t * 0.4;
    books.forEach(({ b, p }, i) => {
      b.position.y = p.y + Math.sin(t * 0.9 + i * 2) * 0.18;
      b.rotation.y += 0.003 * (i % 2 ? 1 : -1);
    });
    sprites.forEach((s, i) => (s.position.y = glyphs[i][2].y + Math.sin(t * 1.1 + i) * 0.14));
    orbs.forEach((m, i) => (m.position.y += Math.cos(t * 1.3 + i) * 0.003));
    points.rotation.y = t * 0.02;

    renderer.render(scene, camera);
  };
  loop();

  return {
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = (m as unknown as { material?: THREE.Material | THREE.Material[] }).material;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
          (x as THREE.SpriteMaterial).map?.dispose?.();
          x.dispose();
        });
      });
      renderer.dispose();
    },
  };
}
