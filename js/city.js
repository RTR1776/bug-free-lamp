// City Generation Module
import { WORLD_SIZE, BUILDING_COUNT } from './main.js';

// Building types with their generation parameters
const BuildingTypes = {
    SKYSCRAPER: {
        minWidth: 15,
        maxWidth: 35,
        minHeight: 80,
        maxHeight: 180,
        minDepth: 15,
        maxDepth: 35,
        color: 0x2244aa,
        emissive: 0x001133,
        weight: 0.25
    },
    OFFICE: {
        minWidth: 20,
        maxWidth: 40,
        minHeight: 40,
        maxHeight: 80,
        minDepth: 20,
        maxDepth: 40,
        color: 0x335588,
        emissive: 0x001122,
        weight: 0.25
    },
    BALLPARK: {
        radius: 50,
        height: 20,
        color: 0x227744,
        emissive: 0x002211,
        weight: 0.05
    },
    SCHOOL: {
        width: 40,
        height: 15,
        depth: 60,
        color: 0x884422,
        emissive: 0x221100,
        weight: 0.1
    },
    HOUSE: {
        minWidth: 8,
        maxWidth: 12,
        height: 8,
        minDepth: 8,
        maxDepth: 12,
        roofHeight: 4,
        color: 0x665544,
        roofColor: 0x442222,
        weight: 0.35
    }
};

export class CityGenerator {
    constructor(scene) {
        this.scene = scene;
        this.buildings = [];
        this.buildingMeshes = new THREE.Group();
        this.scene.add(this.buildingMeshes);
        
        // Create textures
        this.textures = this.createTextures();
        
        // Create ground
        this.createGround();
    }
    
    createTextures() {
        const textures = {};
        
        // Window grid texture for buildings
        textures.windows = this.createWindowTexture();
        textures.windowsLit = this.createWindowTexture(true);
        textures.concrete = this.createConcreteTexture();
        textures.grass = this.createGrassTexture();
        textures.roof = this.createRoofTexture();
        
        return textures;
    }
    
    createWindowTexture(lit = false) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Building wall base - darker with more variation
        const baseGray = 20 + Math.random() * 15;
        ctx.fillStyle = `rgb(${baseGray}, ${baseGray + 5}, ${baseGray + 10})`;
        ctx.fillRect(0, 0, 128, 256);
        
