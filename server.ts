import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Type } from '@google/genai';
import { calculateLocalEffortFallback } from './src/utils/rules';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Gemini SDK with recommended User-Agent header
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('MY_') && apiKey.length > 15) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// AI Task Effort & Difficulty Valuation Route
app.post('/api/analyze-task', async (req, res) => {
  const { title, detail, category } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: '할일 제목이 필요합니다.' });
  }

  if (aiClient) {
    try {
      const prompt = `당신은 귀여운 반려묘와 함께하는 힐링 투두 앱의 따뜻한 안내자입니다.
집사가 등록하려는 다음 할일의 난이도와 노력, 집중도를 친근하고 따뜻하게 살펴보고 '캔 보상(10 ~ 150)'을 매겨주세요.

할일 제목: "${title}"
상세 내용: "${detail || '없음'}"
카테고리: "${category || 'life'}"

작성 규칙 (매우 중요):
- 절대로 '인지적 집중', '유의미한 과업', '감정사', 'AI 분석', '수고를 진솔하게 인정' 같은 딱딱하고 기계적인 AI 말투를 쓰지 마세요.
- 마치 동물의 숲이나 네코아츠메 같은 따뜻하고 몽글몽글한 힐링 게임 속 안내자처럼 자연스럽고 다정한 한국어로 작성하세요.

평가 항목:
1. difficulty: 'easy' (가벼운 루틴 10~40캔), 'medium' (집중 과업 45~80캔), 'hard' (고난도 과업 85~120캔), 'extreme' (장시간 마라톤/중요 시험 125~150캔)
2. difficultyLabel: 친근한 한국어 표현 (예: '가벼운 몸풀기', '집중 몰입!', '도전 과제', '대단한 챌린지')
3. effortValue: 정수 10 ~ 150
4. rationale: 이 일에 왜 응원이 필요한지 집사의 마음에 공감해주는 따뜻하고 자연스러운 1-2문장
5. catComment: 고양이가 옆에서 꼬리를 살랑이며 건네는 사랑스러운 응원 한마디 (끝말은 자연스럽게 '~다냥!', '~라옹!', '~다옹~' 사용)
6. suggestedPacing: 집사에게 도움이 될 현실적인 팁이나 가벼운 휴식 조언 1줄`;

      const apiPromise = aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: '당신은 집사의 일상을 따뜻하게 응원하고 공감해주는 사랑스러운 고양이 투두 컴패니언입니다. 기계적이거나 딱딱한 문구를 절대로 사용하지 마세요.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              difficulty: {
                type: Type.STRING,
                description: 'easy, medium, hard, or extreme',
              },
              difficultyLabel: {
                type: Type.STRING,
                description: 'Short Korean label for difficulty',
              },
              effortValue: {
                type: Type.INTEGER,
                description: 'Coin value from 10 to 150',
              },
              rationale: {
                type: Type.STRING,
                description: 'Empathetic analysis of mental and physical effort',
              },
              catComment: {
                type: Type.STRING,
                description: 'Cute encouraging words from the cat ending in ~다냥 / ~라옹',
              },
              suggestedPacing: {
                type: Type.STRING,
                description: 'Pacing or break advice',
              },
            },
            required: ['difficulty', 'difficultyLabel', 'effortValue', 'rationale', 'catComment'],
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI valuation timeout')), 3500)
      );

      const response = await Promise.race([apiPromise, timeoutPromise]);

      const parsed = JSON.parse(response.text || '{}');
      const validDifficulty = ['easy', 'medium', 'hard', 'extreme'].includes(parsed.difficulty)
        ? parsed.difficulty
        : 'medium';
      const validValue = Math.min(150, Math.max(10, Number(parsed.effortValue) || 40));

      return res.json({
        difficulty: validDifficulty,
        difficultyLabel: parsed.difficultyLabel || '알찬 미션',
        effortValue: validValue,
        rationale: parsed.rationale || '집사의 소중한 집중과 정성이 담긴 멋진 할일입니다.',
        catComment: parsed.catComment || '집사 힘내라옹! 끝나면 맛난 참치캔 먹자냥! 🐟',
        suggestedPacing: parsed.suggestedPacing || '적절한 스트레칭과 함께 진행해 보세요.',
      });
    } catch (err) {
      console.warn('Gemini API call failed, falling back to local heuristic:', err);
    }
  }

  const fallback = calculateLocalEffortFallback(title, detail, category);
  return res.json(fallback);
});

