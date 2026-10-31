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

app.use(express.json());

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
      const prompt = `당신은 귀여운 3D 고양이를 모시는 집사의 일상을 돕는 'AI 노력 가치 감정사'입니다.
집사가 등록하려는 다음 할일의 난이도와 정신적/육체적 피로도, 집중력 소모를 공정하게 분석하여 '캔/츄르 코인(10 ~ 150)'의 가치를 매겨주세요.

할일 제목: "${title}"
상세 내용: "${detail || '없음'}"
카테고리: "${category || 'life'}"

평가 기준:
1. difficulty: 'easy' (가벼운 일상 루틴 10~40캔), 'medium' (집중 30분 이상 45~80캔), 'hard' (고난도/높은 스트레스/창작 85~120캔), 'extreme' (장시간 마라톤/중요 시험/대규모 마감 125~150캔)
2. difficultyLabel: 한국어 짧은 수식어 (예: '가벼운 스트레칭', '집중력 풀가동!', '고난도 퀘스트', '전설의 집사 챌린지')
3. effortValue: 정수 10 ~ 150
4. rationale: 왜 이 노력이 가치 있는지, 집사의 심리적/신체적 수고를 진솔하고 따뜻하게 인정해주는 1-2문장의 평가
5. catComment: 집사의 고양이가 옆에서 꼬리를 흔들며 하는 귀여운 응원 한마디 (반드시 '~다냥!', '~라옹!', '~다옹~' 등 귀여운 고양이 말투 사용)
6. suggestedPacing: 이 작업을 마칠 때까지 도움이 되는 현실적인 휴식/호흡 팁 1줄`;

      const apiPromise = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: '당신은 집사의 생산성을 응원하고 노력을 보상하는 따뜻하고 공정한 고양이 AI 어시스턴트입니다.',
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
  currentAction: 'idle' | 'bow' | 'purr' | 'loaf' | 'incense';
  lastSeen: number;
}

const connectedCats = new Map<string, { ws: WebSocket; presence: OnlineCatPresence }>();

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
        };

        connectedCats.set(sessionId, { ws, presence });

        // 1. Send all existing players to the newcomer
        const allPresences: OnlineCatPresence[] = [];
        connectedCats.forEach((val) => {
          allPresences.push(val.presence);
        });

        ws.send(
          JSON.stringify({
            type: 'init',
            payload: {
              myId: sessionId,
              users: allPresences,
            },
          })
        );

        // 2. Announce newcomer to everyone else
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

          // Broadcast silent zen action (bow, loaf, heart, incense)
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
      server: { middlewareMode: true },
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
