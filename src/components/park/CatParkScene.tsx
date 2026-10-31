import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CatState, CatBreedId, CatAccessory } from '../../types/cat';
import { OnlineCatUser, ParkActionType, ZenActionNotification } from '../../types/park';
import { createCat3DModel, updateCatAccessory, CatModelParts } from '../cat3d/catModel';
import { playSound } from '../../utils/audio';

interface CatParkSceneProps {
  myCat: CatState;
  remoteUsers: OnlineCatUser[];
  onMoveMyCat: (x: number, z: number, rotY: number, isMoving: boolean) => void;
  onPerformAction: (action: ParkActionType) => void;
  recentActionNotification: ZenActionNotification | null;
}

export const CatParkScene: React.FC<CatParkSceneProps> = ({
  myCat,
  remoteUsers,
  onMoveMyCat,
  onPerformAction,
  recentActionNotification,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const myCatRef = useRef(myCat);
  myCatRef.current = myCat;

  const remoteUsersRef = useRef<OnlineCatUser[]>(remoteUsers);
  remoteUsersRef.current = remoteUsers;

  const onMoveRef = useRef(onMoveMyCat);
  onMoveRef.current = onMoveMyCat;

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
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 560;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfef3c7, 0.022); // Warm soothing morning mist

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 5.5, 9.5);
    camera.lookAt(0, 1.2, 1.5);

    // Environment Lighting
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Warm Sun Light
    const sunLight = new THREE.DirectionalLight(0xffedd5, 2.0);
    sunLight.position.set(5, 10, 7);
    sunLight.castShadow = !isSoftwareGl;
    if (sunLight.castShadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 30;
      sunLight.shadow.camera.left = -10;
      sunLight.shadow.camera.right = 10;
      sunLight.shadow.camera.top = 10;
      sunLight.shadow.camera.bottom = -10;
    }
    scene.add(sunLight);

    const ambientLight = new THREE.HemisphereLight(0xfffbeb, 0xdcfce7, 0.85);
    scene.add(ambientLight);

    // --- 1. Zen Garden Terrain & Grounds ---
    const parkGroundGroup = new THREE.Group();
    scene.add(parkGroundGroup);

    // Lush green lawn floor
    const lawnGeom = new THREE.CylinderGeometry(14, 14, 0.2, 32);
    const lawnMat = new THREE.MeshStandardMaterial({
      color: 0x86efac, // soft zen moss green
      roughness: 0.9,
      metalness: 0.0,
    });
    const lawn = new THREE.Mesh(lawnGeom, lawnMat);
    lawn.position.set(0, -0.1, 0);
    lawn.receiveShadow = !isSoftwareGl;
    parkGroundGroup.add(lawn);

    // Stone pathway circle around statue
    const pathGeom = new THREE.RingGeometry(3.2, 5.0, 32);
    pathGeom.rotateX(-Math.PI / 2);
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // smooth light stone
      roughness: 0.85,
    });
    const pathRing = new THREE.Mesh(pathGeom, pathMat);
    pathRing.position.set(0, 0.015, 0);
    pathRing.receiveShadow = !isSoftwareGl;
    parkGroundGroup.add(pathRing);

    // Stepping stones leading to center
    for (let i = 0; i < 6; i++) {
      const stepGeom = new THREE.CylinderGeometry(0.5, 0.55, 0.04, 16);
      const step = new THREE.Mesh(stepGeom, pathMat);
      step.position.set((Math.random() - 0.5) * 0.4, 0.02, 5.0 + i * 1.0);
      step.rotation.y = Math.random() * Math.PI;
      parkGroundGroup.add(step);
    }

    // --- 2. Central Monument: 대형 황금 냥이 수호신 불상 (Giant Golden Cat Buddha) ---
    const monumentGroup = new THREE.Group();
    monumentGroup.position.set(0, 0, 0);
    scene.add(monumentGroup);

    // Multi-tier lotus plinth
    const plinthBase = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.4, 0.35, 24),
      new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.8 })
    );
    plinthBase.position.set(0, 0.175, 0);
    monumentGroup.add(plinthBase);

    const lotusPlinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.0, 0.25, 24),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5, metalness: 0.2 })
    );
    lotusPlinth.position.set(0, 0.45, 0);
    monumentGroup.add(lotusPlinth);

    // Giant Golden Cat Statue
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // deep warm gold
      roughness: 0.3,
      metalness: 0.85,
    });

    const statueGroup = new THREE.Group();
    statueGroup.position.set(0, 0.58, 0);
    monumentGroup.add(statueGroup);

    // Statue Torso
    const statueTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 0.9, 16, 24), goldMat);
    statueTorso.position.set(0, 1.0, 0);
    statueGroup.add(statueTorso);

    // Statue Head
    const statueHead = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 24), goldMat);
    statueHead.position.set(0, 2.1, 0.15);
    statueGroup.add(statueHead);

    // Statue Ears
    const earGeom = new THREE.ConeGeometry(0.35, 0.6, 16);
    const leftEar = new THREE.Mesh(earGeom, goldMat);
    leftEar.position.set(-0.55, 2.7, 0.1);
    leftEar.rotation.z = -0.25;
    statueGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeom, goldMat);
    rightEar.position.set(0.55, 2.7, 0.1);
    rightEar.rotation.z = 0.25;
    statueGroup.add(rightEar);

    // Peaceful closed smile & eyes on statue
    const smileGeom = new THREE.TorusGeometry(0.2, 0.03, 8, 16, Math.PI);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0xb45309 });
    const statueSmile = new THREE.Mesh(smileGeom, smileMat);
    statueSmile.position.set(0, 1.85, 0.96);
    statueGroup.add(statueSmile);

    // Paws resting together in serene meditation mudra
    const pawGeom = new THREE.SphereGeometry(0.32, 16, 16);
    pawGeom.scale(1.2, 0.8, 1.2);
    const leftPaw = new THREE.Mesh(pawGeom, goldMat);
    leftPaw.position.set(-0.4, 0.3, 0.7);
    statueGroup.add(leftPaw);

    const rightPaw = new THREE.Mesh(pawGeom, goldMat);
    rightPaw.position.set(0.4, 0.3, 0.7);
    statueGroup.add(rightPaw);

    // Glowing Golden Halo Ring behind Statue Head
    const haloGeom = new THREE.TorusGeometry(1.3, 0.06, 16, 48);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    halo.position.set(0, 2.15, -0.4);
    statueGroup.add(halo);

    // Incense Burner Pot (향로) in front of Statue
    const burnerGroup = new THREE.Group();
    burnerGroup.position.set(0, 0.15, 1.85);
    scene.add(burnerGroup);

    const burnerBowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.25, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.6, metalness: 0.4 })
    );
    burnerBowl.position.set(0, 0.15, 0);
    burnerGroup.add(burnerBowl);

    // Incense smoke particles
    const smokeParticlesGroup = new THREE.Group();
    burnerGroup.add(smokeParticlesGroup);

    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.5,
    });
    const smokeMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < 15; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.06 + i * 0.01, 8, 8), smokeMat.clone());
      p.userData = { speed: 0.4 + Math.random() * 0.3, offset: i * 0.2, angle: i * 0.4 };
      smokeParticlesGroup.add(p);
      smokeMeshes.push(p);
    }

    // --- 3. Sakura Cherry Blossom Trees around perimeter ---
    const treePositions = [
      [-6, -4],
      [6, -4],
      [-7, 3],
      [7, 3],
      [-4, 7],
      [4, 7],
    ];
    treePositions.forEach(([tx, tz]) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tx, 0, tz);
      scene.add(treeGroup);

      // Trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.35, 3.0, 10),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
      );
      trunk.position.set(0, 1.5, 0);
      treeGroup.add(trunk);

      // Fluffy pink blossom foliage
      const foliageMat = new THREE.MeshStandardMaterial({
        color: 0xfbcfe8, // soft sakura pink
        roughness: 0.8,
      });
      for (let f = 0; f < 4; f++) {
        const blossom = new THREE.Mesh(new THREE.SphereGeometry(1.1 - f * 0.15, 12, 12), foliageMat);
        blossom.position.set(
          (Math.random() - 0.5) * 0.8,
          2.6 + f * 0.5,
          (Math.random() - 0.5) * 0.8
        );
        treeGroup.add(blossom);
      }
    });

    // --- 4. Spawn Local Player Cat ---
    const myCatParts = createCat3DModel(myCatRef.current.breed);
    myCatParts.root.position.set(myPosRef.current.x, 0, myPosRef.current.z);
    myCatParts.root.scale.set(0.75, 0.75, 0.75);
    scene.add(myCatParts.root);
    updateCatAccessory(myCatParts.accessoryGroup, myCatRef.current.accessory);
    myModelRef.current = myCatParts;

    // --- 5. Animation & Game Loop ---
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

      // --- 1. Process Local Movement Inputs ---
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

      // Handle Zen Action timeout
      if (myActionRef.current !== 'idle') {
        actionTimerRef.current -= delta;
        if (actionTimerRef.current <= 0) {
          myActionRef.current = 'idle';
        }
      }

      if (isMoving && myActionRef.current === 'idle') {
        const speed = 3.2 * delta;
        const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
        const normX = moveX / len;
        const normZ = moveZ / len;

        const nextX = THREE.MathUtils.clamp(myPosRef.current.x + normX * speed, -8, 8);
        const nextZ = THREE.MathUtils.clamp(myPosRef.current.z + normZ * speed, -8, 8);

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

        // Animate local walking or Zen action
        if (myActionRef.current === 'bow') {
          // Deep peaceful cat bow
          myModelRef.current.catBodyGroup.rotation.x = THREE.MathUtils.damp(
            myModelRef.current.catBodyGroup.rotation.x,
            0.65,
            8,
            delta
          );
          myModelRef.current.head.rotation.x = THREE.MathUtils.damp(
            myModelRef.current.head.rotation.x,
            0.7,
            8,
            delta
          );
          myModelRef.current.catBodyGroup.position.y = 0;
        } else if (myActionRef.current === 'loaf') {
          // Paws tucked under body, eyes shut
          myModelRef.current.catBodyGroup.rotation.x = 0;
          myModelRef.current.catBodyGroup.position.y = -0.15;
          myModelRef.current.leftEyelid.scale.y = 1.0;
          myModelRef.current.rightEyelid.scale.y = 1.0;
        } else if (myPosRef.current.isMoving) {
          // Walking paws swing & tail wave
          const walkCycle = Math.sin(time * 12);
          myModelRef.current.frontLeftPaw.position.z = walkCycle * 0.15;
          myModelRef.current.frontRightPaw.position.z = -walkCycle * 0.15;
          myModelRef.current.catBodyGroup.position.y = Math.abs(Math.sin(time * 12)) * 0.05;
          myModelRef.current.catBodyGroup.rotation.x = 0;
        } else {
          // Idle breathing
          myModelRef.current.catBodyGroup.position.y = 0;
          myModelRef.current.catBodyGroup.rotation.x = THREE.MathUtils.damp(
            myModelRef.current.catBodyGroup.rotation.x,
            0,
            8,
            delta
          );
          myModelRef.current.frontLeftPaw.position.z = 0;
          myModelRef.current.frontRightPaw.position.z = 0;
        }
      }

      // Camera smoothly follows player cat from friendly isometric angle
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

      // --- 2. Update Incense Smoke Particles & Statue Halo ---
      halo.rotation.z = time * 0.2;
      smokeMeshes.forEach((mesh) => {
        mesh.position.y += mesh.userData.speed * delta;
        mesh.position.x = Math.sin(time * 2 + mesh.userData.angle) * 0.08;
        mesh.position.z = Math.cos(time * 2 + mesh.userData.angle) * 0.08;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (mesh.position.y > 1.8) {
          mesh.position.y = 0.3;
          mat.opacity = 0.5;
        } else {
          mat.opacity = Math.max(0, 0.5 - (mesh.position.y - 0.3) * 0.3);
        }
      });

      // --- 3. Synchronize Remote User Cats ---
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

          item = {
            parts,
            user,
            targetX: user.x,
            targetZ: user.z,
            targetRotY: user.rotY,
            currentAction: user.currentAction || 'idle',
            actionTimer: 0,
          };
          remoteModelsRef.current.set(user.id, item);
        } else {
          item.targetX = user.x;
          item.targetZ = user.z;
          item.targetRotY = user.rotY;
          item.currentAction = user.currentAction || 'idle';
        }

        // Interpolate remote position smoothly
        const root = item.parts.root;
        root.position.x = THREE.MathUtils.damp(root.position.x, item.targetX, 8, delta);
        root.position.z = THREE.MathUtils.damp(root.position.z, item.targetZ, 8, delta);
        root.rotation.y = THREE.MathUtils.damp(root.rotation.y, item.targetRotY, 8, delta);

        // Remote cat actions
        if (item.currentAction === 'bow') {
          item.parts.catBodyGroup.rotation.x = THREE.MathUtils.damp(
            item.parts.catBodyGroup.rotation.x,
            0.65,
            8,
            delta
          );
        } else if (item.currentAction === 'loaf') {
          item.parts.catBodyGroup.position.y = -0.15;
        } else if (user.isMoving) {
          const walk = Math.sin(time * 12);
          item.parts.frontLeftPaw.position.z = walk * 0.15;
          item.parts.frontRightPaw.position.z = -walk * 0.15;
        } else {
          item.parts.catBodyGroup.rotation.x = 0;
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
    actionTimerRef.current = action === 'bow' ? 2.5 : action === 'loaf' ? 4.5 : 2.0;

    if (action === 'bow') {
      playSound.zenBowl();
    } else if (action === 'purr') {
      playSound.pet();
      playSound.zenChime();
    } else if (action === 'incense') {
      playSound.zenChime();
    } else if (action === 'loaf') {
      playSound.purr();
    }

    onPerformAction(action);
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-crosshair touch-none" />

      {/* Floating Zen Action Notification Banner */}
      {recentActionNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-stone-900/90 text-amber-300 px-4 py-2 rounded-2xl shadow-lg border border-amber-500/40 text-xs font-bold flex items-center gap-2 backdrop-blur-md animate-fade-in whitespace-nowrap">
          <span>🐾</span>
          <span>
            {recentActionNotification.action === 'bow' &&
              `'${recentActionNotification.name}' 냥이가 수호신 불상에 공손히 절을 올렸습니다 🙇`}
            {recentActionNotification.action === 'purr' &&
              `'${recentActionNotification.name}' 냥이가 따뜻한 골골송 하트를 전했습니다 💖`}
            {recentActionNotification.action === 'loaf' &&
              `'${recentActionNotification.name}' 냥이가 식빵을 구우며 평화롭게 명상합니다 🧘`}
            {recentActionNotification.action === 'incense' &&
              `'${recentActionNotification.name}' 냥이가 캣닢 향을 피워 축복을 나눕니다 🌿`}
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

      {/* Floating Zen Action Toolbar (Bottom Right) */}
      <div className="absolute bottom-20 right-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => triggerLocalAction('bow')}
          className="px-3 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-lg shadow-amber-500/30 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-amber-300"
          title="황금 고양이 불상과 친구들에게 절하기"
        >
          <span className="text-base">🙇</span>
          <span>절하기</span>
        </button>

        <button
          type="button"
          onClick={() => triggerLocalAction('purr')}
          className="px-3 py-2 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs shadow-lg shadow-rose-500/30 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-rose-300"
          title="하트 골골송 보내기"
        >
          <span className="text-base">💖</span>
          <span>골골 하트</span>
        </button>

        <button
          type="button"
          onClick={() => triggerLocalAction('loaf')}
          className="px-3 py-2 rounded-2xl bg-stone-700 hover:bg-stone-800 text-white font-extrabold text-xs shadow-lg flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-stone-600"
          title="식빵 굽기 명상"
        >
          <span className="text-base">🧘</span>
          <span>식빵 굽기</span>
        </button>

        <button
          type="button"
          onClick={() => triggerLocalAction('incense')}
          className="px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-emerald-400"
          title="캣닢 향 공양하기"
        >
          <span className="text-base">🌿</span>
          <span>향 올리기</span>
        </button>
      </div>
    </div>
  );
};