// AI Multimodal Vision: Real-Time Cat Photo to 3D Model Palette
app.post('/api/analyze-cat-photo', async (req, res) => {
  const { photoBase64 } = req.body;

  if (!photoBase64 || typeof photoBase64 !== 'string') {
    return res.status(400).json({ error: '고양이 사진 데이터가 필요합니다.' });
  }

  const cleanBase64 = photoBase64.replace(/^data:image\/\w+;base64,/, '');

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanBase64,
                },
              },
              {
                text: `사진 속 고양이를 세심하게 관찰하여 3D 카툰 마스코트 캐릭터로 1:1 재현하기 위한 색상 팔레트와 무늬 특징을 추출해주세요.

반드시 다음 JSON 형식에 맞춰 색상 헥스코드와 특징을 작성해주세요:
- breedTag: 묘종 또는 무늬 명칭 (예: '치즈 태비', '고등어 태비', '턱시도 냥이', '삼색이', '스노우 화이트', '샴', '러시안 블루', '카오스')
- suggestedName: 사진 속 인상에 어울리는 사랑스러운 한국어 이름 (예: '망고', '모찌', '오레오', '보리', '루루', '나비')
- personality: 'foodie' (먹보), 'energetic' (활발), 'cuddly' (애교), 'zen' (도도/느긋) 중 하나
- primaryColor: 고양이의 주요 털 색상 헥스코드 (예: 치즈는 #f59e0b, 고등어는 #6b7280, 턱시도는 #18181b, 화이트는 #ffffff, 샴/베이지는 #e0d5c1)
- stripeColor: 줄무늬 또는 포인트 무늬 색상 헥스코드 (줄무늬가 없으면 톤온톤 어두운 색상)
- bellyColor: 가슴/배/턱 털 색상 헥스코드 (보통 #ffffff 또는 #fef3c7)
- eyeColorLeft: 왼쪽 눈동자 색상 헥스코드 (예: 에메랄드 #10b981, 호박/골드 #f59e0b, 사파이어 #38bdf8)
- eyeColorRight: 오른쪽 눈동자 색상 헥스코드 (오드아이라면 왼쪽과 다른 색상, 보통은 같음)
- noseColor: 코 색상 헥스코드 (핑크는 #f43f5e, 어두운 코는 #3f3f46)
- hasStripes: 줄무늬(태비)가 뚜렷한지 여부 (boolean)
- hasBib: 가슴에 흰 털(턱시도 빕)이 있는지 여부 (boolean)
- hasSocks: 발 끝에 하얀 양말을 신었는지 여부 (boolean)
- hasBlush: 볼터치 추천 여부 (boolean, 기본 true)
- aiDescription: 사진 속 고양이의 매력 포인트를 짚어주는 다정하고 사랑스러운 1~2문장의 감정평`,
              },
            ],
          },
        ],
        config: {
          systemInstruction: '당신은 실제 고양이 사진을 보고 가장 사랑스러운 3D 툰 캐릭터 모델로 색상과 특징을 변환하는 전문 3D 아티스트 AI입니다.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              breedTag: { type: Type.STRING },
              suggestedName: { type: Type.STRING },
              personality: { type: Type.STRING },
              primaryColor: { type: Type.STRING },
              stripeColor: { type: Type.STRING },
              bellyColor: { type: Type.STRING },
              eyeColorLeft: { type: Type.STRING },
              eyeColorRight: { type: Type.STRING },
              noseColor: { type: Type.STRING },
              hasStripes: { type: Type.BOOLEAN },
              hasBib: { type: Type.BOOLEAN },
              hasSocks: { type: Type.BOOLEAN },
              hasBlush: { type: Type.BOOLEAN },
              aiDescription: { type: Type.STRING },
            },
            required: [
              'breedTag',
              'suggestedName',
              'personality',
              'primaryColor',
              'bellyColor',
              'eyeColorLeft',
              'eyeColorRight',
              'aiDescription',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        success: true,
        data: {
          breedTag: parsed.breedTag || '나만의 특별한 냥이',
          suggestedName: parsed.suggestedName || '모찌',
          personality: ['foodie', 'energetic', 'cuddly', 'zen'].includes(parsed.personality)
            ? parsed.personality
            : 'cuddly',
          primaryColor: parsed.primaryColor || '#f59e0b',
          stripeColor: parsed.stripeColor || '#d97706',
          bellyColor: parsed.bellyColor || '#ffffff',
          eyeColorLeft: parsed.eyeColorLeft || '#10b981',
          eyeColorRight: parsed.eyeColorRight || parsed.eyeColorLeft || '#10b981',
          noseColor: parsed.noseColor || '#f43f5e',
          hasStripes: parsed.hasStripes ?? true,
          hasBib: parsed.hasBib ?? true,
          hasSocks: parsed.hasSocks ?? true,
          hasBlush: parsed.hasBlush ?? true,
          aiDescription: parsed.aiDescription || '호기심 가득하고 눈빛이 보석처럼 빛나는 사랑스러운 고양이입니다!',
        },
      });
    } catch (err) {
      console.warn('Gemini vision photo analysis failed, using fallback:', err);
    }
  }

  // Fallback if AI key is missing or call fails
  return res.json({
    success: true,
    data: {
      breedTag: '사진 맞춤 냥이',
      suggestedName: '보리',
      personality: 'cuddly',
      primaryColor: '#f59e0b',
      stripeColor: '#d97706',
      bellyColor: '#ffffff',
      eyeColorLeft: '#10b981',
      eyeColorRight: '#10b981',
      noseColor: '#f43f5e',
      hasStripes: true,
      hasBib: true,
      hasSocks: true,
      hasBlush: true,
      aiDescription: '동글동글한 볼살과 다정한 눈빛이 매력적인 천사 같은 고양이입니다! 💕',
    },
  });
});