        // Add some wall texture/noise
        for (let i = 0; i < 800; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 256;
            const gray = baseGray - 5 + Math.random() * 10;
            ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, 0.5)`;
            ctx.fillRect(x, y, 1 + Math.random(), 1 + Math.random());
        }
        
        // Window grid with more detail
        const windowWidth = 10;
        const windowHeight = 14;
        const spacingX = 14;
        const spacingY = 18;
        
        for (let y = 8; y < 256; y += spacingY) {
            for (let x = 6; x < 128; x += spacingX) {
                // Window frame
                ctx.fillStyle = '#151520';
                ctx.fillRect(x - 1, y - 1, windowWidth + 2, windowHeight + 2);
                
                // Some windows are lit with varying colors
                const isLit = lit && Math.random() > 0.35;
                if (isLit) {
                    const warmth = Math.random();
                    if (warmth > 0.7) {
                        ctx.fillStyle = '#ffeeaa'; // Warm yellow
                    } else if (warmth > 0.4) {
                        ctx.fillStyle = '#aaddff'; // Cool blue (TV/monitor)
                    } else {
                        ctx.fillStyle = '#ffeedd'; // Soft white
                    }
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.shadowBlur = 3;
                    
                    // Interior glow gradient
                    const gradient = ctx.createLinearGradient(x, y, x, y + windowHeight);
                    gradient.addColorStop(0, ctx.fillStyle);
                    gradient.addColorStop(1, '#ffe8aa');
                    ctx.fillStyle = gradient;
                } else {
                    ctx.fillStyle = '#080812';
                    ctx.shadowBlur = 0;
                }
                ctx.fillRect(x, y, windowWidth, windowHeight);
                
                // Window dividers (cross pattern)
                if (Math.random() > 0.5) {
                    ctx.fillStyle = '#202030';
                    ctx.fillRect(x + windowWidth / 2 - 0.5, y, 1, windowHeight);
                    ctx.fillRect(x, y + windowHeight / 2 - 0.5, windowWidth, 1);
                }
            }
        }
        
        // Add some vertical lines for building panels
        ctx.strokeStyle = 'rgba(40, 40, 50, 0.3)';
        ctx.lineWidth = 2;
        for (let x = 0; x < 128; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 256);
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    createConcreteTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Concrete base with slight color variation
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(0, 0, 128, 128);
        
        // Add noise for realistic concrete
        for (let i = 0; i < 1500; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            const gray = 35 + Math.random() * 35;
            ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            ctx.fillRect(x, y, 1 + Math.random(), 1 + Math.random());
        }
        
        // Add some darker spots (stains/weathering)
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            const radius = 3 + Math.random() * 8;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(25, 25, 25, 0.4)');
            gradient.addColorStop(1, 'rgba(25, 25, 25, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add subtle cracks
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.3)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * 128, Math.random() * 128);
            for (let j = 0; j < 3; j++) {
                ctx.lineTo(Math.random() * 128, Math.random() * 128);
            }
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    createGrassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Base grass color - darker for night
        ctx.fillStyle = '#0f2215';
        ctx.fillRect(0, 0, 128, 128);
        
        // Grass variation patches
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            const radius = 10 + Math.random() * 20;
            const green = 20 + Math.random() * 25;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `rgba(${green * 0.4}, ${green}, ${green * 0.3}, 0.5)`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Grass blades
        for (let i = 0; i < 1500; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            const green = 25 + Math.random() * 45;
            const height = 1 + Math.random() * 3;
            ctx.fillStyle = `rgb(${green * 0.3}, ${green}, ${green * 0.25})`;
            ctx.fillRect(x, y, 1, height);
        }
        
        // Add some small dirt patches
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            ctx.fillStyle = 'rgba(40, 30, 20, 0.3)';
            ctx.beginPath();
            ctx.arc(x, y, 2 + Math.random() * 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(120, 120);
        return texture;
    }
    
    createRoofTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#1a1515';
        ctx.fillRect(0, 0, 64, 64);
        
        // Shingle pattern with more detail
        for (let y = 0; y < 64; y += 6) {
            const offset = (y / 6) % 2 === 0 ? 0 : 8;
            for (let x = offset - 8; x < 72; x += 16) {
                // Shingle base
                const brightness = 25 + Math.random() * 15;
                ctx.fillStyle = `rgb(${brightness}, ${brightness - 5}, ${brightness - 8})`;
                ctx.fillRect(x, y, 14, 5);
                
                // Shingle shadow edge
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(x, y + 4, 14, 1);
                
                // Shingle highlight
                ctx.fillStyle = 'rgba(60, 50, 45, 0.2)';
                ctx.fillRect(x, y, 14, 1);
            }
        }
        
        // Add some moss/weathering
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            ctx.fillStyle = 'rgba(30, 40, 25, 0.4)';
            ctx.fillRect(x, y, 2, 2);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    createGround() {
        // Textured ground plane
        const groundGeometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE);
        const groundMaterial = new THREE.MeshStandardMaterial({
            map: this.textures.grass,
            roughness: 0.9,
            metalness: 0.1,
            color: 0x4a7a4a,
            emissive: 0x112211,
            emissiveIntensity: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Keep the grid overlay for visual reference
        const gridHelper = new THREE.GridHelper(WORLD_SIZE, 50, 0x004466, 0x003344);
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.3;
        this.scene.add(gridHelper);
    }
    
    generate() {
        // Clear existing buildings
        this.clear();
        
        // Create city zones
        this.generateDowntown();
        this.generateSuburbs();
        this.generateSpecialBuildings();
    }
    
    clear() {
        while (this.buildingMeshes.children.length > 0) {
            const child = this.buildingMeshes.children[0];
            this.buildingMeshes.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }
        this.buildings = [];
    }
    
    generateDowntown() {
        // Dense area in the center with tall buildings
        const downtownRadius = WORLD_SIZE * 0.2;
        const buildingCount = Math.floor(BUILDING_COUNT * 0.4);
        const minSpawnClearance = 80; // Keep center clear for spawn area
        
        for (let i = 0; i < buildingCount; i++) {
            // Random position within downtown area, but not too close to center
            const angle = Math.random() * Math.PI * 2;
            const radius = minSpawnClearance + Math.random() * (downtownRadius - minSpawnClearance);
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Mostly skyscrapers and offices in downtown
            const rand = Math.random();
            if (rand < 0.6) {
                this.createSkyscraper(x, z);
            } else {
                this.createOfficeBuilding(x, z);
            }
        }
    }
    
    generateSuburbs() {
        // Houses spread around the outer areas
        const innerRadius = WORLD_SIZE * 0.25;
        const outerRadius = WORLD_SIZE * 0.45;
        const houseCount = Math.floor(BUILDING_COUNT * 0.4);
        
        for (let i = 0; i < houseCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Check for overlap before placing
            if (!this.checkOverlap(x, z, 15)) {
                this.createHouse(x, z);
            }
        }
    }
    
    generateSpecialBuildings() {
        // Add schools and ballparks in specific locations
        const specialLocations = [
            { x: -300, z: -300, type: 'ballpark' },
            { x: 300, z: 300, type: 'ballpark' },
            { x: -400, z: 200, type: 'school' },
            { x: 400, z: -200, type: 'school' },
            { x: 0, z: 400, type: 'school' },
            { x: 200, z: -400, type: 'ballpark' }
        ];
        
        for (const loc of specialLocations) {
            if (!this.checkOverlap(loc.x, loc.z, 60)) {
                if (loc.type === 'ballpark') {
                    this.createBallpark(loc.x, loc.z);
                } else {
                    this.createSchool(loc.x, loc.z);
                }
            }
        }
    }
    
    checkOverlap(x, z, minDistance) {
        for (const building of this.buildings) {
            const center = new THREE.Vector3();
            building.bbox.getCenter(center);
            const dist = Math.sqrt((x - center.x) ** 2 + (z - center.z) ** 2);
            if (dist < minDistance) return true;
        }
        return false;
    }
    
    createSkyscraper(x, z) {
        const type = BuildingTypes.SKYSCRAPER;
        const width = this.randomRange(type.minWidth, type.maxWidth);
        const height = this.randomRange(type.minHeight, type.maxHeight);
        const depth = this.randomRange(type.minDepth, type.maxDepth);
        
        // Create textured building material
        const windowTex = this.textures.windowsLit.clone();
        windowTex.needsUpdate = true;
        windowTex.repeat.set(width / 20, height / 30);
        
        const material = new THREE.MeshStandardMaterial({
            map: windowTex,
            color: 0xffffff,
            emissive: 0x5588cc,
            emissiveMap: windowTex,
            emissiveIntensity: 1.2,
            roughness: 0.5,
            metalness: 0.1
        });
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, height / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.buildingMeshes.add(mesh);
        
        // Add wireframe outline for vector aesthetic
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.15
        });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        wireframe.position.copy(mesh.position);
        this.buildingMeshes.add(wireframe);
        
        // Add antenna on top
        if (Math.random() > 0.5) {
            const antennaGeometry = new THREE.CylinderGeometry(0.3, 0.5, 15, 6);
            const antennaMaterial = new THREE.MeshStandardMaterial({
                color: 0x444444,
                emissive: 0xff0000,
                emissiveIntensity: 0.5,
                metalness: 0.8
            });
            const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
            antenna.position.set(x, height + 7.5, z);
            this.buildingMeshes.add(antenna);
            
            // Blinking light on top
            const lightGeometry = new THREE.SphereGeometry(0.5, 8, 8);
            const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.set(x, height + 15, z);
            this.buildingMeshes.add(light);
        }
        
        // Store building data with bounding box
        const bbox = new THREE.Box3(
            new THREE.Vector3(x - width/2, 0, z - depth/2),
            new THREE.Vector3(x + width/2, height, z + depth/2)
        );
        this.buildings.push({ mesh, bbox, type: 'skyscraper' });
    }
    
    createOfficeBuilding(x, z) {
        const type = BuildingTypes.OFFICE;
        const width = this.randomRange(type.minWidth, type.maxWidth);
        const height = this.randomRange(type.minHeight, type.maxHeight);
        const depth = this.randomRange(type.minDepth, type.maxDepth);
        
        const windowTex = this.textures.windows.clone();
        windowTex.needsUpdate = true;
        windowTex.repeat.set(width / 25, height / 35);
        
        const material = new THREE.MeshStandardMaterial({
            map: windowTex,
            color: 0xffffff,
            emissive: 0x4477bb,
            emissiveMap: windowTex,
            emissiveIntensity: 1.0,
            roughness: 0.5,
            metalness: 0.2
        });
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, height / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.buildingMeshes.add(mesh);
        
        // Wireframe outline
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ff88,
            transparent: true,
            opacity: 0.15
        });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        wireframe.position.copy(mesh.position);
        this.buildingMeshes.add(wireframe);
        
        const bbox = new THREE.Box3(
            new THREE.Vector3(x - width/2, 0, z - depth/2),
            new THREE.Vector3(x + width/2, height, z + depth/2)
        );
        this.buildings.push({ mesh, bbox, type: 'office' });
    }
    
    addFloorLines(x, z, width, depth, height, color) {
        // No longer needed with textures, but keeping for potential use
    }
    
    createHouse(x, z) {
        const type = BuildingTypes.HOUSE;
        const width = this.randomRange(type.minWidth, type.maxWidth);
        const depth = this.randomRange(type.minDepth, type.maxDepth);
        const height = type.height;
        const roofHeight = type.roofHeight;
        
        // House body with texture
        const wallMaterial = new THREE.MeshStandardMaterial({
            map: this.textures.concrete,
            color: 0xaabbcc,
            emissive: 0x333333,
            emissiveIntensity: 0.3,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
        const body = new THREE.Mesh(bodyGeometry, wallMaterial);
        body.position.set(x, height / 2, z);
        body.castShadow = true;
        body.receiveShadow = true;
        this.buildingMeshes.add(body);
        
        // Wireframe outline
        const bodyEdges = new THREE.EdgesGeometry(bodyGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ff66,
            transparent: true,
            opacity: 0.5
        });
        const bodyWireframe = new THREE.LineSegments(bodyEdges, lineMaterial);
        bodyWireframe.position.copy(body.position);
        this.buildingMeshes.add(bodyWireframe);
        
        // Roof with texture
        const roofMaterial = new THREE.MeshStandardMaterial({
            map: this.textures.roof,
            color: 0xaa6644,
            emissive: 0x331111,
            emissiveIntensity: 0.2,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const roofGeometry = new THREE.ConeGeometry(
            Math.max(width, depth) * 0.75, 
            roofHeight, 
            4
        );
        roofGeometry.rotateY(Math.PI / 4);
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(x, height + roofHeight / 2, z);
        roof.castShadow = true;
        this.buildingMeshes.add(roof);
        
        const totalHeight = height + roofHeight;
        const bbox = new THREE.Box3(
            new THREE.Vector3(x - width/2, 0, z - depth/2),
            new THREE.Vector3(x + width/2, totalHeight, z + depth/2)
        );
        this.buildings.push({ mesh: body, bbox, type: 'house' });
    }
    
    createBallpark(x, z) {
        const type = BuildingTypes.BALLPARK;
        const radius = type.radius;
        const height = type.height;
        
        // Stadium structure
        const stadiumMaterial = new THREE.MeshStandardMaterial({
            color: 0x55aa77,
            emissive: 0x224433,
            emissiveIntensity: 0.4,
            roughness: 0.7,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        
        // Create stadium as a torus (ring shape)
        const stadiumGeometry = new THREE.TorusGeometry(radius * 0.85, radius * 0.15, 8, 24);
        stadiumGeometry.rotateX(Math.PI / 2);
        const stadium = new THREE.Mesh(stadiumGeometry, stadiumMaterial);
        stadium.position.set(x, height / 2, z);
        stadium.scale.set(1, 1, 0.7); // Oval shape
        stadium.castShadow = true;
        this.buildingMeshes.add(stadium);
        
        // Wireframe
        const edges = new THREE.EdgesGeometry(stadiumGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ffaa,
            transparent: true,
            opacity: 0.5
        });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        wireframe.position.copy(stadium.position);
        wireframe.scale.copy(stadium.scale);
        this.buildingMeshes.add(wireframe);
        
        // Green field in center
        const fieldGeometry = new THREE.CircleGeometry(radius * 0.7, 24);
        fieldGeometry.rotateX(-Math.PI / 2);
        const fieldMaterial = new THREE.MeshStandardMaterial({
            color: 0x44bb55,
            emissive: 0x115522,
            emissiveIntensity: 0.3,
            roughness: 0.9
        });
        const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        field.position.set(x, 0.5, z);
        field.scale.set(1, 1, 0.7);
        this.buildingMeshes.add(field);
        
        // Diamond shape for baseball field
        const diamondPoints = [
            new THREE.Vector3(0, 1, -radius * 0.4),
            new THREE.Vector3(radius * 0.2, 1, 0),
            new THREE.Vector3(0, 1, radius * 0.2),
            new THREE.Vector3(-radius * 0.2, 1, 0),
            new THREE.Vector3(0, 1, -radius * 0.4)
        ];
        const diamondGeometry = new THREE.BufferGeometry().setFromPoints(diamondPoints);
        const diamondMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const diamond = new THREE.Line(diamondGeometry, diamondMaterial);
        diamond.position.set(x, 0, z);
        this.buildingMeshes.add(diamond);
        
        const bbox = new THREE.Box3(
            new THREE.Vector3(x - radius, 0, z - radius * 0.7),
            new THREE.Vector3(x + radius, height, z + radius * 0.7)
        );
        this.buildings.push({ mesh: stadium, bbox, type: 'ballpark' });
    }
    
    createSchool(x, z) {
        const type = BuildingTypes.SCHOOL;
        const width = type.width;
        const height = type.height;
        const depth = type.depth;
        
        const material = new THREE.MeshStandardMaterial({
            color: 0xcc8866,
            emissive: 0x553322,
            emissiveIntensity: 0.4,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffaa44,
            transparent: true,
            opacity: 0.5
        });
        
        // Main building (L-shape) - Horizontal part
        const mainGeometry = new THREE.BoxGeometry(width, height, depth * 0.4);
        const mainBuilding = new THREE.Mesh(mainGeometry, material);
        mainBuilding.position.set(x, height / 2, z - depth * 0.3);
        mainBuilding.castShadow = true;
        mainBuilding.receiveShadow = true;
        this.buildingMeshes.add(mainBuilding);
        
        const mainEdges = new THREE.EdgesGeometry(mainGeometry);
        const mainWireframe = new THREE.LineSegments(mainEdges, lineMaterial);
        mainWireframe.position.copy(mainBuilding.position);
        this.buildingMeshes.add(mainWireframe);
        
        // Vertical part of L
        const wingGeometry = new THREE.BoxGeometry(width * 0.4, height, depth * 0.6);
        const wing = new THREE.Mesh(wingGeometry, material);
        wing.position.set(x + width * 0.3, height / 2, z + depth * 0.1);
        wing.castShadow = true;
        wing.receiveShadow = true;
        this.buildingMeshes.add(wing);
        
        const wingEdges = new THREE.EdgesGeometry(wingGeometry);
        const wingWireframe = new THREE.LineSegments(wingEdges, lineMaterial);
        wingWireframe.position.copy(wing.position);
        this.buildingMeshes.add(wingWireframe);
        
        // Flagpole
        const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 20, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(x - width * 0.4, 10, z - depth * 0.5);
        this.buildingMeshes.add(pole);
        
        // Flag
        const flagGeometry = new THREE.PlaneGeometry(6, 4);
        const flagMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff4444, 
            side: THREE.DoubleSide 
        });
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(x - width * 0.4 + 3, 18, z - depth * 0.5);
        this.buildingMeshes.add(flag);
        
        // Combined bounding box
        const bbox = new THREE.Box3(
            new THREE.Vector3(x - width/2, 0, z - depth * 0.5),
            new THREE.Vector3(x + width/2, height, z + depth * 0.4)
        );
        this.buildings.push({ mesh: mainBuilding, bbox, type: 'school' });
    }
    
    randomRange(min, max) {
        return min + Math.random() * (max - min);
    }
    
    getBuildings() {
        return this.buildings;
    }
    
    getBuildingAt(position, radius) {
        for (const building of this.buildings) {
            const center = new THREE.Vector3();
            building.bbox.getCenter(center);
            if (position.distanceTo(center) < radius) {
                return building;
            }
        }
        return null;
    }
}
