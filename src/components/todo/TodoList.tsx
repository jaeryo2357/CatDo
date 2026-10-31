import React, { useState } from 'react';
import { TaskCategory, TodoItem, TASK_PRESETS, AiTaskAnalysis } from '../../types/todo';
import { TodoItemCard } from './TodoItem';
import {
  Plus,
  CheckCircle2,
  Sparkles,
  Filter,
  Brain,
  Calendar,
  Layers,
  Search,
} from 'lucide-react';
import { playSound } from '../../utils/audio';
import { calculateLocalEffortFallback } from '../../utils/rules';

interface TodoListProps {
  todos: TodoItem[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onAddTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'completed'>) => void;
  onOpenAddModal: () => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onToggleComplete,
  onDelete,
  onAddTodo,
  onOpenAddModal,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('work');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Inline Add Submission
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

  const handleApplyPreset = (presetTitle: string, presetCat: TaskCategory) => {
    setQuickTitle(presetTitle);
    setQuickCategory(presetCat);
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

  const pendingCoins = todos
    .filter((t) => !t.completed)
    .reduce((sum, t) => sum + t.analysis.effortValue, 0);

  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="w-full space-y-4">
      {/* 1. Productivity Top Dashboard (45% ToDo Experience) */}
      <div className="bg-white rounded-3xl p-5 border-2 border-amber-200/90 shadow-sm space-y-4">
        {/* Metric Cards Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>오늘의 생산성 대시보드</span>
            </div>
            <h2 className="text-xl font-black text-stone-900 mt-0.5 tracking-tight flex items-center gap-2">
              <span>{completedCount} / {totalCount} 완료</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {percent}% 달성
              </span>
            </h2>
          </div>

          {/* Effort Coins summary pills */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-right">
              <span className="text-[10px] text-stone-500 block font-medium">완료한 노력 보상</span>
              <span className="text-xs font-black text-amber-900">+{earnedCoins}캔 🐟</span>
            </div>
            <div className="px-3 py-1.5 rounded-2xl bg-stone-50 border border-stone-200 text-right">
              <span className="text-[10px] text-stone-500 block font-medium">남은 수확 예정</span>
              <span className="text-xs font-black text-stone-700">+{pendingCoins}캔 🐟</span>
            </div>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* 2. Fast Inline Task Add Bar (Zero Friction) */}
        <form onSubmit={handleQuickAdd} className="space-y-2">
          <div className="flex gap-2 items-center">
            {/* Category Dropdown */}
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value as TaskCategory)}
              className="px-2.5 py-2.5 rounded-2xl border-2 border-stone-200 bg-stone-50 text-xs font-bold text-stone-700 focus:outline-none focus:border-amber-500 shrink-0 cursor-pointer"
            >
              <option value="work">💼 업무</option>
              <option value="study">📚 공부</option>
              <option value="health">🏃 운동</option>
              <option value="life">🧹 일상</option>
              <option value="hobby">🎨 취미</option>
            </select>

            {/* Input Field */}
            <div className="relative flex-1">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="오늘 완료할 작업을 적고 Enter를 누르세요..."
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none text-sm font-medium text-stone-800 placeholder:text-stone-400 bg-stone-50/50 focus:bg-white transition-colors"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!quickTitle.trim() || isAiAnalyzing}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-orange-500/15 flex items-center gap-1.5 shrink-0 active:scale-95 transition-all cursor-pointer"
            >
              {isAiAnalyzing ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>AI 분석 중...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-3" />
                  <span>등록</span>
                </>
              )}
            </button>

            {/* Modal Detail Add Trigger */}
            <button
              type="button"
              onClick={onOpenAddModal}
              className="p-2.5 rounded-2xl border-2 border-stone-200 hover:border-amber-300 bg-stone-50 hover:bg-stone-100 text-stone-600 text-xs font-bold transition-colors cursor-pointer"
              title="상세 내용과 함께 등록하기"
            >
              상세
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-stone-400 font-semibold mr-1">추천:</span>
            {TASK_PRESETS.slice(0, 4).map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p.title, p.category)}
                className="px-2.5 py-0.5 rounded-lg bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-600 text-[11px] font-medium transition-colors border border-stone-200/60"
              >
                {p.icon} {p.title}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-stone-200 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1">
          {[
            { id: 'all', label: `전체 (${totalCount})` },
            { id: 'active', label: `진행중 (${totalCount - completedCount})` },
            { id: 'completed', label: `완료됨 (${completedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as 'all' | 'active' | 'completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category & Search Filter */}
        <div className="flex items-center gap-2">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">모든 분류</option>
            <option value="work">💼 업무</option>
            <option value="study">📚 공부</option>
            <option value="health">🏃 운동</option>
            <option value="life">🧹 일상</option>
            <option value="hobby">🎨 취미</option>
          </select>

          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색..."
              className="w-24 sm:w-32 px-2.5 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* 4. Task List Items */}
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
            <span className="text-3xl block">📝</span>
            <p className="font-bold text-sm text-stone-700">해당하는 할일이 없습니다!</p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              상단 입력창에 새로운 할일을 적고 등록해보세요. AI가 바로 노력 가치를 평가합니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
