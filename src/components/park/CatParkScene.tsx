import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CatState } from '../../types/cat';
import { OnlineCatUser, ParkActionType, ParkActionNotification } from '../../types/park';
import { createCat3DModel, updateCatAccessory, CatModelParts } from '../cat3d/catModel';
import { playSound } from '../../utils/audio';

interface CatParkSceneProps {
  myCat: CatState;
  remoteUsers: OnlineCatUser[];
  onMoveMyCat: (x: number, z: number, rotY: number, isMoving: boolean) => void;
  onPerformAction: (action: ParkActionType) => void;
  onSelectCat: (user: OnlineCatUser) => void;
  recentActionNotification: ParkActionNotification | null;
}

export const CatParkScene: React.FC<CatParkSceneProps> = ({
  myCat,
  remoteUsers,
  onMoveMyCat,
  onPerformAction,
  onSelectCat,
  recentActionNotification,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const myCatRef = useRef(myCat);
  myCatRef.current = myCat;

  const remoteUsersRef = useRef<OnlineCatUser[]>(remoteUsers);
  remoteUsersRef.current = remoteUsers;

  const onMoveRef = useRef(onMoveMyCat);
  onMoveRef.current = onMoveMyCat;

  const onSelectCatRef = useRef(onSelectCat);
  onSelectCatRef.current = onSelectCat;

  // Local movement state
  const myPosRef = useRef({ x: 0, z: 3.5, rotY: 0, isMoving: false });
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const virtualJoyRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const myActionRef = useRef<'idle' | ParkActionType>('idle');
  const actionTimerRef = useRef<number>(0);

  // Store 3D model handles
  const myModelRef = useRef<CatModelParts | null>(null);
  const remoteModelsRef = useRef<
    Map<
      string,
      {
        parts: CatModelParts;
        user: OnlineCatUser;
        targetX: number;
        targetZ: number;
        targetRotY: number;
        currentAction: 'idle' | ParkActionType;
        actionTimer: number;
        hungryBadge?: THREE.Group;
      }
    >
  >(new Map());

  // Listen to keyboard for desktop movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'w', 'arrowdown', 's', 'arrowleft', 'a', 'arrowright', 'd'].includes(k)) {
        keysPressedRef.current[k] = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysPressedRef.current[k] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const gl =
          document.createElement('canvas').getContext('webgl2') ||
          document.createElement('canvas').getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return (
          /SwiftShader|llvmpipe|softpipe|Software|Basic Render|Mesa|Google|Headless/i.test(gpu) ||
          /HeadlessChrome/i.test(navigator.userAgent)
        );
      } catch {
        return true;
      }
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 560;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfef9c3, 0.016); // Gentle warm sunshine haze

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 5.5, 9.5);
    camera.lookAt(0, 1.2, 1.5);

    // Environment Lighting
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Warm Sun Light
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    sunLight.position.set(6, 12, 8);
    sunLight.castShadow = !isSoftwareGl;
    if (sunLight.castShadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 35;
      sunLight.shadow.camera.left = -12;
      sunLight.shadow.camera.right = 12;
      sunLight.shadow.camera.top = 12;
      sunLight.shadow.camera.bottom = -12;
    }
    scene.add(sunLight);

    const ambientLight = new THREE.HemisphereLight(0xffedd5, 0xbbf7d0, 0.9);
    scene.add(ambientLight);

    // --- 1. Park Terrain & Grounds ---
    const parkGroundGroup = new THREE.Group();
    scene.add(parkGroundGroup);

    // Spacious lush green lawn floor
    const lawnGeom = new THREE.CylinderGeometry(16, 16, 0.2, 36);
    const lawnMat = new THREE.MeshStandardMaterial({
      color: 0x86efac, // soft green lawn
      roughness: 0.9,
      metalness: 0.0,
    });
    const lawn = new THREE.Mesh(lawnGeom, lawnMat);
    lawn.position.set(0, -0.1, 0);
    lawn.receiveShadow = !isSoftwareGl;
    parkGroundGroup.add(lawn);

    // Stone pathway around the central playground
    const pathGeom = new THREE.RingGeometry(3.6, 5.5, 36);
    pathGeom.rotateX(-Math.PI / 2);
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.85,
    });
    const pathRing = new THREE.Mesh(pathGeom, pathMat);
    pathRing.position.set(0, 0.015, 0);
    pathRing.receiveShadow = !isSoftwareGl;
    parkGroundGroup.add(pathRing);

    // Stepping stones entrance
    for (let i = 0; i < 7; i++) {
      const stepGeom = new THREE.CylinderGeometry(0.5, 0.55, 0.04, 16);
      const step = new THREE.Mesh(stepGeom, pathMat);
      step.position.set((Math.random() - 0.5) * 0.4, 0.02, 5.2 + i * 0.9);
      step.rotation.y = Math.random() * Math.PI;
      parkGroundGroup.add(step);
    }

    // --- 2. Central Cat Playground: Multi-tier Wooden Cat Tower ---
    const catTowerGroup = new THREE.Group();
    catTowerGroup.position.set(0, 0, 0);
    scene.add(catTowerGroup);

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // warm honey wood
      roughness: 0.7,
    });
    const sisalMat = new THREE.MeshStandardMaterial({
      color: 0xe5e7eb, // soft scratch fabric
      roughness: 0.9,
    });
    const cushionMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a, // soft pastel yellow cushion
      roughness: 0.6,
    });

    // Tower Base
    const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 0.25, 24), woodMat);
    towerBase.position.set(0, 0.125, 0);
    towerBase.receiveShadow = !isSoftwareGl;
    catTowerGroup.add(towerBase);

    // Central Scratching Pillars
    const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.6, 16), sisalMat);
    pillar1.position.set(-0.6, 0.9, -0.4);
    catTowerGroup.add(pillar1);

    const pillar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.6, 16), sisalMat);
    pillar2.position.set(0.6, 1.4, -0.3);
    catTowerGroup.add(pillar2);

    const pillarCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 3.8, 16), sisalMat);
    pillarCenter.position.set(0, 2.0, 0.3);
    catTowerGroup.add(pillarCenter);

    // Platform Tier 1 (Low platform)
    const plat1 = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.1, 20), woodMat);
    plat1.position.set(-0.6, 1.7, -0.4);
    catTowerGroup.add(plat1);

    const pad1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.05, 20), cushionMat);
    pad1.position.set(-0.6, 1.77, -0.4);
    catTowerGroup.add(pad1);

    // Platform Tier 2 (Mid platform)
    const plat2 = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.1, 20), woodMat);
    plat2.position.set(0.6, 2.7, -0.3);
    catTowerGroup.add(plat2);

    const pad2 = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.05, 20), cushionMat);
    pad2.position.set(0.6, 2.77, -0.3);
    catTowerGroup.add(pad2);

    // Platform Tier 3: Cozy Top Cat Bed House
    const topHouseGroup = new THREE.Group();
    topHouseGroup.position.set(0, 3.9, 0.3);
    catTowerGroup.add(topHouseGroup);

    const houseBase = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.15, 24), woodMat);
    topHouseGroup.add(houseBase);

    // House walls with entry arch
    const houseWall = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.0, 0.8, 24, 1, true, 0.5, Math.PI * 1.6),
      woodMat
    );
    houseWall.position.set(0, 0.45, 0);
    topHouseGroup.add(houseWall);

    // House roof with cute cat ears
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.7, 24), woodMat);
    roof.position.set(0, 1.15, 0);
    topHouseGroup.add(roof);

    // Hanging Pom-pom Toy from tier 1
    const pomString = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8),
      new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
    );
    pomString.position.set(-0.9, 1.35, -0.4);
    catTowerGroup.add(pomString);

    const pomBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.8 })
    );
    pomBall.position.set(-0.9, 1.0, -0.4);
    catTowerGroup.add(pomBall);

    // --- 3. Cozy Picnic Mat Area ---
    const picnicGroup = new THREE.Group();
    picnicGroup.position.set(4.2, 0.02, 2.5);
    scene.add(picnicGroup);

    // Checkered picnic blanket
    const blanket = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.02, 2.0),
      new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.9 })
    );
    picnicGroup.add(blanket);

    // Cushions on picnic mat
    const cushionGeom = new THREE.CylinderGeometry(0.35, 0.4, 0.12, 16);
    const cushion1 = new THREE.Mesh(
      cushionGeom,
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.7 })
    );
    cushion1.position.set(-0.6, 0.08, -0.4);
    picnicGroup.add(cushion1);

    // Snack bowl with fish treats
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.2, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 })
    );
    bowl.position.set(0.4, 0.08, 0.3);
    picnicGroup.add(bowl);

    // Fish snack in bowl
    const fishTreat = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.06, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xf97316 })
    );
    fishTreat.position.set(0.4, 0.16, 0.3);
    picnicGroup.add(fishTreat);

    // --- 4. Cardboard Nap Box (Cat Favorite!) ---
    const boxGroup = new THREE.Group();
    boxGroup.position.set(-2.2, 0.01, 5.0);
    boxGroup.rotation.y = 0.4;
    scene.add(boxGroup);

    const boxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
    const boxBottom = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 1.3), boxMat);
    boxGroup.add(boxBottom);

    const wallGeom = new THREE.BoxGeometry(1.6, 0.45, 0.06);
    const wall1 = new THREE.Mesh(wallGeom, boxMat);
    wall1.position.set(0, 0.22, 0.65);
    boxGroup.add(wall1);

    const wall2 = new THREE.Mesh(wallGeom, boxMat);
    wall2.position.set(0, 0.22, -0.65);
    boxGroup.add(wall2);

    const sideGeom = new THREE.BoxGeometry(0.06, 0.45, 1.3);
    const wall3 = new THREE.Mesh(sideGeom, boxMat);
    wall3.position.set(0.8, 0.22, 0);
    boxGroup.add(wall3);

    const wall4 = new THREE.Mesh(sideGeom, boxMat);
    wall4.position.set(-0.8, 0.22, 0);
    boxGroup.add(wall4);

    // --- 5. Playground Yarn Balls & Toys scattered on grass ---
    const yarn1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.85 })
    );
    yarn1.position.set(-3.5, 0.22, 1.0);
    scene.add(yarn1);

    const yarn2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.85 })
    );
    yarn2.position.set(1.5, 0.2, -3.2);
    scene.add(yarn2);

    // --- 6. Park Trees & Flower Bushes ---
    const treePositions = [
      [-6.5, -4.5],
      [6.5, -4.5],
      [-7.5, 3.5],
      [7.5, 3.5],
      [-5.0, 7.5],
      [5.0, 7.5],
    ];
    treePositions.forEach(([tx, tz]) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tx, 0, tz);
      scene.add(treeGroup);

      // Trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.35, 2.8, 10),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
      );
      trunk.position.set(0, 1.4, 0);
      treeGroup.add(trunk);

      // Fluffy foliage (Sakura pink & fresh green mix)
      const foliageMat = new THREE.MeshStandardMaterial({
        color: tx > 0 ? 0xfbcfe8 : 0x86efac,
        roughness: 0.8,
      });
      for (let f = 0; f < 4; f++) {
        const leafSphere = new THREE.Mesh(
          new THREE.SphereGeometry(1.1 - f * 0.15, 12, 12),
          foliageMat
        );
        leafSphere.position.set(
          (Math.random() - 0.5) * 0.8,
          2.4 + f * 0.5,
          (Math.random() - 0.5) * 0.8
        );
        treeGroup.add(leafSphere);
      }
    });

    // Flower patches
    const flowerColors = [0xf43f5e, 0xfbbf24, 0xa855f7, 0x38bdf8];
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const dist = 7.0 + Math.random() * 2.5;
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshStandardMaterial({
          color: flowerColors[i % flowerColors.length],
          roughness: 0.7,
        })
      );
      flower.position.set(Math.cos(angle) * dist, 0.12, Math.sin(angle) * dist);
      scene.add(flower);
    }

    // --- 7. Spawn Local Player Cat ---
    const myCatParts = createCat3DModel(myCatRef.current.breed);
    myCatParts.root.position.set(myPosRef.current.x, 0, myPosRef.current.z);
    myCatParts.root.scale.set(0.75, 0.75, 0.75);
    scene.add(myCatParts.root);
    updateCatAccessory(myCatParts.accessoryGroup, myCatRef.current.accessory);
    myModelRef.current = myCatParts;

    // Helper to create 3D Floating Hungry Cat Icon Badge
    const createHungryBadge = () => {
      const badgeGroup = new THREE.Group();
      // Cute floating bubble
      const bubble = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0xef4444,
          roughness: 0.3,
          metalness: 0.1,
        })
      );
      badgeGroup.add(bubble);

      // Fish bone emblem
      const fish = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.08, 0.12),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      badgeGroup.add(fish);

      badgeGroup.position.set(0, 1.8, 0);
      return badgeGroup;
    };

    // --- 8. Raycaster Pointer Interaction for Cat Inspection ---
    const raycaster = new THREE.Raycaster();
    const mousePos = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

      mousePos.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mousePos.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mousePos, camera);

      // Check intersections with remote cats
      let foundUser: OnlineCatUser | null = null;
      let minDistance = Infinity;

      remoteModelsRef.current.forEach((item) => {
        const intersects = raycaster.intersectObjects(item.parts.root.children, true);
        if (intersects.length > 0 && intersects[0].distance < minDistance) {
          minDistance = intersects[0].distance;
          foundUser = item.user;
        }
      });

      if (foundUser) {
        playSound.zenBowl();
        onSelectCatRef.current(foundUser);
      }
    };

    renderer.domElement.addEventListener('click', handlePointerDown);

    // --- 9. Animation & Game Loop ---
    let clock = new THREE.Clock();
    let frameId = 0;
    let isDisposed = false;
    let lastNetworkSend = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      try {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isDisposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 10);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 10);
      } catch {
        frameId = window.setTimeout(cb, 80);
      }
    }

    const animate = () => {
      if (isDisposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Swing pom-pom toy gently
      pomBall.position.x = -0.9 + Math.sin(time * 3) * 0.12;
      pomBall.position.z = -0.4 + Math.cos(time * 2.5) * 0.12;

      // --- Process Local Movement Inputs ---
      let moveX = 0;
      let moveZ = 0;
      const keys = keysPressedRef.current;

      if (keys['w'] || keys['arrowup']) moveZ -= 1;
      if (keys['s'] || keys['arrowdown']) moveZ += 1;
      if (keys['a'] || keys['arrowleft']) moveX -= 1;
      if (keys['d'] || keys['arrowright']) moveX += 1;

      // Add virtual joystick
      if (virtualJoyRef.current.x !== 0 || virtualJoyRef.current.y !== 0) {
        moveX += virtualJoyRef.current.x;
        moveZ += virtualJoyRef.current.y;
      }

      const isMoving = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05;

      // Handle Park Action timeout
      if (myActionRef.current !== 'idle') {
        actionTimerRef.current -= delta;
        if (actionTimerRef.current <= 0) {
          myActionRef.current = 'idle';
        }
      }

      if (isMoving && myActionRef.current === 'idle') {
        const speed = 3.5 * delta;
        const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
        const normX = moveX / len;
        const normZ = moveZ / len;

        const nextX = THREE.MathUtils.clamp(myPosRef.current.x + normX * speed, -10, 10);
        const nextZ = THREE.MathUtils.clamp(myPosRef.current.z + normZ * speed, -10, 10);

        // Turn towards movement angle
        const targetAngle = Math.atan2(normX, normZ);
        myPosRef.current.rotY = THREE.MathUtils.damp(
          myPosRef.current.rotY,
          targetAngle,
          10,
          delta
        );
        myPosRef.current.x = nextX;
        myPosRef.current.z = nextZ;
        myPosRef.current.isMoving = true;
      } else {
        myPosRef.current.isMoving = false;
      }

      // Sync local model position & rotation
      if (myModelRef.current) {
        const root = myModelRef.current.root;
        root.position.x = myPosRef.current.x;
        root.position.z = myPosRef.current.z;
        root.rotation.y = myPosRef.current.rotY;

        // Animate local actions
        if (myActionRef.current === 'roll') {
          // Playful roll over showing belly
          myModelRef.current.catBodyGroup.rotation.z = Math.sin(time * 6) * 0.8;
          myModelRef.current.catBodyGroup.position.y = -0.1;
        } else if (myActionRef.current === 'loaf') {
          // Paws tucked under body, cozy bread loaf
          myModelRef.current.catBodyGroup.rotation.x = 0;
          myModelRef.current.catBodyGroup.rotation.z = 0;
          myModelRef.current.catBodyGroup.position.y = -0.15;
          myModelRef.current.leftEyelid.scale.y = 1.0;
          myModelRef.current.rightEyelid.scale.y = 1.0;
        } else if (myActionRef.current === 'purr') {
          // Gentle rhythmic vibrating purr
          myModelRef.current.catBodyGroup.position.y = Math.sin(time * 25) * 0.04;
          myModelRef.current.tailGroup.rotation.z = Math.sin(time * 8) * 0.5;
        } else if (myActionRef.current === 'play_yarn') {
          // Playfully batting paws
          myModelRef.current.frontLeftPaw.position.y = Math.abs(Math.sin(time * 10)) * 0.25;
          myModelRef.current.frontLeftPaw.position.z = 0.2;
        } else if (myPosRef.current.isMoving) {
          // Walking paws swing & tail wave
          const walkCycle = Math.sin(time * 12);
          myModelRef.current.frontLeftPaw.position.z = walkCycle * 0.15;
          myModelRef.current.frontRightPaw.position.z = -walkCycle * 0.15;
          myModelRef.current.catBodyGroup.position.y = Math.abs(Math.sin(time * 12)) * 0.05;
          myModelRef.current.catBodyGroup.rotation.z = 0;
          myModelRef.current.leftEyelid.scale.y = 0;
          myModelRef.current.rightEyelid.scale.y = 0;
        } else {
          // Idle breathing
          myModelRef.current.catBodyGroup.position.y = 0;
          myModelRef.current.catBodyGroup.rotation.z = THREE.MathUtils.damp(
            myModelRef.current.catBodyGroup.rotation.z,
            0,
            8,
            delta
          );
          myModelRef.current.frontLeftPaw.position.z = 0;
          myModelRef.current.frontRightPaw.position.z = 0;
          myModelRef.current.leftEyelid.scale.y = 0;
          myModelRef.current.rightEyelid.scale.y = 0;
        }
      }

      // Camera smoothly follows player cat from isometric view
      const targetCamX = myPosRef.current.x * 0.45;
      const targetCamZ = myPosRef.current.z + 5.5;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 4, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 4, delta);
      camera.lookAt(myPosRef.current.x * 0.45, 1.2, myPosRef.current.z * 0.6);

      // Throttled network broadcast (every 100ms)
      if (Date.now() - lastNetworkSend > 90) {
        lastNetworkSend = Date.now();
        onMoveRef.current(
          myPosRef.current.x,
          myPosRef.current.z,
          myPosRef.current.rotY,
          myPosRef.current.isMoving
        );
      }

      // --- Synchronize Remote User Cats ---
      const activeUserIds = new Set<string>();
      remoteUsersRef.current.forEach((user) => {
        activeUserIds.add(user.id);
        let item = remoteModelsRef.current.get(user.id);

        if (!item) {
          // Spawn new remote cat
          const parts = createCat3DModel(user.breed || 'cheese');
          parts.root.position.set(user.x, 0, user.z);
          parts.root.rotation.y = user.rotY || 0;
          parts.root.scale.set(0.75, 0.75, 0.75);
          scene.add(parts.root);
          updateCatAccessory(parts.accessoryGroup, user.accessory || 'none');

          let hungryBadge: THREE.Group | undefined;
          if (user.isHungry || user.fullness <= 30) {
            hungryBadge = createHungryBadge();
            parts.root.add(hungryBadge);
          }

          item = {
            parts,
            user,
            targetX: user.x,
            targetZ: user.z,
            targetRotY: user.rotY,
            currentAction: user.currentAction || 'idle',
            actionTimer: 0,
            hungryBadge,
          };
          remoteModelsRef.current.set(user.id, item);
        } else {
          item.user = user;
          item.targetX = user.x;
          item.targetZ = user.z;
          item.targetRotY = user.rotY;
          item.currentAction = user.currentAction || 'idle';

          // Update hungry badge visibility
          const isHungryNow = user.isHungry || user.fullness <= 30;
          if (isHungryNow && !item.hungryBadge) {
            item.hungryBadge = createHungryBadge();
            item.parts.root.add(item.hungryBadge);
          } else if (!isHungryNow && item.hungryBadge) {
            item.parts.root.remove(item.hungryBadge);
            item.hungryBadge = undefined;
          }
        }

        // Interpolate remote position smoothly
        const root = item.parts.root;
        root.position.x = THREE.MathUtils.damp(root.position.x, item.targetX, 8, delta);
        root.position.z = THREE.MathUtils.damp(root.position.z, item.targetZ, 8, delta);
        root.rotation.y = THREE.MathUtils.damp(root.rotation.y, item.targetRotY, 8, delta);

        // Bob hungry badge up and down
        if (item.hungryBadge) {
          item.hungryBadge.position.y = 1.7 + Math.sin(time * 4) * 0.12;
        }

        // Remote cat animations
        if (item.currentAction === 'roll') {
          item.parts.catBodyGroup.rotation.z = Math.sin(time * 6) * 0.8;
          item.parts.catBodyGroup.position.y = -0.1;
        } else if (item.currentAction === 'loaf' || user.isHungry) {
          // Hungry or loafing cats lie down
          item.parts.catBodyGroup.position.y = -0.15;
          item.parts.leftEyelid.scale.y = 0.8;
          item.parts.rightEyelid.scale.y = 0.8;
        } else if (item.currentAction === 'purr') {
          item.parts.catBodyGroup.position.y = Math.sin(time * 25) * 0.04;
        } else if (user.isMoving) {
          const walk = Math.sin(time * 12);
          item.parts.frontLeftPaw.position.z = walk * 0.15;
          item.parts.frontRightPaw.position.z = -walk * 0.15;
          item.parts.catBodyGroup.position.y = Math.abs(Math.sin(time * 12)) * 0.05;
        } else {
          item.parts.catBodyGroup.rotation.z = 0;
          item.parts.catBodyGroup.position.y = 0;
          item.parts.frontLeftPaw.position.z = 0;
          item.parts.frontRightPaw.position.z = 0;
        }
      });

      // Remove disconnected remote cats
      remoteModelsRef.current.forEach((val, id) => {
        if (!activeUserIds.has(id)) {
          scene.remove(val.parts.root);
          remoteModelsRef.current.delete(id);
        }
      });

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(animate);
      } else {
        frameId = requestAnimationFrame(animate);
      }
    };

    // Start loop
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      if (frameId) {
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
      }
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handlePointerDown);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync accessory changes on local cat
  useEffect(() => {
    if (myModelRef.current) {
      updateCatAccessory(myModelRef.current.accessoryGroup, myCat.accessory);
    }
  }, [myCat.accessory]);

  // Method to trigger action locally
  const triggerLocalAction = (action: ParkActionType) => {
    myActionRef.current = action;
    actionTimerRef.current = action === 'roll' ? 3.0 : action === 'loaf' ? 4.5 : 2.5;

    if (action === 'roll') {
      playSound.purr();
    } else if (action === 'purr') {
      playSound.zenChime();
    } else if (action === 'loaf') {
      playSound.pet();
    } else if (action === 'play_yarn') {
      playSound.coin();
    }

    onPerformAction(action);
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-pointer touch-none" />

      {/* Floating Action / Like / Rescue Notification Banner */}
      {recentActionNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-stone-900/90 text-amber-300 px-4 py-2 rounded-2xl shadow-lg border border-amber-500/40 text-xs font-bold flex items-center gap-2 backdrop-blur-md animate-fade-in whitespace-nowrap">
          <span>🐾</span>
          <span>
            {recentActionNotification.action === 'like' &&
              `'${recentActionNotification.name}' 님이 '${recentActionNotification.targetName}' 냥이에게 응원 하트를 보냈습니다! ❤️`}
            {recentActionNotification.action === 'rescued_food' &&
              `'${recentActionNotification.name}' 님이 배고픈 '${recentActionNotification.targetName}' 냥이에게 간식을 챙겨주었습니다! 🐟✨`}
            {recentActionNotification.action === 'roll' &&
              `'${recentActionNotification.name}' 냥이가 발라당 누워 배를 보여주며 애교를 부립니다 🐾`}
            {recentActionNotification.action === 'purr' &&
              `'${recentActionNotification.name}' 냥이가 따뜻한 골골송을 부릅니다 🎶`}
            {recentActionNotification.action === 'loaf' &&
              `'${recentActionNotification.name}' 냥이가 식빵을 구우며 평화롭게 휴식합니다 🍞`}
            {recentActionNotification.action === 'play_yarn' &&
              `'${recentActionNotification.name}' 냥이가 털실을 굴리며 신나게 놉니다 🧶`}
          </span>
        </div>
      )}

      {/* On-Screen Mobile Movement Controls (Virtual D-Pad in bottom left) */}
      <div className="absolute bottom-20 left-4 z-20 flex flex-col items-center gap-1.5 opacity-85 hover:opacity-100 transition-opacity">
        <button
          type="button"
          onMouseDown={() => (virtualJoyRef.current.y = -1)}
          onMouseUp={() => (virtualJoyRef.current.y = 0)}
          onTouchStart={() => (virtualJoyRef.current.y = -1)}
          onTouchEnd={() => (virtualJoyRef.current.y = 0)}
          className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md shadow-md border border-stone-200 text-stone-700 font-black text-sm flex items-center justify-center active:scale-95 cursor-pointer"
        >
          ▲
        </button>
        <div className="flex gap-1.5">
          <button
            type="button"
            onMouseDown={() => (virtualJoyRef.current.x = -1)}
            onMouseUp={() => (virtualJoyRef.current.x = 0)}
            onTouchStart={() => (virtualJoyRef.current.x = -1)}
            onTouchEnd={() => (virtualJoyRef.current.x = 0)}
            className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md shadow-md border border-stone-200 text-stone-700 font-black text-sm flex items-center justify-center active:scale-95 cursor-pointer"
          >
            ◀
          </button>
          <button
            type="button"
            onMouseDown={() => (virtualJoyRef.current.y = 1)}
            onMouseUp={() => (virtualJoyRef.current.y = 0)}
            onTouchStart={() => (virtualJoyRef.current.y = 1)}
            onTouchEnd={() => (virtualJoyRef.current.y = 0)}
            className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md shadow-md border border-stone-200 text-stone-700 font-black text-sm flex items-center justify-center active:scale-95 cursor-pointer"
          >
            ▼
          </button>
          <button
            type="button"
            onMouseDown={() => (virtualJoyRef.current.x = 1)}
            onMouseUp={() => (virtualJoyRef.current.x = 0)}
            onTouchStart={() => (virtualJoyRef.current.x = 1)}
            onTouchEnd={() => (virtualJoyRef.current.x = 0)}
            className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md shadow-md border border-stone-200 text-stone-700 font-black text-sm flex items-center justify-center active:scale-95 cursor-pointer"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Floating Cat Park Action Toolbar (Bottom Right) */}
      <div className="absolute bottom-20 right-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => triggerLocalAction('roll')}
          className="px-3 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-lg shadow-amber-500/30 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-amber-300"
          title="발라당 애교 부리기"
        >
          <span className="text-base">🐾</span>
          <span>발라당</span>
        </button>

        <button
          type="button"
          onClick={() => triggerLocalAction('purr')}
          className="px-3 py-2 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs shadow-lg shadow-rose-500/30 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-rose-300"
          title="골골송 부르기"
        >
          <span className="text-base">🎶</span>
          <span>골골송</span>
        </button>

        <button
          type="button"
          onClick={() => triggerLocalAction('loaf')}
          className="px-3 py-2 rounded-2xl bg-stone-700 hover:bg-stone-800 text-white font-extrabold text-xs shadow-lg flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-stone-600"
          title="식빵 굽기"
        >
          <span className="text-base">🍞</span>
          <span>식빵 굽기</span>
        </button>

        <button
          type="button"
          onClick={() => triggerLocalAction('play_yarn')}
          className="px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-emerald-400"
          title="털실 굴리기"
        >
          <span className="text-base">🧶</span>
          <span>털실 놀이</span>
        </button>
      </div>
    </div>
  );
};
