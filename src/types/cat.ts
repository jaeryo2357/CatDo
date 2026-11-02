export type CatBreedId = 'cheese' | 'mackerel' | 'tuxedo' | 'calico' | 'white';

export interface CatBreedInfo {
  id: CatBreedId;
  name: string;
  tagline: string;
  description: string;
  primaryColor: string;
  stripeColor?: string;
  bellyColor: string;
  eyeColor: string;
  personalityHint: string;
}

export const CAT_BREEDS: CatBreedInfo[] = [
  {
    id: 'cheese',
    name: '치즈 태비',
    tagline: '골골송 장인 & 친화력 만렙',
    description: '황금빛 털에 사랑스러운 줄무늬! 밥을 사랑하고 집사 옆에 꼭 붙어있길 좋아하는 다정쟁이.',
    primaryColor: '#f59e0b',
    stripeColor: '#d97706',
    bellyColor: '#fef3c7',
    eyeColor: '#10b981',
    personalityHint: '먹보 & 애교쟁이',
  },
  {
    id: 'mackerel',
    name: '고등어 태비',
    tagline: '똑똑하고 호기심 많은 탐험가',
    description: '은빛 고등어 줄무늬와 에메랄드 눈동자! 집사가 일할 때 모니터 뒤에서 감시하며 집중력을 높여줍니다.',
    primaryColor: '#6b7280',
    stripeColor: '#374151',
    bellyColor: '#f3f4f6',
    eyeColor: '#059669',
    personalityHint: '지적이고 꼼꼼함',
  },
  {
    id: 'tuxedo',
    name: '턱시도냥',
    tagline: '신사다운 매력의 하얀 양말냥',
    description: '멋진 검은 연미복과 눈부신 흰 양말! 묵묵히 곁을 지키며 집사의 성취를 든든하게 응원해요.',
    primaryColor: '#1f2937',
    stripeColor: '#111827',
    bellyColor: '#ffffff',
    eyeColor: '#eab308',
    personalityHint: '의젓하고 듬직함',
  },
  {
    id: 'calico',
    name: '삼색냥이',
    tagline: '행운을 부르는 사랑스러운 삼색이',
    description: '순백 바탕에 주황, 검정 무늬가 조화로운 행운의 고양이! 집사에게 매일 행운의 기운을 전해줍니다.',
    primaryColor: '#f9fafb',
    stripeColor: '#ea580c',
    bellyColor: '#ffffff',
    eyeColor: '#0284c7',
    personalityHint: '발랄하고 행운 가득',
  },
  {
    id: 'white',
    name: '스노우 화이트',
    tagline: '구름처럼 보송보송한 우아함',
    description: '눈부시게 하얀 솜뭉치 털과 신비로운 푸른 눈! 집사의 고단한 하루를 힐링으로 채워줍니다.',
    primaryColor: '#ffffff',
    stripeColor: '#e0e7ff',
    bellyColor: '#ffffff',
    eyeColor: '#38bdf8',
    personalityHint: '우아하고 평온함',
  },
];

export type CatPersonality = 'foodie' | 'energetic' | 'cuddly' | 'zen';

export type CatAccessory = 'none' | 'bell_collar' | 'sunglasses' | 'party_hat' | 'flower';

export type CatActionAnimation = 'idle' | 'walk' | 'eat' | 'sleep' | 'dance' | 'beg' | 'pet' | 'happy';

export interface CatState {
  id: string;
  name: string;
  breed: CatBreedId;
  personality: CatPersonality;
  level: number;
  exp: number;
  expToNext: number;
  fullness: number; // 0 to 100
  happiness: number; // 0 to 100
  coins: number; // Fish / Tuna Can coins
  accessory: CatAccessory;
  currentAnimation: CatActionAnimation;
  totalTasksCompleted: number;
  adoptedAt: number;
  lastFedAt: number;
  lastPetAt: number;
  // Social Park & Community features
  likesCount?: number;
  interests?: string[];
  isPublicInterests?: boolean;
  bio?: string;
  kindnessKarma?: number; // Gained by feeding hungry stray/inactive cats
  notes?: import('./park').CatNote[];
}

export interface FoodShopItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: number;
  fullnessRestore: number;
  happinessBonus: number;
  expBonus: number;
  animation: CatActionAnimation;
}

export const FOOD_ITEMS: FoodShopItem[] = [
  {
    id: 'kibble',
    name: '바삭바삭 크런치 사료',
    icon: '🥣',
    description: '매일 영양 가득한 고소한 기본 사료. 가볍게 배를 채우기에 딱!',
    cost: 15,
    fullnessRestore: 20,
    happinessBonus: 5,
    expBonus: 10,
    animation: 'eat',
  },
  {
    id: 'tuna_can',
    name: '특선 프리미엄 참치캔',
    icon: '🐟',
    description: '통통한 황다랑어 살이 듬뿍! 냥이의 눈이 반짝이며 골골송 폭발.',
    cost: 40,
    fullnessRestore: 45,
    happinessBonus: 20,
    expBonus: 25,
    animation: 'eat',
  },
  {
    id: 'chicken_churu',
    name: '마법의 닭가슴살 츄르',
    icon: '🍗',
    description: '거부할 수 없는 최고의 마약 간식! 먹는 순간 춤추며 환호해요.',
    cost: 70,
    fullnessRestore: 60,
    happinessBonus: 40,
    expBonus: 45,
    animation: 'dance',
  },
  {
    id: 'catnip_treat',
    name: '유기농 황홀한 캣닢볼',
    icon: '🌿',
    description: '스트레스 제로! 냥이가 데굴데굴 구르며 극상의 행복에 빠져듭니다.',
    cost: 50,
    fullnessRestore: 15,
    happinessBonus: 50,
    expBonus: 35,
    animation: 'happy',
  },
];
