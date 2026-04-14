// ========================================
// SHADER LOADING ANIMATION
// Mobile-Optimized Pure WebGL Shader Animation
// Zero external dependencies (No Three.js needed)
// ========================================

const CONFIG = {
    DISPLAY_DURATION: 2200, // Restored back to 2.2 seconds
    FADE_DURATION: 400,     // 400ms graceful fade out to match CSS
    MOBILE_PIXEL_RATIO_CAP: 1.5
};

function isMobile() {
    return window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function initRawWebGLShader() {
    const container = document.getElementById('shader-loader-canvas');
    if (!container) return null;

    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl', { alpha: false, antialias: !isMobile() }) ||
        canvas.getContext('experimental-webgl', { alpha: false, antialias: !isMobile() });

    if (!gl) {
        console.warn('WebGL not supported, skipping shader loader');
        const overlay = document.getElementById('shader-loader');
        if (overlay) overlay.style.display = 'none';
        return null;
    }

    const vertexShaderSrc = `
        attribute vec2 position;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    const fragmentShaderSrc = `
        precision highp float;
        uniform vec2 resolution;
        uniform float time;

        void main(void) {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
            float t = time * 0.08;
            float lineWidth = 0.002;

            vec3 color = vec3(0.0);
            for(int j = 0; j < 3; j++){
                for(int i = 0; i < 5; i++){
                    color[j] += lineWidth * float(i * i) / abs(fract(t - 0.01 * float(j) + float(i) * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2));
                }
            }
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return null;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        -1.0, 1.0,
        1.0, -1.0,
        1.0, 1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, "resolution");
    const timeLocation = gl.getUniformLocation(program, "time");

    function onResize() {
        const pixelRatio = isMobile() ? Math.min(window.devicePixelRatio, CONFIG.MOBILE_PIXEL_RATIO_CAP) : window.devicePixelRatio;
        const width = container.clientWidth;
        const height = container.clientHeight;

        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    }

    window.addEventListener('resize', onResize);
    onResize();

    let animationId;
    let startTime = performance.now();

    function animate(now) {
        animationId = requestAnimationFrame(animate);
        const elapsed = (now - startTime) / 1000;
        gl.uniform1f(timeLocation, elapsed * 2.5); // Make shader animation smooth and slightly faster
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // Start animation loop
    requestAnimationFrame(animate);

    return {
        cleanup: function () {
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(animationId);
            gl.deleteProgram(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteBuffer(positionBuffer);
            if (canvas && canvas.parentNode === container) {
                container.removeChild(canvas);
            }
        },
        pause: function () {
            cancelAnimationFrame(animationId);
        }
    };
}

// Main loader logic
function startLoader() {
    const loaderOverlay = document.getElementById('shader-loader');
    if (!loaderOverlay) return;

    // Remove any previous scroll lock immediately to ensure scrolling works
    document.body.style.overflow = 'hidden';

    // PERFORMANCE OPTIMIZATION: Session Storage Check
    const hasSeenLoader = sessionStorage.getItem('fefu_loader_seen') === 'true';
    if (!hasSeenLoader) {
        sessionStorage.setItem('fefu_loader_seen', 'true');
    }

    // If completely bypassing, or if it's a mobile device (where we want to skip it), don't even init the shader or fade.
    if (hasSeenLoader || isMobile()) {
        loaderOverlay.remove();
        document.body.style.overflow = 'auto';
        document.body.style.overflowX = 'hidden';
        window.dispatchEvent(new Event('start-heavy-loading'));
        document.dispatchEvent(new Event('loader-finished'));
        return; // Exit immediately
    }

    // Initialize raw webgl shader animation ONLY for new visitors
    const shaderControls = initRawWebGLShader();

    let isLoaderDismissed = false;
    function dismissLoader() {
        if (isLoaderDismissed) return;
        isLoaderDismissed = true;

        loaderOverlay.classList.add('fade-out');

        setTimeout(() => {
            if (shaderControls && shaderControls.cleanup) shaderControls.cleanup();
            loaderOverlay.remove();

            // Dispatch event so other components know they can start heavy ops ONLY once fade is done.
            window.dispatchEvent(new Event('start-heavy-loading'));

            // Re-enable scrolling explicitly
            document.body.style.overflow = 'auto';
            document.body.style.overflowX = 'hidden'; // Keep horizontal scroll clean

            // Explicitly trigger opening animations of hero components
            document.dispatchEvent(new Event('loader-finished'));

        }, CONFIG.FADE_DURATION);
    }
    // Ensure a minimum display time of 2s for aesthetics, but wait for fonts to load to prevent FOUT.
    const startTime = Date.now();
    let hasDismissed = false;

    const tryDismiss = () => {
        if (hasDismissed) return;
        const elapsed = Date.now() - startTime;
        const timeRemaining = Math.max(0, CONFIG.DISPLAY_DURATION - elapsed);

        setTimeout(() => {
            if (!hasDismissed) {
                hasDismissed = true;
                dismissLoader();
            }
        }, timeRemaining);
    };

    // 1. Wait for custom web fonts to be completely ready
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(tryDismiss).catch(tryDismiss);
    } else {
        // Fallback if fonts API is unavailable
        window.addEventListener('load', tryDismiss);
    }

    // 2. Absolute hard-stop fallback of 4 seconds if fonts hang or network is terrible
    setTimeout(() => {
        if (!hasDismissed && document.getElementById('shader-loader')) {
            hasDismissed = true;
            dismissLoader();
        }
    }, 4000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startLoader);
} else {
    startLoader();
}
