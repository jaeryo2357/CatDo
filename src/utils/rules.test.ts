import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLocalEffortFallback,
  feedCat,
  completeTask,
  petCat,
  isCatHungry,
  rescueFeedStrayCat,
  extractInterestTags,
} from './rules';
import { CatState, FOOD_ITEMS } from '../types/cat';
import { TodoItem } from '../types/todo';

const initialCat: CatState = {
  id: 'test_cat',
  name: '나비',
  breed: 'cheese',
  personality: 'foodie',
  level: 1,
  exp: 0,
  expToNext: 100,
  fullness: 20,
  happiness: 50,
  coins: 50,
  accessory: 'none',
  currentAnimation: 'idle',
  totalTasksCompleted: 0,
  adoptedAt: Date.now(),
  lastFedAt: Date.now(),
  lastPetAt: Date.now(),
};

test('calculateLocalEffortFallback assigns appropriate effort to simple vs intense tasks', () => {
  const easyTask = calculateLocalEffortFallback('물 마시기', '가볍게 수분 섭취', 'health');
  assert.ok(easyTask.effortValue >= 15);
  assert.ok(easyTask.effortValue <= 50);

  const hardTask = calculateLocalEffortFallback('프로젝트 기획서 작성 및 코딩', '클라우드 배포와 버그 수정', 'work');
  assert.ok(hardTask.effortValue > easyTask.effortValue);
  assert.ok(hardTask.catComment.includes('냥') || hardTask.catComment.includes('옹'));
});

test('feedCat deducts coins and increases fullness & happiness', () => {
  const kibble = FOOD_ITEMS[0]; // cost 15, fullness +20
  const result = feedCat(initialCat, kibble);

  assert.equal(result.success, true);
  assert.equal(result.updatedCat.coins, 35);
  assert.equal(result.updatedCat.fullness, 40);
  assert.equal(result.updatedCat.currentAnimation, 'eat');
});

test('feedCat fails cleanly when coins are insufficient', () => {
  const poorCat = { ...initialCat, coins: 5 };
  const tuna = FOOD_ITEMS[1]; // cost 40
  const result = feedCat(poorCat, tuna);

  assert.equal(result.success, false);
  assert.equal(result.updatedCat.coins, 5);
  assert.match(result.message, /코인이 부족/);
});

test('completeTask awards coins, adds exp, and increments task count', () => {
  const mockTask: TodoItem = {
    id: 'task_1',
    title: '30분 러닝하기',
    category: 'health',
    completed: false,
    createdAt: Date.now(),
    analysis: {
      difficulty: 'medium',
      difficultyLabel: '집중 집중!',
      effortValue: 45,
      rationale: '테스트 과제',
      catComment: '수고했다냥!',
    },
  };

  const { updatedCat, coinsGained, expGained } = completeTask(initialCat, mockTask);
  assert.equal(coinsGained, 45);
  assert.equal(updatedCat.coins, 95);
  assert.equal(updatedCat.totalTasksCompleted, 1);
  assert.equal(expGained, Math.round(45 * 0.8));
});

test('petCat increases happiness', () => {
  const { updatedCat } = petCat(initialCat);
  assert.equal(updatedCat.happiness, 56);
  assert.equal(updatedCat.currentAnimation, 'pet');
});

test('isCatHungry correctly detects low fullness', () => {
  assert.equal(isCatHungry({ ...initialCat, fullness: 20 }), true);
  assert.equal(isCatHungry({ ...initialCat, fullness: 80 }), false);
});

test('rescueFeedStrayCat deducts rescuer coins, restores fullness and grants karma', () => {
  const result = rescueFeedStrayCat(50, 15);
  assert.equal(result.success, true);
  assert.equal(result.newRescuerCoins, 40);
  assert.equal(result.newTargetFullness, 50);
  assert.equal(result.karmaEarned, 1);

  const poorRescuer = rescueFeedStrayCat(5, 10);
  assert.equal(poorRescuer.success, false);
  assert.equal(poorRescuer.newRescuerCoins, 5);
});

test('extractInterestTags finds tags from todo titles', () => {
  const todos: TodoItem[] = [
    {
      id: '1',
      title: '리액트 컴포넌트 코딩 및 개발',
      category: 'study',
      completed: false,
      createdAt: 0,
      analysis: { difficulty: 'medium', difficultyLabel: '', effortValue: 30, rationale: '', catComment: '' }
    },
    {
      id: '2',
      title: '아침 러닝 5km 운동 오운완',
      category: 'health',
      completed: false,
      createdAt: 0,
      analysis: { difficulty: 'medium', difficultyLabel: '', effortValue: 30, rationale: '', catComment: '' }
    }
  ];

  const tags = extractInterestTags(todos);
  assert.ok(tags.includes('#개발자'));
  assert.ok(tags.includes('#오운완'));
});

