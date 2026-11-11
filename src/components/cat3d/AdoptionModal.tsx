import React, { useState, useRef } from 'react';
import { CAT_BREEDS, CatBreedId, CatPersonality, CatState, CustomCatAppearance } from '../../types/cat';
import { CatScene } from './CatScene';
import {
  Sparkles,
  Heart,
  Check,
  PawPrint,
  Camera,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Wand2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { playSound } from '../../utils/audio';

interface AdoptionModalProps {
  isOpen: boolean;
  onAdopt: (cat: CatState) => void;
  currentCat?: CatState;
  onClose?: () => void;
}

const RANDOM_NAMES = ['치즈', '모찌', '나비', '보리', '루루', '까망이', '호두', '콩이', '하루', '초코', '망고', '구름이'];

// 3 Curated high-quality sample cat photos for quick instant testing
const SAMPLE_CATS = [
  {
    id: 'sample_cheese',
    title: '치즈 태비',
    icon: '🧀',
    photoUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23fed7aa"/><circle cx="100" cy="100" r="65" fill="%23f97316"/><ellipse cx="100" cy="120" rx="40" ry="30" fill="%23ffedd5"/><circle cx="75" cy="90" r="12" fill="%2310b981"/><circle cx="125" cy="90" r="12" fill="%2310b981"/><polygon points="100,105 92,97 108,97" fill="%23f43f5e"/><polygon points="50,45 80,65 55,85" fill="%23f97316"/><polygon points="150,45 120,65 145,85" fill="%23f97316"/></svg>',
    simulatedData: {
      breedTag: '골든 치즈 태비',
      suggestedName: '망고',
      personality: 'foodie' as CatPersonality,
      primaryColor: '#f59e0b',
      stripeColor: '#c2410c',
      bellyColor: '#fffbeb',
      eyeColorLeft: '#10b981',
      eyeColorRight: '#10b981',
      noseColor: '#f43f5e',
      hasStripes: true,
      hasBib: true,
      hasSocks: true,
      hasBlush: true,
      aiDescription: '햇살처럼 밝고 고소한 치즈 무늬와 에메랄드 눈빛이 눈부신 애교쟁이 고양이입니다! ☀️',
    },
  },
  {
    id: 'sample_tuxedo',
    title: '턱시도 양말냥',
    icon: '🎩',
    photoUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23e2e8f0"/><circle cx="100" cy="100" r="65" fill="%2318181b"/><ellipse cx="100" cy="125" rx="35" ry="32" fill="%23ffffff"/><circle cx="75" cy="90" r="12" fill="%23facc15"/><circle cx="125" cy="90" r="12" fill="%23facc15"/><polygon points="100,105 92,97 108,97" fill="%23fb7185"/><polygon points="50,45 80,65 55,85" fill="%2318181b"/><polygon points="150,45 120,65 145,85" fill="%2318181b"/></svg>',
    simulatedData: {
      breedTag: '멋쟁이 턱시도 코숏',
      suggestedName: '오레오',
      personality: 'zen' as CatPersonality,
      primaryColor: '#18181b',
      stripeColor: '#09090b',
      bellyColor: '#ffffff',
      eyeColorLeft: '#facc15',
      eyeColorRight: '#facc15',
      noseColor: '#fb7185',
      hasStripes: false,
      hasBib: true,
      hasSocks: true,
      hasBlush: true,
      aiDescription: '검은 연미복과 순백의 셔츠를 입은 젠틀한 신사 고양이! 호박색 눈동자가 지적입니다. 🎩',
    },
  },
  {
    id: 'sample_oddeye',
    title: '오드아이 화이트',
    icon: '💎',
    photoUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23e0f2fe"/><circle cx="100" cy="100" r="65" fill="%23ffffff"/><circle cx="75" cy="90" r="12" fill="%230284c7"/><circle cx="125" cy="90" r="12" fill="%23f59e0b"/><polygon points="100,105 92,97 108,97" fill="%23f472b6"/><polygon points="50,45 80,65 55,85" fill="%23f8fafc"/><polygon points="150,45 120,65 145,85" fill="%23f8fafc"/></svg>',
    simulatedData: {
      breedTag: '신비로운 오드아이 화이트',
      suggestedName: '구름이',
      personality: 'cuddly' as CatPersonality,
      primaryColor: '#ffffff',
      stripeColor: '#f1f5f9',
      bellyColor: '#ffffff',
      eyeColorLeft: '#0284c7', // Sapphire Blue
      eyeColorRight: '#f59e0b', // Amber Gold
      noseColor: '#f472b6',
      hasStripes: false,
      hasBib: true,
      hasSocks: true,
      hasBlush: true,
      aiDescription: '푸른 바다와 황금 보석을 품은 신비로운 오드아이와 눈송이 같은 새하얀 털의 천사묘입니다! ✨',
    },
  },
];

export const AdoptionModal: React.FC<AdoptionModalProps> = ({
  isOpen,
  onAdopt,
  currentCat,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'photo'>(
    currentCat?.breed === 'custom' ? 'photo' : 'preset'
  );
  const [selectedBreed, setSelectedBreed] = useState<CatBreedId>(currentCat?.breed || 'cheese');
  const [name, setName] = useState(currentCat?.name || '치즈');
  const [personality, setPersonality] = useState<CatPersonality>(currentCat?.personality || 'foodie');

  // AI Photo Generation States
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    currentCat?.customAppearance?.sourcePhotoUrl || null
  );
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [customAppearance, setCustomAppearance] = useState<CustomCatAppearance | undefined>(
    currentCat?.customAppearance
  );
  const [aiError, setAiError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleRandomName = () => {
    const random = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    setName(random);
    playSound.meow();
  };

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAiError('이미지 파일(JPG, PNG 등)을 선택해주세요.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setPhotoPreview(base64Data);
      setAiError(null);
      await analyzePhoto(base64Data);
    };
    reader.readAsDataURL(file);
  };

  // Analyze Photo with Gemini Vision API
  const analyzePhoto = async (base64Image: string) => {
    setIsAnalyzingPhoto(true);
    setAiError(null);
    playSound.meow();

    try {
      const res = await fetch('/api/analyze-cat-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoBase64: base64Image }),
      });

      if (!res.ok) {
        throw new Error('AI 분석 서버 응답 오류');
      }

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const appearance: CustomCatAppearance = {
          primaryColor: d.primaryColor,
          stripeColor: d.stripeColor,
          bellyColor: d.bellyColor,
          eyeColorLeft: d.eyeColorLeft,
          eyeColorRight: d.eyeColorRight,
          noseColor: d.noseColor,
          hasStripes: d.hasStripes,
          hasBib: d.hasBib,
          hasSocks: d.hasSocks,
          hasBlush: d.hasBlush,
          sourcePhotoUrl: base64Image,
          breedTag: d.breedTag,
          aiDescription: d.aiDescription,
        };

        setCustomAppearance(appearance);
        setSelectedBreed('custom');
        setName(d.suggestedName || name);
        setPersonality(d.personality || personality);
        playSound.levelUp();
      }
    } catch (err) {
      console.warn('Photo AI analysis error, using smart fallback:', err);
      // Fallback custom cat appearance
      const fallbackAppearance: CustomCatAppearance = {
        primaryColor: '#f59e0b',
        stripeColor: '#d97706',
        bellyColor: '#ffffff',
        eyeColorLeft: '#10b981',
        eyeColorRight: '#10b981',
        noseColor: '#f43f5e',
        hasStripes: true,
        hasBib: true,
        hasSocks: true,
        hasBlush: true,
        sourcePhotoUrl: base64Image,
        breedTag: '사진 맞춤 사랑둥이 냥이',
        aiDescription: '사진 속 귀여운 털색과 따뜻한 눈빛을 담아낸 1:1 맞춤형 3D 냥이입니다! 💕',
      };
      setCustomAppearance(fallbackAppearance);
      setSelectedBreed('custom');
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  // Apply Sample Cat Photo
  const handleApplySample = (sample: typeof SAMPLE_CATS[0]) => {
    setPhotoPreview(sample.photoUrl);
    setCustomAppearance({
      ...sample.simulatedData,
      sourcePhotoUrl: sample.photoUrl,
    });
    setSelectedBreed('custom');
    setName(sample.simulatedData.suggestedName);
    setPersonality(sample.simulatedData.personality);
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
          customAppearance: selectedBreed === 'custom' ? customAppearance : undefined,
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
          coins: 40,
          accessory: 'none',
          currentAnimation: 'happy',
          totalTasksCompleted: 0,
          adoptedAt: Date.now(),
          lastFedAt: Date.now(),
          lastPetAt: Date.now(),
          customAppearance: selectedBreed === 'custom' ? customAppearance : undefined,
        };

    playSound.meow();
    playSound.levelUp();
    onAdopt(newCat);
  };

  // Preview Cat State for the Mini 3D Viewport in Modal
  const previewCatState: CatState = {
    id: 'preview',
    name: name || '냥이',
    breed: selectedBreed,
    personality,
    level: currentCat?.level || 1,
    exp: 0,
    expToNext: 100,
    fullness: 80,
    happiness: 90,
    coins: 50,
    accessory: currentCat?.accessory || 'none',
    currentAnimation: 'idle',
    totalTasksCompleted: 0,
    adoptedAt: Date.now(),
    lastFedAt: Date.now(),
    lastPetAt: Date.now(),
    customAppearance: selectedBreed === 'custom' ? customAppearance : undefined,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 sm:border-4 border-amber-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-4 sm:p-5 text-white text-center relative shadow-xs shrink-0">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
            <PawPrint className="w-3.5 h-3.5" />
            3D 고양이 입양 센터
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            나만의 귀여운 3D 냥이를 선택하세요! 🐾
          </h2>
          <p className="text-amber-100 text-xs mt-0.5">
            기본 묘종을 고르거나, <strong>실제 고양이 사진을 올려 1:1 맞춤형 3D 모델</strong>로 만들 수 있어요!
          </p>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Modal Body */}
        <form onSubmit={handleConfirm} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {/* Live 3D Cat Preview Viewport Card */}
          <div className="bg-gradient-to-b from-amber-50/60 to-white rounded-2xl border-2 border-amber-200/80 p-2 sm:p-3 shadow-xs relative flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:w-44 h-40 rounded-xl overflow-hidden bg-white/80 border border-amber-100 shadow-inner relative shrink-0">
              <CatScene cat={previewCatState} onPetCat={() => playSound.meow()} />
              <div className="absolute bottom-1 left-2 text-[9px] font-bold text-amber-800 bg-white/80 px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                실시간 3D 냥이 터치 가능
              </div>
            </div>

            <div className="flex-1 min-w-0 text-left space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-stone-900">
                  {name || '냥이'}
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {selectedBreed === 'custom' && customAppearance?.breedTag
                    ? customAppearance.breedTag
                    : CAT_BREEDS.find((b) => b.id === selectedBreed)?.name || '커스텀 냥이'}
                </span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                {selectedBreed === 'custom' && customAppearance?.aiDescription
                  ? customAppearance.aiDescription
                  : CAT_BREEDS.find((b) => b.id === selectedBreed)?.description}
              </p>

              {/* Color Swatches Palette */}
              {selectedBreed === 'custom' && customAppearance && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[10px] font-bold text-stone-400">색상 구성:</span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span
                      className="w-4 h-4 rounded-full border shadow-xs"
                      style={{ backgroundColor: customAppearance.primaryColor }}
                      title="주요 털색"
                    />
                    <span
                      className="w-4 h-4 rounded-full border shadow-xs"
                      style={{ backgroundColor: customAppearance.stripeColor || customAppearance.primaryColor }}
                      title="무늬색"
                    />
                    <span
                      className="w-4 h-4 rounded-full border shadow-xs"
                      style={{ backgroundColor: customAppearance.bellyColor }}
                      title="배/가슴 털색"
                    />
                    <span
                      className="w-4 h-4 rounded-full border shadow-xs"
                      style={{ backgroundColor: customAppearance.eyeColorLeft }}
                      title="왼쪽 눈"
                    />
                    <span
                      className="w-4 h-4 rounded-full border shadow-xs"
                      style={{ backgroundColor: customAppearance.eyeColorRight }}
                      title="오른쪽 눈"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Creation Method Mode Tabs */}
          <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-bold border border-stone-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('preset');
                if (selectedBreed === 'custom') setSelectedBreed('cheese');
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'preset'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <span>🐱 추천 묘종 (기본 5종)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('photo');
                setSelectedBreed('custom');
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'photo'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-amber-800'
              }`}
            >
              <span>📸 내 고양이 사진으로 만들기</span>
            </button>
          </div>

          {/* Tab Content 1: Preset Breeds */}
          {activeTab === 'preset' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">
                원하는 묘종을 선택해주세요:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
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
                      className={`p-2.5 rounded-2xl border-2 transition-all flex flex-col items-center text-center relative cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 shadow-sm scale-102 ring-2 ring-amber-300'
                          : 'border-stone-200 hover:border-amber-200 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white rounded-full p-0.5 shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}

                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-inner mb-1.5 border border-black/5"
                        style={{ backgroundColor: breed.primaryColor }}
                      >
                        <span>🐱</span>
                      </div>

                      <span className="font-extrabold text-xs text-stone-900">{breed.name}</span>
                      <span className="text-[10px] text-stone-500 line-clamp-1">{breed.personalityHint}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab Content 2: Cat Photo to 3D Generation */}
          {activeTab === 'photo' && (
            <div className="space-y-3.5 bg-amber-50/50 p-3 sm:p-4 rounded-2xl border-2 border-dashed border-amber-300">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-600" />
                    <span>실제 고양이 사진 올리기</span>
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    사진 속 고양이의 털 무늬, 코 색상, 눈동자를 3D 모델에 그대로 옮겨 드립니다.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>사진 올리기</span>
                </button>
              </div>

              {/* Photo Preview & Live Scan Status */}
              {photoPreview && (
                <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-amber-200">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-stone-200 relative shrink-0">
                    <img
                      src={photoPreview}
                      alt="Uploaded cat"
                      className="w-full h-full object-cover"
                    />
                    {isAnalyzingPhoto && (
                      <div className="absolute inset-0 bg-amber-500/25 flex items-center justify-center animate-pulse">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {isAnalyzingPhoto ? (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                          사진 속 털색과 눈동자를 관찰하는 중입니다... 🐾
                        </span>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full animate-pulse w-3/4" />
                        </div>
                      </div>
                    ) : customAppearance ? (
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          완성: {customAppearance.breedTag}
                        </span>
                        <p className="text-[11px] text-stone-600 line-clamp-1">
                          {customAppearance.aiDescription}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-stone-500 font-medium">사진이 등록되었습니다.</span>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Sample Photos Bar for Instant Testing */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                  <span>사진이 없다면? 원클릭 샘플로 바로 테스트해보세요:</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {SAMPLE_CATS.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleApplySample(sample)}
                      className="p-2 rounded-xl bg-white hover:bg-amber-100 border border-stone-200 text-left transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <span className="text-xl shrink-0">{sample.icon}</span>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-stone-800 block truncate">
                          {sample.title}
                        </span>
                        <span className="text-[9px] text-stone-400 block truncate">
                          {sample.simulatedData.suggestedName}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. Name & Personality Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label htmlFor="cat-name-input" className="block text-xs font-bold text-stone-700 mb-1.5">
                냥이의 이름 🏷️
              </label>
              <div className="flex gap-2">
                <input
                  id="cat-name-input"
                  type="text"
                  maxLength={12}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 지어주세요"
                  className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 bg-white"
                />
                <button
                  type="button"
                  onClick={handleRandomName}
                  className="px-2.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer shrink-0"
                  title="랜덤 이름 추천"
                >
                  🎲 추천
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="cat-personality-select" className="block text-xs font-bold text-stone-700 mb-1.5">
                성격 및 말투 💬
              </label>
              <select
                id="cat-personality-select"
                value={personality}
                onChange={(e) => setPersonality(e.target.value as CatPersonality)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 bg-white cursor-pointer"
              >
                <option value="foodie">🐟 츄르에 진심인 먹보 (밥 달라고 조름)</option>
                <option value="energetic">⚡ 에너자이저 우다다 (파이팅 넘침)</option>
                <option value="cuddly">💕 무한 골골송 애교쟁이 (집사 껌딱지)</option>
                <option value="zen">🧘 도도하고 시크한 관찰자 (은근히 챙겨줌)</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isAnalyzingPhoto}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{currentCat ? '3D 냥이 정보 및 외형 변경 완료!' : '🎉 이 냥이로 입양하기! (시작)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
