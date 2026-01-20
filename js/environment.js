// Environment Module - Streets, Cars, People, and City Life
import { WORLD_SIZE } from './main.js';

export class Environment {
    constructor(scene) {
        this.scene = scene;
        
        // Collections
        this.cars = [];
        this.policeCars = [];
        this.people = [];
        this.streetLights = [];
        this.lightPoles = [];
        this.trees = [];
        this.billboards = [];
        this.benches = [];
        this.trashCans = [];
        this.fireHydrants = [];
        
        // Street grid
        this.streets = [];
        this.intersections = [];
        
        // Animation time
        this.time = 0;
        
        // Create everything
        this.createStreetGrid();
        this.createSidewalks();
        this.createCars(100);
        this.createPoliceCars(8);
        this.createPeople(200);
        this.createStreetLights();
        this.createLightPoles(150);
        this.createTrees(120);
        this.createBillboards();
        this.createParkedCars(80);
        this.createTrafficLights();
        this.createStreetFurniture();
    }
    
    createStreetGrid() {
        const streetWidth = 20;
        const blockSize = 120;
        const numStreets = 12;
        const halfGrid = (numStreets * blockSize) / 2;
        
        // Road material with better texture - realistic asphalt for daytime
        const roadTexture = this.createRoadTexture();
        const roadMaterial = new THREE.MeshStandardMaterial({
            map: roadTexture,
            roughness: 0.9,
            metalness: 0.0,
            color: 0x555555  // Gray asphalt
        });
        
        // Create horizontal streets
        for (let i = -numStreets / 2; i <= numStreets / 2; i++) {
            const z = i * blockSize;
            const streetGeo = new THREE.PlaneGeometry(numStreets * blockSize, streetWidth);
            streetGeo.rotateX(-Math.PI / 2);
            const street = new THREE.Mesh(streetGeo, roadMaterial.clone());
            street.position.set(0, 0.1, z);
            street.receiveShadow = true;
            this.scene.add(street);
            
            this.streets.push({ 
                start: new THREE.Vector3(-halfGrid, 0, z),
                end: new THREE.Vector3(halfGrid, 0, z),
                direction: new THREE.Vector3(1, 0, 0),
                type: 'horizontal'
            });
        }
        
        // Create vertical streets
        for (let i = -numStreets / 2; i <= numStreets / 2; i++) {
            const x = i * blockSize;
            const streetGeo = new THREE.PlaneGeometry(streetWidth, numStreets * blockSize);
            streetGeo.rotateX(-Math.PI / 2);
            const street = new THREE.Mesh(streetGeo, roadMaterial.clone());
            street.position.set(x, 0.15, 0);
            street.receiveShadow = true;
            this.scene.add(street);
            
            this.streets.push({
                start: new THREE.Vector3(x, 0, -halfGrid),
                end: new THREE.Vector3(x, 0, halfGrid),
                direction: new THREE.Vector3(0, 0, 1),
                type: 'vertical'
            });
        }
        
        // Create intersections markers
        for (let i = -numStreets / 2; i <= numStreets / 2; i++) {
            for (let j = -numStreets / 2; j <= numStreets / 2; j++) {
                this.intersections.push(new THREE.Vector3(i * blockSize, 0, j * blockSize));
            }
        }
        
        // Add lane markings
        this.addLaneMarkings();
        
        // Add crosswalks at intersections
        this.addCrosswalks();
    }
    
