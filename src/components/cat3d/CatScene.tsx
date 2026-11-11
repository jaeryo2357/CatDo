import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CatActionAnimation, CatBreedId, CatState } from '../../types/cat';
import { createCat3DModel, updateCatAccessory, CatModelParts } from './catModel';

interface CatSceneProps {
  cat: CatState;
  onPetCat: () => void;
  className?: string;
}

export const CatScene: React.FC<CatSceneProps> = ({ cat, onPetCat, className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const onPetRef = useRef(onPetCat);
  onPetRef.current = onPetCat;

  const catRef = useRef(cat);
  catRef.current = cat;

  const modelPartsRef = useRef<CatModelParts | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const lastBreedRef = useRef<CatBreedId>(cat.breed);
  const lastAppearanceKeyRef = useRef<string>(JSON.stringify(cat.customAppearance));
  const lastAccessoryRef = useRef(cat.accessory);
  const actionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL as per threejs guidelines
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render|Mesa|Google|Headless/i.test(gpu) || /HeadlessChrome/i.test(navigator.userAgent);
      } catch {
        return true;
      }
    })();

    // 2. Setup Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // 3. Scene & Camera (tuned for mobile portrait aspect ratio)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 2.0, 6.8);
    camera.lookAt(0, 1.15, 0);

    // Procedural Room Environment
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 4. Lighting Rig (Warm key light + cool hemisphere fill)
    const keyLight = new THREE.DirectionalLight(0xffedd5, 2.2);
    keyLight.position.set(3, 6, 4);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0xe2e8f0, 0.8);
    scene.add(hemiLight);

    // Soft Room Floor Platform & Rug
    const rugGroup = new THREE.Group();
    scene.add(rugGroup);

    // Cozy circular woven rug
    const rugGeom = new THREE.CylinderGeometry(2.2, 2.25, 0.04, 32);
    const rugMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7, // warm cream rug
      roughness: 0.95,
      metalness: 0.0,
    });
    const rug = new THREE.Mesh(rugGeom, rugMat);
    rug.position.set(0, 0.02, 0);
    rug.receiveShadow = !isSoftwareGl;
    rugGroup.add(rug);

    // Rug pastel decorative border ring
    const borderGeom = new THREE.TorusGeometry(2.05, 0.05, 12, 32);
    borderGeom.rotateX(Math.PI / 2);
    const borderMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.8 });
    const rugBorder = new THREE.Mesh(borderGeom, borderMat);
    rugBorder.position.set(0, 0.045, 0);
    rugGroup.add(rugBorder);

    // Contact shadow radial decal
    const shadowGeom = new THREE.PlaneGeometry(3.0, 3.0);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
    grad.addColorStop(0, 'rgba(30, 20, 10, 0.45)');
    grad.addColorStop(0.6, 'rgba(40, 25, 15, 0.18)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeom, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, 0.05, 0.1);
    scene.add(contactShadow);

    // 5. Create Cat 3D Model
    let catParts = createCat3DModel(catRef.current.breed, catRef.current.customAppearance);
    modelPartsRef.current = catParts;
    sceneRef.current = scene;
    scene.add(catParts.root);
    updateCatAccessory(catParts.accessoryGroup, catRef.current.accessory);

    // 6. Interactive Raycasting & Pointer Tracking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let targetHeadRotY = 0;
    let targetHeadRotX = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.x = x;
      mouse.y = y;

      // Soft head tilt towards pointer
      targetHeadRotY = THREE.MathUtils.clamp(x * 0.4, -0.45, 0.45);
      targetHeadRotX = THREE.MathUtils.clamp(-y * 0.25, -0.25, 0.2);
    };

    const handlePointerDown = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.set(x, y);
      raycaster.setFromCamera(mouse, camera);
      const currentParts = modelPartsRef.current;
      if (!currentParts) return;
      const intersects = raycaster.intersectObjects([currentParts.root], true);

      if (intersects.length > 0) {
        onPetRef.current();

        // Trigger heart burst
        const hearts = currentParts.heartParticles.children;
        hearts.forEach((h, i) => {
          h.userData.active = true;
          h.userData.progress = (i / hearts.length) * 0.4;
          (h as THREE.Mesh).position.set(
            (Math.random() - 0.5) * 0.8,
            1.2 + Math.random() * 0.4,
            0.4 + Math.random() * 0.4
          );
        });
      }
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('click', handlePointerDown);

    // 7. Animation State Variables
    let clock = new THREE.Clock();
    let frameId = 0;
    let isDisposed = false;

    let blinkTimer = 0;
    let nextBlinkTime = 2.5;
    let isBlinking = false;
    let blinkProgress = 0;

    let earFlickTimer = 0;
    let nextEarFlick = 4.0;
    let earFlickSide = 1;

    // Continuous loop with afterDraw software WebGL guard
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
      const currentCat = catRef.current;
      const parts = modelPartsRef.current;

      if (parts) {
        // --- 1. Breathing Motion ---
        const breathSpeed = currentCat.currentAnimation === 'sleep' ? 1.5 : 2.5;
        const breathAmount = Math.sin(time * breathSpeed) * 0.02;
        parts.torso.scale.set(1 + breathAmount * 0.5, 1 + breathAmount, 1 + breathAmount * 0.5);

        // --- 2. Head Tilt & Tracking ---
        if (currentCat.currentAnimation === 'sleep') {
          parts.head.position.y = 1.35;
          parts.head.rotation.x = 0.45;
          parts.head.rotation.y = 0;
          parts.head.rotation.z = 0.1;
        } else if (currentCat.currentAnimation === 'eat') {
          // Eating head bob
          const eatBob = Math.sin(time * 12) * 0.12;
          parts.head.position.y = 1.4 + eatBob;
          parts.head.rotation.x = 0.55 + Math.sin(time * 12) * 0.15;
          parts.head.rotation.y = 0;
          parts.foodContent.visible = true;
        } else {
          parts.head.position.y = 1.82;
          parts.foodContent.visible = false;
          // Smooth interpolation towards pointer
          parts.head.rotation.y = THREE.MathUtils.damp(parts.head.rotation.y, targetHeadRotY, 6, delta);
          parts.head.rotation.x = THREE.MathUtils.damp(parts.head.rotation.x, targetHeadRotX, 6, delta);
          parts.head.rotation.z = Math.sin(time * 1.5) * 0.03;
        }

        // --- 3. Segmented Tail Wave ---
        const tailSpeed = currentCat.currentAnimation === 'happy' || currentCat.currentAnimation === 'dance' ? 6 : 2.2;
        const tailAngle = currentCat.currentAnimation === 'sleep' ? 0.2 : 0.45;
        parts.tailSegments.forEach((seg, idx) => {
          const wave = Math.sin(time * tailSpeed - idx * 0.65) * tailAngle;
          seg.rotation.z = wave * 0.4;
          seg.rotation.y = wave * 0.35;
        });

        // --- 4. Ear Twitches ---
        earFlickTimer += delta;
        if (earFlickTimer > nextEarFlick) {
          earFlickTimer = 0;
          nextEarFlick = 3 + Math.random() * 4;
          earFlickSide = Math.random() > 0.5 ? 1 : -1;
        }
        const flickAmount = earFlickTimer < 0.25 ? Math.sin(earFlickTimer * Math.PI * 8) * 0.25 : 0;
        if (earFlickSide === 1) {
          parts.leftEar.rotation.x = flickAmount;
        } else {
          parts.rightEar.rotation.x = flickAmount;
        }

        // --- 5. Natural Blinking ---
        blinkTimer += delta;
        if (!isBlinking && blinkTimer > nextBlinkTime) {
          isBlinking = true;
          blinkTimer = 0;
          blinkProgress = 0;
          nextBlinkTime = 2.5 + Math.random() * 3.5;
        }
        if (isBlinking) {
          blinkProgress += delta * 7;
          let scaleY = 0.01;
          if (blinkProgress <= 0.5) {
            scaleY = THREE.MathUtils.lerp(0.01, 1.0, blinkProgress * 2);
          } else if (blinkProgress <= 1.0) {
            scaleY = THREE.MathUtils.lerp(1.0, 0.01, (blinkProgress - 0.5) * 2);
          } else {
            isBlinking = false;
            scaleY = 0.01;
          }
          parts.leftEyelid.scale.y = scaleY;
          parts.rightEyelid.scale.y = scaleY;
        } else if (currentCat.currentAnimation === 'sleep') {
          // Eyes shut during sleep
          parts.leftEyelid.scale.y = 1.0;
          parts.rightEyelid.scale.y = 1.0;
        } else if (currentCat.currentAnimation === 'pet') {
          // Half-closed blissful eyes during pet
          parts.leftEyelid.scale.y = 0.7;
          parts.rightEyelid.scale.y = 0.7;
        }

        // --- 6. Special Action Poses (Dance / Paw Step) ---
        if (currentCat.currentAnimation === 'dance' || currentCat.currentAnimation === 'happy') {
          const hop = Math.abs(Math.sin(time * 6)) * 0.18;
          parts.catBodyGroup.position.y = hop;
          parts.frontLeftPaw.position.y = 0.16 + Math.sin(time * 6) * 0.08;
          parts.frontRightPaw.position.y = 0.16 + Math.cos(time * 6) * 0.08;
        } else {
          parts.catBodyGroup.position.y = 0;
          parts.frontLeftPaw.position.y = 0.16;
          parts.frontRightPaw.position.y = 0.16;
        }

        // --- 7. Heart Particles Update ---
        parts.heartParticles.children.forEach((h) => {
          const mesh = h as THREE.Mesh;
          const mat = mesh.material as THREE.MeshBasicMaterial;
          if (mesh.userData.active) {
            mesh.userData.progress += delta * 0.9;
            mesh.position.y += delta * 0.8;
            mesh.position.x += Math.sin(time * 5 + mesh.userData.angle) * 0.01;
            mesh.rotation.z = Math.sin(time * 4) * 0.2;

            if (mesh.userData.progress <= 0.3) {
              mat.opacity = mesh.userData.progress / 0.3;
            } else if (mesh.userData.progress >= 0.8) {
              mat.opacity = Math.max(0, 1 - (mesh.userData.progress - 0.8) / 0.2);
            } else {
              mat.opacity = 1;
            }

            if (mesh.userData.progress >= 1.0) {
              mesh.userData.active = false;
              mat.opacity = 0;
            }
          }
        });
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(animate);
      } else {
        frameId = requestAnimationFrame(animate);
      }
    };

    // Start animation loop immediately
    animate();

    // 8. Resize Handler
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
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current);
      }
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('click', handlePointerDown);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync Breed, Custom Appearance & Accessory Changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentAppearanceKey = JSON.stringify(cat.customAppearance);
    const breedChanged = lastBreedRef.current !== cat.breed;
    const appearanceChanged = lastAppearanceKeyRef.current !== currentAppearanceKey;

    if (breedChanged || appearanceChanged) {
      if (modelPartsRef.current) {
        scene.remove(modelPartsRef.current.root);
      }
      const newParts = createCat3DModel(cat.breed, cat.customAppearance);
      modelPartsRef.current = newParts;
      scene.add(newParts.root);
      updateCatAccessory(newParts.accessoryGroup, cat.accessory);
      lastBreedRef.current = cat.breed;
      lastAppearanceKeyRef.current = currentAppearanceKey;
      lastAccessoryRef.current = cat.accessory;
      return;
    }

    if (modelPartsRef.current && lastAccessoryRef.current !== cat.accessory) {
      lastAccessoryRef.current = cat.accessory;
      updateCatAccessory(modelPartsRef.current.accessoryGroup, cat.accessory);
    }
  }, [cat.breed, cat.customAppearance, cat.accessory]);

  return (
    <div className={`relative w-full h-full select-none ${className}`}>
      {/* 3D Canvas Mount (Isolated empty div outside HUD overlays) */}
      <div
        ref={mountRef}
        data-testid="cat-3d-canvas"
        className="w-full h-full cursor-pointer touch-none"
        title="클릭하여 고양이를 쓰다듬어 보세요!"
      />
    </div>
  );
};
