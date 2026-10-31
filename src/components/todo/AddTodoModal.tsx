import React, { useState } from 'react';
import { AiTaskAnalysis, TaskCategory, TASK_PRESETS, TodoItem } from '../../types/todo';
import { Sparkles, Brain, Plus, X, Tag, Clock, ArrowRight } from 'lucide-react';
import { playSound } from '../../utils/audio';
import { calculateLocalEffortFallback } from '../../utils/rules';

interface AddTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'completed'>) => void;
  catName: string;
}

export const AddTodoModal: React.FC<AddTodoModalProps> = ({
  isOpen,
  onClose,
  onAddTodo,
  catName,
}) => {
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [category, setCategory] = useState<TaskCategory>('study');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AiTaskAnalysis | null>(null);

  if (!isOpen) return null;

  const runAiAnalysis = async (taskTitle: string, taskDetail: string, taskCategory: TaskCategory) => {
    if (!taskTitle.trim()) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle.trim(),
          detail: taskDetail.trim(),
          category: taskCategory,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
        playSound.coin();
      } else {
        // Fallback
        const fallback = calculateLocalEffortFallback(taskTitle, taskDetail, taskCategory);
        setAnalysis(fallback);
      }
    } catch {
      const fallback = calculateLocalEffortFallback(taskTitle, taskDetail, taskCategory);
      setAnalysis(fallback);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyPreset = (presetTitle: string, presetCat: TaskCategory, presetDetail: string) => {
    setTitle(presetTitle);
    setCategory(presetCat);
    setDetail(presetDetail);
    runAiAnalysis(presetTitle, presetDetail, presetCat);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Use current or compute fallback
    const finalAnalysis = analysis || calculateLocalEffortFallback(title, detail, category);

    onAddTodo({
      title: title.trim(),
      detail: detail.trim() || undefined,
      category,
      analysis: finalAnalysis,
    });

    playSound.meow();
    // Reset
    setTitle('');
    setDetail('');
    setAnalysis(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border-2 border-amber-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-400 to-orange-400 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <div>
              <h3 className="font-extrabold text-lg">새로운 할일 등록하기</h3>
              <p className="text-amber-100 text-xs">AI가 노력과 난이도를 감정해 캔 보상을 산정합니다</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quick Presets */}
          <div>
            <span className="text-xs font-bold text-stone-500 mb-2 block">빠른 추천 할일</span>
            <div className="flex flex-wrap gap-1.5">
              {TASK_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p.title, p.category, p.defaultDetail)}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-700 rounded-xl text-xs font-medium transition-colors border border-stone-200/80 flex items-center gap-1"
                >
                  <span>{p.icon}</span>
                  <span>{p.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Task Title */}
          <div>
            <label htmlFor="todo-title-input" className="block text-xs font-bold text-stone-700 mb-1.5">
              할일 제목 *
            </label>
            <div className="flex gap-2">
              <input
                id="todo-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  if (title.trim() && !analysis) {
                    runAiAnalysis(title, detail, category);
                  }
                }}
                placeholder="예: 30분 집중 코딩, 방 청소하기, 보고서 초안 작성"
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none text-sm font-medium"
                required
              />
              <button
                type="button"
                onClick={() => runAiAnalysis(title, detail, category)}
                disabled={!title.trim() || isAnalyzing}
                className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isAnalyzing ? '분석 중...' : 'AI 가치 감정'}
              </button>
            </div>
          </div>

          {/* Category & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">카테고리</label>
              <select
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as TaskCategory;
                  setCategory(cat);
                  if (title.trim()) runAiAnalysis(title, detail, cat);
                }}
                className="w-full px-3 py-2 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none text-xs font-semibold bg-white"
              >
                <option value="study">📚 공부 & 학습</option>
                <option value="work">💼 업무 & 프로젝트</option>
                <option value="health">🏃‍♂️ 운동 & 건강</option>
                <option value="life">🧹 일상 & 살림</option>
                <option value="hobby">🎨 취미 & 휴식</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">상세 내용 (선택)</label>
              <input
                type="text"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="세부 목표나 진행 방법"
                className="w-full px-3 py-2 rounded-xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* AI Effort Valuation Card */}
          {analysis && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 border-2 border-amber-200/90 rounded-2xl p-4 animate-fade-in shadow-xs">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-extrabold text-stone-800">
                    AI 노력 가치 감정 완료
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-800">
                    {analysis.difficultyLabel}
                  </span>
                </div>
                {/* Reward Value */}
                <div className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-xl shadow-xs">
                  <span className="text-sm">🐟</span>
                  <span className="text-xs font-black tracking-tight">
                    +{analysis.effortValue} 캔
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {/* Rationale */}
                <div className="text-stone-700 leading-relaxed">
                  <strong className="text-stone-800 mr-1">💡 노력 분석:</strong>
                  {analysis.rationale}
                </div>

                {/* Cat Comment */}
                <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200/60 flex items-start gap-2">
                  <span className="text-base mt-0.5">🐱</span>
                  <div className="text-amber-900 font-semibold italic text-xs">
                    "{analysis.catComment}"
                  </div>
                </div>

                {analysis.suggestedPacing && (
                  <div className="text-[11px] text-stone-500">
                    ⏱️ <strong>집사 팁:</strong> {analysis.suggestedPacing}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              닫기
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isAnalyzing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>할일 등록 및 캔 보상 확정</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
