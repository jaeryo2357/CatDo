import * as THREE from 'three';
import { CatAccessory, CatBreedId, CustomCatAppearance } from '../../types/cat';

export interface CatModelParts {
  root: THREE.Group;
  catBodyGroup: THREE.Group;
  head: THREE.Group;
  torso: THREE.Mesh;
  chestBib: THREE.Mesh;
  leftEar: THREE.Group;
  rightEar: THREE.Group;
  leftEye: THREE.Group;
  rightEye: THREE.Group;
  leftEyelid: THREE.Mesh;
  rightEyelid: THREE.Mesh;
  nose: THREE.Mesh;
  tailSegments: THREE.Group[];
  frontLeftPaw: THREE.Mesh;
  frontRightPaw: THREE.Mesh;
  hindLeftPaw: THREE.Mesh;
  hindRightPaw: THREE.Mesh;
  collar: THREE.Group;
  bell: THREE.Mesh;
  accessoryGroup: THREE.Group;
  foodBowlGroup: THREE.Group;
  foodContent: THREE.Mesh;
  heartParticles: THREE.Group;
  materials: {
    primary: THREE.MeshStandardMaterial;
    secondary: THREE.MeshStandardMaterial;
    belly: THREE.MeshStandardMaterial;
    innerEar: THREE.MeshStandardMaterial;
    nose: THREE.MeshStandardMaterial;
    eyeIrisLeft: THREE.MeshStandardMaterial;
    eyeIrisRight: THREE.MeshStandardMaterial;
    eyePupil: THREE.MeshBasicMaterial;
    twinkle: THREE.MeshBasicMaterial;
    bell: THREE.MeshStandardMaterial;
    collar: THREE.MeshStandardMaterial;
    eyelid: THREE.MeshStandardMaterial;
    bowl: THREE.MeshStandardMaterial;
    food: THREE.MeshStandardMaterial;
  };
}

