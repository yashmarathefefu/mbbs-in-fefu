// ============================================
// Interactive COBE Globe — ES Module
// FEFU Contact section background
// ============================================

import createGlobe from 'https://cdn.jsdelivr.net/npm/cobe@0.6.5/+esm';

function initGlobe() {
    const canvas = document.getElementById('globe-canvas');
    if (!canvas) return;

    let isMobile = window.innerWidth < 768;
    const lowEndDevice = isMobile && (
        (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
        ((navigator.connection || {}).saveData === true)
    );

    if (lowEndDevice) {
        document.documentElement.classList.add('low-end-device');
    }

    let phi = 0;
    let width = 0;
    let pointerInteracting = null;
    let pointerMovement = 0;
    let currentR = 0;
    let globe = null; // Hoist globe variable here
    let currentDpr = isMobile ? 1 : Math.min(window.devicePixelRatio, 2);
    let resizeFrame = null;

    function onResize(force) {
        const isMobileNow = window.innerWidth < 768;
        const dprNow = isMobileNow ? 1 : Math.min(window.devicePixelRatio, 2);
        const nextWidth = canvas.clientWidth || 800;

        if (!force && nextWidth === width && dprNow === currentDpr && isMobileNow === isMobile) {
            return;
        }

        // Use the canvas's CSS-defined size (set in styles.css per breakpoint)
        width = nextWidth;
        currentDpr = dprNow;
        isMobile = isMobileNow;

        // Update canvas DOM attributes for responsive sizing
        canvas.width = width * currentDpr;
        canvas.height = width * currentDpr;

        // Update the globe if it exists
        if (globe) {
            globe.width = width * currentDpr;
            globe.height = width * currentDpr;
        }
    }

    function scheduleResize() {
        if (resizeFrame !== null) {
            return;
        }

        resizeFrame = window.requestAnimationFrame(() => {
            resizeFrame = null;
            onResize(false);
        });
    }

    // Update size on custom slider change
    window.addEventListener('globe-settings-changed', () => onResize(true));

    window.addEventListener('resize', scheduleResize, { passive: true });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', scheduleResize, { passive: true });
    }
    onResize(true);

    globe = createGlobe(canvas, {
        width: width * currentDpr,
        height: width * currentDpr,
        devicePixelRatio: currentDpr,
        phi: 0,
        theta: 0.25,
        dark: 1,
        diffuse: 1.0,
        mapSamples: lowEndDevice ? 6000 : (isMobile ? 10000 : 16000),
        mapBrightness: 9.0,                // Maximum visibility for continental dots
        baseColor: [0.22, 0.22, 0.22],     // Clean dark land dots
        glowColor: [0.05, 0.05, 0.05],     // Pure neutral dark glow
        markers: [
            { location: [28.6139, 77.2090], size: 0.05 }, // New Delhi, India
            { location: [43.1198, 131.8869], size: 0.06 } // Vladivostok, Russia (FEFU)
        ],
        markerColor: [0.1, 0.8, 0.9],      // Bright cyan markers mimicking the screenshot
        onRender: function (state) {
            // Use custom global speed if available, otherwise fallback to 0.003
            const speed = window.globeSettings ? window.globeSettings.speed : (lowEndDevice ? 0.0018 : 0.003);
            // Center the globe initially on Asia/Russia (India + Vladivostok)
            if (phi === 0) phi = 4.2;
            if (pointerInteracting === null) phi += speed;
            state.phi = phi + currentR;
            state.width = width * currentDpr;
            state.height = width * currentDpr;

            // Dynamic theme support for white/black globe
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            if (isLight) {
                state.dark = 0;                        // Light globe mode
                state.baseColor = [0.25, 0.35, 0.65];  // Darker, rich blue dots for full opacity feel
                state.glowColor = [0.95, 0.95, 1.0];   // Very subtle glow so the sphere doesn't wash out the dots
                state.diffuse = 1.0;                   // Less diffuse to make dots sharper
                state.mapBrightness = 30;              // Boost dot opacity/sharpness
                state.markers = [];                    // Hide markers
            } else {
                state.dark = 1;                        // Enable dark globe mode
                state.baseColor = [0.15, 0.15, 0.15];  // Dark grey base dots
                state.glowColor = [0.03, 0.03, 0.03];  // Almost no glow, very dark border
                state.diffuse = 0.5;
                state.mapBrightness = 25;              // Brightness balance
                state.markers = [                      // Show FEFU markers
                    { location: [28.6139, 77.2090], size: 0.05 }, // New Delhi, India
                    { location: [43.1198, 131.8869], size: 0.06 } // Vladivostok, Russia (FEFU)
                ];
            }
        }
    });

    setTimeout(() => { canvas.style.opacity = '1'; }, 100);

    // Drag-to-rotate interaction
    if (lowEndDevice) {
        canvas.style.pointerEvents = 'none';
    }

    canvas.addEventListener('pointerdown', (e) => {
        if (lowEndDevice) return;
        pointerInteracting = e.clientX - pointerMovement;
        canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('pointerup', () => {
        if (lowEndDevice) return;
        pointerInteracting = null;
        canvas.style.cursor = 'grab';
    });
    canvas.addEventListener('pointerout', () => {
        if (lowEndDevice) return;
        pointerInteracting = null;
        canvas.style.cursor = 'grab';
    });
    canvas.addEventListener('mousemove', (e) => {
        if (lowEndDevice) return;
        if (pointerInteracting !== null) {
            const delta = e.clientX - pointerInteracting;
            pointerMovement = delta;
            currentR = delta / 200;
        }
    });
    canvas.addEventListener('touchmove', (e) => {
        if (lowEndDevice) return;
        if (e.touches && e.touches[0] && pointerInteracting !== null) {
            const delta = e.touches[0].clientX - pointerInteracting;
            pointerMovement = delta;
            currentR = delta / 200;
        }
    }, { passive: true });
}

// Initialize the globe as soon as the DOM is ready since it's now in the Hero section
document.addEventListener('DOMContentLoaded', initGlobe);
