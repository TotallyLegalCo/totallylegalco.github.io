import * as THREE from 'three';

const ACID = 0xa7ff3c;
const TAU = Math.PI * 2;

type DeformableGeometry = {
  geometry: THREE.BufferGeometry;
  base: Float32Array;
  seed: number;
  amount: number;
};

/** Procedural low-poly broccoli specimen rendered only as triangular wireframe. */
export class BroccoliOrganism {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  private readonly specimen = new THREE.Group();
  private readonly material = new THREE.MeshBasicMaterial({
    color: ACID,
    wireframe: true,
    transparent: true,
    opacity: 0.86
  });
  private readonly deformable: DeformableGeometry[] = [];
  private width = 0;
  private height = 0;
  private pointerDown = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private rotationX = -0.06;
  private rotationY = 0;
  private audioLevel = 0;
  private instability = 0;
  private reducedMotion = false;
  private disposed = false;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly onInteract?: () => void) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.add(this.specimen);
    this.camera.position.set(0, 0, 8.2);
    this.buildSpecimen();
    this.bindPointer();
  }

  setAudioLevel(level: number): void {
    this.audioLevel = Math.max(0, Math.min(1, level));
  }

  setInstability(value: number): void {
    this.instability = Math.max(0, Math.min(1, value));
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  resize(pixelRatio: number): void {
    if (this.disposed) return;
    const bounds = this.canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    this.width = bounds.width;
    this.height = bounds.height;
    this.renderer.setPixelRatio(Math.min(pixelRatio, 1.5));
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  update(time: number, delta: number): void {
    if (this.disposed || !this.width || !this.height) return;
    const seconds = Math.min(delta, 50) / 1000;
    const motion = this.reducedMotion ? 0 : 1;
    const glitch = this.reducedMotion ? 0 : this.instability;
    this.rotationY += seconds * motion * 0.24;
    this.specimen.rotation.y = this.rotationY;
    this.specimen.rotation.x = this.rotationX + Math.sin(time * 0.00019) * motion * 0.018;

    const bassPulse = Math.sin(time * 0.0031) * 0.012 + this.audioLevel * 0.12;
    const glitchPulse = glitch > 0.16 ? Math.sin(time * 0.027) * glitch * 0.045 : 0;
    const scale = 1 + bassPulse + glitchPulse;
    this.specimen.scale.set(scale, scale, scale);
    this.specimen.position.x = glitch > 0.22 ? Math.sin(time * 0.032) * glitch * 0.055 : 0;
    this.specimen.position.y = Math.sin(time * 0.0008) * motion * 0.018;

    for (const item of this.deformable) {
      const positions = item.geometry.attributes.position;
      const amplitude = item.amount * glitch;
      for (let index = 0; index < positions.count; index++) {
        const offset = index * 3;
        const x = item.base[offset];
        const y = item.base[offset + 1];
        const z = item.base[offset + 2];
        const wave = Math.sin(time * 0.019 + item.seed + index * 1.71) * amplitude;
        const length = Math.max(0.001, Math.hypot(x, y, z));
        positions.array[offset] = x + x / length * wave;
        positions.array[offset + 1] = y + y / length * wave;
        positions.array[offset + 2] = z + z / length * wave;
      }
      positions.needsUpdate = true;
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.scene.remove(this.specimen);
    this.specimen.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    this.material.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private buildSpecimen(): void {
    // The main stalk tapers into a slightly wandering, faceted stem.
    const stemGeometry = this.createStemGeometry();
    this.specimen.add(new THREE.Mesh(stemGeometry, this.material));

    // A thick, short central stem runs into the uneven crown rather than a sphere.
    this.addBranch(new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(0.04, 1.12, 0.01), 0.072, 4);

    // Uneven lobes form the recognizable clustered head; each floret is a deformed ico.
    const florets: Array<[number, number, number, number, number]> = [
      [-0.88, 1.32, 0.03, 0.56, 1], [-0.52, 1.65, 0.23, 0.53, 2], [-0.12, 1.87, -0.12, 0.5, 3],
      [0.34, 1.73, 0.16, 0.58, 4], [0.78, 1.42, -0.1, 0.52, 5], [1.03, 1.05, 0.12, 0.39, 6],
      [-1.1, 0.98, -0.18, 0.38, 7], [-0.65, 1.1, -0.3, 0.48, 8], [-0.18, 1.31, 0.32, 0.51, 9],
      [0.34, 1.27, -0.35, 0.55, 10], [0.74, 1.08, 0.34, 0.43, 11], [-0.92, 0.68, 0.22, 0.32, 12],
      [-0.42, 0.82, 0.38, 0.36, 13], [0.22, 0.83, 0.43, 0.4, 14], [0.76, 0.67, -0.28, 0.34, 15],
      [-0.05, 2.12, 0.16, 0.32, 16]
    ];

    for (const [x, y, z, size, seed] of florets) {
      const base = new THREE.Vector3(0.02 * x, 0.55 + (y - 0.7) * 0.3, 0);
      const target = new THREE.Vector3(x * 0.76, y, z);
      const branchEnd = target.clone().multiplyScalar(0.76).add(base.clone().multiplyScalar(0.24));
      this.addBranch(base, branchEnd, 0.018 + size * 0.045, seed);

      const geometry = this.makeFloret(seed);
      geometry.scale(size, size * (0.88 + (seed % 4) * 0.045), size * (0.9 + (seed % 3) * 0.06));
      const floret = new THREE.Mesh(geometry, this.material);
      floret.position.copy(target);
      floret.rotation.set(seed * 0.37, seed * 1.61, seed * 0.29);
      this.specimen.add(floret);
      this.deformable.push({
        geometry,
        base: new Float32Array(geometry.attributes.position.array as Float32Array),
        seed,
        amount: 0.025
      });
    }

    this.buildRoots();
  }

  private makeFloret(seed: number): THREE.IcosahedronGeometry {
    const geometry = new THREE.IcosahedronGeometry(1, 1);
    const position = geometry.attributes.position;
    for (let index = 0; index < position.count; index++) {
      const x = position.getX(index);
      const y = position.getY(index);
      const z = position.getZ(index);
      const irregular = 1 + 0.14 * Math.sin(seed * 4.1 + x * 8.4 + y * 5.6 + z * 7.3)
        + 0.07 * Math.sin(seed * 2.3 + x * 13.1 - z * 9.2);
      position.setXYZ(index, x * irregular, y * irregular, z * irregular);
    }
    position.needsUpdate = true;
    return geometry;
  }

  private createStemGeometry(): THREE.BufferGeometry {
    const radial = 9;
    const rings = 9;
    const positions: number[] = [];
    const indices: number[] = [];
    for (let ring = 0; ring <= rings; ring++) {
      const v = ring / rings;
      const y = -1.62 + v * 2.22;
      const radius = 0.16 + Math.pow(v, 0.76) * 0.19 + Math.sin(v * 9.5) * 0.025;
      const centerX = Math.sin(v * 4.2) * 0.085;
      const centerZ = Math.cos(v * 5.1) * 0.055;
      for (let side = 0; side < radial; side++) {
        const angle = side / radial * TAU;
        const uneven = 1 + Math.sin(angle * 3 + ring * 1.8) * 0.085;
        positions.push(centerX + Math.cos(angle) * radius * uneven, y, centerZ + Math.sin(angle) * radius * uneven);
      }
    }
    for (let ring = 0; ring < rings; ring++) {
      for (let side = 0; side < radial; side++) {
        const next = (side + 1) % radial;
        const a = ring * radial + side;
        const b = ring * radial + next;
        const c = (ring + 1) * radial + side;
        const d = (ring + 1) * radial + next;
        indices.push(a, c, b, b, c, d);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    return geometry;
  }

  private addBranch(start: THREE.Vector3, end: THREE.Vector3, radius: number, seed: number): void {
    const mid = start.clone().lerp(end, 0.52);
    mid.x += Math.sin(seed * 2.7) * 0.07;
    mid.z += Math.cos(seed * 1.9) * 0.07;
    const curve = new THREE.CatmullRomCurve3([start, mid, end]);
    const geometry = new THREE.TubeGeometry(curve, 5, radius, 5, false);
    this.specimen.add(new THREE.Mesh(geometry, this.material));
  }

  private buildRoots(): void {
    this.addBranch(new THREE.Vector3(0.02, -1.52, 0), new THREE.Vector3(-0.04, -2.13, 0.02), 0.055, 31);
    const roots = 12;
    for (let index = 0; index < roots; index++) {
      const angle = index / roots * TAU + 0.12;
      const reach = 0.72 + (index % 4) * 0.18;
      const start = new THREE.Vector3(Math.cos(angle) * 0.1, -1.43, Math.sin(angle) * 0.1);
      const middle = new THREE.Vector3(Math.cos(angle) * reach * 0.53, -1.77 - (index % 3) * 0.04, Math.sin(angle) * reach * 0.53);
      const tip = new THREE.Vector3(Math.cos(angle) * reach, -2.1 - (index % 2) * 0.12, Math.sin(angle) * reach);
      const curve = new THREE.CatmullRomCurve3([start, middle, tip]);
      this.specimen.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 7, 0.025 + (index % 3) * 0.006, 4, false), this.material));

      if (index % 2 === 0) {
        const forkStart = middle.clone();
        const forkTip = new THREE.Vector3(tip.x * 1.14 + Math.sin(angle) * 0.17, -2.2, tip.z * 1.14 - Math.cos(angle) * 0.17);
        this.addBranch(forkStart, forkTip, 0.014, index + 44);
      }
    }
  }

  private bindPointer(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    this.pointerDown = true;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.canvas.setPointerCapture(event.pointerId);
    this.onInteract?.();
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.pointerDown) return;
    const deltaX = event.clientX - this.lastPointerX;
    const deltaY = event.clientY - this.lastPointerY;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.rotationY += deltaX * 0.009;
    this.rotationX = THREE.MathUtils.clamp(this.rotationX + deltaY * 0.006, -0.45, 0.45);
    this.onInteract?.();
  };

  private readonly onPointerUp = (): void => {
    this.pointerDown = false;
  };

  private readonly onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z + event.deltaY * 0.004, 5.3, 11.2);
    this.onInteract?.();
  };
}
