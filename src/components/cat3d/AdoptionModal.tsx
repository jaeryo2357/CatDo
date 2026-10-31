import React, { useState } from 'react';
import { CAT_BREEDS, CatBreedId, CatPersonality, CatState } from '../../types/cat';
import { Sparkles, Heart, Check, PawPrint, Dna } from 'lucide-react';
import { playSound } from '../../utils/audio';

interface AdoptionModalProps {
  isOpen: boolean;
  onAdopt: (cat: CatState) => void;
  currentCat?: CatState;
  onClose?: () => void;
}

const RANDOM_NAMES = ['치즈', '모찌', '나비', '보리', '루루', '까망이', '호두', '콩이', '하루', '초코', '망고', '구름이'];

export const AdoptionModal: React.FC<AdoptionModalProps> = ({
  isOpen,
  onAdopt,
  currentCat,
  onClose,
}) => {
  const [selectedBreed, setSelectedBreed] = useState<CatBreedId>(currentCat?.breed || 'cheese');
  const [name, setName] = useState(currentCat?.name || '치즈');
  const [personality, setPersonality] = useState<CatPersonality>(currentCat?.personality || 'foodie');

  if (!isOpen) return null;

  const handleRandomName = () => {
    const random = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    setName(random);
    playSound.meow();
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || '냥이';

    const newCat: CatState = currentCat
      ? {
          ...currentCat,
          name: finalName,
          breed: selectedBreed,
          personality,
        }
      : {
          id: `cat_${Date.now()}`,
          name: finalName,
          breed: selectedBreed,
          personality,
          level: 1,
          exp: 0,
          expToNext: 100,
          fullness: 50,
          happiness: 70,
          coins: 40, // Starting welcome tuna cans!
          accessory: 'none',
          currentAnimation: 'happy',
          totalTasksCompleted: 0,
          adoptedAt: Date.now(),
          lastFedAt: Date.now(),
          lastPetAt: Date.now(),
        };

    playSound.meow();
    playSound.levelUp();
    onAdopt(newCat);
  };

  const activeBreedInfo = CAT_BREEDS.find((b) => b.id === selectedBreed)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-amber-200 overflow-hidden my-6">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-6 text-white text-center relative shadow-sm">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <PawPrint className="w-4 h-4" />
            3D 고양이 입양 센터
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            평생을 함께할 나만의 냥이를 골라주세요!
          </h2>
          <p className="text-amber-100 text-sm mt-1 max-w-md mx-auto">
            할일을 완수하고 보상을 모아 이 작고 사랑스러운 냥이의 든든한 집사가 되어주세요.
          </p>
        </div>

        <form onSubmit={handleConfirm} className="p-6 sm:p-8 space-y-6">
          {/* 1. Cat Breed Selection Cards */}
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-3 flex items-center justify-between">
              <span>1. 묘종 선택 (3D 스타일)</span>
              <span className="text-xs text-amber-600 font-normal">총 5종의 귀여운 냥이들</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {CAT_BREEDS.map((breed) => {
                const isSelected = selectedBreed === breed.id;
                return (
                  <button
                    key={breed.id}
                    type="button"
                    onClick={() => {
                      setSelectedBreed(breed.id);
                      playSound.meow();
                    }}
                    className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center text-center relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 shadow-md scale-102 ring-2 ring-amber-300'
                        : 'border-stone-200 hover:border-amber-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full p-1 shadow">
                        <Check className="w-3.5 h-3.5 stroke-3" />
                      </span>
                    )}

                    {/* Cute Stylized Cat Avatar representation */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner mb-2 border border-black/5"
                      style={{ backgroundColor: breed.primaryColor }}
                    >
                      <span className="drop-shadow">🐱</span>
                    </div>

                    <span className="font-bold text-xs text-stone-800">{breed.name}</span>
                    <span className="text-[10px] text-stone-500 mt-0.5 leading-tight line-clamp-1">
                      {breed.personalityHint}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Breed Detail Banner */}
            <div className="mt-3 p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-start gap-3">
              <div
                className="w-4 h-4 rounded-full mt-0.5 shrink-0 ring-2 ring-white shadow"
                style={{ backgroundColor: activeBreedInfo.primaryColor }}
              />
              <div className="text-xs text-stone-600">
                <span className="font-bold text-stone-800 mr-1.5">{activeBreedInfo.name}:</span>
                {activeBreedInfo.description}
              </div>
            </div>
          </div>

          {/* 2. Cat Name & Personality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cat-name-input" className="block text-sm font-bold text-stone-700 mb-2">
                2. 냥이의 이름 🏷️
              </label>
              <div className="flex gap-2">
                <input
                  id="cat-name-input"
                  type="text"
                  maxLength={12}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 지어주세요"
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none font-medium text-stone-800"
                  required
                />
                <button
                  type="button"
                  onClick={handleRandomName}
                  className="px-3.5 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-xs font-bold transition-colors shrink-0"
                >
                  랜덤 추천
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">
                3. 냥이 성향 🐾
              </label>
              <select
                value={personality}
                onChange={(e) => setPersonality(e.target.value as CatPersonality)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none font-medium text-stone-800 bg-white"
              >
                <option value="foodie">🍖 먹보 (참치캔과 간식에 진심)</option>
                <option value="cuddly">💕 애교쟁이 (쓰다듬기를 최고로 좋아함)</option>
                <option value="energetic">⚡ 활발함 (장난감과 댄스 매니아)</option>
                <option value="zen">🧘‍♂️ 차분함 (묵묵히 집사를 지켜보는 현자)</option>
              </select>
            </div>
          </div>

          {/* Initial Welcome Bonus Notice */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-3xl">🎁</span>
            <div className="text-xs text-stone-700">
              <span className="font-bold text-orange-800 block text-sm">입양 기념 웰컴 선물 지급!</span>
              새내기 집사님을 위해 <strong className="text-amber-700">40 캔 코인</strong>이 지갑에 즉시 지급됩니다. 할일을 완료하고 풍성한 참치캔을 모아보세요!
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50 transition-colors"
              >
                취소
              </button>
            )}
            <button
              type="submit"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold shadow-lg shadow-orange-500/25 transition-all transform active:scale-95 flex items-center gap-2"
            >
              <Heart className="w-5 h-5 fill-current" />
              {currentCat ? '정보 저장하기' : '이 고양이와 함께 시작하기!'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