export function createCat3DModel(
  breedId: CatBreedId = 'cheese',
  customAppearance?: CustomCatAppearance
): CatModelParts {
  const root = new THREE.Group();
  root.name = 'Cat_Root';

  // Determine colors based on breed or custom photo appearance
  let primaryHex = 0xf59e0b; // cheese
  let stripeHex = 0xd97706;
  let bellyHex = 0xfef3c7;
  let eyeLeftHex = 0x10b981;
  let eyeRightHex = 0x10b981;
  let noseHex = 0xf43f5e;
  let hasStripes = breedId === 'cheese' || breedId === 'mackerel';
  let hasSocks = breedId === 'tuxedo';
  let hasBib = true;
  let hasBlush = true;

  if (breedId === 'mackerel') {
    primaryHex = 0x6b7280;
    stripeHex = 0x374151;
    bellyHex = 0xf3f4f6;
    eyeLeftHex = 0x059669;
    eyeRightHex = 0x059669;
  } else if (breedId === 'tuxedo') {
    primaryHex = 0x18181b;
    stripeHex = 0x18181b;
    bellyHex = 0xffffff;
    eyeLeftHex = 0xfacc15;
    eyeRightHex = 0xfacc15;
    hasStripes = false;
    hasSocks = true;
  } else if (breedId === 'calico') {
    primaryHex = 0xfafaf9;
    stripeHex = 0xea580c;
    bellyHex = 0xffffff;
    eyeLeftHex = 0x0284c7;
    eyeRightHex = 0x0284c7;
    hasStripes = true;
  } else if (breedId === 'white') {
    primaryHex = 0xffffff;
    stripeHex = 0xf1f5f9;
    bellyHex = 0xffffff;
    eyeLeftHex = 0x38bdf8;
    eyeRightHex = 0x38bdf8;
    hasStripes = false;
  }

  // Apply custom AI photo appearance if available
  if (customAppearance) {
    try {
      if (customAppearance.primaryColor) {
        primaryHex = parseInt(customAppearance.primaryColor.replace('#', '0x'), 16);
      }
      if (customAppearance.stripeColor) {
        stripeHex = parseInt(customAppearance.stripeColor.replace('#', '0x'), 16);
      }
      if (customAppearance.bellyColor) {
        bellyHex = parseInt(customAppearance.bellyColor.replace('#', '0x'), 16);
      }
      if (customAppearance.eyeColorLeft) {
        eyeLeftHex = parseInt(customAppearance.eyeColorLeft.replace('#', '0x'), 16);
      }
      if (customAppearance.eyeColorRight) {
        eyeRightHex = parseInt(customAppearance.eyeColorRight.replace('#', '0x'), 16);
      }
      if (customAppearance.noseColor) {
        noseHex = parseInt(customAppearance.noseColor.replace('#', '0x'), 16);
      }
      if (customAppearance.hasStripes !== undefined) {
        hasStripes = customAppearance.hasStripes;
      }
      if (customAppearance.hasSocks !== undefined) {
        hasSocks = customAppearance.hasSocks;
      }
      if (customAppearance.hasBib !== undefined) {
        hasBib = customAppearance.hasBib;
      }
      if (customAppearance.hasBlush !== undefined) {
        hasBlush = customAppearance.hasBlush;
      }
    } catch (e) {
      console.warn('Error parsing custom cat appearance hex:', e);
    }
  }

  // Materials with soft velvety toon roughness
  const primaryMat = new THREE.MeshStandardMaterial({
    color: primaryHex,
    roughness: 0.72,
    metalness: 0.04,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: stripeHex,
    roughness: 0.72,
    metalness: 0.04,
  });

  const bellyMat = new THREE.MeshStandardMaterial({
    color: bellyHex,
    roughness: 0.78,
    metalness: 0.02,
  });

  const innerEarMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6, // soft pastel pink
    roughness: 0.55,
  });

  const noseMat = new THREE.MeshStandardMaterial({
    color: noseHex,
    roughness: 0.35,
  });

  const eyeIrisLeftMat = new THREE.MeshStandardMaterial({
    color: eyeLeftHex,
    roughness: 0.1,
    metalness: 0.1,
  });

  const eyeIrisRightMat = new THREE.MeshStandardMaterial({
    color: eyeRightHex,
    roughness: 0.1,
    metalness: 0.1,
  });

  const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
  const twinkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const eyelidMat = new THREE.MeshStandardMaterial({
    color: primaryHex,
    roughness: 0.72,
  });

  const collarMat = new THREE.MeshStandardMaterial({
    color: 0xef4444, // bright red collar ribbon
    roughness: 0.5,
  });

  const bellMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24, // gold bell
    roughness: 0.2,
    metalness: 0.9,
  });

  const bowlMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8, // sky blue cute bowl
    roughness: 0.3,
  });

  const foodMat = new THREE.MeshStandardMaterial({
    color: 0x92400e, // golden kibbles / tuna
    roughness: 0.9,
  });

  const pawPadMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6, // soft jelly bean pink
    roughness: 0.45,
  });

  // Cat Body Group (all parts of cat)
  const catBodyGroup = new THREE.Group();
  catBodyGroup.position.set(0, 0, 0);
  root.add(catBodyGroup);

  // 1. Torso (chubby, cute rounded teardrop/capsule shape)
  const torsoGeom = new THREE.CapsuleGeometry(0.74, 0.72, 18, 24);
  const torso = new THREE.Mesh(torsoGeom, primaryMat);
  torso.rotation.x = Math.PI / 12; // slightly upright resting lean
  torso.position.set(0, 0.96, -0.05);
  torso.castShadow = true;
  torso.receiveShadow = true;
  catBodyGroup.add(torso);

  // White chest bib
  let chestBib: THREE.Mesh;
  const bibGeom = new THREE.SphereGeometry(0.56, 16, 16);
  chestBib = new THREE.Mesh(bibGeom, bellyMat);
  chestBib.scale.set(0.92, 1.12, 0.46);
  chestBib.position.set(0, 0.96, 0.43);
  if (hasBib) {
    catBodyGroup.add(chestBib);
  }

  // Back stripe patches
  if (hasStripes) {
    for (let i = 0; i < 3; i++) {
      const stripeGeom = new THREE.CylinderGeometry(0.75, 0.75, 0.09, 16, 1, true, -Math.PI / 3, (2 * Math.PI) / 3);
      const stripe = new THREE.Mesh(stripeGeom, secondaryMat);
      stripe.position.set(0, 0.8 + i * 0.23, -0.06);
      stripe.rotation.x = Math.PI / 12;
      catBodyGroup.add(stripe);
    }
  }

  // 2. Head Group (Kawaii Chibi Proportions: big, round, squishy cheeks)
  const head = new THREE.Group();
  head.position.set(0, 1.84, 0.22);
  catBodyGroup.add(head);

  // Main head sphere (squishy, broad cheeks)
  const headGeom = new THREE.SphereGeometry(0.76, 24, 24);
  headGeom.scale(1.14, 0.98, 1.04);
  const headMesh = new THREE.Mesh(headGeom, primaryMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Chubby Cheeks
  const leftCheekGeom = new THREE.SphereGeometry(0.33, 16, 16);
  const leftCheek = new THREE.Mesh(leftCheekGeom, primaryMat);
  leftCheek.position.set(-0.54, -0.15, 0.28);
  head.add(leftCheek);

  const rightCheek = new THREE.Mesh(leftCheekGeom, primaryMat);
  rightCheek.position.set(0.54, -0.15, 0.28);
  head.add(rightCheek);

  // Adorable Pink Cheeks Blush (볼터치)
  if (hasBlush) {
    const blushGeom = new THREE.CircleGeometry(0.14, 16);
    const blushMat = new THREE.MeshBasicMaterial({
      color: 0xfb7185,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const leftBlush = new THREE.Mesh(blushGeom, blushMat);
    leftBlush.position.set(-0.46, -0.06, 0.62);
    leftBlush.rotation.y = -0.35;
    head.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeom, blushMat);
    rightBlush.position.set(0.46, -0.06, 0.62);
    rightBlush.rotation.y = 0.35;
    head.add(rightBlush);
  }

  // White muzzle pads (whiskers area) - ω shape
  const muzzleGeom = new THREE.SphereGeometry(0.24, 16, 16);
  muzzleGeom.scale(1.12, 0.92, 0.82);
  const leftMuzzle = new THREE.Mesh(muzzleGeom, bellyMat);
  leftMuzzle.position.set(-0.16, -0.22, 0.65);
  head.add(leftMuzzle);

  const rightMuzzle = new THREE.Mesh(muzzleGeom, bellyMat);
  rightMuzzle.position.set(0.16, -0.22, 0.65);
  head.add(rightMuzzle);

  // Cute Little Cat Smile Curve (ω mouth)
  const mouthGeom = new THREE.TorusGeometry(0.08, 0.012, 8, 16, Math.PI);
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x881337 });
  const leftSmile = new THREE.Mesh(mouthGeom, mouthMat);
  leftSmile.position.set(-0.07, -0.25, 0.74);
  leftSmile.rotation.z = Math.PI;
  head.add(leftSmile);

  const rightSmile = new THREE.Mesh(mouthGeom, mouthMat);
  rightSmile.position.set(0.07, -0.25, 0.74);
  rightSmile.rotation.z = Math.PI;
  head.add(rightSmile);

  // Cute Button Nose
  const noseGeom = new THREE.ConeGeometry(0.085, 0.08, 12);
  noseGeom.rotateX(Math.PI);
  const nose = new THREE.Mesh(noseGeom, noseMat);
  nose.position.set(0, -0.14, 0.76);
  head.add(nose);

  // Whiskers (thin stylized tubes)
  const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const whiskerGeom = new THREE.CylinderGeometry(0.01, 0.007, 0.44);
  whiskerGeom.rotateZ(Math.PI / 2);

  [-1, 1].forEach((side) => {
    for (let w = -1; w <= 1; w++) {
      const whisker = new THREE.Mesh(whiskerGeom, whiskerMat);
      whisker.position.set(side * 0.46, -0.2 + w * 0.06, 0.63);
      whisker.rotation.y = side * 0.25;
      whisker.rotation.z = side * (w * 0.15);
      head.add(whisker);
    }
  });

  // Ears (Cute soft rounded cones with inner pink fluff)
  const leftEar = new THREE.Group();
  leftEar.position.set(-0.46, 0.58, 0.05);
  leftEar.rotation.z = -0.2;
  head.add(leftEar);

  const earGeom = new THREE.ConeGeometry(0.32, 0.56, 16);
  earGeom.scale(1, 1, 0.55);
  const leftEarMesh = new THREE.Mesh(earGeom, primaryMat);
  leftEar.add(leftEarMesh);

  const innerEarGeom = new THREE.ConeGeometry(0.22, 0.44, 16);
  innerEarGeom.scale(1, 1, 0.45);
  const leftInnerEar = new THREE.Mesh(innerEarGeom, innerEarMat);
  leftInnerEar.position.set(0, -0.04, 0.06);
  leftEar.add(leftInnerEar);

  const rightEar = new THREE.Group();
  rightEar.position.set(0.46, 0.58, 0.05);
  rightEar.rotation.z = 0.2;
  head.add(rightEar);

  const rightEarMesh = new THREE.Mesh(earGeom, primaryMat);
  rightEar.add(rightEarMesh);

  const rightInnerEar = new THREE.Mesh(innerEarGeom, innerEarMat);
  rightInnerEar.position.set(0, -0.04, 0.06);
  rightEar.add(rightInnerEar);

  // Eyes (Sparkling, large, expressive anime-style kawaii eyes)
  function createEye(isLeft: boolean) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(isLeft ? -0.32 : 0.32, 0.02, 0.7);

    // Iris base (supports left/right odd-eyes)
    const irisGeom = new THREE.SphereGeometry(0.185, 16, 16);
    irisGeom.scale(0.92, 1.08, 0.36);
    const iris = new THREE.Mesh(irisGeom, isLeft ? eyeIrisLeftMat : eyeIrisRightMat);
    eyeGroup.add(iris);

    // Pupil
    const pupilGeom = new THREE.SphereGeometry(0.13, 16, 16);
    pupilGeom.scale(0.8, 0.98, 0.4);
    const pupil = new THREE.Mesh(pupilGeom, eyePupilMat);
    pupil.position.set(0, 0, 0.02);
    eyeGroup.add(pupil);

    // Main Twinkle reflection highlight
    const twinkleGeom = new THREE.SphereGeometry(0.052, 12, 12);
    const twinkle = new THREE.Mesh(twinkleGeom, twinkleMat);
    twinkle.position.set(isLeft ? -0.05 : -0.04, 0.055, 0.075);
    eyeGroup.add(twinkle);

    // Small sub-twinkle
    const subTwinkleGeom = new THREE.SphereGeometry(0.026, 12, 12);
    const subTwinkle = new THREE.Mesh(subTwinkleGeom, twinkleMat);
    subTwinkle.position.set(isLeft ? 0.04 : 0.05, -0.04, 0.075);
    eyeGroup.add(subTwinkle);

    // Lower crescent eye glimmer
    const lowerGlimmerGeom = new THREE.SphereGeometry(0.018, 8, 8);
    const lowerGlimmer = new THREE.Mesh(lowerGlimmerGeom, twinkleMat);
    lowerGlimmer.position.set(0, -0.06, 0.072);
    eyeGroup.add(lowerGlimmer);

    // Eyelid for blinking
    const eyelidGeom = new THREE.SphereGeometry(0.205, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    eyelidGeom.scale(0.96, 1.12, 0.4);
    const eyelid = new THREE.Mesh(eyelidGeom, eyelidMat);
    eyelid.position.set(0, 0.04, 0.02);
    eyelid.scale.set(1, 0.01, 1);
    eyeGroup.add(eyelid);

    return { eyeGroup, eyelid };
  }

  const leftEyeData = createEye(true);
  head.add(leftEyeData.eyeGroup);

  const rightEyeData = createEye(false);
  head.add(rightEyeData.eyeGroup);

  // 3. Collar and Bell
  const collar = new THREE.Group();
  collar.position.set(0, 1.45, 0.15);
  catBodyGroup.add(collar);

  const collarBandGeom = new THREE.TorusGeometry(0.56, 0.05, 12, 32);
  collarBandGeom.rotateX(Math.PI / 2 + 0.1);
  const collarBand = new THREE.Mesh(collarBandGeom, collarMat);
  collar.add(collarBand);

  // Golden Bell
  const bellGeom = new THREE.SphereGeometry(0.12, 16, 16);
  const bell = new THREE.Mesh(bellGeom, bellMat);
  bell.position.set(0, -0.12, 0.54);
  collar.add(bell);

  // 4. Paws with Pink Jelly Bean Pads (하얀 양말 & 젤리 발바닥)
  const pawMat = hasSocks ? bellyMat : primaryMat;
  const pawGeom = new THREE.SphereGeometry(0.23, 16, 16);
  pawGeom.scale(0.9, 0.72, 1.32);

  function createPaw(x: number, y: number, z: number, rotY = 0) {
    const pawMesh = new THREE.Mesh(pawGeom, pawMat);
    pawMesh.position.set(x, y, z);
    pawMesh.rotation.y = rotY;
    pawMesh.castShadow = true;

    // Pink jelly bean palm pad
    const palmPadGeom = new THREE.CircleGeometry(0.08, 12);
    palmPadGeom.rotateX(Math.PI / 2);
    const palmPad = new THREE.Mesh(palmPadGeom, pawPadMat);
    palmPad.position.set(0, -0.15, 0.02);
    pawMesh.add(palmPad);

    // 3 Cute little toe beans
    [-0.06, 0, 0.06].forEach((tx, idx) => {
      const toeGeom = new THREE.CircleGeometry(0.032, 8);
      toeGeom.rotateX(Math.PI / 2);
      const toePad = new THREE.Mesh(toeGeom, pawPadMat);
      toePad.position.set(tx, -0.15, 0.16 + (idx === 1 ? 0.03 : 0));
      pawMesh.add(toePad);
    });

    return pawMesh;
  }

  const frontLeftPaw = createPaw(-0.35, 0.16, 0.45);
  catBodyGroup.add(frontLeftPaw);

  const frontRightPaw = createPaw(0.35, 0.16, 0.45);
  catBodyGroup.add(frontRightPaw);

  const hindLeftPaw = createPaw(-0.6, 0.15, -0.15, 0.25);
  catBodyGroup.add(hindLeftPaw);

  const hindRightPaw = createPaw(0.6, 0.15, -0.15, -0.25);
  catBodyGroup.add(hindRightPaw);

  // 5. Tail (Segmented 5-bone chain for silky smooth natural curl & wagging)
  const tailSegments: THREE.Group[] = [];
  const numSegments = 5;
  let parentBone: THREE.Group = catBodyGroup;

  for (let i = 0; i < numSegments; i++) {
    const segGroup = new THREE.Group();
    if (i === 0) {
      segGroup.position.set(0, 0.48, -0.62);
      segGroup.rotation.x = -Math.PI / 4;
    } else {
      segGroup.position.set(0, 0.22, -0.06);
    }

    const radius = 0.13 * (1 - i * 0.12);
    const segGeom = new THREE.CylinderGeometry(radius * 0.85, radius, 0.25, 12);
    segGeom.translate(0, 0.125, 0);

    const segMat = (i === numSegments - 1 && hasBib) ? bellyMat : primaryMat;
    const segMesh = new THREE.Mesh(segGeom, segMat);
    segMesh.castShadow = true;
    segGroup.add(segMesh);

    parentBone.add(segGroup);
    tailSegments.push(segGroup);
    parentBone = segGroup;
  }

  // 6. Accessories Group (Hat, glasses, flower)
  const accessoryGroup = new THREE.Group();
  accessoryGroup.position.set(0, 0.52, 0.05);
  head.add(accessoryGroup);

  // 7. Food Bowl (Ceramic bowl placed in front of cat)
  const foodBowlGroup = new THREE.Group();
  foodBowlGroup.position.set(0, 0, 1.25);
  root.add(foodBowlGroup);

  const bowlOuterGeom = new THREE.CylinderGeometry(0.48, 0.38, 0.22, 24);
  const bowlOuter = new THREE.Mesh(bowlOuterGeom, bowlMat);
  bowlOuter.position.set(0, 0.11, 0);
  bowlOuter.castShadow = true;
  foodBowlGroup.add(bowlOuter);

  const foodGeom = new THREE.SphereGeometry(0.38, 16, 16);
  foodGeom.scale(1, 0.25, 1);
  const foodContent = new THREE.Mesh(foodGeom, foodMat);
  foodContent.position.set(0, 0.18, 0);
  foodContent.visible = false;
  foodBowlGroup.add(foodContent);

  // 8. Heart Particles Group (for happy purr / pet effect)
  const heartParticles = new THREE.Group();
  catBodyGroup.add(heartParticles);

  for (let p = 0; p < 8; p++) {
    const heartShape = new THREE.Shape();
    const x = 0, y = 0;
    heartShape.moveTo(x + 0.1, y + 0.1);
    heartShape.bezierCurveTo(x + 0.1, y + 0.1, x + 0.08, y + 0.17, x + 0.02, y + 0.17);
    heartShape.bezierCurveTo(x - 0.06, y + 0.17, x - 0.06, y + 0.08, x - 0.06, y + 0.08);
    heartShape.bezierCurveTo(x - 0.06, y + 0.02, x + 0.02, y - 0.08, x + 0.1, y - 0.14);
    heartShape.bezierCurveTo(x + 0.18, y - 0.08, x + 0.26, y + 0.02, x + 0.26, y + 0.08);
    heartShape.bezierCurveTo(x + 0.26, y + 0.08, x + 0.26, y + 0.17, x + 0.18, y + 0.17);
    heartShape.bezierCurveTo(x + 0.13, y + 0.17, x + 0.1, y + 0.1, x + 0.1, y + 0.1);

    const heartGeom = new THREE.ShapeGeometry(heartShape);
    const heartMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const heartMesh = new THREE.Mesh(heartGeom, heartMat);
    heartMesh.scale.set(0.6, 0.6, 0.6);
    heartMesh.userData = {
      baseY: 1.2 + Math.random() * 0.8,
      speed: 0.8 + Math.random() * 0.6,
      angle: (p / 8) * Math.PI * 2,
      active: false,
      progress: 0,
    };
    heartParticles.add(heartMesh);
  }

  return {
    root,
    catBodyGroup,
    head,
    torso,
    chestBib,
    leftEar,
    rightEar,
    leftEye: leftEyeData.eyeGroup,
    rightEye: rightEyeData.eyeGroup,
    leftEyelid: leftEyeData.eyelid,
    rightEyelid: rightEyeData.eyelid,
    nose,
    tailSegments,
    frontLeftPaw,
    frontRightPaw,
    hindLeftPaw,
    hindRightPaw,
    collar,
    bell,
    accessoryGroup,
    foodBowlGroup,
    foodContent,
    heartParticles,
    materials: {
      primary: primaryMat,
      secondary: secondaryMat,
      belly: bellyMat,
      innerEar: innerEarMat,
      nose: noseMat,
      eyeIrisLeft: eyeIrisLeftMat,
      eyeIrisRight: eyeIrisRightMat,
      eyePupil: eyePupilMat,
      twinkle: twinkleMat,
      bell: bellMat,
      collar: collarMat,
      eyelid: eyelidMat,
      bowl: bowlMat,
      food: foodMat,
    },
  };
}

