import { CheckSquare, Cat, Footprints, ShoppingBag, BarChart3 } from 'lucide-react';
import { playSound } from '../../utils/audio';

export type MobileTab = 'todo' | 'cat' | 'park' | 'shop' | 'stats';

interface MobileTabBarProps {
  currentTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
  pendingTasksCount: number;
  isCatHungry: boolean;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  currentTab,
  onChangeTab,
  pendingTasksCount,
  isCatHungry,
}) => {
  const tabs = [
    {
      id: 'todo' as MobileTab,
      label: '투두',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'cat' as MobileTab,
      label: '냥이룸',
      icon: Cat,
      badge: isCatHungry ? '!' : undefined,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'park' as MobileTab,
      label: '산책 공원',
      icon: Footprints,
    },
    {
      id: 'shop' as MobileTab,
      label: '간식 상점',
      icon: ShoppingBag,
    },
    {
      id: 'stats' as MobileTab,
      label: '집사 기록',
      icon: BarChart3,
    },
  ];

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-2 py-1.5 shadow-lg safe-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                playSound.meow();
                onChangeTab(tab.id);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer relative ${
                isActive
                  ? 'text-amber-600 font-extrabold scale-105'
                  : 'text-stone-400 hover:text-stone-600 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-2.5' : 'stroke-2'}`} />
                {tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full ring-2 ring-white shadow-xs ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight leading-none">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
