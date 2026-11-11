import { CatState, FoodShopItem } from '../types/cat';
import { AiTaskAnalysis, TaskCategory, TodoItem } from '../types/todo';

/**
 * Calculates local effort analysis fallback when offline or for deterministic tests.
 */
export function calculateLocalEffortFallback(
  title: string,
  detail: string = '',
  category: TaskCategory = 'life'
): AiTaskAnalysis {
  const combined = `${title} ${detail}`.toLowerCase();
  let baseScore = 25;
  let difficulty: 'easy' | 'medium' | 'hard' | 'extreme' = 'easy';
  let difficultyLabel = '가벼운 미션';

  // Keyword strain analysis
  const hardKeywords = [
    '기획서', '보고서', '발표', '시험', '공부', '개발', '코딩', '버그',
    '마감', '프로젝트', '논문', '운동', '러닝', '헬스', 'pt', '대청소',
    'study', 'code', 'exam', 'workout', 'presentation', 'writing'
  ];
  const extremeKeywords = [
    '최종 발표', '기말고사', '중간고사', '출시', '마라톤', '철야', '배포',
    '면접', '자격증', '대청소 3시간', 'release', 'deploy', 'interview'
  ];

  let hardMatches = 0;
  for (const kw of hardKeywords) {
    if (combined.includes(kw)) hardMatches++;
  }
  let extremeMatches = 0;
  for (const kw of extremeKeywords) {
    if (combined.includes(kw)) extremeMatches++;
  }

  // Length and intensity assessment
  const lengthBonus = Math.min(20, Math.floor(combined.length / 10));
  baseScore += lengthBonus;

  if (category === 'work' || category === 'study') {
    baseScore += 20;
  } else if (category === 'health') {
    baseScore += 15;
  }

  baseScore += hardMatches * 15 + extremeMatches * 30;

  // Clamp score
  if (baseScore < 20) {
    baseScore = 20;
    difficulty = 'easy';
    difficultyLabel = '가벼운 몸풀기';
  } else if (baseScore < 50) {
    difficulty = 'easy';
    difficultyLabel = '기분 좋은 성취';
  } else if (baseScore < 85) {
    difficulty = 'medium';
    difficultyLabel = '집중력 풀가동';
  } else if (baseScore < 120) {
    difficulty = 'hard';
    difficultyLabel = '고난도 퀘스트';
  } else {
    difficulty = 'extreme';
    difficultyLabel = '궁극의 마스터 챌린지';
  }

  const effortValue = Math.min(150, Math.max(15, baseScore));

  const catComments: Record<typeof difficulty, string> = {
    easy: `이 정도는 식은 죽 먹기다냥! 가볍게 끝내고 냥이랑 놀아달라옹~ 🐾`,
    medium: `집중력이 꽤 필요한 멋진 일이다옹! 끝나면 맛난 참치캔 먹을 수 있겠다냥! 🐟`,
    hard: `우와... 집사 오늘 뇌 풀가동이냐옹?! 힘들면 중간에 냥이 만지며 1분 쉬어가라옹! ⚡`,
    extreme: `경보 발령! 엄청난 대업적이다냥! 이거 끝내면 냥이 왕국 최고의 영웅 인정이다옹!! 👑✨`,
  };

  const rationales: Record<typeof difficulty, string> = {
    easy: '몸과 마음의 짐을 덜어주는 가볍고 상쾌한 작업이에요.',
    medium: '차분한 집중과 정성이 담긴 의미 있는 시간이에요.',
    hard: '많은 에너지와 깊은 몰입이 필요한 중요한 일이에요. 끝내면 큰 보람이 있을 거예요!',
    extreme: '오늘의 가장 큰 승부처! 무사히 해내고 나면 냥이와 함께 푹 쉬어요.',
  };

  return {
    difficulty,
    difficultyLabel,
    effortValue,
    rationale: rationales[difficulty],
    catComment: catComments[difficulty],
    suggestedPacing: difficulty === 'extreme' || difficulty === 'hard'
      ? '50분 집중 후 10분 스트레칭과 수분 섭취를 추천합니다.'
      : '경쾌하게 끝내고 고양이 머리를 쓰다듬어 주세요!',
  };
}

/**
 * Feeds the cat a shop item.
 */
export function feedCat(
  cat: CatState,
  food: FoodShopItem
): { success: boolean; updatedCat: CatState; message: string; leveledUp: boolean } {
  if (cat.coins < food.cost) {
    return {
      success: false,
      updatedCat: cat,
      message: `캔 코인이 부족해요! (필요: ${food.cost}캔, 보유: ${cat.coins}캔). 할일을 완료하고 코인을 모아보세요!`,
      leveledUp: false,
    };
  }

  const newCoins = cat.coins - food.cost;
  const newFullness = Math.min(100, cat.fullness + food.fullnessRestore);
  const newHappiness = Math.min(100, cat.happiness + food.happinessBonus);
  
  let newExp = cat.exp + food.expBonus;
  let newLevel = cat.level;
  let newExpToNext = cat.expToNext;
  let leveledUp = false;

  while (newExp >= newExpToNext) {
    newExp -= newExpToNext;
    newLevel += 1;
    newExpToNext = Math.floor(newExpToNext * 1.35);
    leveledUp = true;
  }

  const updatedCat: CatState = {
    ...cat,
    coins: newCoins,
    fullness: newFullness,
    happiness: newHappiness,
    level: newLevel,
    exp: newExp,
    expToNext: newExpToNext,
    currentAnimation: food.animation,
    lastFedAt: Date.now(),
  };

  const message = leveledUp
    ? `🎉 ${cat.name}에게 ${food.name}을(를) 주었습니다! 배가 든든해지고 레벨 ${newLevel}로 승급했습니다! 🌟`
    : `✨ ${cat.name}이(가) ${food.name}을(를) 맛있게 냠냠 먹었습니다! (포만감 +${food.fullnessRestore}%)`;

  return {
    success: true,
    updatedCat,
    message,
    leveledUp,
  };
}

