
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const container = document.getElementById('tree-container');
const previewHack = document.getElementById('previewHack');

if (container) {
    const leavesVS = /*glsl*/`
        uniform sampler2D uNoiseMap;
        uniform vec3 uBoxMin, uBoxSize, uRaycast;
        uniform float uTime;
        varying vec3 vObjectPos, vNormal, vWorldNormal, vWorldPos; 
        varying float vCloseToGround;
        
        vec4 getTriplanar(sampler2D tex){
            vec4 xPixel = texture(tex, (vObjectPos.xy + uTime) / 3.);
            vec4 yPixel = texture(tex, (vObjectPos.yz + uTime) / 3.);
            vec4 zPixel = texture(tex, (vObjectPos.zx + uTime) / 3.);
            vec4 combined = (xPixel + yPixel + zPixel) / 6.0;
            combined.xyz = combined.xyz * vObjectPos; 
            return combined;
        }
        
        void main() {
            vWorldPos = (modelMatrix * instanceMatrix * vec4(position, 1.)).xyz; 
            vCloseToGround = smoothstep(2.5, .0, distance(vec3(0.), vWorldPos));
            
            mat4 mouseDisplace = mat4(1.0);
            float offset = clamp(0.8 - distance(uRaycast, instanceMatrix[3].xyz), 0., 999.); 
            // Original hover math (0.8 power, / 2.0) - globally applied to leaves
            offset = (pow(offset, 0.8) / 2.0); 
            mouseDisplace[3].xyz = vec3(offset);
            
            vNormal = normalMatrix * mat3(instanceMatrix) * mat3(mouseDisplace) * normalize(normal); 
            vWorldNormal = vec3(modelMatrix * instanceMatrix * mouseDisplace * vec4(normal, 0.));
            vObjectPos = ((vWorldPos - uBoxMin) * 2.) / uBoxSize - vec3(1.0); 
            
            // Ground liquid effect
            vec4 noiseOffset = getTriplanar(uNoiseMap) * vCloseToGround; 
            vec4 newPos = instanceMatrix * mouseDisplace * vec4(position, 1.); 
            newPos.xyz = newPos.xyz + noiseOffset.xyz;
            gl_Position =  projectionMatrix * modelViewMatrix * newPos;
        }
    `
    const leavesFS = /*glsl*/`
        #include <common> 
        #include <lights_pars_begin>
        precision mediump float;
        uniform vec3 uColorA, uColorB, uColorC;
        uniform float uTime;
        varying vec3 vObjectPos, vNormal, vWorldNormal, vWorldPos; 
        varying float vCloseToGround;
        
        vec3 mix3 (vec3 v1, vec3 v2, vec3 v3, float fa){
            vec3 m; 
            fa > 0.7 ? m = mix(v2, v3, (fa - .5) * 2.) : m = mix(v1, v2, fa * 2.);
            return m;
        }

        float getPosColors(){
            float p = 0.;
            p = smoothstep(0.2, 0.8, distance(vec3(0.), vObjectPos));
            p = p * (-(vWorldNormal.g / 2.) + 0.5) * (- vObjectPos.y / 9. + 0.5); 
            return p;
        }
        float getDiffuse(){
            float intensity = 0.0;
            for (int i = 0; i < directionalLights.length(); i++){
                intensity += dot(directionalLights[i].direction, vNormal);
            }
            intensity = smoothstep(0.55, 1.0, intensity) * 0.2 
                        + pow(smoothstep(0.55, 1.0, intensity), 0.5);
            return intensity;
        }

        void main(){
            // Restored original leaf color calculation
            float gradMap = (getPosColors() + getDiffuse()) / 2.0;
            vec4 c = vec4(mix3(uColorA, uColorB, uColorC, gradMap), 1.0);
            gl_FragColor = vec4(pow(c.xyz,vec3(0.454545)), c.w);
        }
    `

    // GENERAL DEFINITIONS
    const scene = new THREE.Scene();

    // Set transparent background for integration with site theme
    const loader = new GLTFLoader();

    // Adjust camera for container aspect ratio
    const width = container.clientWidth;
    const height = container.clientHeight || 400; // Default height if not set yet

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.001, 1000);

    // Check WebGL support before proceeding
    // Check WebGL support before proceeding
    let renderer;

    // OPTIMIZATION: Detect Mobile/Tablet
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 992;

    try {
        renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: !isMobile, // Disable AA on mobile
            powerPreference: "high-performance",
            precision: isMobile ? "mediump" : "highp"
        });
    } catch (e) {
        console.warn("Tree 3D: WebGL not available, skipping 3D tree.", e);
        renderer = null;
    }

    // Only proceed with 3D tree if WebGL is available
    if (renderer) {
        // OPTIMIZATION: Cap pixel ratio aggressively on mobile
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

        const controls = new OrbitControls(camera, renderer.domElement);
        const dummy = new THREE.Object3D();
        const matrix = new THREE.Matrix4();
        const pointer = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();
        const dlight01 = new THREE.DirectionalLight(0xfff5cc, 2.2); // Warm golden sunlight
        const dlight02 = new THREE.DirectionalLight(0x000000, 0.0); // Dummy light to fix WebGL 1-iteration loop warning
        const tree = { group: new THREE.Group() };

        const noiseMap = new THREE.TextureLoader().load('./assets/noise.png');
        const poleTexture = new THREE.TextureLoader().load('./assets/texture.jpg');
        poleTexture.rotation = 100 * 0.01745329252;

        const rayPlane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 1, 1), undefined);

        // MATERIALS
        const leavesMat = new THREE.ShaderMaterial({
            lights: true,
            side: THREE.DoubleSide,
            uniforms: {
                ...THREE.UniformsLib.lights,
                uTime: { value: 0. },
                uColorA: { value: new THREE.Color(0x0d5e2b) }, // Deep emerald (shaded leaves)
                uColorB: { value: new THREE.Color(0x3da35d) }, // Rich leaf green (mid tones)
                uColorC: { value: new THREE.Color(0x96e072) }, // Bright spring green (sunlit)
                uBoxMin: { value: new THREE.Vector3(0, 0, 0) },
                uBoxSize: { value: new THREE.Vector3(10, 10, 10) },
                uRaycast: { value: new THREE.Vector3(0, 0, 0) },
                uNoiseMap: { value: noiseMap },
            },
            vertexShader: leavesVS,
            fragmentShader: leavesFS,
        })

        // LAZY LOADING VARIABLES
        let sceneInitialized = false;
        let isAnimating = false;

        // SCENE INIT FUNCTION
        function initScene() {
            if (sceneInitialized) return;
            sceneInitialized = true;

            container.appendChild(renderer.domElement);

            // Ensure dimensions are correct at init time
            const currentWidth = container.clientWidth;
            const currentHeight = container.clientHeight || 400;
            renderer.setSize(currentWidth, currentHeight);
            camera.aspect = currentWidth / currentHeight;
            camera.updateProjectionMatrix();

            dlight01.position.set(3, 6, -3);
            dlight01.lookAt(0, 2.4, 0);

            rayPlane.visible = false;

            camera.position.set(-7, 1, -12);
            controls.target = new THREE.Vector3(0, 2.4, 0);
            controls.maxPolarAngle = Math.PI * 0.5;
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;
            controls.autoRotate = true;
            controls.autoRotateSpeed = 1.5; // Gentle auto-rotation
            controls.enablePan = false;
            controls.enableZoom = false; // Disable zoom so user doesn't get lost or mess up page scroll
            // Enable ONE-finger touch rotation for mobile
            controls.touches = { ONE: THREE.TOUCH.ROTATE };

            scene.add(dlight01, dlight02, tree.group, rayPlane);

            noiseMap.wrapS = THREE.RepeatWrapping;
            noiseMap.wrapT = THREE.RepeatWrapping;

            // GLTF LOADING 
            loader.loadAsync("./assets/tree.glb")
                .then(obj => {
                    if (previewHack) previewHack.style.display = "none";

                    tree.pole = obj.scene.getObjectByName("Pole");
                    tree.pole.material = new THREE.MeshToonMaterial({
                        map: poleTexture,
                        bumpMap: poleTexture,
                        bumpScale: 0.05
                    });

                    // Each vertex of crown mesh will be a leaf
                    // Crown mesh won't be visible in scene
                    tree.crown = obj.scene.getObjectByName("Leaves");

                    // For object space shader
                    tree.bbox = new THREE.Box3().setFromObject(tree.crown);
                    leavesMat.uniforms.uBoxMin.value.copy(tree.bbox.min);
                    leavesMat.uniforms.uBoxSize.value.copy(tree.bbox.getSize(new THREE.Vector3()));

                    tree.leavesCount = tree.crown.geometry.attributes.position.count;
                    tree.whenDied = new Array(tree.leavesCount);
                    tree.deadID = [];
                    tree.leafGeometry = obj.scene.getObjectByName("Leaf").geometry;
                    tree.leaves = new THREE.InstancedMesh(tree.leafGeometry, leavesMat, tree.leavesCount);

                    for (let i = 0; i < tree.leavesCount; i++) {
                        dummy.position.x = tree.crown.geometry.attributes.position.array[i * 3];
                        dummy.position.y = tree.crown.geometry.attributes.position.array[i * 3 + 1];
                        dummy.position.z = tree.crown.geometry.attributes.position.array[i * 3 + 2];
                        dummy.lookAt(dummy.position.x + tree.crown.geometry.attributes.normal.array[i * 3],
                            dummy.position.y + tree.crown.geometry.attributes.normal.array[i * 3 + 1],
                            dummy.position.z + tree.crown.geometry.attributes.normal.array[i * 3 + 2]);
                        dummy.scale.x = (Math.random() * 0.2 + 0.8);
                        dummy.scale.y = (Math.random() * 0.2 + 0.8);
                        dummy.scale.z = (Math.random() * 0.2 + 0.8);
                        dummy.updateMatrix();
                        tree.leaves.setMatrixAt(i, dummy.matrix);
                    }

                    tree.group.add(tree.pole, tree.leaves);

                    for (let i = 0; i < 24; i++)
                        tree.deadID.push(Math.floor(Math.random() * tree.leavesCount));

                    // Start killing leaves loop
                    killRandom();
                })
                .catch(error => {
                    console.error("Failed to load 3D tree model:", error);
                    if (previewHack) {
                        previewHack.style.display = "block"; // Ensure fallback is visible
                        previewHack.innerHTML = '<div style="position:absolute;bottom:10px;left:0;right:0;text-align:center;color:white;font-size:12px;background:rgba(0,0,0,0.5)">3D Model Failed to Load</div>';
                    }
                });

            // EVENTS
            // Resize Handler (Window based - more stable than ResizeObserver)
            const handleResize = () => {
                if (!container) return;
                const w = container.clientWidth;
                const h = container.clientHeight;

                // Only update if dimensions exist
                if (w > 0 && h > 0) {
                    camera.aspect = w / h;
                    camera.updateProjectionMatrix();
                    // Pass false to updateStyle to prevent fighting with CSS
                    renderer.setSize(w, h, false);
                }
            };

            window.addEventListener('resize', handleResize);

            // Initial setup
            handleResize();

            // Mouse Move on Container (desktop)
            container.addEventListener("mousemove", (e) => pointerMove(e));

            // Touch Move on Container (mobile) - enables leaf interaction on phones
            container.addEventListener("touchmove", (e) => {
                if (e.touches.length === 1) {
                    pointerMove(e.touches[0]);
                }
            }, { passive: true });
        }


        // INTERSECTION OBSERVER
        // Wait for heavy loading event before starting to observe and load Tree assets
        let _treeObserverInit = false;
        window.addEventListener('start-heavy-loading', () => {
            if (_treeObserverInit) return;
            _treeObserverInit = true;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Element is visible
                        if (!sceneInitialized) {
                            initScene();
                        }
                        isAnimating = true;
                        animate();
                    } else {
                        // Element is not visible
                        isAnimating = false;
                    }
                });
            }, { rootMargin: "100px" }); // Start loading slightly before in viewport

            observer.observe(container);
        });


        // Animation Loop
        function animate() {
            if (!isAnimating) return; // Stop loop if not visible

            requestAnimationFrame(animate);
            leavesMat.uniforms.uTime.value += 0.01;

            if (tree.deadID) {
                tree.deadID = tree.deadID.map(i => {
                    tree.leaves.getMatrixAt(i, matrix);
                    matrix.decompose(dummy.position, dummy.rotation, dummy.scale);
                    if (dummy.position.y > 0) {
                        dummy.position.y -= 0.04;
                        dummy.position.x += Math.random() / 5 - 0.11;
                        dummy.position.z += Math.random() / 5 - 0.11;
                        dummy.rotation.x += 0.2;
                        dummy.updateMatrix();
                        tree.leaves.setMatrixAt(i, dummy.matrix);
                        return (i);
                    }
                })
                if (tree.leaves) tree.leaves.instanceMatrix.needsUpdate = true;
            }

            controls.update();
            renderer.render(scene, camera);
        }

        function killRandom() {
            if (!isAnimating) {
                // Check again in a bit if we paused
                setTimeout(killRandom, 1000);
                return;
            }

            if (tree.deadID)
                tree.deadID.push(Math.floor(Math.random() * tree.leavesCount));
            setTimeout(killRandom, Math.random() * 1500);
        }

        function pointerMove(e) {
            if (!tree.leaves) return; // Don't raycast if not loaded

            // Calculate pointer position in normalized device coordinates (-1 to +1) for both components
            const rect = container.getBoundingClientRect();
            pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1);

            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObjects([tree.leaves, rayPlane]);

            if (intersects[0]) {
                // for smooth transition between background and tree
                rayPlane.position.copy(intersects[0].point);
                rayPlane.position.multiplyScalar(0.9);
                rayPlane.lookAt(camera.position);
                leavesMat.uniforms.uRaycast.value = intersects[0].point;

                // Drop leaves on hover/touch — interactive feel for visitors
                if (intersects[0].instanceId !== undefined) {
                    tree.deadID.push(intersects[0].instanceId);
                    // Drop 2-3 nearby leaves for a satisfying burst effect
                    for (let k = 0; k < 2; k++) {
                        const nearbyLeaf = Math.floor(Math.random() * tree.leavesCount);
                        tree.deadID.push(nearbyLeaf);
                    }
                }
            }
        }
    } // end if (renderer)
}
