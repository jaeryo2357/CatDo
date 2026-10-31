import React, { useState } from 'react';
import { CatState } from '../../types/cat';
import { TaskCategory, TodoItem, TASK_PRESETS, AiTaskAnalysis } from '../../types/todo';
import { TodoItemCard } from '../todo/TodoItem';
import { CatScene } from '../cat3d/CatScene';
import {
  Plus,
  Sparkles,
  Calendar,
  CheckCircle2,
  Filter,
  Search,
  ArrowRight,
  Heart,
} from 'lucide-react';
import { playSound } from '../../utils/audio';
import { calculateLocalEffortFallback } from '../../utils/rules';

interface TodoMobileViewProps {
  cat: CatState;
  todos: TodoItem[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onAddTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'completed'>) => void;
  onOpenAddModal: () => void;
  onJumpToCatRoom: () => void;
}

export const TodoMobileView: React.FC<TodoMobileViewProps> = ({
  cat,
  todos,
  onToggleComplete,
  onDelete,
  onAddTodo,
  onOpenAddModal,
  onJumpToCatRoom,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('study');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;

    setIsAiAnalyzing(true);
    let analysis: AiTaskAnalysis;

    try {
      const res = await fetch('/api/analyze-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category: quickCategory,
        }),
      });
      if (res.ok) {
        analysis = await res.json();
      } else {
        analysis = calculateLocalEffortFallback(title, '', quickCategory);
      }
    } catch {
      analysis = calculateLocalEffortFallback(title, '', quickCategory);
    } finally {
      setIsAiAnalyzing(false);
    }

    onAddTodo({
      title,
      category: quickCategory,
      analysis,
    });

    playSound.meow();
    setQuickTitle('');
  };

  const filteredTodos = todos.filter((item) => {
    if (statusFilter === 'active' && item.completed) return false;
    if (statusFilter === 'completed' && !item.completed) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.detail && item.detail.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const earnedCoins = todos
    .filter((t) => t.completed)
    .reduce((sum, t) => sum + t.analysis.effortValue, 0);

  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex-1 p-3 sm:p-4 space-y-3.5 overflow-y-auto">
      {/* 1. Mobile Cat Peek Widget (Tappable to jump to 3D Cat Room) */}
      <div
        onClick={onJumpToCatRoom}
        className="bg-gradient-to-r from-amber-100/80 via-orange-50 to-amber-100/80 rounded-3xl p-3 border-2 border-amber-200/90 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-amber-300 transition-all"
        title="냥이룸으로 이동"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-amber-400 text-white flex items-center justify-center text-xl shadow-xs shrink-0 font-black">
            🐱
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-stone-900 text-xs truncate">
                {cat.name} (Lv.{cat.level})
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500 text-white shrink-0">
                {cat.coins}캔
              </span>
            </div>
            <p className="text-[11px] text-stone-600 mt-0.5 truncate italic font-medium">
              "{cat.name}: 집사 파이팅이다냥! 🐾"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-800 bg-white/80 px-2.5 py-1.5 rounded-xl border border-amber-200/80 shrink-0">
          <span>냥이룸</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>

      {/* 2. Today's Productivity Dashboard Card */}
      <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              오늘의 미션 달성도
            </span>
            <div className="text-lg font-black text-stone-900 mt-0.5 flex items-center gap-2">
              <span>{completedCount} / {totalCount} 완료</span>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                {percent}%
              </span>
            </div>
          </div>

          <div className="text-right bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <span className="text-[10px] text-stone-500 block">수확한 노력 캔</span>
            <span className="text-xs font-black text-amber-900">+{earnedCoins}캔 🐟</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Fast Mobile Task Add Input Bar */}
        <form onSubmit={handleQuickAdd} className="pt-1 flex gap-2 items-center">
          <select
            value={quickCategory}
            onChange={(e) => setQuickCategory(e.target.value as TaskCategory)}
            className="px-2 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-700 focus:outline-none focus:border-amber-500 shrink-0 cursor-pointer"
          >
            <option value="study">📚 공부</option>
            <option value="work">💼 업무</option>
            <option value="health">🏃 운동</option>
            <option value="life">🧹 일상</option>
            <option value="hobby">🎨 취미</option>
          </select>

          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="할일 입력 후 Enter..."
            className="flex-1 px-3 py-2 rounded-xl border border-stone-200 focus:border-amber-500 focus:outline-none text-xs font-medium bg-stone-50/50 focus:bg-white"
          />

          <button
            type="submit"
            disabled={!quickTitle.trim() || isAiAnalyzing}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 disabled:opacity-40 text-white text-xs font-extrabold shadow-xs shrink-0 cursor-pointer"
          >
            {isAiAnalyzing ? '분석..' : '추가'}
          </button>
        </form>
      </div>

      {/* 3. Mobile Filter Strip & Search */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: `전체 ${totalCount}` },
            { id: 'active', label: `진행중 ${totalCount - completedCount}` },
            { id: 'completed', label: `완료 ${completedCount}` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as 'all' | 'active' | 'completed')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-[11px] font-semibold px-2 py-1 rounded-xl border border-stone-200 bg-white text-stone-700 shrink-0"
        >
          <option value="all">모든 분류</option>
          <option value="work">💼 업무</option>
          <option value="study">📚 공부</option>
          <option value="health">🏃 운동</option>
          <option value="life">🧹 일상</option>
          <option value="hobby">🎨 취미</option>
        </select>
      </div>

      {/* 4. Task List */}
      <div className="space-y-2.5">
        {filteredTodos.length > 0 ? (
          filteredTodos.map((todo) => (
            <TodoItemCard
              key={todo.id}
              todo={todo}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border-2 border-dashed border-stone-200 text-stone-500 space-y-2">
            <span className="text-3xl block">🐾</span>
            <p className="font-bold text-xs text-stone-700">해당하는 할일이 없습니다!</p>
            <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
              상단 입력창에 새로운 작업을 적고 AI 노력 가치 캔을 받아보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
