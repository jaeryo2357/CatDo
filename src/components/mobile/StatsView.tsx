import React from 'react';
import { CAT_BREEDS, CatState } from '../../types/cat';
import { TodoItem } from '../../types/todo';
import {
  Trophy,
  Award,
  CheckCircle2,
  Fish,
  Heart,
  RotateCcw,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { playSound } from '../../utils/audio';

interface StatsViewProps {
  cat: CatState;
  todos: TodoItem[];
  onOpenAdoption: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  cat,
  todos,
  onOpenAdoption,
}) => {
  const breedInfo = CAT_BREEDS.find((b) => b.id === cat.breed) || CAT_BREEDS[0];

  const totalCompleted = todos.filter((t) => t.completed).length;
  const totalCoinsEarned = todos
    .filter((t) => t.completed)
    .reduce((sum, t) => sum + t.analysis.effortValue, 0);

  // Difficulty breakdown
  const diffCounts = {
    easy: todos.filter((t) => t.analysis.difficulty === 'easy').length,
    medium: todos.filter((t) => t.analysis.difficulty === 'medium').length,
    hard: todos.filter((t) => t.analysis.difficulty === 'hard').length,
    extreme: todos.filter((t) => t.analysis.difficulty === 'extreme').length,
  };

  const daysTogether = Math.max(
    1,
    Math.floor((Date.now() - (cat.adoptedAt || Date.now())) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
      {/* 1. Cat & Butler Profile Card */}
      <div className="bg-white rounded-3xl p-5 border-2 border-amber-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-black/5"
              style={{ backgroundColor: breedInfo.primaryColor }}
            >
              🐱
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-lg text-stone-900">{cat.name}</h3>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                  Lv.{cat.level}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5 font-medium">
                {breedInfo.name} · 함께한 지 {daysTogether}일째 🐾
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAdoption}
            className="p-2.5 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 transition-colors cursor-pointer"
            title="고양이 정보 및 묘종 변경"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Intimacy & Level status */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between font-bold text-stone-700">
            <span>집사 친밀도 경험치</span>
            <span>{cat.exp} / {cat.expToNext} EXP</span>
          </div>
          <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (cat.exp / cat.expToNext) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Cumulative Productivity Achievements */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">완료한 총 할일</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">
            {cat.totalTasksCompleted || totalCompleted}
            <span className="text-xs font-normal text-stone-500 ml-1">개</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-1">성실한 집사 인증 🌟</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">누적 수확 캔</span>
            <span className="text-base">🐟</span>
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2">
            {totalCoinsEarned.toLocaleString()}
            <span className="text-xs font-normal text-stone-500 ml-1">캔</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-1">AI 공정 가치 환산치</span>
        </div>
      </div>

      {/* 3. AI Effort Distribution Breakdown */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-sm text-stone-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI 노력 난이도 분석 분포</span>
          </h4>
          <span className="text-xs text-stone-500">총 {todos.length}개 작업</span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-2xl bg-stone-50 border border-stone-200">
            <span className="text-[10px] font-bold text-stone-500 block">초급</span>
            <span className="text-lg font-black text-stone-800">{diffCounts.easy}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-700 block">중급</span>
            <span className="text-lg font-black text-amber-900">{diffCounts.medium}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-orange-50 border border-orange-200">
            <span className="text-[10px] font-bold text-orange-700 block">고급</span>
            <span className="text-lg font-black text-orange-900">{diffCounts.hard}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-red-50 border border-red-200">
            <span className="text-[10px] font-bold text-red-700 block">극상</span>
            <span className="text-lg font-black text-red-900">{diffCounts.extreme}</span>
          </div>
        </div>
      </div>

      {/* 4. Encouragement Callout */}
      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl border border-amber-200/90 text-xs text-stone-700 flex items-center gap-3">
        <Trophy className="w-8 h-8 text-amber-500 shrink-0" />
        <div>
          <strong className="text-stone-900 block font-bold">집사 등급: 레벨 {cat.level} 다정 집사</strong>
          매일 할일을 꾸준히 해낼수록 고양이의 털 윤기가 돌고 새로운 모션이 해금됩니다!
        </div>
      </div>
    </div>
  );
};
