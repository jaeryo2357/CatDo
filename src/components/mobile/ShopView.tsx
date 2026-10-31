import React from 'react';
import { CatState, FOOD_ITEMS, FoodShopItem, CatAccessory } from '../../types/cat';
import { Fish, Heart, Sparkles, Check, ShoppingBag, ShieldCheck } from 'lucide-react';
import { playSound } from '../../utils/audio';

interface ShopViewProps {
  cat: CatState;
  onFeed: (food: FoodShopItem) => void;
  onChangeAccessory: (acc: CatAccessory) => void;
}

export const ShopView: React.FC<ShopViewProps> = ({
  cat,
  onFeed,
  onChangeAccessory,
}) => {
  return (
    <div className="flex-1 p-4 space-y-5 overflow-y-auto">
      {/* Wallet Balance Hero Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-5 text-white shadow-md shadow-orange-500/20 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-amber-100 uppercase tracking-wider block">
            집사의 노력 지갑
          </span>
          <div className="text-3xl font-black mt-1 flex items-center gap-2">
            <span>🐟</span>
            <span>{cat.coins.toLocaleString()}</span>
            <span className="text-base font-bold text-amber-100">캔</span>
          </div>
          <p className="text-[11px] text-amber-100 mt-1">
            할일을 완수하고 AI 감정으로 캔을 모아보세요!
          </p>
        </div>

        <div className="text-right bg-white/20 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20">
          <span className="text-[10px] text-amber-100 block">현재 냥이 포만감</span>
          <span className="text-base font-black text-white">{cat.fullness}%</span>
        </div>
      </div>

      {/* 1. Food & Treats Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-1.5">
            <span>🥣</span>
            <span>영양 간식 & 식사</span>
          </h3>
          <span className="text-xs text-stone-500">배고픈 냥이를 든든하게!</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FOOD_ITEMS.map((item) => {
            const canAfford = cat.coins >= item.cost;
            return (
              <div
                key={item.id}
                className={`p-4 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                  canAfford
                    ? 'bg-white border-amber-200/90 shadow-xs'
                    : 'bg-stone-50 border-stone-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shadow-inner shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-stone-900 truncate">{item.name}</h4>
                    <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-stone-600">
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      포만감 +{item.fullnessRestore}%
                    </span>
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      행복 +{item.happinessBonus}%
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => onFeed(item)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 text-white font-extrabold text-xs shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>{item.cost}캔</span>
                    <span>구매/급여</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Accessories Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-1.5">
            <span>🎀</span>
            <span>냥이 꾸미기 악세서리</span>
          </h3>
          <span className="text-xs text-stone-500">원하는 장식을 장착하세요</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { id: 'none', label: '기본 (착용 안함)', icon: '🐾', desc: '자연스러운 냥이의 모습' },
            { id: 'bell_collar', label: '황금 방울 목걸이', icon: '🔔', desc: '딸랑딸랑 맑은 소리' },
            { id: 'sunglasses', label: '힙스터 선글라스', icon: '🕶️', desc: '트렌디한 힙합 냥이' },
            { id: 'party_hat', label: '축하 고깔모자', icon: '🎉', desc: '언제나 생일파티 기분' },
            { id: 'flower', label: '사랑스런 분홍꽃', icon: '🌸', desc: '청순하고 사랑스러운 매력' },
          ].map((acc) => {
            const isEquipped = cat.accessory === acc.id;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => {
                  onChangeAccessory(acc.id as CatAccessory);
                  playSound.coin();
                }}
                className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-between cursor-pointer ${
                  isEquipped
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-300 shadow-sm'
                    : 'bg-white hover:bg-stone-50 border-stone-200'
                }`}
              >
                <span className="text-2xl block mb-1">{acc.icon}</span>
                <span className="font-bold text-xs text-stone-900 block leading-tight">{acc.label}</span>
                <span className="text-[10px] text-stone-500 mt-1 block line-clamp-1">{acc.desc}</span>

                <span
                  className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isEquipped ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {isEquipped ? '착용 중' : '선택하기'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