// AI Translation Route for Global Butler Notes
app.post('/api/translate', async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required' });
  }

  const desiredLang = targetLang || 'ko';

  if (aiClient) {
    try {
      const prompt = `Translate the following message between cat lovers/butlers warmly and politely into ${desiredLang === 'ko' ? 'Korean' : 'English'}. Keep the tone cute, supportive, and friendly, using cute cat emoticons if appropriate.
Original text: "${text}"
Output ONLY the translated sentence, nothing else.`;

      const apiPromise = aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Translation timeout')), 3000)
      );

      const response = await Promise.race([apiPromise, timeoutPromise]);
      const translated = response.text ? response.text.trim() : text;
      return res.json({ translatedText: translated, sourceText: text });
    } catch (err) {
      console.warn('Translation failed, using fallback:', err);
    }
  }

  // Fallback simple translation simulation
  let fallbackText = text;
  if (desiredLang === 'ko') {
    if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
      fallbackText = '안녕하세요! 오늘도 귀여운 고양이와 함께 힘내세요 🐾';
    } else if (text.toLowerCase().includes('cute') || text.toLowerCase().includes('love')) {
      fallbackText = '고양이가 정말 사랑스럽고 귀여워요! 늘 응원합니다 ✨';
    } else {
      fallbackText = `[번역] ${text}`;
    }
  } else {
    fallbackText = `[Translated] Hello from a friendly butler: "${text}"! Keep it up! 🐾`;
  }

  return res.json({ translatedText: fallbackText, sourceText: text });
});

