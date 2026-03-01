// three_bg.js
// Procedural Three.js background inspired by heavenly clouds, sunbursts, and stars.

const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;

// Renderer setup
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// Warm gradient background color, deep space blue at top, warm glow at bottom
scene.background = new THREE.Color(0x1a2a44);

// Textures
const textureLoader = new THREE.TextureLoader();
// We'll use procedural generation since we don't have exact cloud textures handy
// but we can generate a simple radial gradient for sparks and sunbursts

const createParticleTexture = () => {
    const memCanvas = document.createElement('canvas');
    memCanvas.width = 64;
    memCanvas.height = 64;
    const ctx = memCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.2, 'rgba(255,230,150,0.8)');
    grad.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(memCanvas);
};

const particleTexture = createParticleTexture();

// --- 1. The Sunburst / Central Light ---
// A large plane with the glowing gradient
const sunburstGeometry = new THREE.PlaneGeometry(80, 80);
const sunburstMaterial = new THREE.MeshBasicMaterial({
    map: particleTexture,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const sunburst = new THREE.Mesh(sunburstGeometry, sunburstMaterial);
sunburst.position.set(0, 5, -30);
scene.add(sunburst);

// --- 2. Stars and Sparks ---
const starsGeometry = new THREE.BufferGeometry();
const starsCount = 2000;
const posArray = new Float32Array(starsCount * 3);
const colorArray = new Float32Array(starsCount * 3);
const sizeArray = new Float32Array(starsCount);

for (let i = 0; i < starsCount * 3; i += 3) {
    // Distribute across a wide area back in z
    posArray[i] = (Math.random() - 0.5) * 200; // x
    posArray[i + 1] = (Math.random() - 0.5) * 100 + 10; // y (biased upwards)
    posArray[i + 2] = (Math.random() - 0.5) * 50 - 40; // z

    // Mix of cool white and warm gold stars
    const isGold = Math.random() > 0.5;
    colorArray[i] = isGold ? 1.0 : 0.8; // r
    colorArray[i + 1] = isGold ? 0.8 : 0.9; // g
    colorArray[i + 2] = isGold ? 0.5 : 1.0; // b

    sizeArray[i / 3] = Math.random() * 0.5 + 0.1;
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
starsGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));

// Custom Shader Material for stars so we can twinkle them
const starsMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        pointTexture: { value: particleTexture }
    },
    vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying vec2 vUv;
        uniform float time;
        void main() {
            vColor = color;
            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            
            // Twinkle effect based on position and time
            float twinkle = sin(time * 2.0 + position.x * 10.0 + position.y * 10.0) * 0.5 + 0.5;
            gl_PointSize = size * (100.0 / -mvPosition.z) * (0.5 + twinkle * 0.5);
            
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        varying vec2 vUv;
        void main() {
            vec4 texColor = texture2D(pointTexture, gl_PointCoord);
            if(texColor.a < 0.1) discard;
            gl_FragColor = vec4(vColor, 1.0) * texColor;
        }
    `,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    vertexColors: true
});

const starsMesh = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starsMesh);

// --- 3. Dynamic Clouds ---
// We'll create some fluffy cloud clumps using groups of softly lit spheres or planes
const cloudGroup = new THREE.Group();
const cloudCount = 15;
const cloudGeo = new THREE.PlaneGeometry(30, 30);

// We'll use a procedural soft texture for the clouds as well
const createCloudTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.4)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(64, 64, 64, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
};
const cloudTex = createCloudTexture();

const cloudMats = [
    new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0.1, color: 0x88bbff, depthWrite: false }), // Blueish block
    new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0.15, color: 0xffddaa, depthWrite: false, blending: THREE.AdditiveBlending }) // Golden warm highlights
];

for (let i = 0; i < cloudCount; i++) {
    const isWarm = Math.random() > 0.5;
    const cloud = new THREE.Mesh(cloudGeo, cloudMats[isWarm ? 1 : 0]);
    // Distribute mainly on the bottom and sides
    cloud.position.x = (Math.random() - 0.5) * 80;
    cloud.position.y = (Math.random() - 0.5) * 40 - 10;
    cloud.position.z = (Math.random() - 0.5) * 20 - 10;
    cloud.rotation.z = Math.random() * Math.PI;
    const scale = Math.random() * 1.5 + 0.5;
    cloud.scale.set(scale, scale, scale);
    cloudGroup.add(cloud);
}
scene.add(cloudGroup);

// --- 4. Stone Platforms (Left and Right edges) ---
// Simple 3D boxes to represent the stone steps
const boxGeo = new THREE.BoxGeometry(6, 1.5, 6);
const boxMat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    roughness: 0.8,
    metalness: 0.1
});

const leftPlatform = new THREE.Mesh(boxGeo, boxMat);
leftPlatform.position.set(-25, -15, 5);
leftPlatform.rotation.y = Math.PI / 4;
leftPlatform.rotation.z = 0.1;
scene.add(leftPlatform);

const rightPlatform = new THREE.Mesh(boxGeo, boxMat);
rightPlatform.position.set(25, -12, 2);
rightPlatform.rotation.y = -Math.PI / 6;
rightPlatform.rotation.z = -0.1;
scene.add(rightPlatform);


// --- Lighting ---
// Ambient light
const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Soft white light
scene.add(ambientLight);

// Directional light from the "Sunburst"
const dirLight = new THREE.DirectionalLight(0xffeedd, 2);
dirLight.position.set(0, 10, -20);
scene.add(dirLight);

// Side fill lights
const sideLight1 = new THREE.PointLight(0x88bbff, 1.5, 50);
sideLight1.position.set(-20, 0, 10);
scene.add(sideLight1);


// --- Animation Loop ---
let time = 0;
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    time += delta;

    // Slowly rotate sunburst
    sunburst.rotation.z += 0.05 * delta;

    // Slowly drift clouds
    cloudGroup.children.forEach((c, i) => {
        c.position.x += 0.2 * delta;
        if (c.position.x > 50) c.position.x = -50;
        c.rotation.z += (i % 2 === 0 ? 1 : -1) * 0.02 * delta;
    });

    // Update star uniforms for twinkling
    starsMaterial.uniforms.time.value = time;

    // Slowly orbit the camera very slightly for ambient motion
    // (We removed mouse cursor movement, so this gives it life)
    camera.position.x = Math.sin(time * 0.1) * 2;
    camera.position.y = Math.cos(time * 0.1) * 1;
    camera.lookAt(0, 0, -20);

    renderer.render(scene, camera);
}

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start loop
animate();
