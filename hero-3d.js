
import * as THREE from "three";

/**
 * Hero3D - Animated background for the Hero section
 * Creates a premium, high-tech floating particle field with interactive waves
 */
class Hero3D {
    constructor() {
        this.container = document.getElementById('hero-particles');
        if (!this.container) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

        this.particles = null;
        this.geometry = null;
        this.material = null;
        this.count = 2000;

        this.mouse = new THREE.Vector2(0, 0);
        this.targetMouse = new THREE.Vector2(0, 0);

        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.z = 5;

        // Create Particles
        this.geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.count * 3);
        const colors = new Float32Array(this.count * 3);
        const scales = new Float32Array(this.count);

        const color1 = new THREE.Color("#a78bfa"); // Primary
        const color2 = new THREE.Color("#e879f9"); // Accent

        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            // Spread in a wide area
            positions[i3] = (Math.random() - 0.5) * 15;
            positions[i3 + 1] = (Math.random() - 0.5) * 10;
            positions[i3 + 2] = (Math.random() - 0.5) * 10;

            const mixedColor = color1.clone().lerp(color2, Math.random());
            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;

            scales[i] = Math.random();
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

        this.material = new THREE.PointsMaterial({
            size: 0.05,
            sizeAttenuation: true,
            transparent: true,
            alphaMap: this.createCircleTexture(),
            depthWrite: false,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.particles);

        // Responsive
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));

        this.animate();
    }

    createCircleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(e) {
        this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.0005;

        // Smooth mouse move
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

        // Animate particles
        const positions = this.geometry.attributes.position.array;
        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            // Gentle wave motion
            positions[i3 + 1] += Math.sin(time + positions[i3]) * 0.002;
            positions[i3] += Math.cos(time + positions[i3 + 1]) * 0.001;

            // Mouse proximity repulsion
            const dx = positions[i3] - this.mouse.x * 5;
            const dy = positions[i3 + 1] - this.mouse.y * 3;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 2) {
                positions[i3] += dx * 0.01;
                positions[i3 + 1] += dy * 0.01;
            }
        }
        this.geometry.attributes.position.needsUpdate = true;

        // Rotate group slightly
        this.particles.rotation.y = time * 0.1;

        this.renderer.render(this.scene, this.camera);
    }
}

// Global initialization
let _hero3DInitialized = false;
window.addEventListener('start-heavy-loading', () => {
    if (_hero3DInitialized) return;
    _hero3DInitialized = true;
    new Hero3D();
});
