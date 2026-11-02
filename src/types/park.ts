import { CatAccessory, CatBreedId } from './cat';

export type ParkActionType = 'loaf' | 'roll' | 'purr' | 'play_yarn';

export interface CatNote {
  id: string;
  senderId: string;
  senderName: string;
  senderBreed: CatBreedId;
  senderAccessory: CatAccessory;
  receiverCatId: string;
  message: string;
  createdAt: number;
  translatedText?: string;
  targetLang?: string;
}

export interface OnlineCatUser {
  id: string;
  catId: string;
  name: string;
  breed: CatBreedId;
  level: number;
  accessory: CatAccessory;
  x: number;
  z: number;
  rotY: number;
  isMoving: boolean;
  currentAction: 'idle' | ParkActionType;
  lastActionAt?: number;
  // Cat Park Social & Welfare features
  fullness: number; // 0-100
  happiness: number; // 0-100
  isHungry: boolean;
  likesCount: number;
  interests: string[];
  isPublicInterests: boolean;
  bio: string;
  ownerName?: string;
  rescuedCount?: number;
  isNpc?: boolean;
}

export interface ParkActionNotification {
  id: string;
  userId: string;
  name: string;
  action: ParkActionType | 'like' | 'rescued_food';
  targetName?: string;
  x: number;
  z: number;
  timestamp: number;
}
