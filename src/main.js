import * as THREE from 'three';
import './style.css';

const canvas = document.querySelector('#glass-canvas');
const stage = document.querySelector('.specimen-stage');
const status = document.querySelector('#render-status');
const sliders = ['x', 'y', 'z'].map((axis) => ({
  axis,
  input: document.querySelector(`#axis-${axis}`),
  output: document.querySelector(`#value-${axis}`),
}));
const resetButton = document.querySelector('#reset-view');
let renderer;
let animationFrame = 0;
let environmentTarget;

function formatDegrees(radians) {
  let degrees = THREE.MathUtils.euclideanModulo(
    Math.round(THREE.MathUtils.radToDeg(radians)) + 180,
    360,
  ) - 180;
  if (degrees === -180 && radians > 0) degrees = 180;

  return {
    degrees,
    label: `${degrees < 0 ? '-' : ''}${String(Math.abs(degrees)).padStart(3, '0')}°`,
  };
}

function initialize() {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    status.hidden = false;
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const environmentCanvas = document.createElement('canvas');
  environmentCanvas.width = 512;
  environmentCanvas.height = 256;
  const environmentContext = environmentCanvas.getContext('2d');
  environmentContext.fillStyle = '#141512';
  environmentContext.fillRect(0, 0, 512, 256);

  for (const { x, width, color } of [
    { x: 52, width: 58, color: '#eef0e9' },
    { x: 205, width: 24, color: '#ced8d6' },
    { x: 412, width: 44, color: '#e8e4d8' },
  ]) {
    const panel = environmentContext.createLinearGradient(x, 0, x + width, 0);
    panel.addColorStop(0, '#242522');
    panel.addColorStop(0.28, color);
    panel.addColorStop(0.76, color);
    panel.addColorStop(1, '#26231e');
    environmentContext.fillStyle = panel;
    environmentContext.fillRect(x, 26, width, 200);
  }

  const warmPanel = environmentContext.createLinearGradient(304, 0, 316, 0);
  warmPanel.addColorStop(0, '#3c2412');
  warmPanel.addColorStop(0.5, '#d79243');
  warmPanel.addColorStop(1, '#3c2412');
  environmentContext.fillStyle = warmPanel;
  environmentContext.fillRect(304, 69, 12, 125);

  const environmentTexture = new THREE.CanvasTexture(environmentCanvas);
  environmentTexture.colorSpace = THREE.SRGBColorSpace;
  environmentTexture.mapping = THREE.EquirectangularReflectionMapping;
  const environmentGenerator = new THREE.PMREMGenerator(renderer);
  environmentTarget = environmentGenerator.fromEquirectangular(environmentTexture);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 1;
  environmentTexture.dispose();
  environmentGenerator.dispose();
  const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 80);
  camera.position.set(0, 0.25, 7.6);

  scene.add(new THREE.HemisphereLight(0xcfdedb, 0x26221b, 0.8));

  const keyLight = new THREE.DirectionalLight(0xffe6c2, 3.2);
  keyLight.position.set(-3.5, 5, 5);
  scene.add(keyLight);

  const edgeLight = new THREE.DirectionalLight(0xc5ddff, 3);
  edgeLight.position.set(4, 1.7, -4);
  scene.add(edgeLight);

  const topLight = new THREE.PointLight(0xffa243, 8, 8, 2);
  topLight.position.set(0, 2.4, 2.2);
  scene.add(topLight);

  const glassProfile = [
    new THREE.Vector2(0, -1.35),
    new THREE.Vector2(0.52, -1.35),
    new THREE.Vector2(0.59, -1.32),
    new THREE.Vector2(0.62, -1.25),
    new THREE.Vector2(0.63, -1.14),
    new THREE.Vector2(0.72, 0.96),
    new THREE.Vector2(0.75, 1.05),
    new THREE.Vector2(0.74, 1.1),
    new THREE.Vector2(0.71, 1.11),
    new THREE.Vector2(0.69, 1.08),
    new THREE.Vector2(0.67, 1.02),
    new THREE.Vector2(0.58, -0.94),
    new THREE.Vector2(0.54, -1.02),
    new THREE.Vector2(0, -1.02),
  ];
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry(glassProfile, 112),
    new THREE.MeshPhysicalMaterial({
      color: 0xc3d1ca,
      metalness: 0,
      roughness: 0.025,
      transmission: 1,
      thickness: 0.22,
      ior: 1.48,
      attenuationColor: 0xf6f7f3,
      attenuationDistance: 12,
      side: THREE.DoubleSide,
    }),
  );
  glass.rotation.order = 'XYZ';
  scene.add(glass);

  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.59, 0.035, 12, 100),
    new THREE.MeshPhysicalMaterial({
      color: 0xf0a347,
      metalness: 0.4,
      roughness: 0.22,
      emissive: 0x391a08,
    }),
  );
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = -1.29;
  glass.add(baseRing);

  const resizeObserver = new ResizeObserver((entries) => {
    const { width, height } = entries[0].contentRect;

    if (width === 0 || height === 0) return;

    camera.aspect = width / height;
    camera.position.z = width < 500 ? 8.15 : 7.6;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render();
  });
  resizeObserver.observe(stage);

  function render() {
    if (animationFrame) return;

    animationFrame = requestAnimationFrame(() => {
      animationFrame = 0;
      renderer.render(scene, camera);
    });
  }

  function syncControls() {
    for (const { axis, input, output } of sliders) {
      const { degrees, label } = formatDegrees(glass.rotation[axis]);
      input.value = String(degrees);
      input.setAttribute('aria-valuetext', `${degrees} degrees`);
      output.value = label;
    }
  }

  for (const { axis, input } of sliders) {
    input.addEventListener('input', () => {
      glass.rotation[axis] = THREE.MathUtils.degToRad(Number(input.value));
      syncControls();
      render();
      input.setAttribute(
        'aria-valuetext',
        `${Math.round(Number(input.value))} degrees`,
      );
    });
  }

  resetButton.addEventListener('click', () => {
    glass.rotation.set(0, 0, 0);
    syncControls();
    render();
    canvas.focus({ preventScroll: true });
  });

  let pointerId = null;
  let previousX = 0;
  let previousY = 0;
  let previousAngle = 0;
  const rollThreshold = 34;

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;

    pointerId = event.pointerId;
    previousX = event.clientX;
    previousY = event.clientY;
    previousAngle = Math.atan2(
      event.clientY - (stage.getBoundingClientRect().top + stage.clientHeight / 2),
      event.clientX - (stage.getBoundingClientRect().left + stage.clientWidth / 2),
    );
    canvas.setPointerCapture(pointerId);
    canvas.classList.add('is-dragging');
    event.preventDefault();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId) return;

    const rect = stage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = event.clientX - previousX;
    const deltaY = event.clientY - previousY;
    const radius = Math.hypot(event.clientX - centerX, event.clientY - centerY);
    const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
    let deltaRoll = angle - previousAngle;

    if (deltaRoll > Math.PI) deltaRoll -= Math.PI * 2;
    if (deltaRoll < -Math.PI) deltaRoll += Math.PI * 2;

    glass.rotation.y += deltaX * 0.008;
    glass.rotation.x += deltaY * 0.008;
    if (radius > rollThreshold) glass.rotation.z += deltaRoll;

    previousX = event.clientX;
    previousY = event.clientY;
    previousAngle = angle;
    syncControls();
    render();
  });

  function endDrag(event) {
    if (event.pointerId !== pointerId) return;

    pointerId = null;
    canvas.classList.remove('is-dragging');
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  canvas.addEventListener('keydown', (event) => {
    const step = THREE.MathUtils.degToRad(event.shiftKey ? 3 : 8);

    if (event.key === 'Home') {
      glass.rotation.set(0, 0, 0);
      syncControls();
      render();
      event.preventDefault();
      return;
    }

    const keyboardRotations = {
      ArrowUp: ['x', -step],
      ArrowDown: ['x', step],
      ArrowLeft: [event.shiftKey ? 'z' : 'y', event.shiftKey ? -step : -step],
      ArrowRight: [event.shiftKey ? 'z' : 'y', step],
    };
    const rotation = keyboardRotations[event.key];

    if (!rotation) return;

    glass.rotation[rotation[0]] += rotation[1];
    syncControls();
    render();
    event.preventDefault();
  });

  syncControls();
  render();
}

initialize();

window.addEventListener(
  'pagehide',
  () => {
    cancelAnimationFrame(animationFrame);
    environmentTarget?.dispose();
    renderer?.dispose();
  },
  { once: true },
);
