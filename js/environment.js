// Environment Module - Streets, Cars, People, and City Life
import { WORLD_SIZE } from './main.js';

export class Environment {
    constructor(scene) {
        this.scene = scene;
        
        // Collections
        this.cars = [];
        this.people = [];
        this.streetLights = [];
        this.trees = [];
        this.billboards = [];
        
        // Street grid
        this.streets = [];
        this.intersections = [];
        
        // Animation time
        this.time = 0;
        
        // Create everything
        this.createStreetGrid();
        this.createCars(80);
        this.createPeople(150);
        this.createStreetLights();
        this.createTrees(100);
        this.createBillboards();
        this.createParkedCars(60);
        this.createTrafficLights();
    }
    
    createStreetGrid() {
        const streetWidth = 20;
        const blockSize = 120;
        const numStreets = 12;
        const halfGrid = (numStreets * blockSize) / 2;
        
        // Road material
        const roadTexture = this.createRoadTexture();
        const roadMaterial = new THREE.MeshStandardMaterial({
            map: roadTexture,
            roughness: 0.9,
            metalness: 0.1
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
    }
    
    createRoadTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Asphalt base
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 256, 256);
        
        // Road texture noise
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const gray = 20 + Math.random() * 20;
            ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            ctx.fillRect(x, y, 1, 1);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(20, 20);
        return texture;
    }
    
    addLaneMarkings() {
        const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        // Center lane dashes
        const dashGeo = new THREE.PlaneGeometry(0.3, 4);
        dashGeo.rotateX(-Math.PI / 2);
        
        for (const street of this.streets) {
            const length = street.start.distanceTo(street.end);
            const numDashes = Math.floor(length / 15);
            
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
        }
    }
    
    createCars(count) {
        const carColors = [0xff3333, 0x3333ff, 0x33ff33, 0xffff33, 0xff33ff, 0x33ffff, 0xffffff, 0x333333, 0xff6600, 0x6600ff];
        
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
            
            const car = this.createCarMesh(carColors[Math.floor(Math.random() * carColors.length)]);
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
    
    createCarMesh(color) {
        const group = new THREE.Group();
        
        // Body
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.8,
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
        
        const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8 });
        const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 });
        const pantMat = new THREE.MeshStandardMaterial({ color: pantColor, roughness: 0.8 });
        
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
        
        // Point light
        const pointLight = new THREE.PointLight(0xffffaa, 0.5, 30);
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
        
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 2;
        trunk.castShadow = true;
        group.add(trunk);
        
        // Foliage layers
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x228833, roughness: 0.8 });
        
        const layer1 = new THREE.Mesh(new THREE.ConeGeometry(3, 4, 8), foliageMat);
        layer1.position.y = 5;
        layer1.castShadow = true;
        group.add(layer1);
        
        const layer2 = new THREE.Mesh(new THREE.ConeGeometry(2.5, 3, 8), foliageMat);
        layer2.position.y = 7;
        layer2.castShadow = true;
        group.add(layer2);
        
        const layer3 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2, 8), foliageMat);
        layer3.position.y = 8.5;
        layer3.castShadow = true;
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
