import React, { useState, useEffect } from 'react';
import { CatAccessory, CatBreedId, CatState, FoodShopItem } from './types/cat';
import { TodoItem } from './types/todo';
import { AdoptionModal } from './components/cat3d/AdoptionModal';
import { AddTodoModal } from './components/todo/AddTodoModal';
import { MobileTabBar, MobileTab } from './components/mobile/MobileTabBar';
import { TodoMobileView } from './components/mobile/TodoMobileView';
import { CatRoomView } from './components/mobile/CatRoomView';
import { ShopView } from './components/mobile/ShopView';
import { StatsView } from './components/mobile/StatsView';
import { CatParkView } from './components/park/CatParkView';
import { completeTask, feedCat, petCat, isCatHungry, extractInterestTags } from './utils/rules';
import { playSound } from './utils/audio';
import {
  Sparkles,
  Plus,
  RotateCcw,
  Heart,
  Volume2,
  VolumeX,
} from 'lucide-react';

const STORAGE_CAT_KEY = 'catdo_cat_state_v1';
const STORAGE_TODOS_KEY = 'catdo_todos_v1';

const DEFAULT_TODOS: TodoItem[] = [
  {
    id: 'seed_1',
    title: '집중해서 30분 코딩 및 공부하기',
    detail: '방해 금지 모드로 목표 분량 완료하기',
    category: 'study',
    completed: false,
    createdAt: Date.now() - 3600000,
    analysis: {
      difficulty: 'medium',
      difficultyLabel: '집중 집중!',
      effortValue: 50,
      rationale: '높은 인지적 집중과 문제 해결 노력이 요구되는 유의미한 과업입니다.',
      catComment: '집사야 파이팅이다냥! 끝나면 맛있는 참치캔 부탁한다옹! 🐟',
      suggestedPacing: '25분 몰입 후 5분 먼 곳을 바라보며 눈을 쉬어주세요.',
    },
  },
  {
    id: 'seed_2',
    title: '신선한 물 500ml 마시고 가벼운 스트레칭',
    detail: '어깨와 목 근육 부드럽게 풀어주기',
    category: 'health',
    completed: true,
    completedAt: Date.now() - 1800000,
    createdAt: Date.now() - 7200000,
    analysis: {
      difficulty: 'easy',
      difficultyLabel: '가벼운 몸풀기',
      effortValue: 25,
      rationale: '지친 심신을 리프레시하고 활력을 되찾는 상쾌한 건강 습관입니다.',
      catComment: '기지개 쭉쭉 켜라냥! 냥이처럼 유연해질 거다옹~ 🐾',
    },
  },
  {
    id: 'seed_3',
    title: '방 정리 및 책상 위 먼지 털기',
    detail: '쾌적한 환경을 만들어 집중도 높이기',
    category: 'life',
    completed: false,
    createdAt: Date.now() - 1200000,
    analysis: {
      difficulty: 'medium',
      difficultyLabel: '기분 좋은 성취',
      effortValue: 40,
      rationale: '공간을 청결하게 정돈하여 스트레스를 줄이고 능률을 올리는 실용적 활동입니다.',
      catComment: '먼지 털 때 냥이 코 간지럽지 않게 조심해달라옹! 🧹',
    },
  },
];

