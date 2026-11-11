import React, { useState, useMemo, useRef } from 'react';
import { CatState } from '../../types/cat';
import { TaskCategory, TodoItem, TASK_PRESETS, AiTaskAnalysis } from '../../types/todo';
import { TodoItemCard } from '../todo/TodoItem';
import {
  Plus,
  Sparkles,
  Search,
  Star,
  Check,
  ChevronDown,
  ChevronUp,
  Zap,
  Trash2,
  X,
} from 'lucide-react';
import { playSound } from '../../utils/audio';
import { calculateLocalEffortFallback } from '../../utils/rules';

interface TodoMobileViewProps {
  cat: CatState;
  todos: TodoItem[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onAddTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'completed'>) => void;
  onToggleImportant?: (id: string) => void;
  onUpdateTodo?: (id: string, updates: Partial<TodoItem>) => void;
  onClearCompleted?: () => void;
  onOpenAddModal: () => void;
  onJumpToCatRoom: () => void;
}

type FilterTab = 'active' | 'important' | 'completed';

export const TodoMobileView: React.FC<TodoMobileViewProps> = ({
  cat,
  todos,
  onToggleComplete,
  onDelete,
  onAddTodo,
  onToggleImportant,
  onUpdateTodo,
  onClearCompleted,
  onOpenAddModal,
}) => {
  // Input states
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('study');
  const [quickImportant, setQuickImportant] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // Filters & Toggles
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Fast inline task addition
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
      isImportant: quickImportant,
      analysis,
    });

    playSound.meow();
    setQuickTitle('');
    setQuickImportant(false);
    setIsPresetsOpen(false);
  };

  const handleApplyPreset = (presetTitle: string, presetCat: TaskCategory) => {
    setQuickTitle(presetTitle);
    setQuickCategory(presetCat);
    setIsPresetsOpen(false);
    inputRef.current?.focus();
  };

  // Metrics
  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;
  const importantCount = todos.filter((t) => t.isImportant && !t.completed).length;

  // Processed lists
  const processedTodos = useMemo(() => {
    let list = [...todos];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.detail && t.detail.toLowerCase().includes(q))
      );
    }

    if (categoryFilter !== 'all') {
      list = list.filter((t) => t.category === categoryFilter);
    }

    // Default sort: importance first, then newest
    list.sort((a, b) => {
      if (a.isImportant && !b.isImportant) return -1;
      if (!a.isImportant && b.isImportant) return 1;
      return b.createdAt - a.createdAt;
    });

    return list;
  }, [todos, searchQuery, categoryFilter]);

  const activeTodos = processedTodos.filter((t) => !t.completed);
  const completedTodos = processedTodos.filter((t) => t.completed);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-stone-50 overflow-y-auto">
      {/* 1. Ultra-Compact Fast Input Bar (Directly at top, zero wasted space) */}
      <div className="sticky top-0 z-20 bg-stone-50/95 backdrop-blur-md px-3 pt-2.5 pb-2 border-b border-stone-200/60 shadow-2xs">
        <form onSubmit={handleQuickAdd} className="flex items-center gap-1.5">
          {/* Category Dropdown */}
          <select
            value={quickCategory}
            onChange={(e) => setQuickCategory(e.target.value as TaskCategory)}
            className="h-9 px-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-700 focus:outline-none focus:border-amber-500 shrink-0 cursor-pointer shadow-2xs"
            title="카테고리"
          >
            <option value="study">📚 공부</option>
            <option value="work">💼 업무</option>
            <option value="health">🏃 운동</option>
            <option value="life">🧹 일상</option>
            <option value="hobby">🎨 취미</option>
          </select>

          {/* Title Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="할 일 추가... (Enter)"
            className="min-w-0 flex-1 h-9 px-3 rounded-xl border border-stone-300 focus:border-amber-500 focus:outline-none text-xs font-medium text-stone-900 bg-white shadow-2xs placeholder:text-stone-400 transition-colors"
          />

          {/* Star Priority Toggle */}
          <button
            type="button"
            onClick={() => setQuickImportant(!quickImportant)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs ${
              quickImportant
                ? 'bg-amber-100 border-amber-400 text-amber-600'
                : 'bg-white border-stone-300 text-stone-400 hover:text-amber-500'
            }`}
            title={quickImportant ? '중요 표시 해제' : '중요 할일로 등록'}
          >
            <Star className={`w-3.5 h-3.5 ${quickImportant ? 'fill-amber-500' : ''}`} />
          </button>

          {/* Add / Submit Button */}
          <button
            type="submit"
            disabled={!quickTitle.trim() || isAiAnalyzing}
            className="h-9 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold shadow-2xs transition-all shrink-0 cursor-pointer flex items-center gap-1"
          >
            {isAiAnalyzing ? (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4 stroke-[2.5]" />
            )}
            <span className="hidden sm:inline">추가</span>
          </button>
        </form>

        {/* 2. Slim Filter & Control Strip */}
        <div className="flex items-center justify-between gap-1.5 mt-2">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1 bg-stone-200/70 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveFilterTab('active')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                activeFilterTab === 'active'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              진행 중 {activeCount}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('important')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                activeFilterTab === 'important'
                  ? 'bg-white text-amber-800 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>⭐</span>
              <span>{importantCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('completed')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                activeFilterTab === 'completed'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              완료 {completedCount}
            </button>
          </div>

          {/* Auxiliary Action Icons: Search & Presets */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setIsPresetsOpen(!isPresetsOpen);
                setIsSearchOpen(false);
              }}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                isPresetsOpen
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
              title="추천 템플릿"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden xs:inline text-[11px]">템플릿</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                setIsPresetsOpen(false);
                if (isSearchOpen) setSearchQuery('');
              }}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isSearchOpen || searchQuery
                  ? 'bg-stone-800 border-stone-800 text-white'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
              title="검색"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Collapsible Search Input (Only when toggled) */}
        {isSearchOpen && (
          <div className="mt-2 relative animate-fade-in">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="할 일 검색..."
              autoFocus
              className="w-full pl-7 pr-7 py-1 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-amber-400 text-stone-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1.5 text-stone-400 hover:text-stone-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Collapsible Presets Drawer (Only when toggled) */}
        {isPresetsOpen && (
          <div className="mt-2 p-2 bg-white rounded-xl border border-amber-200/80 shadow-xs flex flex-wrap gap-1.5 animate-fade-in">
            {TASK_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p.title, p.category)}
                className="px-2 py-1 rounded-lg bg-stone-50 hover:bg-amber-100 text-stone-700 text-[11px] font-medium border border-stone-200 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>{p.icon}</span>
                <span>{p.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. The Main ToDo List (Immediately visible above the fold!) */}
      <div className="p-3 space-y-2 pb-24">
        {/* Active / Starred Tab View */}
        {activeFilterTab !== 'completed' && (
          <>
            {(activeFilterTab === 'important'
              ? activeTodos.filter((t) => t.isImportant)
              : activeTodos
            ).length > 0 ? (
              (activeFilterTab === 'important'
                ? activeTodos.filter((t) => t.isImportant)
                : activeTodos
              ).map((todo) => (
                <TodoItemCard
                  key={todo.id}
                  todo={todo}
                  onToggleComplete={onToggleComplete}
                  onDelete={onDelete}
                  onToggleImportant={onToggleImportant}
                  onUpdateTodo={onUpdateTodo}
                />
              ))
            ) : (
              <div className="py-12 text-center text-stone-400 space-y-2">
                <span className="text-3xl block">🐾</span>
                <p className="font-bold text-xs text-stone-600">
                  {activeFilterTab === 'important'
                    ? '중요 표시된 할 일이 없습니다.'
                    : '진행 중인 할 일이 없습니다!'}
                </p>
                <p className="text-[11px] text-stone-400">
                  상단 입력창에서 새로운 할 일을 등록해보세요.
                </p>
              </div>
            )}

            {/* Subtle Collapsible Completed Link at Bottom of Active View */}
            {completedTodos.length > 0 && activeFilterTab === 'active' && (
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                  className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-500 hover:text-stone-700 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>완료된 항목 ({completedTodos.length})</span>
                  </span>
                  {isCompletedExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {isCompletedExpanded && (
                  <div className="mt-2 space-y-2 animate-fade-in">
                    {completedTodos.map((todo) => (
                      <TodoItemCard
                        key={todo.id}
                        todo={todo}
                        onToggleComplete={onToggleComplete}
                        onDelete={onDelete}
                        onToggleImportant={onToggleImportant}
                        onUpdateTodo={onUpdateTodo}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Dedicated Completed Tab View */}
        {activeFilterTab === 'completed' && (
          <div className="space-y-2">
            {completedTodos.length > 0 ? (
              <>
                <div className="flex items-center justify-between px-1 pb-1">
                  <span className="text-[11px] font-bold text-stone-400">
                    완료된 작업 총 {completedTodos.length}개
                  </span>
                  {onClearCompleted && (
                    <button
                      type="button"
                      onClick={onClearCompleted}
                      className="text-[10px] text-stone-400 hover:text-rose-600 transition-colors flex items-center gap-0.5 cursor-pointer font-semibold"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>완료 목록 비우기</span>
                    </button>
                  )}
                </div>

                {completedTodos.map((todo) => (
                  <TodoItemCard
                    key={todo.id}
                    todo={todo}
                    onToggleComplete={onToggleComplete}
                    onDelete={onDelete}
                    onToggleImportant={onToggleImportant}
                    onUpdateTodo={onUpdateTodo}
                  />
                ))}
              </>
            ) : (
              <div className="py-12 text-center text-stone-400 space-y-1">
                <span className="text-2xl block">📝</span>
                <p className="font-bold text-xs text-stone-600">완료된 할 일이 아직 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
