import React, { useState } from 'react';
import { TodoItem } from '../../types/todo';
import { Check, Trash2, ChevronDown, ChevronUp, Brain, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '../../utils/audio';

interface TodoItemCardProps {
  todo: TodoItem;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_MAP: Record<string, { label: string; color: string; icon: string }> = {
  work: { label: '업무', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '💼' },
  study: { label: '공부', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '📚' },
  health: { label: '운동', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: '🏃' },
  life: { label: '일상', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: '🧹' },
  hobby: { label: '취미', color: 'bg-pink-100 text-pink-800 border-pink-200', icon: '🎨' },
};

const DIFFICULTY_MAP: Record<string, { label: string; bg: string }> = {
  easy: { label: '초급', bg: 'bg-stone-100 text-stone-700' },
  medium: { label: '중급', bg: 'bg-amber-100 text-amber-800' },
  hard: { label: '고급', bg: 'bg-orange-100 text-orange-800' },
  extreme: { label: '극상', bg: 'bg-red-100 text-red-800' },
};

export const TodoItemCard: React.FC<TodoItemCardProps> = ({
  todo,
  onToggleComplete,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const catInfo = CATEGORY_MAP[todo.category] || CATEGORY_MAP.life;
  const diffInfo = DIFFICULTY_MAP[todo.analysis.difficulty] || DIFFICULTY_MAP.medium;

  const handleToggle = () => {
    if (!todo.completed) {
      // Trigger satisfying confetti blast
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#f59e0b', '#fbbf24', '#f43f5e', '#3b82f6', '#10b981'],
        });
      } catch {}
      playSound.coin();
    }
    onToggleComplete(todo.id);
  };

  return (
    <div
      className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
        todo.completed
          ? 'bg-stone-50/70 border-stone-200/80 opacity-75'
          : 'bg-white border-amber-200/80 shadow-xs hover:border-amber-300'
      }`}
    >
      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
        {/* Complete Checkbox */}
        <button
          type="button"
          onClick={handleToggle}
          className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            todo.completed
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
              : 'border-stone-300 hover:border-amber-500 bg-stone-50'
          }`}
          aria-label={todo.completed ? `완료 취소: ${todo.title}` : `완료하기: ${todo.title}`}
        >
          {todo.completed && <Check className="w-4 h-4 stroke-3" />}
        </button>

        {/* Title and Badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${catInfo.color}`}
            >
              <span>{catInfo.icon}</span>
              <span>{catInfo.label}</span>
            </span>

            {/* Effort Badge */}
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300/80 flex items-center gap-1">
              <span>🐟</span>
              <span>+{todo.analysis.effortValue} 캔</span>
            </span>

            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${diffInfo.bg}`}>
              {todo.analysis.difficultyLabel}
            </span>
          </div>

          <h4
            className={`font-bold text-sm sm:text-base mt-1.5 truncate text-stone-800 ${
              todo.completed ? 'line-through text-stone-400' : ''
            }`}
          >
            {todo.title}
          </h4>

          {todo.detail && (
            <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{todo.detail}</p>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* AI Analysis Accordion Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
            title="AI 가치 분석 보기"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(todo.id)}
            className="p-1.5 rounded-xl hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
            title="할일 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded AI Review Drawer */}
      {isExpanded && (
        <div className="px-4 pb-3.5 pt-1 bg-amber-50/50 border-t border-amber-100 text-xs text-stone-700 space-y-2 animate-fade-in">
          <div className="flex items-start gap-1.5">
            <Brain className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <strong className="text-stone-800">노력 감정 소견:</strong>{' '}
              {todo.analysis.rationale}
            </div>
          </div>

          <div className="p-2 bg-white/90 rounded-xl border border-amber-200/60 flex items-start gap-2">
            <span className="text-sm">🐱</span>
            <span className="text-amber-900 font-semibold italic text-xs">
              "{todo.analysis.catComment}"
            </span>
          </div>

          {todo.analysis.suggestedPacing && (
            <div className="text-[11px] text-stone-500">
              💡 <strong>권장 페이스:</strong> {todo.analysis.suggestedPacing}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