export function updateCatAccessory(accessoryGroup: THREE.Group, accessory: CatAccessory) {
  // Clear previous accessory
  while (accessoryGroup.children.length > 0) {
    const child = accessoryGroup.children[0];
    accessoryGroup.remove(child);
  }

  if (accessory === 'none' || accessory === 'bell_collar') {
    return;
  }

  if (accessory === 'party_hat') {
    const hatGeom = new THREE.ConeGeometry(0.24, 0.6, 16);
    const hatMat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      roughness: 0.4,
      metalness: 0.1,
    });
    const hat = new THREE.Mesh(hatGeom, hatMat);
    hat.position.set(0, 0.35, 0);
    hat.rotation.z = 0.1;

    // Pom pom
    const pomGeom = new THREE.SphereGeometry(0.08, 12, 12);
    const pomMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.9 });
    const pom = new THREE.Mesh(pomGeom, pomMat);
    pom.position.set(0, 0.32, 0);
    hat.add(pom);

    accessoryGroup.add(hat);
  } else if (accessory === 'sunglasses') {
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.1,
      metalness: 0.8,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });

    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, -0.48, 0.68);

    [-0.32, 0.32].forEach((x) => {
      const lensGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16);
      lensGeom.rotateX(Math.PI / 2);
      const lens = new THREE.Mesh(lensGeom, glassMat);
      lens.position.set(x, 0, 0);
      glassesGroup.add(lens);

      const frameGeom = new THREE.TorusGeometry(0.19, 0.02, 8, 16);
      const frame = new THREE.Mesh(frameGeom, frameMat);
      frame.position.set(x, 0, 0.01);
      glassesGroup.add(frame);
    });

    const bridgeGeom = new THREE.BoxGeometry(0.28, 0.03, 0.02);
    const bridge = new THREE.Mesh(bridgeGeom, frameMat);
    bridge.position.set(0, 0.04, 0.01);
    glassesGroup.add(bridge);

    accessoryGroup.add(glassesGroup);
  } else if (accessory === 'flower') {
    const flowerGroup = new THREE.Group();
    flowerGroup.position.set(0.38, 0.3, 0.2);
    flowerGroup.rotation.z = -0.4;

    const centerGeom = new THREE.SphereGeometry(0.08, 12, 12);
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 });
    const center = new THREE.Mesh(centerGeom, centerMat);
    flowerGroup.add(center);

    const petalMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.5 });
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const petalGeom = new THREE.SphereGeometry(0.08, 12, 12);
      petalGeom.scale(1.2, 0.7, 0.4);
      const petal = new THREE.Mesh(petalGeom, petalMat);
      petal.position.set(Math.cos(angle) * 0.12, Math.sin(angle) * 0.12, 0);
      petal.rotation.z = angle;
      flowerGroup.add(petal);
    }

    accessoryGroup.add(flowerGroup);
  }
}
