import * as THREE from 'three';
import { CatAccessory, CatBreedId } from '../../types/cat';

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
    eyeIris: THREE.MeshStandardMaterial;
    eyePupil: THREE.MeshBasicMaterial;
    twinkle: THREE.MeshBasicMaterial;
    bell: THREE.MeshStandardMaterial;
    collar: THREE.MeshStandardMaterial;
    eyelid: THREE.MeshStandardMaterial;
    bowl: THREE.MeshStandardMaterial;
    food: THREE.MeshStandardMaterial;
  };
}

export function createCat3DModel(breedId: CatBreedId): CatModelParts {
  const root = new THREE.Group();
  root.name = 'Cat_Root';

  // Determine colors based on breed
  let primaryHex = 0xf59e0b; // cheese
  let stripeHex = 0xd97706;
  let bellyHex = 0xfef3c7;
  let eyeHex = 0x10b981;

  if (breedId === 'mackerel') {
    primaryHex = 0x6b7280;
    stripeHex = 0x374151;
    bellyHex = 0xf3f4f6;
    eyeHex = 0x059669;
  } else if (breedId === 'tuxedo') {
    primaryHex = 0x18181b;
    stripeHex = 0x18181b;
    bellyHex = 0xffffff;
    eyeHex = 0xfacc15;
  } else if (breedId === 'calico') {
    primaryHex = 0xfafaf9;
    stripeHex = 0xea580c;
    bellyHex = 0xffffff;
    eyeHex = 0x0284c7;
  } else if (breedId === 'white') {
    primaryHex = 0xffffff;
    stripeHex = 0xf1f5f9;
    bellyHex = 0xffffff;
    eyeHex = 0x38bdf8;
  }

  // Materials with physical velvety roughness
  const primaryMat = new THREE.MeshStandardMaterial({
    color: primaryHex,
    roughness: 0.75,
    metalness: 0.05,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: stripeHex,
    roughness: 0.75,
    metalness: 0.05,
  });

  const bellyMat = new THREE.MeshStandardMaterial({
    color: bellyHex,
    roughness: 0.8,
    metalness: 0.02,
  });

  const innerEarMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6, // soft pink
    roughness: 0.6,
  });

  const noseMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e, // rose pink
    roughness: 0.4,
  });

  const eyeIrisMat = new THREE.MeshStandardMaterial({
    color: eyeHex,
    roughness: 0.1,
    metalness: 0.1,
  });

  const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
  const twinkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const eyelidMat = new THREE.MeshStandardMaterial({
    color: primaryHex,
    roughness: 0.75,
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

  // Cat Body Group (all parts of cat)
  const catBodyGroup = new THREE.Group();
  catBodyGroup.position.set(0, 0, 0);
  root.add(catBodyGroup);

  // 1. Torso (chubby, cute rounded teardrop/capsule shape)
  const torsoGeom = new THREE.CapsuleGeometry(0.72, 0.7, 16, 24);
  const torso = new THREE.Mesh(torsoGeom, primaryMat);
  torso.rotation.x = Math.PI / 12; // slightly upright resting lean
  torso.position.set(0, 0.95, -0.05);
  torso.castShadow = true;
  torso.receiveShadow = true;
  catBodyGroup.add(torso);

  // White chest bib
  const bibGeom = new THREE.SphereGeometry(0.55, 16, 16);
  const chestBib = new THREE.Mesh(bibGeom, bellyMat);
  chestBib.scale.set(0.9, 1.1, 0.45);
  chestBib.position.set(0, 0.95, 0.42);
  catBodyGroup.add(chestBib);

  // Back stripe patches (if cheese or mackerel)
  if (breedId === 'cheese' || breedId === 'mackerel' || breedId === 'calico') {
    for (let i = 0; i < 3; i++) {
      const stripeGeom = new THREE.CylinderGeometry(0.73, 0.73, 0.08, 16, 1, true, -Math.PI / 3, (2 * Math.PI) / 3);
      const stripe = new THREE.Mesh(stripeGeom, secondaryMat);
      stripe.position.set(0, 0.8 + i * 0.22, -0.06);
      stripe.rotation.x = Math.PI / 12;
      catBodyGroup.add(stripe);
    }
  }

  // 2. Head Group
  const head = new THREE.Group();
  head.position.set(0, 1.82, 0.22);
  catBodyGroup.add(head);

  // Main head sphere (squishy, broad cheeks)
  const headGeom = new THREE.SphereGeometry(0.74, 24, 24);
  headGeom.scale(1.12, 0.98, 1.02);
  const headMesh = new THREE.Mesh(headGeom, primaryMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Chubby Cheeks
  const leftCheekGeom = new THREE.SphereGeometry(0.32, 16, 16);
  const leftCheek = new THREE.Mesh(leftCheekGeom, primaryMat);
  leftCheek.position.set(-0.54, -0.15, 0.28);
  head.add(leftCheek);

  const rightCheek = new THREE.Mesh(leftCheekGeom, primaryMat);
  rightCheek.position.set(0.54, -0.15, 0.28);
  head.add(rightCheek);

  // White muzzle pads (whiskers area)
  const muzzleGeom = new THREE.SphereGeometry(0.24, 16, 16);
  muzzleGeom.scale(1.1, 0.9, 0.8);
  const leftMuzzle = new THREE.Mesh(muzzleGeom, bellyMat);
  leftMuzzle.position.set(-0.16, -0.22, 0.64);
  head.add(leftMuzzle);

  const rightMuzzle = new THREE.Mesh(muzzleGeom, bellyMat);
  rightMuzzle.position.set(0.16, -0.22, 0.64);
  head.add(rightMuzzle);

  // Nose
  const noseGeom = new THREE.ConeGeometry(0.09, 0.08, 12);
  noseGeom.rotateX(Math.PI);
  const nose = new THREE.Mesh(noseGeom, noseMat);
  nose.position.set(0, -0.14, 0.74);
  head.add(nose);

  // Whiskers (thin stylized tubes)
  const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const whiskerGeom = new THREE.CylinderGeometry(0.012, 0.008, 0.45);
  whiskerGeom.rotateZ(Math.PI / 2);

  [-1, 1].forEach((side) => {
    for (let w = -1; w <= 1; w++) {
      const whisker = new THREE.Mesh(whiskerGeom, whiskerMat);
      whisker.position.set(side * 0.45, -0.2 + w * 0.06, 0.62);
      whisker.rotation.y = side * 0.25;
      whisker.rotation.z = side * (w * 0.15);
      head.add(whisker);
    }
  });

  // Ears (Twitchable groups)
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

  // Eyes (Big, expressive, cute anime-style eyes)
  function createEye(isLeft: boolean) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(isLeft ? -0.32 : 0.32, 0.02, 0.68);

    // Iris base
    const irisGeom = new THREE.SphereGeometry(0.18, 16, 16);
    irisGeom.scale(0.9, 1.05, 0.35);
    const iris = new THREE.Mesh(irisGeom, eyeIrisMat);
    eyeGroup.add(iris);

    // Pupil
    const pupilGeom = new THREE.SphereGeometry(0.13, 16, 16);
    pupilGeom.scale(0.8, 0.98, 0.4);
    const pupil = new THREE.Mesh(pupilGeom, eyePupilMat);
    pupil.position.set(0, 0, 0.02);
    eyeGroup.add(pupil);

    // Twinkle reflection highlight
    const twinkleGeom = new THREE.SphereGeometry(0.05, 12, 12);
    const twinkle = new THREE.Mesh(twinkleGeom, twinkleMat);
    twinkle.position.set(isLeft ? -0.05 : -0.04, 0.05, 0.07);
    eyeGroup.add(twinkle);

    // Small sub-twinkle
    const subTwinkleGeom = new THREE.SphereGeometry(0.025, 12, 12);
    const subTwinkle = new THREE.Mesh(subTwinkleGeom, twinkleMat);
    subTwinkle.position.set(isLeft ? 0.04 : 0.05, -0.04, 0.07);
    eyeGroup.add(subTwinkle);

    // Eyelid for blinking
    const eyelidGeom = new THREE.SphereGeometry(0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    eyelidGeom.scale(0.95, 1.1, 0.4);
    const eyelid = new THREE.Mesh(eyelidGeom, eyelidMat);
    eyelid.position.set(0, 0.04, 0.02);
    eyelid.scale.set(1, 0.01, 1); // Start open
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

  // 4. Paws (Front and Hind)
  const pawGeom = new THREE.SphereGeometry(0.22, 16, 16);
  pawGeom.scale(0.9, 0.7, 1.3);

  const frontLeftPaw = new THREE.Mesh(pawGeom, breedId === 'tuxedo' ? bellyMat : primaryMat);
  frontLeftPaw.position.set(-0.35, 0.16, 0.45);
  frontLeftPaw.castShadow = true;
  catBodyGroup.add(frontLeftPaw);

  const frontRightPaw = new THREE.Mesh(pawGeom, breedId === 'tuxedo' ? bellyMat : primaryMat);
  frontRightPaw.position.set(0.35, 0.16, 0.45);
  frontRightPaw.castShadow = true;
  catBodyGroup.add(frontRightPaw);

  const hindLeftPaw = new THREE.Mesh(pawGeom, breedId === 'tuxedo' ? bellyMat : primaryMat);
  hindLeftPaw.position.set(-0.6, 0.15, -0.15);
  hindLeftPaw.rotation.y = 0.25;
  hindLeftPaw.castShadow = true;
  catBodyGroup.add(hindLeftPaw);

  const hindRightPaw = new THREE.Mesh(pawGeom, breedId === 'tuxedo' ? bellyMat : primaryMat);
  hindRightPaw.position.set(0.6, 0.15, -0.15);
  hindRightPaw.rotation.y = -0.25;
  hindRightPaw.castShadow = true;
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

    const segMat = (i === numSegments - 1 && (breedId === 'cheese' || breedId === 'calico'))
      ? bellyMat
      : primaryMat;
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
  foodContent.visible = false; // toggles when fed
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
      eyeIris: eyeIrisMat,
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

/**
 * Updates accessory meshes on the cat
 */
export function updateCatAccessory(accessoryGroup: THREE.Group, accessory: CatAccessory) {
  // Clear previous
  while (accessoryGroup.children.length > 0) {
    const child = accessoryGroup.children[0];
    accessoryGroup.remove(child);
  }

  if (accessory === 'party_hat') {
    const hatGeom = new THREE.ConeGeometry(0.28, 0.6, 16);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.4 });
    const hat = new THREE.Mesh(hatGeom, hatMat);
    hat.position.set(0, 0.35, 0.05);

    // Pom pom on top
    const pomGeom = new THREE.SphereGeometry(0.08, 12, 12);
    const pomMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.9 });
    const pom = new THREE.Mesh(pomGeom, pomMat);
    pom.position.set(0, 0.65, 0.05);
    accessoryGroup.add(hat);
    accessoryGroup.add(pom);
  } else if (accessory === 'sunglasses') {
    const frameGeom = new THREE.BoxGeometry(0.85, 0.18, 0.06);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.2 });
    const frame = new THREE.Mesh(frameGeom, frameMat);
    frame.position.set(0, -0.48, 0.64);

    const lensGeom = new THREE.BoxGeometry(0.32, 0.16, 0.04);
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.8, roughness: 0.1 });
    const leftLens = new THREE.Mesh(lensGeom, lensMat);
    leftLens.position.set(-0.22, -0.48, 0.67);
    const rightLens = new THREE.Mesh(lensGeom, lensMat);
    rightLens.position.set(0.22, -0.48, 0.67);

    accessoryGroup.add(frame);
    accessoryGroup.add(leftLens);
    accessoryGroup.add(rightLens);
  } else if (accessory === 'flower') {
    const flowerGroup = new THREE.Group();
    flowerGroup.position.set(0.42, 0.2, 0.2);
    flowerGroup.rotation.z = -0.4;

    const centerGeom = new THREE.SphereGeometry(0.08, 12, 12);
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24 });
    const center = new THREE.Mesh(centerGeom, centerMat);
    flowerGroup.add(center);

    const petalGeom = new THREE.SphereGeometry(0.06, 12, 12);
    petalGeom.scale(1.2, 0.6, 0.4);
    const petalMat = new THREE.MeshStandardMaterial({ color: 0xf472b6 });
    for (let i = 0; i < 5; i++) {
      const petal = new THREE.Mesh(petalGeom, petalMat);
      const angle = (i / 5) * Math.PI * 2;
      petal.position.set(Math.cos(angle) * 0.12, Math.sin(angle) * 0.12, 0);
      petal.rotation.z = angle;
      flowerGroup.add(petal);
    }
    accessoryGroup.add(flowerGroup);
  }
}
