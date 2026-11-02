import React, { useState } from 'react';
import { CatAccessory, CatState, FOOD_ITEMS, FoodShopItem } from '../../types/cat';
import { TodoItem } from '../../types/todo';
import { CatScene } from '../cat3d/CatScene';
import {
  Heart,
  Fish,
  Sparkles,
  Moon,
  Sun,
  ShoppingBag,
  RotateCcw,
  Volume2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { playSound } from '../../utils/audio';

interface CatRoomViewProps {
  cat: CatState;
  activeTasks: TodoItem[];
  onFeed: (food: FoodShopItem) => void;
  onPet: () => void;
  onPlay: () => void;
  onChangeAccessory: (acc: CatAccessory) => void;
  onOpenAdoption: () => void;
  onToggleSleep: () => void;
  onGoToPark?: () => void;
}

export const CatRoomView: React.FC<CatRoomViewProps> = ({
  cat,
  activeTasks,
  onFeed,
  onPet,
  onPlay,
  onChangeAccessory,
  onOpenAdoption,
  onToggleSleep,
  onGoToPark,
}) => {
  const [isFeedSheetOpen, setIsFeedSheetOpen] = useState(false);
  const [isClosetOpen, setIsClosetOpen] = useState(false);

  const getCatDialogue = () => {
    if (cat.currentAnimation === 'sleep') {
      return '새근새근... 조용히 집사의 집중을 응원하고 있다냥... Zzz';
    }
    if (cat.fullness <= 25) {
      return '배가 꼬르륵거린다옹... 할일 하나만 끝내고 캔 하나 사달라냥! 😿';
    }
    if (activeTasks.length > 0) {
      const first = activeTasks[0];
      return `"${first.title}" 완료 시 +${first.analysis.effortValue}캔 획득 가능! 🐟`;
    }
    return '모든 미션을 완수한 훌륭한 집사다옹! 사랑한다냥~ 💕';
  };

  return (
    <div className="flex-1 flex flex-col relative h-full min-h-[500px] overflow-hidden select-none">
      {/* Top Floating Bio & Dialogue Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 space-y-2 pointer-events-none">
        {/* Cat Status Card */}
        <div className="bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐱</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-stone-900 text-sm">{cat.name}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500 text-white">
                  Lv.{cat.level}
                </span>
                {cat.fullness <= 30 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-500 text-white animate-pulse">
                    배고파요!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-stone-500">
                <span>{cat.exp}/{cat.expToNext} EXP</span>
              </div>
            </div>
          </div>

          {/* Vitals Progress */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span>🥣</span>
              <div className="w-12 h-2 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${cat.fullness <= 30 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${cat.fullness}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-stone-700">{cat.fullness}%</span>
            </div>

            <div className="flex items-center gap-1">
              <span>💖</span>
              <div className="w-12 h-2 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${cat.happiness}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-stone-700">{cat.happiness}%</span>
            </div>
          </div>
        </div>

        {/* Live Reaction Speech Bubble */}
        <div className="bg-amber-50/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-200/80 shadow-xs flex items-center gap-1.5 text-xs text-amber-950 font-medium pointer-events-auto">
          <span className="text-sm">🐾</span>
          <span className="italic">{getCatDialogue()}</span>
        </div>
      </div>

      {/* 3D Cat Viewport */}
      <div className="w-full flex-1 min-h-[360px] bg-gradient-to-b from-amber-50/20 via-white to-amber-50/40">
        <CatScene cat={cat} onPetCat={onPet} />
      </div>

      {/* Floating Action Menu Bar (Thumb Zone at Bottom) */}
      <div className="p-3 bg-white/95 border-t border-stone-200 space-y-2 z-20">
        <div className="grid grid-cols-4 gap-2">
          {/* Pet */}
          <button
            type="button"
            onClick={onPet}
            className="py-2.5 px-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl flex flex-col items-center justify-center gap-1 text-rose-800 text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            <span>쓰다듬기</span>
          </button>

          {/* Feed */}
          <button
            type="button"
            onClick={() => {
              setIsFeedSheetOpen(!isFeedSheetOpen);
              setIsClosetOpen(false);
            }}
            className={`py-2.5 px-2 rounded-2xl border flex flex-col items-center justify-center gap-1 text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-xs ${
              isFeedSheetOpen
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
            }`}
          >
            <Fish className="w-4 h-4" />
            <span>밥 주기</span>
          </button>

          {/* Play */}
          <button
            type="button"
            onClick={onPlay}
            className="py-2.5 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl flex flex-col items-center justify-center gap-1 text-amber-900 text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>놀아주기</span>
          </button>

          {/* Sleep */}
          <button
            type="button"
            onClick={onToggleSleep}
            className="py-2.5 px-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-1 text-stone-700 text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            {cat.currentAnimation === 'sleep' ? (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span>깨우기</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>낮잠</span>
              </>
            )}
          </button>
        </div>

        {/* Online Stroll Park Button */}
        {onGoToPark && (
          <button
            type="button"
            onClick={onGoToPark}
            className="w-full py-2 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <span>🌿</span>
            <span>냥이 광장 & 놀이터 산책 나가기</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">실시간 광장</span>
          </button>
        )}

        {/* Secondary Row: Closet & Breed Switch */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsClosetOpen(!isClosetOpen);
              setIsFeedSheetOpen(false);
            }}
            className="flex-1 py-1.5 px-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-stone-500" />
            <span>악세서리 옷장</span>
          </button>

          <button
            type="button"
            onClick={onOpenAdoption}
            className="py-1.5 px-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>묘종 변경</span>
          </button>
        </div>

        {/* Feeding Drawer Bottom Sheet */}
        {isFeedSheetOpen && (
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 animate-fade-in space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-950">
              <span>🐟 간식 골라 먹이기</span>
              <span>보유: {cat.coins}캔</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FOOD_ITEMS.map((item) => {
                const canAfford = cat.coins >= item.cost;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!canAfford}
                    onClick={() => {
                      onFeed(item);
                      setIsFeedSheetOpen(false);
                    }}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                      canAfford
                        ? 'bg-white hover:bg-amber-100 border-amber-300 cursor-pointer shadow-xs active:scale-95'
                        : 'bg-stone-100 border-stone-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-stone-800">{item.name}</div>
                        <div className="text-[10px] text-stone-500">+{item.fullnessRestore}% 포만감</div>
                      </div>
                    </div>
                    <span className="text-xs font-black text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded-md">
                      {item.cost}캔
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Closet Drawer Bottom Sheet */}
        {isClosetOpen && (
          <div className="p-3 bg-stone-100 rounded-2xl border border-stone-200 animate-fade-in space-y-1.5">
            <span className="text-xs font-bold text-stone-800 block">🎀 악세서리 착용</span>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: 'none', label: '해제', icon: '🐾' },
                { id: 'bell_collar', label: '방울', icon: '🔔' },
                { id: 'sunglasses', label: '선글라스', icon: '🕶️' },
                { id: 'party_hat', label: '고깔모자', icon: '🎉' },
                { id: 'flower', label: '꽃', icon: '🌸' },
              ].map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    onChangeAccessory(acc.id as CatAccessory);
                    playSound.coin();
                    setIsClosetOpen(false);
                  }}
                  className={`p-2 rounded-xl text-center text-xs font-bold border transition-all ${
                    cat.accessory === acc.id
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-base block mb-0.5">{acc.icon}</span>
                  <span className="text-[10px] block leading-tight">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