// --- Real-Time Multiplayer Online Cat Park (WebSocket) ---
export interface OnlineCatPresence {
  id: string;
  catId: string;
  name: string;
  breed: string;
  level: number;
  accessory: string;
  x: number;
  z: number;
  rotY: number;
  isMoving: boolean;
  currentAction: 'idle' | 'loaf' | 'roll' | 'purr' | 'play_yarn';
  lastSeen: number;
  // Social Park & Welfare fields
  fullness: number;
  happiness: number;
  isHungry: boolean;
  likesCount: number;
  interests: string[];
  isPublicInterests: boolean;
  bio: string;
  ownerName: string;
  rescuedCount: number;
  isNpc?: boolean;
}

// Seed community/neighbor cats in the park
const COMMUNITY_CATS: OnlineCatPresence[] = [
  {
    id: 'npc_stray_calico',
    catId: 'stray_calico_1',
    name: '보리 (삼색이)',
    breed: 'calico',
    level: 2,
    accessory: 'none',
    x: 4.2,
    z: 2.5,
    rotY: -0.8,
    isMoving: false,
    currentAction: 'loaf',
    lastSeen: Date.now(),
    fullness: 18, // Hungry! Inactive butler
    happiness: 45,
    isHungry: true,
    likesCount: 12,
    interests: ['#열공독서', '#자격증준비'],
    isPublicInterests: true,
    bio: '집사님이 시험 기간이라 며칠째 접속을 못했어요... 배가 꼬르륵거려요 😿',
    ownerName: '시험기간_공대생',
    rescuedCount: 4,
    isNpc: true,
  },
  {
    id: 'npc_active_tuxedo',
    catId: 'active_tuxedo_2',
    name: '레오 (턱시도)',
    breed: 'tuxedo',
    level: 5,
    accessory: 'sunglasses',
    x: -3.8,
    z: 1.2,
    rotY: 1.2,
    isMoving: false,
    currentAction: 'purr',
    lastSeen: Date.now(),
    fullness: 90,
    happiness: 95,
    isHungry: false,
    likesCount: 38,
    interests: ['#개발자', '#오운완', '#모각코'],
    isPublicInterests: true,
    bio: '오늘도 1일 1커밋 완료하고 캣타워 아래서 힐링 중이다냥! 🕶️',
    ownerName: '풀스택_코딩냥',
    rescuedCount: 15,
    isNpc: true,
  },
  {
    id: 'npc_sleepy_cheese',
    catId: 'sleepy_cheese_3',
    name: '치즈킹 (치즈태비)',
    breed: 'cheese',
    level: 3,
    accessory: 'bell_collar',
    x: 0.5,
    z: -3.5,
    rotY: 0.1,
    isMoving: false,
    currentAction: 'roll',
    lastSeen: Date.now(),
    fullness: 70,
    happiness: 85,
    isHungry: false,
    likesCount: 24,
    interests: ['#미니멀라이프', '#홈카페'],
    isPublicInterests: true,
    bio: '햇살 드는 피크닉 돗자리에서 뒹굴거리는 중~ 낮잠이 최고라옹 💤',
    ownerName: '따뜻한_라떼',
    rescuedCount: 2,
    isNpc: true,
  },
  {
    id: 'npc_hungry_white',
    catId: 'hungry_white_4',
    name: '스노우 (화이트)',
    breed: 'white',
    level: 1,
    accessory: 'flower',
    x: -2.0,
    z: 5.2,
    rotY: 2.5,
    isMoving: false,
    currentAction: 'loaf',
    lastSeen: Date.now(),
    fullness: 22, // Hungry!
    happiness: 40,
    isHungry: true,
    likesCount: 19,
    interests: ['#외국어마스터', '#영어회화'],
    isPublicInterests: true,
    bio: '배고파서 박스 안에서 웅크리고 있어요... 간식 챙겨주시면 은혜 갚겠다냥 🌸',
    ownerName: '출장간_토익러',
    rescuedCount: 6,
    isNpc: true,
  },
];