export default function App() {
  const [cat, setCat] = useState<CatState | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [activeTab, setActiveTab] = useState<MobileTab>('todo');
  const [isAdoptionOpen, setIsAdoptionOpen] = useState(false);
  const [isAddTodoOpen, setIsAddTodoOpen] = useState(false);
  const [bannerAlert, setBannerAlert] = useState<string | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart') === '1';

    const savedCat = localStorage.getItem(STORAGE_CAT_KEY);
    const savedTodos = localStorage.getItem(STORAGE_TODOS_KEY);

    if (savedCat) {
      try {
        setCat(JSON.parse(savedCat));
      } catch {
        setCat(null);
      }
    } else if (autostart) {
      const seedCat: CatState = {
        id: 'cat_autostart',
        name: '치즈',
        breed: 'cheese',
        personality: 'foodie',
        level: 1,
        exp: 20,
        expToNext: 100,
        fullness: 50,
        happiness: 75,
        coins: 50,
        accessory: 'bell_collar',
        currentAnimation: 'idle',
        totalTasksCompleted: 1,
        adoptedAt: Date.now(),
        lastFedAt: Date.now(),
        lastPetAt: Date.now(),
      };
      setCat(seedCat);
      localStorage.setItem(STORAGE_CAT_KEY, JSON.stringify(seedCat));
    } else {
      setIsAdoptionOpen(true);
    }

    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos));
      } catch {
        setTodos(DEFAULT_TODOS);
      }
    } else {
      setTodos(DEFAULT_TODOS);
      localStorage.setItem(STORAGE_TODOS_KEY, JSON.stringify(DEFAULT_TODOS));
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (cat) {
      localStorage.setItem(STORAGE_CAT_KEY, JSON.stringify(cat));
    }
  }, [cat]);

  useEffect(() => {
    localStorage.setItem(STORAGE_TODOS_KEY, JSON.stringify(todos));
  }, [todos]);

  // Show temporary banner feedback
  const showBanner = (text: string) => {
    setBannerAlert(text);
    setTimeout(() => setBannerAlert(null), 3500);
  };

  // 1. Feeding Handler
  const handleFeedCat = (foodItem: FoodShopItem) => {
    if (!cat) return;
    const result = feedCat(cat, foodItem);

    if (!result.success) {
      showBanner(result.message);
      playSound.meow();
      return;
    }

    setCat(result.updatedCat);
    showBanner(result.message);
    playSound.munch();
    playSound.meow();

    if (result.leveledUp) {
      playSound.levelUp();
    }

    setTimeout(() => {
      setCat((prev) => (prev ? { ...prev, currentAnimation: 'idle' } : null));
    }, 3500);
  };

  // 2. Petting Handler
  const handlePetCat = () => {
    if (!cat) return;
    const result = petCat(cat);
    setCat(result.updatedCat);
    playSound.pet();

    setTimeout(() => {
      setCat((prev) => (prev ? { ...prev, currentAnimation: 'idle' } : null));
    }, 2500);
  };

  // 3. Play Toy Handler
  const handlePlayWithToy = () => {
    if (!cat) return;
    const updated: CatState = {
      ...cat,
      happiness: Math.min(100, cat.happiness + 12),
      currentAnimation: 'dance',
    };
    setCat(updated);
    playSound.meow();

    setTimeout(() => {
      setCat((prev) => (prev ? { ...prev, currentAnimation: 'idle' } : null));
    }, 3500);
  };

  // 4. Toggle Sleep
  const handleToggleSleep = () => {
    if (!cat) return;
    const nextAnim = cat.currentAnimation === 'sleep' ? 'idle' : 'sleep';
    setCat({
      ...cat,
      currentAnimation: nextAnim,
    });
    playSound.meow();
    showBanner(
      nextAnim === 'sleep'
        ? `${cat.name}이(가) 포근하게 웅크리고 낮잠을 잡니다. Zzz...`
        : `${cat.name}이(가) 하품을 하며 기지개를 켭니다!`
    );
  };

  // 5. Change Accessory
  const handleChangeAccessory = (acc: CatAccessory) => {
    if (!cat) return;
    setCat({ ...cat, accessory: acc });
  };

  // 6. Adoption Confirm
  const handleAdoptCat = (newCat: CatState) => {
    setCat(newCat);
    setIsAdoptionOpen(false);
    showBanner(`🎉 ${newCat.name}의 집사가 되신 것을 축하합니다! 매일매일 행복하게 지내봐요.`);
  };

  // 7. Toggle Todo Completion & Earn Effort Coins
  const handleToggleTodo = (id: string) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;

    const willComplete = !target.completed;
    const updatedTodos = todos.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          completed: willComplete,
          completedAt: willComplete ? Date.now() : undefined,
        };
      }
      return t;
    });

    setTodos(updatedTodos);

    if (willComplete && cat) {
      const { updatedCat, coinsGained, leveledUp } = completeTask(cat, target);
      setCat(updatedCat);
      showBanner(
        `🏆 '${target.title}' 완료! AI 노력 가치 +${coinsGained}캔 코인을 획득했습니다! 🐟`
      );
      if (leveledUp) {
        playSound.levelUp();
      }

      setTimeout(() => {
        setCat((prev) => (prev ? { ...prev, currentAnimation: 'idle' } : null));
      }, 3000);
    }
  };

  // 8. Add Todo
  const handleAddTodo = (newTodoData: Omit<TodoItem, 'id' | 'createdAt' | 'completed'>) => {
    const newTodo: TodoItem = {
      ...newTodoData,
      id: `task_${Date.now()}`,
      completed: false,
      createdAt: Date.now(),
    };
    setTodos([newTodo, ...todos]);
    showBanner(`새로운 할일이 등록되었습니다! 완료 시 +${newTodo.analysis.effortValue}캔 보상 🐟`);
  };

  // 9. Delete Todo
  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  // 10. Toggle Todo Importance (Star)
  const handleToggleImportant = (id: string) => {
    setTodos(
      todos.map((t) => (t.id === id ? { ...t, isImportant: !t.isImportant } : t))
    );
  };

  // 11. Update Todo Title/Detail
  const handleUpdateTodo = (id: string, updates: Partial<TodoItem>) => {
    setTodos(
      todos.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    showBanner('할일 내용이 저장되었습니다.');
  };

  // 12. Clear Completed Todos
  const handleClearCompletedTodos = () => {
    const completedCount = todos.filter((t) => t.completed).length;
    if (completedCount === 0) return;
    setTodos(todos.filter((t) => !t.completed));
    showBanner(`완료된 할일 ${completedCount}개를 목록에서 정리했습니다.`);
  };

  const pendingTasksCount = todos.filter((t) => !t.completed).length;
  const hungry = cat ? isCatHungry(cat) : false;

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col justify-center items-center sm:py-6 sm:px-4 text-stone-800 antialiased selection:bg-amber-200">
      {/* Outer Desktop Device Shell Container */}
      <div className="w-full max-w-md h-screen sm:h-[860px] sm:max-h-[92vh] sm:rounded-[40px] sm:shadow-2xl sm:border-[8px] sm:border-stone-800 flex flex-col bg-stone-50 relative overflow-hidden transition-all duration-300">
        {/* Android Smartphone Top Notch / Speaker Indicator (visible on desktop preview) */}
        <div className="hidden sm:flex items-center justify-center pt-2.5 pb-1 bg-stone-800">
          <div className="w-16 h-1 bg-stone-600 rounded-full" />
          <div className="w-2.5 h-2.5 rounded-full bg-stone-700 ml-3" />
        </div>

        {/* Mobile Top App Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-3.5 py-2 flex items-center justify-between">
          {/* Left Contextual Title */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-xs text-white shadow-2xs font-black">
              🐾
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-stone-900 leading-none">
                {activeTab === 'todo'
                  ? '오늘의 할 일'
                  : activeTab === 'cat'
                  ? '냥이룸'
                  : activeTab === 'park'
                  ? '산책 공원'
                  : activeTab === 'shop'
                  ? '간식 상점'
                  : '집사 기록'}
              </h1>
              {activeTab === 'todo' && (
                <span className="text-[10px] text-stone-400 font-medium block mt-0.5">
                  {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                  {pendingTasksCount > 0 ? ` • ${pendingTasksCount}개 남음` : ' • 모두 완료!'}
                </span>
              )}
            </div>
          </div>

          {/* Right Header: Cat & Coins Status Pill */}
          <div className="flex items-center gap-1.5">
            {cat && (
              <button
                type="button"
                onClick={() => setActiveTab('cat')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-xs font-bold text-amber-900 transition-colors cursor-pointer shadow-2xs"
                title="고양이 방으로 이동"
              >
                <span>🐱 {cat.name}</span>
                <span className="text-amber-300">|</span>
                <span className="flex items-center gap-0.5">
                  <span>🐟</span>
                  <span>{cat.coins}</span>
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Temporary Alert Toast */}
        {bannerAlert && (
          <div className="absolute top-14 left-4 right-4 z-50 bg-stone-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border border-stone-700 animate-fade-in backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="line-clamp-2">{bannerAlert}</span>
          </div>
        )}

        {/* Main Tab Screen Viewport */}
        <div className="flex-1 flex flex-col min-h-0 relative bg-stone-50">
          {cat ? (
            <>
              {activeTab === 'todo' && (
                <TodoMobileView
                  cat={cat}
                  todos={todos}
                  onToggleComplete={handleToggleTodo}
                  onDelete={handleDeleteTodo}
                  onAddTodo={handleAddTodo}
                  onToggleImportant={handleToggleImportant}
                  onUpdateTodo={handleUpdateTodo}
                  onClearCompleted={handleClearCompletedTodos}
                  onOpenAddModal={() => setIsAddTodoOpen(true)}
                  onJumpToCatRoom={() => setActiveTab('cat')}
                />
              )}

              {activeTab === 'cat' && (
                <CatRoomView
                  cat={cat}
                  activeTasks={todos.filter((t) => !t.completed)}
                  onFeed={handleFeedCat}
                  onPet={handlePetCat}
                  onPlay={handlePlayWithToy}
                  onChangeAccessory={handleChangeAccessory}
                  onOpenAdoption={() => setIsAdoptionOpen(true)}
                  onToggleSleep={handleToggleSleep}
                  onGoToPark={() => setActiveTab('park')}
                />
              )}

              {activeTab === 'park' && (
                <CatParkView
                  cat={{
                    ...cat,
                    interests:
                      cat.interests && cat.interests.length > 0
                        ? cat.interests
                        : extractInterestTags(todos),
                  }}
                  onBackToRoom={() => setActiveTab('cat')}
                  onUpdateCatState={(updater) => setCat((prev) => (prev ? updater(prev) : null))}
                />
              )}

              {activeTab === 'shop' && (
                <ShopView
                  cat={cat}
                  onFeed={handleFeedCat}
                  onChangeAccessory={handleChangeAccessory}
                />
              )}

              {activeTab === 'stats' && (
                <StatsView
                  cat={cat}
                  todos={todos}
                  onOpenAdoption={() => setIsAdoptionOpen(true)}
                />
              )}
            </>
          ) : (
            /* First Launch Onboarding Empty State */
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div className="bg-white p-6 rounded-3xl border-2 border-amber-200 shadow-lg space-y-4 max-w-sm">
                <span className="text-5xl block animate-bounce">🐱</span>
                <h2 className="text-xl font-black text-stone-900">
                  냥이투두에 오신 것을 환영합니다!
                </h2>
                <p className="text-stone-600 text-xs leading-relaxed">
                  키우고 싶은 나만의 3D 고양이를 선택해주세요.
                  할일을 완료할 때마다 AI가 노력과 고생을 가치로 환산해 참치캔을 드립니다! 🐟
                </p>
                <button
                  type="button"
                  onClick={() => setIsAdoptionOpen(true)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs shadow-md shadow-orange-500/25 cursor-pointer"
                >
                  고양이 입양하기 🐾
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Android Navigation Bar */}
        {cat && (
          <MobileTabBar
            currentTab={activeTab}
            onChangeTab={setActiveTab}
            pendingTasksCount={pendingTasksCount}
            isCatHungry={hungry}
          />
        )}
      </div>

      {/* Desktop Ambient Helper Footnote */}
      <div className="hidden sm:flex items-center gap-3 text-stone-400 text-xs mt-3 font-medium">
        <span>📱 안드로이드 모바일 앱 화면 (Play Store 기준)</span>
        <span>•</span>
        <span>하단 탭바를 눌러 냥이룸/할일/상점을 이동하세요</span>
      </div>

      {/* Adoption Modal */}
      <AdoptionModal
        isOpen={isAdoptionOpen}
        onAdopt={handleAdoptCat}
        currentCat={cat || undefined}
        onClose={cat ? () => setIsAdoptionOpen(false) : undefined}
      />

      {/* Add Todo Modal with AI valuation */}
      <AddTodoModal
        isOpen={isAddTodoOpen}
        onClose={() => setIsAddTodoOpen(false)}
        onAddTodo={handleAddTodo}
        catName={cat?.name || '냥이'}
      />
    </div>
  );
}
