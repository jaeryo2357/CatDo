import React, { useState } from 'react';
import { TodoItem } from '../../types/todo';
import {
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Star,
  Edit3,
  CheckCircle,
  X,
  MessageSquare,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '../../utils/audio';

interface TodoItemCardProps {
  todo: TodoItem;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleImportant?: (id: string) => void;
  onUpdateTodo?: (id: string, updates: Partial<TodoItem>) => void;
}

const CATEGORY_MAP: Record<string, { label: string; color: string; icon: string }> = {
  work: { label: '업무', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '💼' },
  study: { label: '공부', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: '📚' },
  health: { label: '운동', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '🏃' },
  life: { label: '일상', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🧹' },
  hobby: { label: '취미', color: 'bg-pink-50 text-pink-700 border-pink-200', icon: '🎨' },
};

const DIFFICULTY_MAP: Record<string, { label: string; bg: string }> = {
  easy: { label: '초급', bg: 'bg-stone-100 text-stone-600' },
  medium: { label: '중급', bg: 'bg-amber-100 text-amber-800' },
  hard: { label: '고급', bg: 'bg-orange-100 text-orange-800' },
  extreme: { label: '극상', bg: 'bg-rose-100 text-rose-800' },
};

export const TodoItemCard: React.FC<TodoItemCardProps> = ({
  todo,
  onToggleComplete,
  onDelete,
  onToggleImportant,
  onUpdateTodo,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDetail, setEditDetail] = useState(todo.detail || '');

  const catInfo = CATEGORY_MAP[todo.category] || CATEGORY_MAP.life;
  const diffInfo = DIFFICULTY_MAP[todo.analysis.difficulty] || DIFFICULTY_MAP.medium;

  const handleToggle = () => {
    if (!todo.completed) {
      try {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.7 },
          colors: ['#f59e0b', '#fbbf24', '#f43f5e', '#3b82f6', '#10b981'],
        });
      } catch {}
      playSound.coin();
    }
    onToggleComplete(todo.id);
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editTitle.trim()) return;
    if (onUpdateTodo) {
      onUpdateTodo(todo.id, {
        title: editTitle.trim(),
        detail: editDetail.trim() || undefined,
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(todo.title);
    setEditDetail(todo.detail || '');
    setIsEditing(false);
  };

  return (
    <div
      className={`group rounded-2xl border transition-all duration-200 overflow-hidden ${
        todo.completed
          ? 'bg-stone-50/70 border-stone-200/90 text-stone-400'
          : todo.isImportant
          ? 'bg-amber-50/30 border-amber-300 shadow-xs hover:border-amber-400 hover:shadow-sm'
          : 'bg-white border-stone-200/90 shadow-xs hover:border-stone-300 hover:shadow-sm'
      }`}
    >
      <div className="p-3 sm:p-3.5 flex items-start gap-2.5 sm:gap-3">
        {/* Modern Circular Checkbox */}
        <button
          type="button"
          onClick={handleToggle}
          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            todo.completed
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs scale-95'
              : 'border-stone-300 hover:border-amber-500 hover:bg-amber-50/50 bg-white'
          }`}
          aria-label={todo.completed ? `완료 취소: ${todo.title}` : `완료하기: ${todo.title}`}
        >
          {todo.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            /* Inline Edit Form */
            <form onSubmit={handleSaveEdit} className="space-y-2 py-0.5">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 bg-white"
                placeholder="할일 제목"
                autoFocus
              />
              <input
                type="text"
                value={editDetail}
                onChange={(e) => setEditDetail(e.target.value)}
                className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-stone-200 focus:outline-none focus:border-amber-400 bg-stone-50"
                placeholder="세부 메모 (선택)"
              />
              <div className="flex items-center gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-2 py-1 rounded-md text-[11px] font-bold text-stone-500 hover:bg-stone-100 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-xs cursor-pointer"
                >
                  저장
                </button>
              </div>
            </form>
          ) : (
            /* Standard Display */
            <>
              {/* Task Title */}
              <div className="flex items-baseline justify-between gap-2">
                <h4
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`text-xs sm:text-sm font-bold leading-snug cursor-pointer select-none transition-colors ${
                    todo.completed
                      ? 'line-through text-stone-400'
                      : 'text-stone-900 hover:text-amber-700'
                  }`}
                >
                  {todo.title}
                </h4>
              </div>

              {/* Subtitle / Memo */}
              {todo.detail && (
                <p
                  className={`text-[11px] mt-0.5 line-clamp-2 leading-relaxed ${
                    todo.completed ? 'text-stone-400 line-through' : 'text-stone-500'
                  }`}
                >
                  {todo.detail}
                </p>
              )}

              {/* Clean Unboxed Metadata Line (Anti-Slop Zero-Pill Discipline) */}
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 flex-wrap mt-2">
                <span className="font-semibold text-stone-700">{catInfo.label}</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="text-stone-600">{todo.analysis.difficultyLabel}</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="font-bold text-amber-700 flex items-center gap-0.5">
                  <span>🐟</span>
                  <span>+{todo.analysis.effortValue}캔</span>
                </span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-stone-500 hover:text-amber-800 font-medium inline-flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                  <span>{isExpanded ? '냥이 생각 닫기' : '냥이 생각'}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3 text-stone-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-stone-400" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Action Icons (Star, Edit, Delete) */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            {/* Star / Important Toggle */}
            {onToggleImportant && (
              <button
                type="button"
                onClick={() => onToggleImportant(todo.id)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  todo.isImportant
                    ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                    : 'text-stone-300 hover:text-amber-500 hover:bg-stone-100'
                }`}
                title={todo.isImportant ? '중요 표시 해제' : '중요 표시'}
              >
                <Star className={`w-3.5 h-3.5 ${todo.isImportant ? 'fill-amber-400' : ''}`} />
              </button>
            )}

            {/* Edit button */}
            {onUpdateTodo && !todo.completed && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                title="수정하기"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Delete button */}
            <button
              type="button"
              onClick={() => onDelete(todo.id)}
              className="p-1.5 rounded-lg text-stone-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Collapsible Cat Notes & Advice Drawer */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-2.5 bg-amber-50/40 border-t border-amber-100/70 text-[11px] text-stone-700 space-y-2 animate-fade-in">
          {/* Encouragement Reflection */}
          <div className="flex items-start gap-1.5">
            <span className="font-bold text-amber-900 shrink-0">🐾 집사 응원:</span>
            <span className="text-stone-700 leading-relaxed">{todo.analysis.rationale}</span>
          </div>

          {/* Cat Comment */}
          <div className="p-2.5 bg-white/90 rounded-xl border border-amber-200/60 flex items-start gap-2 shadow-2xs">
            <span className="text-sm shrink-0">🐱</span>
            <span className="text-amber-950 font-medium italic leading-relaxed">
              "{todo.analysis.catComment}"
            </span>
          </div>

          {/* Pacing Advice */}
          {todo.analysis.suggestedPacing && (
            <div className="text-[10px] text-stone-500 flex items-center gap-1.5 pl-0.5">
              <Clock className="w-3 h-3 text-stone-400 shrink-0" />
              <span>
                <strong>작업 팁:</strong> {todo.analysis.suggestedPacing}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