const connectedCats = new Map<string, { ws: WebSocket; presence: OnlineCatPresence }>();

// In-memory note storage
const storedNotes: Array<{
  id: string;
  senderId: string;
  senderName: string;
  senderBreed: string;
  senderAccessory: string;
  receiverCatId: string;
  message: string;
  createdAt: number;
}> = [
  {
    id: 'note_seed_1',
    senderId: 'npc_active_tuxedo',
    senderName: '레오 (턱시도)',
    senderBreed: 'tuxedo',
    senderAccessory: 'sunglasses',
    receiverCatId: 'all',
    message: '오늘 하루도 할일 끝내느라 고생 많으셨어요! 냥이들이 항상 집사님을 응원합니다 ❤️',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'note_seed_2',
    senderId: 'npc_sleepy_cheese',
    senderName: '치즈킹 (치즈태비)',
    senderBreed: 'cheese',
    senderAccessory: 'bell_collar',
    receiverCatId: 'all',
    message: 'Hello fellow cat lovers! Sending warm purrs and good vibes to everyone 🐾✨',
    createdAt: Date.now() - 7200000,
  },
];

const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(message: object, excludeId?: string) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (!excludeId || (client as any).id !== excludeId) {
        client.send(data);
      }
    }
  });
}

wss.on('connection', (ws) => {
  const sessionId = `cat_user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  (ws as any).id = sessionId;

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'join') {
        const payload = msg.payload;
        const fullness = typeof payload.fullness === 'number' ? payload.fullness : 60;
        const isHungry = fullness <= 30;

        const presence: OnlineCatPresence = {
          id: sessionId,
          catId: payload.catId || 'unknown',
          name: payload.name || '방랑냥이',
          breed: payload.breed || 'cheese',
          level: payload.level || 1,
          accessory: payload.accessory || 'none',
          x: payload.x || (Math.random() - 0.5) * 6,
          z: payload.z || 3 + Math.random() * 4,
          rotY: payload.rotY || 0,
          isMoving: false,
          currentAction: 'idle',
          lastSeen: Date.now(),
          fullness,
          happiness: payload.happiness || 80,
          isHungry,
          likesCount: payload.likesCount || 0,
          interests: payload.interests || ['#성실집사'],
          isPublicInterests: payload.isPublicInterests ?? true,
          bio: payload.bio || '오늘도 냥이를 위해 열심히 달리는 집사입니다!',
          ownerName: payload.ownerName || '집사',
          rescuedCount: payload.rescuedCount || 0,
        };

        connectedCats.set(sessionId, { ws, presence });

        // Compile all cats: Community NPCs + connected players
        const allPresences: OnlineCatPresence[] = [...COMMUNITY_CATS];
        connectedCats.forEach((val) => {
          allPresences.push(val.presence);
        });

        ws.send(
          JSON.stringify({
            type: 'init',
            payload: {
              myId: sessionId,
              users: allPresences,
              notes: storedNotes.slice(-15),
            },
          })
        );

        // Announce newcomer to everyone else
        broadcast({ type: 'user_joined', payload: presence }, sessionId);
      } else if (msg.type === 'move') {
        const item = connectedCats.get(sessionId);
        if (item) {
          item.presence.x = msg.payload.x;
          item.presence.z = msg.payload.z;
          item.presence.rotY = msg.payload.rotY;
          item.presence.isMoving = !!msg.payload.isMoving;
          item.presence.lastSeen = Date.now();

          broadcast(
            {
              type: 'user_moved',
              payload: {
                id: sessionId,
                x: item.presence.x,
                z: item.presence.z,
                rotY: item.presence.rotY,
                isMoving: item.presence.isMoving,
              },
            },
            sessionId
          );
        }
      } else if (msg.type === 'action') {
        const item = connectedCats.get(sessionId);
        if (item) {
          item.presence.currentAction = msg.payload.action;
          item.presence.lastSeen = Date.now();

          broadcast({
            type: 'user_action',
            payload: {
              id: sessionId,
              action: msg.payload.action,
              name: item.presence.name,
              x: item.presence.x,
              z: item.presence.z,
            },
          });
        }
      } else if (msg.type === 'like_cat') {
        const targetId = msg.payload.targetId;
        let targetName = '고양이';

        // Check if target is community NPC
        const npc = COMMUNITY_CATS.find((c) => c.id === targetId || c.catId === targetId);
        if (npc) {
          npc.likesCount += 1;
          targetName = npc.name;
        } else {
          // Check connected players
          const targetPlayer = Array.from(connectedCats.values()).find(
            (c) => c.presence.id === targetId || c.presence.catId === targetId
          );
          if (targetPlayer) {
            targetPlayer.presence.likesCount += 1;
            targetName = targetPlayer.presence.name;
          }
        }

        const senderItem = connectedCats.get(sessionId);
        const senderName = senderItem ? senderItem.presence.name : '어떤 집사';

        broadcast({
          type: 'cat_liked',
          payload: {
            targetId,
            senderId: sessionId,
            senderName,
            targetName,
          },
        });
      } else if (msg.type === 'feed_stray') {
        const targetId = msg.payload.targetId;
        let targetName = '고양이';
        let newFullness = 60;

        const npc = COMMUNITY_CATS.find((c) => c.id === targetId || c.catId === targetId);
        if (npc) {
          npc.fullness = Math.min(100, npc.fullness + 35);
          npc.isHungry = npc.fullness <= 30;
          npc.currentAction = 'purr';
          targetName = npc.name;
          newFullness = npc.fullness;
        } else {
          const targetPlayer = Array.from(connectedCats.values()).find(
            (c) => c.presence.id === targetId || c.presence.catId === targetId
          );
          if (targetPlayer) {
            targetPlayer.presence.fullness = Math.min(100, targetPlayer.presence.fullness + 35);
            targetPlayer.presence.isHungry = targetPlayer.presence.fullness <= 30;
            targetPlayer.presence.currentAction = 'purr';
            targetName = targetPlayer.presence.name;
            newFullness = targetPlayer.presence.fullness;
          }
        }

        const senderItem = connectedCats.get(sessionId);
        if (senderItem) {
          senderItem.presence.rescuedCount += 1;
        }
        const senderName = senderItem ? senderItem.presence.name : '선한 집사';

        broadcast({
          type: 'stray_fed',
          payload: {
            targetId,
            targetName,
            senderId: sessionId,
            senderName,
            newFullness,
          },
        });
      } else if (msg.type === 'send_note') {
        const payload = msg.payload;
        const newNote = {
          id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          senderId: sessionId,
          senderName: payload.senderName || '익명의 집사',
          senderBreed: payload.senderBreed || 'cheese',
          senderAccessory: payload.senderAccessory || 'none',
          receiverCatId: payload.receiverCatId || 'all',
          message: payload.message || '',
          createdAt: Date.now(),
        };

        storedNotes.push(newNote);
        if (storedNotes.length > 50) storedNotes.shift();

        broadcast({
          type: 'new_note',
          payload: newNote,
        });
      } else if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch {
      // safe ignore invalid message
    }
  });

  ws.on('close', () => {
    connectedCats.delete(sessionId);
    broadcast({ type: 'user_left', payload: { id: sessionId } });
  });

  ws.on('error', () => {
    connectedCats.delete(sessionId);
  });
});

// Clean up stale connections every 30 seconds
setInterval(() => {
  const now = Date.now();
  connectedCats.forEach((val, id) => {
    if (now - val.presence.lastSeen > 60000) {
      try {
        val.ws.terminate();
      } catch {}
      connectedCats.delete(id);
      broadcast({ type: 'user_left', payload: { id } });
    }
  });
}, 30000);

// Vite Middleware Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`CatDo fullstack app + WebSocket running on http://localhost:${PORT}`);
  });
}

startServer();
