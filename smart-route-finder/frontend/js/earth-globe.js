/**
 * 3D Earth globe — same visualization as index.html hero map-box.
 * Call initEarthGlobe(mapBoxId, canvasContainerId) after THREE.js is loaded.
 */
function initEarthGlobe(mapBoxId, canvasContainerId) {
    const earthWrapper = document.getElementById(canvasContainerId);
    const mapBox = document.getElementById(mapBoxId);
    if (!earthWrapper || !mapBox || typeof THREE === 'undefined') return null;

    const scene = new THREE.Scene();
    let w = mapBox.clientWidth;
    let h = mapBox.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.z = 210;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    earthWrapper.appendChild(renderer.domElement);

    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    const radius = 62;
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
    const specularMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg');

    const earthMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        specularMap: specularMap,
        specular: new THREE.Color(0xff6a00),
        shininess: 15,
        bumpScale: 0.15,
    });

    const earthMesh = new THREE.Mesh(geometry, earthMaterial);
    earthGroup.add(earthMesh);

    const cloudGeometry = new THREE.SphereGeometry(radius + 1.0, 64, 64);
    const cloudTexture = textureLoader.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png');
    const cloudMaterial = new THREE.MeshPhongMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
    });
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    earthGroup.add(cloudMesh);

    const satellites = [];
    const createSatellite = (orbitRadius, speed, colorHex, size) => {
        const satGroup = new THREE.Group();
        const satGeo = new THREE.SphereGeometry(size, 8, 8);
        const satMat = new THREE.MeshBasicMaterial({ color: colorHex });
        const satMesh = new THREE.Mesh(satGeo, satMat);
        satMesh.position.x = orbitRadius;
        satGroup.add(satMesh);

        const trailGeo = new THREE.BufferGeometry();
        const points = [];
        for (let i = 0; i <= 64; i++) {
            const theta = (i / 64) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius));
        }
        trailGeo.setFromPoints(points);
        const trailMat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.15 });
        satGroup.add(new THREE.Line(trailGeo, trailMat));

        satGroup.rotation.x = Math.random() * Math.PI;
        satGroup.rotation.z = Math.random() * Math.PI;
        earthGroup.add(satGroup);
        satellites.push({ group: satGroup, speed });
    };

    createSatellite(radius + 12, 0.02, 0x00b4d8, 1.2);
    createSatellite(radius + 18, 0.015, 0xff6a00, 1.5);
    createSatellite(radius + 24, 0.01, 0x00f5d4, 1.0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
    sunLight.position.set(100, 80, 120);
    scene.add(sunLight);
    const themeNeonLight = new THREE.DirectionalLight(0xff6a00, 1.5);
    themeNeonLight.position.set(-100, -40, -40);
    scene.add(themeNeonLight);

    let targetX = 0;
    let targetY = 0;
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (event) => {
        mouseX = event.clientX - window.innerWidth / 2;
        mouseY = event.clientY - window.innerHeight / 2;
    });

    const onResize = () => {
        w = mapBox.clientWidth;
        h = mapBox.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const animateEarth = () => {
        requestAnimationFrame(animateEarth);
        earthMesh.rotation.y += 0.0015;
        cloudMesh.rotation.y += 0.0018;
        satellites.forEach((sat) => {
            sat.group.rotation.y += sat.speed;
        });
        targetX = mouseX * 0.0005;
        targetY = mouseY * 0.0004;
        earthGroup.rotation.y += 0.05 * (targetX - earthGroup.rotation.y);
        earthGroup.rotation.x += 0.05 * (targetY - earthGroup.rotation.x);
        renderer.render(scene, camera);
    };
    animateEarth();

    return { renderer, onResize };
}
