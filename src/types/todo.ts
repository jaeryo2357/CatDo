export type TaskCategory = 'work' | 'study' | 'health' | 'life' | 'hobby';

export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export interface AiTaskAnalysis {
  difficulty: TaskDifficulty;
  difficultyLabel: string; // e.g. "가벼운 워밍업", "집중 집중!", "고난도 퀘스트", "전설의 집사 챌린지"
  effortValue: number; // 10 to 150 Tuna Coins
  rationale: string; // AI가 분석한 노력/피로도 평가
  catComment: string; // 고양이의 귀여운 코멘트
  suggestedPacing?: string; // 추천 휴식/작업 팁
}

export interface TodoItem {
  id: string;
  title: string;
  detail?: string;
  category: TaskCategory;
  dueDate?: string;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
  analysis: AiTaskAnalysis;
}

export interface TaskPreset {
  title: string;
  category: TaskCategory;
  defaultDetail: string;
  icon: string;
}

export const TASK_PRESETS: TaskPreset[] = [
  {
    title: '30분 딥워크 코딩/공부',
    category: 'study',
    defaultDetail: '스마트폰 끄고 30분 동안 초집중하여 학습하기',
    icon: '💻',
  },
  {
    title: '헬스장 또는 홈트레이닝 40분',
    category: 'health',
    defaultDetail: '스트레칭 및 근력 운동으로 땀 흘리기',
    icon: '🏃‍♂️',
  },
  {
    title: '방 청소 & 빨래 정리하기',
    category: 'life',
    defaultDetail: '책상 정리, 청소기 돌리고 환기하기',
    icon: '🧹',
  },
  {
    title: '프로젝트 핵심 기획서 작성',
    category: 'work',
    defaultDetail: '요구사항 정리 및 구조 설계서 완성',
    icon: '📑',
  },
  {
    title: '물 1.5L 마시기 & 눈 피로 풀기',
    category: 'health',
    defaultDetail: '틈틈이 수분 보충하고 먼 곳 바라보기',
    icon: '💧',
  },
  {
    title: '책 30페이지 읽고 메모하기',
    category: 'hobby',
    defaultDetail: '인상 깊은 구절 형광펜 긋고 한 줄 기록',
    icon: '📖',
  },
];
