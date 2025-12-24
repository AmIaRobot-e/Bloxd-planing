let scene, camera, renderer, controls;
let gridHelper, rollOverMesh, rollOverMaterial;
let cubeGeo, cubeMaterial;
let objects = [];
let raycaster, mouse = new THREE.Vector2();
let currentBlock = "Maple Wood Planks";
let currentLayer = 32;

const blocks = [
    "Maple Log", "Maple Wood Planks", "Stone", "Messy Stone", "Dirt", "Grass Block", 
    "Pine Log", "Pine Wood Planks", "Oak Log", "Oak Wood Planks"
];

init();
render();

function init() {
    // Scene & Camera
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0f1a);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(500, 800, 1300);
    camera.lookAt(0, 0, 0);

    // Roll-over helper (the ghost block)
    cubeGeo = new THREE.BoxGeometry(50, 50, 50);
    rollOverMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.5, transparent: true });
    rollOverMesh = new THREE.Mesh(cubeGeo, rollOverMaterial);
    scene.add(rollOverMesh);

    // Grid
    gridHelper = new THREE.GridHelper(1600, 32, 0x444444, 0x222222);
    gridHelper.position.y = -25; // Align to bottom of first block layer
    scene.add(gridHelper);

    raycaster = new THREE.Raycaster();

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth - 280, window.innerHeight - 60);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x606060);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1, 0.75, 0.5).normalize();
    scene.add(directionalLight);

    // Events
    document.addEventListener('mousemove', onDocumentMouseMove);
    document.addEventListener('mousedown', onDocumentMouseDown);
    window.addEventListener('resize', onWindowResize);

    // UI Initialization
    setupUI();
}

function setupUI() {
    const blockList = document.getElementById('block-list');
    blocks.forEach(name => {
        const div = document.createElement('div');
        div.className = `block-item ${name === currentBlock ? 'active' : ''}`;
        div.title = name;
        
        // Use the texture path provided by user
        const img = document.createElement('img');
        img.src = `textures/${name.replace(/ /g, '_')}_texture.png`;
        img.onerror = () => { img.src = 'https://via.placeholder.com/50?text=B'; };
        
        div.appendChild(img);
        div.onclick = () => {
            document.querySelectorAll('.block-item').forEach(el => el.classList.remove('active'));
            div.classList.add('active');
            currentBlock = name;
        };
        blockList.appendChild(div);
    });

    const slider = document.getElementById('layer-slider');
    const layerVal = document.getElementById('layer-val');
    
    const updateLayer = (val) => {
        currentLayer = parseInt(val);
        slider.value = currentLayer;
        layerVal.innerText = currentLayer;
        updateVisibility();
    };

    slider.oninput = (e) => updateLayer(e.target.value);
    document.getElementById('layer-plus').onclick = () => updateLayer(Math.min(32, currentLayer + 1));
    document.getElementById('layer-minus').onclick = () => updateLayer(Math.max(0, currentLayer - 1));

    document.getElementById('export-btn').onclick = exportToBloxd;
    document.getElementById('clear-btn').onclick = () => {
        objects.forEach(obj => scene.remove(obj));
        objects = [];
        render();
    };
}

function updateVisibility() {
    objects.forEach(obj => {
        const y = (obj.position.y + 25) / 50;
        obj.visible = y < currentLayer;
    });
    render();
}

function onWindowResize() {
    camera.aspect = (window.innerWidth - 280) / (window.innerHeight - 60);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth - 280, window.innerHeight - 60);
}

function onDocumentMouseMove(event) {
    event.preventDefault();
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([gridHelper, ...objects]);
    if (intersects.length > 0) {
        const intersect = intersects[0];
        rollOverMesh.position.copy(intersect.point).add(intersect.face.normal);
        rollOverMesh.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
        // Ensure ghost block is at least at floor level
        if (rollOverMesh.position.y < 25) rollOverMesh.position.y = 25;
    }
    render();
}

function onDocumentMouseDown(event) {
    event.preventDefault();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([gridHelper, ...objects]);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        // Left click to place
        if (event.button === 0) {
            const loader = new THREE.TextureLoader();
            const texture = loader.load(`textures/${currentBlock.replace(/ /g, '_')}_texture.png`, render);
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            
            const material = new THREE.MeshLambertMaterial({ map: texture });
            const voxel = new THREE.Mesh(cubeGeo, material);
            voxel.position.copy(intersect.point).add(intersect.face.normal);
            voxel.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
            
            if (voxel.position.y < 25) voxel.position.y = 25;
            
            voxel.userData = { blockName: currentBlock };
            scene.add(voxel);
            objects.push(voxel);
        } 
        // Right click to remove
        else if (event.button === 2) {
            if (intersect.object !== gridHelper) {
                scene.remove(intersect.object);
                objects.splice(objects.indexOf(intersect.object), 1);
            }
        }
    }
    render();
}

function render() {
    renderer.render(scene, camera);
}

function exportToBloxd() {
    if (objects.length === 0) {
        alert("Build something first!");
        return;
    }

    // Find bounds
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    objects.forEach(obj => {
        const p = obj.position;
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); minZ = Math.min(minZ, p.z);
        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); maxZ = Math.max(maxZ, p.z);
    });

    // Normalize to 0,0,0 at the floor corner
    const sizeX = (maxX - minX) / 50 + 1;
    const sizeY = (maxY - 25) / 50 + 1; // From floor
    const sizeZ = (maxZ - minZ) / 50 + 1;

    const bloxdJson = {
        name: "My Blueprint",
        pos: [0, 0, 0],
        size: [sizeX, sizeY, sizeZ],
        chunks: []
    };

    // For simplicity in v1, we'll put everything in one chunk if possible
    // or use your existing bloxd.js logic to split it.
    // This is where we'd call your writeBloxdschem function.
    
    alert("Exporting " + objects.length + " blocks to .bloxdschem...");
    // Implementation of actual binary write would go here using your bloxd.js
}
