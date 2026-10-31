import React, { useState } from 'react';
import { CatAccessory, CatState, FOOD_ITEMS, FoodShopItem } from '../../types/cat';
import { TodoItem } from '../../types/todo';
import { CatScene } from '../cat3d/CatScene';
import {
  Heart,
  Fish,
  Sparkles,
  RotateCcw,
  Volume2,
  Moon,
  Sun,
  Smile,
  AlertCircle,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { playSound } from '../../utils/audio';

interface CatCompanionCardProps {
  cat: CatState;
  activeTasks: TodoItem[];
  onFeed: (food: FoodShopItem) => void;
  onPet: () => void;
  onPlay: () => void;
  onChangeAccessory: (acc: CatAccessory) => void;
  onOpenAdoption: () => void;
  onToggleSleep: () => void;
}

export const CatCompanionCard: React.FC<CatCompanionCardProps> = ({
  cat,
  activeTasks,
  onFeed,
  onPet,
  onPlay,
  onChangeAccessory,
  onOpenAdoption,
  onToggleSleep,
}) => {
  const [isTreatDrawerOpen, setIsTreatDrawerOpen] = useState(false);
  const [isClosetOpen, setIsClosetOpen] = useState(false);

  // Dynamic empathetic dialogue based on active tasks
  const getCatDialogue = () => {
    if (cat.currentAnimation === 'sleep') {
      return '새근새근... 조용히 집사의 집중을 응원하고 있다냥... Zzz';
    }
    if (cat.fullness <= 25) {
      return '배가 꼬르륵거린다옹... 할일 하나만 끝내고 캔 하나 사달라냥! 😿';
    }
    if (activeTasks.length > 0) {
      const firstTask = activeTasks[0];
      return `"${firstTask.title}" 끝내면 +${firstTask.analysis.effortValue}캔이다냥! 힘내라 집사! 🐾`;
    }
    return '오늘 등록된 할일을 다 끝냈다냥! 최고의 집사 인정이다옹~ 💕';
  };

  const isHungry = cat.fullness <= 30;

  return (
    <div className="bg-white rounded-3xl border-2 border-amber-200/90 shadow-sm overflow-hidden flex flex-col h-full">
      {/* 1. Cat Header Bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-100/70 via-orange-50 to-amber-100/70 border-b border-amber-200/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-white flex items-center justify-center text-sm shadow-xs font-black">
            🐱
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-stone-900 text-sm">{cat.name}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500 text-white">
                Lv.{cat.level}
              </span>
              {isHungry && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500 text-white animate-pulse">
                  배고픔!
                </span>
              )}
            </div>
            {/* Exp */}
            <div className="flex items-center gap-1 text-[10px] text-stone-500">
              <div className="w-16 h-1 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${Math.min(100, (cat.exp / cat.expToNext) * 100)}%` }}
                />
              </div>
              <span>{cat.exp}/{cat.expToNext} EXP</span>
            </div>
          </div>
        </div>

        {/* Tuna Balance Pill */}
        <div className="flex items-center gap-1.5 bg-amber-100/90 px-3 py-1.5 rounded-xl border border-amber-300 shadow-xs">
          <span className="text-sm">🐟</span>
          <span className="text-xs font-black text-amber-950">{cat.coins.toLocaleString()}</span>
          <span className="text-[10px] font-bold text-amber-700">캔</span>
        </div>
      </div>

      {/* 2. Cat Speech Bubble (Emotional connection to ToDo) */}
      <div className="px-4 py-2 bg-amber-50/50 border-b border-amber-100 flex items-start gap-2 text-xs">
        <span className="text-amber-500 font-bold shrink-0">🐾 냥이의 한마디:</span>
        <span className="text-stone-700 font-medium italic line-clamp-1">{getCatDialogue()}</span>
      </div>

      {/* 3. 3D Cat Scene Viewport */}
      <div className="relative flex-1 min-h-[300px] sm:min-h-[360px] bg-gradient-to-b from-amber-50/20 via-white to-amber-50/40">
        <CatScene cat={cat} onPetCat={onPet} />

        {/* Small Touch Prompt */}
        <div className="absolute top-2.5 right-2.5 z-10 bg-white/85 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-stone-200 text-[10px] font-bold text-stone-500 shadow-xs flex items-center gap-1 pointer-events-none">
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span>클릭해서 쓰다듬기</span>
        </div>
      </div>

      {/* 4. Vitals & Companion Controls Strip */}
      <div className="p-3 bg-stone-50/90 border-t border-amber-200/60 space-y-2.5">
        {/* Vitals Progress */}
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
          {/* Hunger / Fullness */}
          <div className="bg-white p-2 rounded-xl border border-stone-200 flex items-center justify-between">
            <span className="text-stone-600 text-[11px] flex items-center gap-1">
              <span>🥣</span>
              <span>포만감</span>
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-14 h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    cat.fullness <= 30 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${cat.fullness}%` }}
                />
              </div>
              <span className="text-[11px] text-stone-700 font-bold">{cat.fullness}%</span>
            </div>
          </div>

          {/* Happiness */}
          <div className="bg-white p-2 rounded-xl border border-stone-200 flex items-center justify-between">
            <span className="text-stone-600 text-[11px] flex items-center gap-1">
              <span>💖</span>
              <span>행복도</span>
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-14 h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-300"
                  style={{ width: `${cat.happiness}%` }}
                />
              </div>
              <span className="text-[11px] text-stone-700 font-bold">{cat.happiness}%</span>
            </div>
          </div>
        </div>

        {/* Quick Action Pill Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setIsTreatDrawerOpen(!isTreatDrawerOpen);
              setIsClosetOpen(false);
            }}
            className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isTreatDrawerOpen
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white hover:bg-amber-50 text-stone-700 border-amber-200'
            }`}
          >
            <Fish className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>밥 주기</span>
            {isTreatDrawerOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={onPet}
            className="flex-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-rose-50 text-stone-700 border border-stone-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer active:scale-95"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>쓰다듬기</span>
          </button>

          <button
            type="button"
            onClick={onPlay}
            className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-amber-50 text-stone-700 border border-stone-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer active:scale-95"
            title="장난감으로 놀아주기"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>놀기</span>
          </button>

          <button
            type="button"
            onClick={onToggleSleep}
            className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-indigo-50 text-stone-700 border border-stone-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="낮잠 재우기 또는 깨우기"
          >
            {cat.currentAnimation === 'sleep' ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsClosetOpen(!isClosetOpen);
              setIsTreatDrawerOpen(false);
            }}
            className="p-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-600 border border-stone-200 text-xs cursor-pointer"
            title="액세서리 옷장"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onOpenAdoption}
            className="p-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-600 border border-stone-200 text-xs cursor-pointer"
            title="고양이 입양소 / 묘종 변경"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Collapsible Treat Drawer */}
        {isTreatDrawerOpen && (
          <div className="p-2.5 bg-amber-50/90 rounded-2xl border border-amber-200 animate-fade-in space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span>🐟 캔으로 맛난 간식 주기</span>
              <span className="text-[11px] text-amber-700">보유: {cat.coins}캔</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {FOOD_ITEMS.map((item) => {
                const canAfford = cat.coins >= item.cost;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!canAfford}
                    onClick={() => {
                      onFeed(item);
                      setIsTreatDrawerOpen(false);
                    }}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                      canAfford
                        ? 'bg-white hover:bg-amber-100 border-amber-200 cursor-pointer shadow-xs active:scale-95'
                        : 'bg-stone-100 border-stone-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{item.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-stone-800 leading-tight">{item.name}</div>
                        <div className="text-[10px] text-stone-500">+{item.fullnessRestore}% 포만감</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-black text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded-md shrink-0">
                      {item.cost}캔
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Collapsible Closet Drawer */}
        {isClosetOpen && (
          <div className="p-2.5 bg-stone-100 rounded-2xl border border-stone-200 animate-fade-in space-y-1.5">
            <span className="text-xs font-bold text-stone-700 block">🎀 악세서리 착용</span>
            <div className="flex flex-wrap gap-1">
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    cat.accessory === acc.id
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span className="mr-1">{acc.icon}</span>
                  <span>{acc.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