/**
 * Pets the cat.
 */
export function petCat(cat: CatState): { updatedCat: CatState; message: string } {
  const newHappiness = Math.min(100, cat.happiness + 6);
  const updatedCat: CatState = {
    ...cat,
    happiness: newHappiness,
    currentAnimation: 'pet',
    lastPetAt: Date.now(),
  };
  return {
    updatedCat,
    message: `${cat.name}을(를) 다정하게 쓰다듬었습니다! 골골송을 부르며 기분이 좋아집니다 💕`,
  };
}

/**
 * Completes a task, granting effort coins and exp to the cat.
 */
export function completeTask(
  cat: CatState,
  task: TodoItem
): { updatedCat: CatState; coinsGained: number; expGained: number; leveledUp: boolean } {
  const coinsGained = task.analysis.effortValue;
  const expGained = Math.round(coinsGained * 0.8);

  let newExp = cat.exp + expGained;
  let newLevel = cat.level;
  let newExpToNext = cat.expToNext;
  let leveledUp = false;

  while (newExp >= newExpToNext) {
    newExp -= newExpToNext;
    newLevel += 1;
    newExpToNext = Math.floor(newExpToNext * 1.35);
    leveledUp = true;
  }

  const updatedCat: CatState = {
    ...cat,
    coins: cat.coins + coinsGained,
    exp: newExp,
    level: newLevel,
    expToNext: newExpToNext,
    totalTasksCompleted: cat.totalTasksCompleted + 1,
    currentAnimation: 'happy',
    happiness: Math.min(100, cat.happiness + 8),
  };

  return {
    updatedCat,
    coinsGained,
    expGained,
    leveledUp,
  };
}

/**
 * Checks hunger status.
 */
export function isCatHungry(cat: CatState): boolean {
  return cat.fullness <= 30;
}

/**
 * Rescues a hungry stray/neighbor cat by feeding them a snack.
 * Costs rescuer 10 coins, restores 35 fullness to the hungry cat, and rewards karma.
 */
export function rescueFeedStrayCat(
  rescuerCoins: number,
  targetFullness: number
): { success: boolean; newRescuerCoins: number; newTargetFullness: number; karmaEarned: number; message: string } {
  const SNACK_COST = 10;
  if (rescuerCoins < SNACK_COST) {
    return {
      success: false,
      newRescuerCoins: rescuerCoins,
      newTargetFullness: targetFullness,
      karmaEarned: 0,
      message: '멸치 코인이 부족합니다! (10캔 필요)',
    };
  }

  const newTargetFullness = Math.min(100, targetFullness + 35);
  return {
    success: true,
    newRescuerCoins: rescuerCoins - SNACK_COST,
    newTargetFullness,
    karmaEarned: 1,
    message: '배고픈 고양이에게 맛있는 간식을 챙겨주었습니다! 🌟 따뜻한 선행 카르마 +1',
  };
}

/**
 * Automatically extracts butler's interest tags from their Todo items.
 */
export function extractInterestTags(todos: TodoItem[]): string[] {
  const tags = new Set<string>();
  for (const todo of todos) {
    const text = `${todo.title} ${todo.detail || ''}`.toLowerCase();
    if (text.includes('코딩') || text.includes('개발') || text.includes('프로그래밍') || text.includes('code') || text.includes('git')) {
      tags.add('#개발자');
    }
    if (text.includes('운동') || text.includes('스트레칭') || text.includes('헬스') || text.includes('러닝') || text.includes('오운완')) {
      tags.add('#오운완');
    }
    if (text.includes('공부') || text.includes('독서') || text.includes('책') || text.includes('시험') || text.includes('자격증')) {
      tags.add('#열공독서');
    }
    if (text.includes('영어') || text.includes('회화') || text.includes('일본어') || text.includes('토익')) {
      tags.add('#외국어마스터');
    }
    if (text.includes('청소') || text.includes('정리') || text.includes('빨래') || text.includes('분리수거')) {
      tags.add('#미니멀라이프');
    }
    if (text.includes('물') || text.includes('영양제') || text.includes('수면') || text.includes('명상')) {
      tags.add('#웰빙케어');
    }
  }

  if (tags.size === 0) {
    tags.add('#성실집사');
    tags.add('#고양이사랑');
  }

  return Array.from(tags).slice(0, 4);
}

