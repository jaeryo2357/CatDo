import { CatAccessory, CatBreedId } from './cat';

export type ParkActionType = 'bow' | 'purr' | 'loaf' | 'incense';

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
}

export interface ZenActionNotification {
  id: string;
  userId: string;
  name: string;
  action: ParkActionType;
  x: number;
  z: number;
  timestamp: number;
}