    createSidewalks() {
        const blockSize = 120;
        const numStreets = 12;
        const sidewalkWidth = 6;
        
        const sidewalkTexture = this.createSidewalkTexture();
        const sidewalkMaterial = new THREE.MeshStandardMaterial({
            map: sidewalkTexture,
            roughness: 0.9,
            metalness: 0.05,
            color: 0x888888
        });
        
        // Create sidewalks along all streets
        for (const street of this.streets) {
            const length = street.start.distanceTo(street.end);
            
            for (const side of [-1, 1]) {
                const sidewalkGeo = new THREE.PlaneGeometry(
                    street.type === 'horizontal' ? length : sidewalkWidth,
                    street.type === 'horizontal' ? sidewalkWidth : length
                );
                sidewalkGeo.rotateX(-Math.PI / 2);
                
                const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMaterial.clone());
                
                if (street.type === 'horizontal') {
                    sidewalk.position.set(
                        (street.start.x + street.end.x) / 2,
                        0.2,
                        street.start.z + side * 13
                    );
                } else {
                    sidewalk.position.set(
                        street.start.x + side * 13,
                        0.2,
                        (street.start.z + street.end.z) / 2
                    );
                }
                
                sidewalk.receiveShadow = true;
                this.scene.add(sidewalk);
            }
        }
    }
    
    createSidewalkTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Concrete base - lighter for daytime
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(0, 0, 128, 128);

        // Add concrete panels with gaps
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 2;
        for (let x = 0; x < 128; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 128);
            ctx.stroke();
        }
        for (let y = 0; y < 128; y += 32) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(128, y);
            ctx.stroke();
        }

        // Add noise/weathering
        for (let i = 0; i < 1500; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            const gray = 140 + Math.random() * 50;
            ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            ctx.fillRect(x, y, 1, 1);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10);
        return texture;
    }
    
    addCrosswalks() {
        const crosswalkMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        for (const intersection of this.intersections) {
            // Skip some for variety
            if (Math.random() > 0.6) continue;
            
            // Add crosswalk stripes
            for (let dir = 0; dir < 4; dir++) {
                const stripeCount = 8;
                for (let i = 0; i < stripeCount; i++) {
                    const stripeGeo = new THREE.PlaneGeometry(0.5, 3);
                    stripeGeo.rotateX(-Math.PI / 2);
                    const stripe = new THREE.Mesh(stripeGeo, crosswalkMaterial);
                    
                    const offset = (i - stripeCount / 2) * 1.2;
                    
                    if (dir % 2 === 0) {
                        stripe.position.set(
                            intersection.x + offset,
                            0.25,
                            intersection.z + (dir === 0 ? 12 : -12)
                        );
                    } else {
                        stripe.rotation.y = Math.PI / 2;
                        stripe.position.set(
                            intersection.x + (dir === 1 ? 12 : -12),
                            0.25,
                            intersection.z + offset
                        );
                    }
                    
                    this.scene.add(stripe);
                }
            }
        }
    }
    
    createRoadTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Asphalt base - gray for daytime visibility
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(0, 0, 256, 256);

        // Road texture noise with variation
        for (let i = 0; i < 4000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const gray = 60 + Math.random() * 40;
            ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            ctx.fillRect(x, y, Math.random() * 2, Math.random() * 2);
        }

        // Add some cracks and wear
        ctx.strokeStyle = '#303030';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * 256, Math.random() * 256);
            ctx.lineTo(Math.random() * 256, Math.random() * 256);
            ctx.stroke();
        }

        // Oil stains (subtle)
        for (let i = 0; i < 3; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
            gradient.addColorStop(0, 'rgba(50, 45, 40, 0.3)');
            gradient.addColorStop(1, 'rgba(50, 45, 40, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(25, 25);
        return texture;
    }
    
    addLaneMarkings() {
        const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        // Center lane dashes
        const dashGeo = new THREE.PlaneGeometry(0.3, 4);
        dashGeo.rotateX(-Math.PI / 2);
        
        // Edge line geometry (continuous)
        const edgeGeo = new THREE.PlaneGeometry(0.2, 10);
        edgeGeo.rotateX(-Math.PI / 2);
        
        for (const street of this.streets) {
            const length = street.start.distanceTo(street.end);
            const numDashes = Math.floor(length / 15);
            
            // Center dashed yellow line
            for (let i = 0; i < numDashes; i++) {
                const t = i / numDashes;
                const pos = street.start.clone().lerp(street.end, t);
                pos.y = 0.2;
                
                const dash = new THREE.Mesh(dashGeo, markingMaterial);
                dash.position.copy(pos);
                if (street.type === 'vertical') {
                    dash.rotation.y = Math.PI / 2;
                }
                this.scene.add(dash);
            }
            
            // White edge lines
            const numEdgeLines = Math.floor(length / 12);
            for (let i = 0; i < numEdgeLines; i++) {
                const t = i / numEdgeLines;
                const pos = street.start.clone().lerp(street.end, t);
                pos.y = 0.2;
                
                for (const offset of [-9, 9]) {
                    const edge = new THREE.Mesh(edgeGeo, whiteMaterial);
                    edge.position.copy(pos);
                    if (street.type === 'horizontal') {
                        edge.position.z += offset;
                    } else {
                        edge.rotation.y = Math.PI / 2;
                        edge.position.x += offset;
                    }
                    this.scene.add(edge);
                }
            }
        }
    }
    
    createCars(count) {
        const carColors = [0xff3333, 0x3333ff, 0x33ff33, 0xffff33, 0xff33ff, 0x33ffff, 0xffffff, 0x333333, 0xff6600, 0x6600ff, 0x888888, 0xaa4422, 0x22aa44, 0x4422aa];
        
        for (let i = 0; i < count; i++) {
            const street = this.streets[Math.floor(Math.random() * this.streets.length)];
            const t = Math.random();
            const pos = street.start.clone().lerp(street.end, t);
            pos.y = 0.5;
            
            // Offset to one lane
            const laneOffset = (Math.random() > 0.5 ? 4 : -4);
            if (street.type === 'horizontal') {
                pos.z += laneOffset;
            } else {
                pos.x += laneOffset;
            }
            
            const carType = Math.random();
            let car;
            if (carType < 0.3) {
                car = this.createSedanMesh(carColors[Math.floor(Math.random() * carColors.length)]);
            } else if (carType < 0.5) {
                car = this.createSUVMesh(carColors[Math.floor(Math.random() * carColors.length)]);
            } else if (carType < 0.7) {
                car = this.createTruckMesh(carColors[Math.floor(Math.random() * carColors.length)]);
            } else {
                car = this.createCarMesh(carColors[Math.floor(Math.random() * carColors.length)]);
            }
            
            car.position.copy(pos);
            
            // Face direction of travel
            if (street.type === 'horizontal') {
                car.rotation.y = laneOffset > 0 ? 0 : Math.PI;
            } else {
                car.rotation.y = laneOffset > 0 ? Math.PI / 2 : -Math.PI / 2;
            }
            
            this.scene.add(car);
            this.cars.push({
                mesh: car,
                street: street,
                speed: 15 + Math.random() * 25,
                t: t,
                laneOffset: laneOffset,
                direction: laneOffset > 0 ? 1 : -1
            });
        }
    }
    
    createPoliceCars(count) {
        for (let i = 0; i < count; i++) {
            const street = this.streets[Math.floor(Math.random() * this.streets.length)];
            const t = Math.random();
            const pos = street.start.clone().lerp(street.end, t);
            pos.y = 0.5;
            
            const laneOffset = (Math.random() > 0.5 ? 4 : -4);
            if (street.type === 'horizontal') {
                pos.z += laneOffset;
            } else {
                pos.x += laneOffset;
            }
            
            const policeCar = this.createPolicCarMesh();
            policeCar.position.copy(pos);
            
            if (street.type === 'horizontal') {
                policeCar.rotation.y = laneOffset > 0 ? 0 : Math.PI;
            } else {
                policeCar.rotation.y = laneOffset > 0 ? Math.PI / 2 : -Math.PI / 2;
            }
            
            this.scene.add(policeCar);
            this.policeCars.push({
                mesh: policeCar,
                street: street,
                speed: 35 + Math.random() * 20, // Police cars are faster
                t: t,
                laneOffset: laneOffset,
                direction: laneOffset > 0 ? 1 : -1,
                sirenPhase: Math.random() * Math.PI * 2
            });
        }
    }
    
    createPolicCarMesh() {
        const group = new THREE.Group();

        // Body - black and white police colors (realistic)
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.7,
            roughness: 0.3
        });

        const whiteMaterial = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            metalness: 0.6,
            roughness: 0.3
        });
        
        // Main body (black)
        const bodyGeo = new THREE.BoxGeometry(2.2, 0.8, 4.5);
        const body = new THREE.Mesh(bodyGeo, bodyMaterial);
        body.position.y = 0.4;
        body.castShadow = true;
        group.add(body);
        
        // White doors/sides
        const doorGeo = new THREE.BoxGeometry(2.25, 0.4, 1.8);
        const doors = new THREE.Mesh(doorGeo, whiteMaterial);
        doors.position.set(0, 0.5, 0);
        group.add(doors);
        
        // Cabin
        const cabinGeo = new THREE.BoxGeometry(1.9, 0.65, 2);
        const cabinMaterial = new THREE.MeshStandardMaterial({
            color: 0x88aacc,
            metalness: 0.1,
            roughness: 0.1,
            transparent: true,
            opacity: 0.7
        });
        const cabin = new THREE.Mesh(cabinGeo, cabinMaterial);
        cabin.position.set(0, 1.1, -0.3);
        group.add(cabin);
        
        // Light bar on top
        const lightBarGeo = new THREE.BoxGeometry(1.6, 0.25, 0.6);
        const lightBarMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
        const lightBar = new THREE.Mesh(lightBarGeo, lightBarMat);
        lightBar.position.set(0, 1.55, -0.3);
        group.add(lightBar);
        
        // Red siren light
        const sirenGeoRed = new THREE.SphereGeometry(0.15, 8, 8);
        const sirenMatRed = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const sirenRed = new THREE.Mesh(sirenGeoRed, sirenMatRed);
        sirenRed.position.set(-0.5, 1.7, -0.3);
        group.add(sirenRed);
        group.sirenRed = sirenRed;
        
        // Blue siren light
        const sirenGeoBlue = new THREE.SphereGeometry(0.15, 8, 8);
        const sirenMatBlue = new THREE.MeshBasicMaterial({ color: 0x0044ff });
        const sirenBlue = new THREE.Mesh(sirenGeoBlue, sirenMatBlue);
        sirenBlue.position.set(0.5, 1.7, -0.3);
        group.add(sirenBlue);
        group.sirenBlue = sirenBlue;
        
        // Point lights for sirens
        const redLight = new THREE.PointLight(0xff0000, 2, 25);
        redLight.position.set(-0.5, 2, -0.3);
        group.add(redLight);
        group.redLight = redLight;
        
        const blueLight = new THREE.PointLight(0x0044ff, 2, 25);
        blueLight.position.set(0.5, 2, -0.3);
        group.add(blueLight);
        group.blueLight = blueLight;
        
        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
        
        const wheelPositions = [
            [-1.1, 0.35, 1.4], [1.1, 0.35, 1.4],
            [-1.1, 0.35, -1.4], [1.1, 0.35, -1.4]
        ];
        
        for (const [x, y, z] of wheelPositions) {
            const wheel = new THREE.Mesh(wheelGeo, wheelMaterial);
            wheel.position.set(x, y, z);
            group.add(wheel);
        }
        
        // Headlights
        const lightGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
        const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        
        const hl1 = new THREE.Mesh(lightGeo, headlightMat);
        hl1.position.set(-0.7, 0.4, -2.25);
        group.add(hl1);
        
        const hl2 = new THREE.Mesh(lightGeo, headlightMat);
        hl2.position.set(0.7, 0.4, -2.25);
        group.add(hl2);
        
        const tl1 = new THREE.Mesh(lightGeo, tailLightMat);
        tl1.position.set(-0.7, 0.4, 2.25);
        group.add(tl1);
        
        const tl2 = new THREE.Mesh(lightGeo, tailLightMat);
        tl2.position.set(0.7, 0.4, 2.25);
        group.add(tl2);
        
        // "POLICE" text indicator (simple stripe)
        const stripeGeo = new THREE.PlaneGeometry(1.5, 0.2);
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0x0044ff, side: THREE.DoubleSide });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(0, 0.85, -2.26);
        stripe.rotation.x = Math.PI / 2;
        group.add(stripe);
        
        return group;
    }
    
    createSedanMesh(color) {
        const group = new THREE.Group();

        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.7,
            roughness: 0.3
        });
        
        // Lower body
        const bodyGeo = new THREE.BoxGeometry(2, 0.6, 4.2);
        const body = new THREE.Mesh(bodyGeo, bodyMaterial);
        body.position.y = 0.35;
        body.castShadow = true;
        group.add(body);
        
        // Cabin - more sleek
        const cabinGeo = new THREE.BoxGeometry(1.7, 0.55, 2.2);
        const cabinMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2a,
            metalness: 0.1,
            roughness: 0.05,
            transparent: true,
            opacity: 0.8
        });
        const cabin = new THREE.Mesh(cabinGeo, cabinMaterial);
        cabin.position.set(0, 0.95, -0.1);
        group.add(cabin);
        
        this.addWheelsAndLights(group);
        
        return group;
    }
    
    createSUVMesh(color) {
        const group = new THREE.Group();

        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.6,
            roughness: 0.35
        });
        
        // Taller body
        const bodyGeo = new THREE.BoxGeometry(2.3, 1, 4.5);
        const body = new THREE.Mesh(bodyGeo, bodyMaterial);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);
        
        // Taller cabin
        const cabinGeo = new THREE.BoxGeometry(2.1, 0.7, 2.5);
        const cabinMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2a,
            metalness: 0.1,
            roughness: 0.05,
            transparent: true,
            opacity: 0.75
        });
        const cabin = new THREE.Mesh(cabinGeo, cabinMaterial);
        cabin.position.set(0, 1.45, 0);
        group.add(cabin);
        
        this.addWheelsAndLights(group, 0.45); // Bigger wheels
        
        return group;
    }
    
    createTruckMesh(color) {
        const group = new THREE.Group();

        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.5,
            roughness: 0.4
        });
        
        // Cab
        const cabGeo = new THREE.BoxGeometry(2.2, 1.2, 2);
        const cab = new THREE.Mesh(cabGeo, bodyMaterial);
        cab.position.set(0, 0.7, -1.5);
        cab.castShadow = true;
        group.add(cab);
        
        // Cabin windows
        const cabinGeo = new THREE.BoxGeometry(2, 0.6, 1.2);
        const cabinMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2a,
            metalness: 0.1,
            roughness: 0.05,
            transparent: true,
            opacity: 0.75
        });
        const cabin = new THREE.Mesh(cabinGeo, cabinMaterial);
        cabin.position.set(0, 1.6, -1.3);
        group.add(cabin);
        
        // Truck bed
        const bedGeo = new THREE.BoxGeometry(2.2, 0.8, 3);
        const bedMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.6 });
        const bed = new THREE.Mesh(bedGeo, bedMat);
        bed.position.set(0, 0.5, 1);
        bed.castShadow = true;
        group.add(bed);
        
        this.addWheelsAndLights(group, 0.4);
        
        return group;
    }
    
    addWheelsAndLights(group, wheelSize = 0.35) {
        const wheelGeo = new THREE.CylinderGeometry(wheelSize, wheelSize, 0.25, 12);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
        
        const wheelPositions = [
            [-1, wheelSize, 1.3], [1, wheelSize, 1.3],
            [-1, wheelSize, -1.3], [1, wheelSize, -1.3]
        ];
        
        for (const [x, y, z] of wheelPositions) {
            const wheel = new THREE.Mesh(wheelGeo, wheelMaterial);
            wheel.position.set(x, y, z);
            group.add(wheel);
        }
        
        // Headlights
        const lightGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
        const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        
        const hl1 = new THREE.Mesh(lightGeo, headlightMat);
        hl1.position.set(-0.6, 0.4, -2);
        group.add(hl1);
        
        const hl2 = new THREE.Mesh(lightGeo, headlightMat);
        hl2.position.set(0.6, 0.4, -2);
        group.add(hl2);
        
        const tl1 = new THREE.Mesh(lightGeo, tailLightMat);
        tl1.position.set(-0.6, 0.4, 2);
        group.add(tl1);
        
        const tl2 = new THREE.Mesh(lightGeo, tailLightMat);
        tl2.position.set(0.6, 0.4, 2);
        group.add(tl2);
    }
    
    createCarMesh(color) {
        const group = new THREE.Group();

        // Body - realistic car paint
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.7,
            roughness: 0.3
        });
        
        // Main body
        const bodyGeo = new THREE.BoxGeometry(2, 0.8, 4);
        const body = new THREE.Mesh(bodyGeo, bodyMaterial);
        body.position.y = 0.4;
        body.castShadow = true;
        group.add(body);
        
        // Cabin
        const cabinGeo = new THREE.BoxGeometry(1.8, 0.7, 2);
        const cabinMaterial = new THREE.MeshStandardMaterial({
            color: 0x88aacc,
            metalness: 0.1,
            roughness: 0.1,
            transparent: true,
            opacity: 0.7
        });
        const cabin = new THREE.Mesh(cabinGeo, cabinMaterial);
        cabin.position.set(0, 1.1, -0.3);
        group.add(cabin);
        
        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
        
        const wheelPositions = [
            [-1, 0.35, 1.3], [1, 0.35, 1.3],
            [-1, 0.35, -1.3], [1, 0.35, -1.3]
        ];
        
        for (const [x, y, z] of wheelPositions) {
            const wheel = new THREE.Mesh(wheelGeo, wheelMaterial);
            wheel.position.set(x, y, z);
            group.add(wheel);
        }
        
        // Headlights
        const lightGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
        const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        
        const hl1 = new THREE.Mesh(lightGeo, headlightMat);
        hl1.position.set(-0.6, 0.4, -2);
        group.add(hl1);
        
        const hl2 = new THREE.Mesh(lightGeo, headlightMat);
        hl2.position.set(0.6, 0.4, -2);
        group.add(hl2);
        
        const tl1 = new THREE.Mesh(lightGeo, tailLightMat);
        tl1.position.set(-0.6, 0.4, 2);
        group.add(tl1);
        
        const tl2 = new THREE.Mesh(lightGeo, tailLightMat);
        tl2.position.set(0.6, 0.4, 2);
        group.add(tl2);
        
        return group;
    }
    
    createPeople(count) {
        const skinTones = [0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524];
        const shirtColors = [0xff4444, 0x4444ff, 0x44ff44, 0xffff44, 0xff44ff, 0x44ffff, 0xffffff, 0x444444, 0xff8844, 0x8844ff];
        const pantColors = [0x222222, 0x333366, 0x663333, 0x336633, 0x555555];
        
        // Sidewalk areas - along streets
        const sidewalkPositions = [];
        for (const street of this.streets) {
            const numPositions = 20;
            for (let i = 0; i < numPositions; i++) {
                const t = i / numPositions;
                const pos = street.start.clone().lerp(street.end, t);
                
                // Place on sidewalk (offset from street)
                const offset = 15 + Math.random() * 5;
                if (street.type === 'horizontal') {
                    sidewalkPositions.push(new THREE.Vector3(pos.x, 0, pos.z + offset));
                    sidewalkPositions.push(new THREE.Vector3(pos.x, 0, pos.z - offset));
                } else {
                    sidewalkPositions.push(new THREE.Vector3(pos.x + offset, 0, pos.z));
                    sidewalkPositions.push(new THREE.Vector3(pos.x - offset, 0, pos.z));
                }
            }
        }
        
        for (let i = 0; i < count && i < sidewalkPositions.length; i++) {
            const pos = sidewalkPositions[Math.floor(Math.random() * sidewalkPositions.length)];
            const person = this.createPersonMesh(
                skinTones[Math.floor(Math.random() * skinTones.length)],
                shirtColors[Math.floor(Math.random() * shirtColors.length)],
                pantColors[Math.floor(Math.random() * pantColors.length)]
            );
            
            person.position.copy(pos);
            person.position.y = 0;
            person.rotation.y = Math.random() * Math.PI * 2;
            
            this.scene.add(person);
            this.people.push({
                mesh: person,
                walkSpeed: 1 + Math.random() * 2,
                walkDirection: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    0,
                    (Math.random() - 0.5) * 2
                ).normalize(),
                animPhase: Math.random() * Math.PI * 2,
                originalPos: pos.clone()
            });
        }
    }
    
    createPersonMesh(skinColor, shirtColor, pantColor) {
        const group = new THREE.Group();

        // Realistic materials for people
        const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7, metalness: 0.0 });
        const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.6, metalness: 0.0 });
        const pantMat = new THREE.MeshStandardMaterial({ color: pantColor, roughness: 0.7, metalness: 0.0 });
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.25, 8, 8);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.y = 1.7;
        head.castShadow = true;
        group.add(head);
        
        // Body/torso
        const torsoGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.6, 8);
        const torso = new THREE.Mesh(torsoGeo, shirtMat);
        torso.position.y = 1.2;
        torso.castShadow = true;
        group.add(torso);
        
        // Legs
        const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.7, 6);
        
        const leftLeg = new THREE.Mesh(legGeo, pantMat);
        leftLeg.position.set(-0.12, 0.55, 0);
        leftLeg.castShadow = true;
        group.add(leftLeg);
        group.leftLeg = leftLeg;
        
        const rightLeg = new THREE.Mesh(legGeo, pantMat);
        rightLeg.position.set(0.12, 0.55, 0);
        rightLeg.castShadow = true;
        group.add(rightLeg);
        group.rightLeg = rightLeg;
        
        // Arms
        const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6);
        
        const leftArm = new THREE.Mesh(armGeo, shirtMat);
        leftArm.position.set(-0.3, 1.1, 0);
        leftArm.rotation.z = 0.2;
        group.add(leftArm);
        group.leftArm = leftArm;
        
        const rightArm = new THREE.Mesh(armGeo, shirtMat);
        rightArm.position.set(0.3, 1.1, 0);
        rightArm.rotation.z = -0.2;
        group.add(rightArm);
        group.rightArm = rightArm;
        
        return group;
    }
    
    createStreetLights() {
        const lightMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
        
        for (const intersection of this.intersections) {
            // Skip some intersections randomly for variety
            if (Math.random() > 0.7) continue;
            
            for (let corner = 0; corner < 4; corner++) {
                const offsetX = (corner % 2 === 0 ? 12 : -12);
                const offsetZ = (corner < 2 ? 12 : -12);
                
                const light = this.createStreetLightMesh();
                light.position.set(
                    intersection.x + offsetX,
                    0,
                    intersection.z + offsetZ
                );
                light.rotation.y = corner * Math.PI / 2;
                this.scene.add(light);
                this.streetLights.push(light);
            }
        }
    }
    
    createLightPoles(count) {
        // Place light poles along streets at regular intervals
        for (const street of this.streets) {
            const length = street.start.distanceTo(street.end);
            const numPoles = Math.floor(length / 60); // One pole every 60 units
            
            for (let i = 1; i < numPoles; i++) {
                const t = i / numPoles;
                const pos = street.start.clone().lerp(street.end, t);
                
                // Skip if too close to intersection
                let nearIntersection = false;
                for (const intersection of this.intersections) {
                    if (pos.distanceTo(intersection) < 20) {
                        nearIntersection = true;
                        break;
                    }
                }
                if (nearIntersection) continue;
                
                // Place on both sides of street
                for (const side of [-1, 1]) {
                    const polePos = pos.clone();
                    if (street.type === 'horizontal') {
                        polePos.z += side * 14;
                    } else {
                        polePos.x += side * 14;
                    }
                    
                    const pole = this.createLightPoleMesh();
                    pole.position.copy(polePos);
                    pole.rotation.y = street.type === 'horizontal' ? 0 : Math.PI / 2;
                    if (side === -1) pole.rotation.y += Math.PI;
                    
                    this.scene.add(pole);
                    this.lightPoles.push(pole);
                }
            }
        }
    }
    
    createLightPoleMesh() {
        const group = new THREE.Group();
        
        const poleMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a, 
            metalness: 0.85, 
            roughness: 0.3 
        });
        
        // Main pole - tapered
        const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 9, 8);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 4.5;
        pole.castShadow = true;
        group.add(pole);
        
        // Base
        const baseGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.4, 8);
        const base = new THREE.Mesh(baseGeo, poleMat);
        base.position.y = 0.2;
        group.add(base);
        
        // Curved arm
        const armGeo = new THREE.TorusGeometry(1.2, 0.06, 8, 12, Math.PI / 2);
        const arm = new THREE.Mesh(armGeo, poleMat);
        arm.position.set(0, 8.8, -1.2);
        arm.rotation.x = -Math.PI / 2;
        arm.rotation.z = Math.PI;
        group.add(arm);
        
        // Light housing
        const housingGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.4, 8);
        const housingMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
        const housing = new THREE.Mesh(housingGeo, housingMat);
        housing.position.set(0, 8.5, -2.4);
        group.add(housing);
        
        // Light lens
        const lensGeo = new THREE.CircleGeometry(0.3, 12);
        const lensMat = new THREE.MeshBasicMaterial({ 
            color: 0xffeecc, 
            transparent: true, 
            opacity: 0.95,
            side: THREE.DoubleSide
        });
        const lens = new THREE.Mesh(lensGeo, lensMat);
        lens.position.set(0, 8.28, -2.4);
        lens.rotation.x = -Math.PI / 2;
        group.add(lens);
        
        // Point light - off during daytime (very dim)
        const pointLight = new THREE.PointLight(0xffddaa, 0.05, 10);
        pointLight.position.set(0, 8, -2.4);
        group.add(pointLight);
        
        // Light cone effect
        const coneGeo = new THREE.ConeGeometry(3, 6, 12, 1, true);
        const coneMat = new THREE.MeshBasicMaterial({ 
            color: 0xffeecc, 
            transparent: true, 
            opacity: 0.03,
            side: THREE.DoubleSide
        });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.set(0, 5, -2.4);
        group.add(cone);
        
        return group;
    }
    
    createStreetLightMesh() {
        const group = new THREE.Group();
        
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.4 });
        
        // Pole
        const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 8, 8);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 4;
        pole.castShadow = true;
        group.add(pole);
        
        // Arm
        const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 3, 6);
        armGeo.rotateZ(Math.PI / 2);
        const arm = new THREE.Mesh(armGeo, poleMat);
        arm.position.set(1.5, 7.5, 0);
        group.add(arm);
        
        // Light housing
        const housingGeo = new THREE.BoxGeometry(1, 0.3, 0.5);
        const housing = new THREE.Mesh(housingGeo, poleMat);
        housing.position.set(2.5, 7.3, 0);
        group.add(housing);
        
        // Light glow
        const glowGeo = new THREE.PlaneGeometry(0.8, 0.4);
        const glowMat = new THREE.MeshBasicMaterial({ 
            color: 0xffffaa, 
            transparent: true, 
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(2.5, 7.1, 0);
        glow.rotation.x = -Math.PI / 2;
        group.add(glow);
        
        // Point light - very dim for daytime
        const pointLight = new THREE.PointLight(0xffffaa, 0.05, 15);
        pointLight.position.set(2.5, 7, 0);
        group.add(pointLight);
        
        return group;
    }
    
    createTrees(count) {
        // Place trees in parks/open areas
        const treePositions = [];
        
        // Create some park areas
        const parkCenters = [
            new THREE.Vector3(-350, 0, -350),
            new THREE.Vector3(350, 0, 350),
            new THREE.Vector3(-350, 0, 350),
            new THREE.Vector3(350, 0, -350),
            new THREE.Vector3(0, 0, -450),
            new THREE.Vector3(0, 0, 450)
        ];
        
        for (const center of parkCenters) {
            for (let i = 0; i < count / parkCenters.length; i++) {
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 100,
                    0,
                    (Math.random() - 0.5) * 100
                );
                treePositions.push(center.clone().add(offset));
            }
        }
        
        for (const pos of treePositions) {
            const tree = this.createTreeMesh();
            tree.position.copy(pos);
            tree.rotation.y = Math.random() * Math.PI * 2;
            tree.scale.setScalar(0.8 + Math.random() * 0.4);
            this.scene.add(tree);
            this.trees.push(tree);
        }
    }
    
    createTreeMesh() {
        const group = new THREE.Group();

        // Trunk - brown bark
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.95, metalness: 0.0 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        // Foliage layers - bright green for daytime
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2e8b2e, roughness: 0.8, metalness: 0.0 });

        const layer1 = new THREE.Mesh(new THREE.ConeGeometry(3, 4, 8), foliageMat);
        layer1.position.y = 5;
        layer1.castShadow = true;
        layer1.receiveShadow = true;
        group.add(layer1);

        const layer2 = new THREE.Mesh(new THREE.ConeGeometry(2.5, 3, 8), foliageMat);
        layer2.position.y = 7;
        layer2.castShadow = true;
        layer2.receiveShadow = true;
        group.add(layer2);

        const layer3 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2, 8), foliageMat);
        layer3.position.y = 8.5;
        layer3.castShadow = true;
        layer3.receiveShadow = true;
        group.add(layer3);

        return group;
    }
    
    createBillboards() {
        const billboardTexts = ['NEON CITY', 'CYBER COLA', 'FUTURE TECH', 'SKY CORP', 'MEGA MART'];
        const billboardColors = [0xff0066, 0x00ffff, 0xffff00, 0x00ff66, 0xff6600];
        
        const positions = [
            { pos: new THREE.Vector3(100, 60, -200), rot: 0 },
            { pos: new THREE.Vector3(-150, 50, 150), rot: Math.PI / 4 },
            { pos: new THREE.Vector3(200, 70, 100), rot: -Math.PI / 3 },
            { pos: new THREE.Vector3(-100, 55, -250), rot: Math.PI / 6 }
        ];
        
        for (let i = 0; i < positions.length; i++) {
            const { pos, rot } = positions[i];
            const billboard = this.createBillboardMesh(
                billboardColors[i % billboardColors.length]
            );
            billboard.position.copy(pos);
            billboard.rotation.y = rot;
            this.scene.add(billboard);
            this.billboards.push(billboard);
        }
    }
    
    createBillboardMesh(glowColor) {
        const group = new THREE.Group();
        
        // Frame
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
        const frameGeo = new THREE.BoxGeometry(22, 12, 1);
        const frame = new THREE.Mesh(frameGeo, frameMat);
        group.add(frame);
        
        // Glowing screen
        const screenMat = new THREE.MeshBasicMaterial({ 
            color: glowColor,
            transparent: true,
            opacity: 0.9
        });
        const screenGeo = new THREE.PlaneGeometry(20, 10);
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.z = 0.6;
        group.add(screen);
        group.screen = screen;
        
        // Support poles
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const poleGeo = new THREE.CylinderGeometry(0.5, 0.5, 40, 8);
        
        const leftPole = new THREE.Mesh(poleGeo, poleMat);
        leftPole.position.set(-8, -20, 0);
        group.add(leftPole);
        
        const rightPole = new THREE.Mesh(poleGeo, poleMat);
        rightPole.position.set(8, -20, 0);
        group.add(rightPole);
        
        return group;
    }
    
    createParkedCars(count) {
        const carColors = [0x666666, 0x444444, 0x888888, 0x222222, 0xaa4444, 0x4444aa];
        
        // Park cars along streets
        for (let i = 0; i < count; i++) {
            const street = this.streets[Math.floor(Math.random() * this.streets.length)];
            const t = Math.random();
            const pos = street.start.clone().lerp(street.end, t);
            
            // Park on the curb
            const offset = (Math.random() > 0.5 ? 12 : -12);
            if (street.type === 'horizontal') {
                pos.z += offset;
            } else {
                pos.x += offset;
            }
            
            const car = this.createCarMesh(carColors[Math.floor(Math.random() * carColors.length)]);
            car.position.copy(pos);
            car.position.y = 0.5;
            
            // Park parallel to street
            if (street.type === 'vertical') {
                car.rotation.y = Math.PI / 2;
            }
            
            this.scene.add(car);
        }
    }
    
    createTrafficLights() {
        for (const intersection of this.intersections) {
            if (Math.random() > 0.3) continue;
            
            const trafficLight = this.createTrafficLightMesh();
            trafficLight.position.set(intersection.x + 8, 0, intersection.z + 8);
            this.scene.add(trafficLight);
        }
    }
    
    createTrafficLightMesh() {
        const group = new THREE.Group();
        
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        // Pole
        const poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 6, 8);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 3;
        group.add(pole);
        
        // Light housing
        const housingGeo = new THREE.BoxGeometry(0.6, 1.5, 0.4);
        const housing = new THREE.Mesh(housingGeo, poleMat);
        housing.position.y = 6.5;
        group.add(housing);
        
        // Lights
        const lightGeo = new THREE.CircleGeometry(0.15, 12);
        
        const redLight = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        redLight.position.set(0, 7, 0.21);
        group.add(redLight);
        
        const yellowLight = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0x333300 }));
        yellowLight.position.set(0, 6.5, 0.21);
        group.add(yellowLight);
        
        const greenLight = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0x003300 }));
        greenLight.position.set(0, 6, 0.21);
        group.add(greenLight);
        
        group.redLight = redLight;
        group.yellowLight = yellowLight;
        group.greenLight = greenLight;
        
        return group;
    }
    
    createStreetFurniture() {
        // Add benches, trash cans, and fire hydrants along sidewalks
        for (const street of this.streets) {
            const length = street.start.distanceTo(street.end);
            const numFurniture = Math.floor(length / 80);
            
            for (let i = 1; i < numFurniture; i++) {
                const t = i / numFurniture + (Math.random() - 0.5) * 0.05;
                const pos = street.start.clone().lerp(street.end, t);
                
                // Skip if too close to intersection
                let nearIntersection = false;
                for (const intersection of this.intersections) {
                    if (pos.distanceTo(intersection) < 25) {
                        nearIntersection = true;
                        break;
                    }
                }
                if (nearIntersection) continue;
                
                const side = Math.random() > 0.5 ? 1 : -1;
                const furniturePos = pos.clone();
                if (street.type === 'horizontal') {
                    furniturePos.z += side * 16;
                } else {
                    furniturePos.x += side * 16;
                }
                
                const furnitureType = Math.random();
                if (furnitureType < 0.35) {
                    // Bench
                    const bench = this.createBenchMesh();
                    bench.position.copy(furniturePos);
                    bench.position.y = 0;
                    bench.rotation.y = street.type === 'horizontal' ? Math.PI / 2 : 0;
                    this.scene.add(bench);
                    this.benches.push(bench);
                } else if (furnitureType < 0.6) {
                    // Trash can
                    const trashCan = this.createTrashCanMesh();
                    trashCan.position.copy(furniturePos);
                    trashCan.position.y = 0;
                    this.scene.add(trashCan);
                    this.trashCans.push(trashCan);
                } else if (furnitureType < 0.8) {
                    // Fire hydrant
                    const hydrant = this.createFireHydrantMesh();
                    hydrant.position.copy(furniturePos);
                    hydrant.position.y = 0;
                    this.scene.add(hydrant);
                    this.fireHydrants.push(hydrant);
                }
            }
        }
    }
    
    createBenchMesh() {
        const group = new THREE.Group();
        
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a3825, roughness: 0.85, metalness: 0.05 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.8 });
        
        // Seat slats
        for (let i = 0; i < 4; i++) {
            const slatGeo = new THREE.BoxGeometry(1.8, 0.08, 0.15);
            const slat = new THREE.Mesh(slatGeo, woodMat);
            slat.position.set(0, 0.45, -0.15 + i * 0.12);
            slat.castShadow = true;
            group.add(slat);
        }
        
        // Back slats
        for (let i = 0; i < 3; i++) {
            const slatGeo = new THREE.BoxGeometry(1.8, 0.08, 0.1);
            const slat = new THREE.Mesh(slatGeo, woodMat);
            slat.position.set(0, 0.6 + i * 0.15, 0.22);
            slat.rotation.x = -0.2;
            slat.castShadow = true;
            group.add(slat);
        }
        
        // Metal legs
        const legGeo = new THREE.BoxGeometry(0.08, 0.45, 0.4);
        for (const x of [-0.7, 0.7]) {
            const leg = new THREE.Mesh(legGeo, metalMat);
            leg.position.set(x, 0.22, 0);
            group.add(leg);
        }
        
        // Armrests
        const armGeo = new THREE.BoxGeometry(0.06, 0.25, 0.35);
        for (const x of [-0.85, 0.85]) {
            const arm = new THREE.Mesh(armGeo, metalMat);
            arm.position.set(x, 0.55, 0);
            group.add(arm);
        }
        
        return group;
    }
    
    createTrashCanMesh() {
        const group = new THREE.Group();
        
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a5a2a, roughness: 0.7, metalness: 0.3 });
        
        // Main body
        const bodyGeo = new THREE.CylinderGeometry(0.35, 0.3, 0.9, 12);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.45;
        body.castShadow = true;
        group.add(body);
        
        // Lid
        const lidGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.08, 12);
        const lid = new THREE.Mesh(lidGeo, bodyMat);
        lid.position.y = 0.94;
        group.add(lid);
        
        // Lid dome
        const domeGeo = new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const dome = new THREE.Mesh(domeGeo, bodyMat);
        dome.position.y = 0.98;
        group.add(dome);
        
        return group;
    }
    
    createFireHydrantMesh() {
        const group = new THREE.Group();
        
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.6, metalness: 0.4 });
        const capMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.4, metalness: 0.7 });
        
        // Main body
        const bodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.7, 12);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.35;
        body.castShadow = true;
        group.add(body);
        
        // Top dome
        const topGeo = new THREE.SphereGeometry(0.18, 12, 8);
        const top = new THREE.Mesh(topGeo, bodyMat);
        top.position.y = 0.7;
        group.add(top);
        
        // Top cap
        const capGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8);
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = 0.85;
        group.add(cap);
        
        // Side outlets
        const outletGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8);
        for (const angle of [0, Math.PI]) {
            const outlet = new THREE.Mesh(outletGeo, bodyMat);
            outlet.rotation.z = Math.PI / 2;
            outlet.position.set(Math.cos(angle) * 0.25, 0.45, Math.sin(angle) * 0.25);
            group.add(outlet);
            
            const outletCap = new THREE.Mesh(capGeo.clone(), capMat);
            outletCap.rotation.z = Math.PI / 2;
            outletCap.position.set(Math.cos(angle) * 0.35, 0.45, Math.sin(angle) * 0.35);
            group.add(outletCap);
        }
        
        // Base
        const baseGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.1, 12);
        const base = new THREE.Mesh(baseGeo, bodyMat);
        base.position.y = 0.05;
        group.add(base);
        
        return group;
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        
        // Animate cars
        for (const car of this.cars) {
            const streetLength = car.street.start.distanceTo(car.street.end);
            car.t += (car.speed / streetLength) * deltaTime * car.direction;
            
            // Wrap around
            if (car.t > 1) car.t = 0;
            if (car.t < 0) car.t = 1;
            
            const pos = car.street.start.clone().lerp(car.street.end, car.t);
            pos.y = 0.5;
            
            if (car.street.type === 'horizontal') {
                pos.z += car.laneOffset;
            } else {
                pos.x += car.laneOffset;
            }
            
            car.mesh.position.copy(pos);
        }
        
        // Animate police cars with sirens
        for (const police of this.policeCars) {
            const streetLength = police.street.start.distanceTo(police.street.end);
            police.t += (police.speed / streetLength) * deltaTime * police.direction;
            
            if (police.t > 1) police.t = 0;
            if (police.t < 0) police.t = 1;
            
            const pos = police.street.start.clone().lerp(police.street.end, police.t);
            pos.y = 0.5;
            
            if (police.street.type === 'horizontal') {
                pos.z += police.laneOffset;
            } else {
                pos.x += police.laneOffset;
            }
            
            police.mesh.position.copy(pos);
            
            // Animate sirens - alternating red/blue flash
            police.sirenPhase += deltaTime * 8; // Fast flashing
            const flash = Math.sin(police.sirenPhase);
            
            if (police.mesh.sirenRed) {
                police.mesh.sirenRed.material.opacity = flash > 0 ? 1 : 0.2;
                police.mesh.sirenRed.scale.setScalar(flash > 0 ? 1.3 : 1);
            }
            if (police.mesh.sirenBlue) {
                police.mesh.sirenBlue.material.opacity = flash < 0 ? 1 : 0.2;
                police.mesh.sirenBlue.scale.setScalar(flash < 0 ? 1.3 : 1);
            }
            if (police.mesh.redLight) {
                police.mesh.redLight.intensity = flash > 0 ? 3 : 0.3;
            }
            if (police.mesh.blueLight) {
                police.mesh.blueLight.intensity = flash < 0 ? 3 : 0.3;
            }
        }
        
        // Animate people walking
        for (const person of this.people) {
            person.animPhase += deltaTime * person.walkSpeed * 5;
            
            // Simple walking animation
            const legSwing = Math.sin(person.animPhase) * 0.3;
            if (person.mesh.leftLeg) {
                person.mesh.leftLeg.rotation.x = legSwing;
                person.mesh.rightLeg.rotation.x = -legSwing;
            }
            if (person.mesh.leftArm) {
                person.mesh.leftArm.rotation.x = -legSwing * 0.5;
                person.mesh.rightArm.rotation.x = legSwing * 0.5;
            }
            
            // Move person
            const move = person.walkDirection.clone().multiplyScalar(person.walkSpeed * deltaTime);
            person.mesh.position.add(move);
            
            // Keep near original position (wander in area)
            const distFromOrigin = person.mesh.position.distanceTo(person.originalPos);
            if (distFromOrigin > 30) {
                person.walkDirection.negate();
                person.mesh.rotation.y += Math.PI;
            }
        }
        
        // Animate billboards (pulsing glow)
        for (const billboard of this.billboards) {
            if (billboard.screen) {
                const pulse = 0.7 + Math.sin(this.time * 2) * 0.3;
                billboard.screen.material.opacity = pulse;
            }
        }
    }
}
