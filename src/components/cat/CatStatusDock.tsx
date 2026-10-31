import React, { useState } from 'react';
import { CatAccessory, CatState, FOOD_ITEMS, FoodShopItem } from '../../types/cat';
import {
  ChevronDown,
  ChevronUp,
  Heart,
  Fish,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  Volume2,
  Smile,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { playSound } from '../../utils/audio';

interface CatStatusDockProps {
  cat: CatState;
  onFeed: (food: FoodShopItem) => void;
  onPet: () => void;
  onPlay: () => void;
  onChangeAccessory: (acc: CatAccessory) => void;
  onOpenAdoption: () => void;
  onToggleSleep: () => void;
}

export const CatStatusDock: React.FC<CatStatusDockProps> = ({
  cat,
  onFeed,
  onPet,
  onPlay,
  onChangeAccessory,
  onOpenAdoption,
  onToggleSleep,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'care' | 'shop' | 'closet'>('care');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3000);
  };

  const isHungry = cat.fullness <= 30;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl transition-all duration-300">
      {/* Collapse Toggle Button */}
      <div className="flex justify-center -mb-px">
        <button
          type="button"
          onClick={() => {
            setIsCollapsed(!isCollapsed);
            playSound.meow();
          }}
          className="px-4 py-1.5 bg-white/90 hover:bg-white text-stone-700 text-xs font-bold rounded-t-2xl border-t border-x border-amber-200/80 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-600" />
              <span>집사 케어 패널 열기</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
              <span>힐링 뷰 (패널 숨기기)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container */}
      {!isCollapsed && (
        <div className="bg-white/95 rounded-3xl border-2 border-amber-200 shadow-xl overflow-hidden backdrop-blur-md">
          {/* Top Status Strip: Hunger, Happiness, Level, Coins */}
          <div className="px-4 py-3 bg-gradient-to-r from-amber-50/90 via-orange-50/90 to-amber-50/90 border-b border-amber-100 flex flex-wrap items-center justify-between gap-3">
            {/* Cat Bio & Level */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onOpenAdoption}
                className="w-10 h-10 rounded-2xl bg-amber-200/80 border border-amber-300 flex items-center justify-center text-xl shadow-inner hover:scale-105 transition-transform"
                title="입양 정보 및 프로필 보기"
              >
                🐱
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-stone-900 text-sm tracking-tight">{cat.name}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                    Lv.{cat.level}
                  </span>
                  {isHungry && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white animate-bounce">
                      배고파요! 밥 주세요
                    </span>
                  )}
                </div>
                {/* Exp bar */}
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-24 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (cat.exp / cat.expToNext) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium">
                    {cat.exp}/{cat.expToNext} EXP
                  </span>
                </div>
              </div>
            </div>

            {/* Vital Meters: Fullness & Happiness */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              {/* Fullness */}
              <div className="flex items-center gap-1.5">
                <span className="text-amber-700">🥣 포만감</span>
                <div className="w-20 h-2.5 bg-stone-200 rounded-full overflow-hidden border border-amber-200/50">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      cat.fullness <= 30 ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${cat.fullness}%` }}
                  />
                </div>
                <span className="text-[11px] text-stone-600">{cat.fullness}%</span>
              </div>

              {/* Happiness */}
              <div className="flex items-center gap-1.5">
                <span className="text-rose-600">💖 행복도</span>
                <div className="w-20 h-2.5 bg-stone-200 rounded-full overflow-hidden border border-rose-200/50">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-300"
                    style={{ width: `${cat.happiness}%` }}
                  />
                </div>
                <span className="text-[11px] text-stone-600">{cat.happiness}%</span>
              </div>

              {/* Coins Wallet */}
              <div className="flex items-center gap-1 bg-amber-100/80 px-3 py-1.5 rounded-2xl border border-amber-300/80 shadow-xs">
                <span className="text-base">🐟</span>
                <span className="text-xs font-extrabold text-amber-900 tracking-tight">
                  {cat.coins.toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-700 font-medium">캔</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-4 pt-2.5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('care')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'care'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                🐾 냥이 상호작용
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('shop')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'shop'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Fish className="w-3.5 h-3.5" />
                간식 & 밥 주기
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('closet')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'closet'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                악세서리 옷장
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleSleep}
                className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                  cat.currentAnimation === 'sleep'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
                title="고양이를 낮잠 재우거나 깨웁니다"
              >
                {cat.currentAnimation === 'sleep' ? '☀️ 깨우기' : '🌙 낮잠 재우기'}
              </button>
            </div>
          </div>

          {/* Tab Contents */}
          <div className="p-3 sm:p-4">
            {/* Tab 1: Care & Play */}
            {activeTab === 'care' && (
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onPet();
                    notify(`${cat.name}을(를) 정성껏 쓰다듬었습니다! 골골송을 불러요 💕`);
                  }}
                  className="flex-1 min-w-[130px] py-2.5 px-3 bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 border border-rose-200 rounded-2xl flex items-center justify-center gap-2 text-rose-800 text-xs font-bold shadow-xs active:scale-95 transition-all"
                >
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span>다정하게 쓰다듬기</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onPlay();
                    notify(`${cat.name}이(가) 신나게 낚싯대를 쫓으며 춤을 춥니다! 🐾`);
                  }}
                  className="flex-1 min-w-[130px] py-2.5 px-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 rounded-2xl flex items-center justify-center gap-2 text-amber-800 text-xs font-bold shadow-xs active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>깃털 장난감 놀기</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playSound.meow();
                    notify(`${cat.name}: "야옹~! (집사 사랑한다옹)"`);
                  }}
                  className="py-2.5 px-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-2xl flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-all"
                >
                  <Volume2 className="w-4 h-4 text-stone-600" />
                  <span>야옹 부르기</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenAdoption}
                  className="py-2.5 px-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-2xl flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4 text-stone-600" />
                  <span>묘종 변경/입양</span>
                </button>
              </div>
            )}

            {/* Tab 2: Shop & Feeding */}
            {activeTab === 'shop' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {FOOD_ITEMS.map((item) => {
                  const canAfford = cat.coins >= item.cost;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onFeed(item)}
                      className={`p-2.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                        canAfford
                          ? 'bg-amber-50/50 hover:bg-amber-100/70 border-amber-200 shadow-xs cursor-pointer active:scale-95'
                          : 'bg-stone-50 border-stone-200 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-xs font-extrabold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-lg">
                          {item.cost}캔
                        </span>
                      </div>
                      <div className="mt-1">
                        <div className="text-xs font-bold text-stone-800 line-clamp-1">{item.name}</div>
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          포만감 +{item.fullnessRestore}% · 행복 +{item.happinessBonus}%
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tab 3: Accessories Closet */}
            {activeTab === 'closet' && (
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'none', label: '착용 안함', icon: '🐾' },
                  { id: 'bell_collar', label: '황금 딸랑이 방울', icon: '🔔' },
                  { id: 'sunglasses', label: '힙스터 선글라스', icon: '🕶️' },
                  { id: 'party_hat', label: '축하 고깔모자', icon: '🎉' },
                  { id: 'flower', label: '사랑스런 분홍꽃', icon: '🌸' },
                ].map((acc) => {
                  const isEquipped = cat.accessory === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        onChangeAccessory(acc.id as CatAccessory);
                        playSound.coin();
                        notify(`악세서리를 '${acc.label}'(으)로 변경했습니다!`);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        isEquipped
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      <span>{acc.icon}</span>
                      <span>{acc.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Toast Notification */}
            {statusNotification && (
              <div className="mt-2 text-center text-xs font-bold text-amber-900 bg-amber-100/90 py-1 px-3 rounded-lg animate-fade-in border border-amber-200/80">
                {statusNotification}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
