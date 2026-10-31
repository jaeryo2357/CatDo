import React, { useState, useEffect, useRef } from 'react';
import { CatState } from '../../types/cat';
import { OnlineCatUser, ParkActionType, ZenActionNotification } from '../../types/park';
import { CatParkScene } from './CatParkScene';
import { Users, Sparkles, HelpCircle, ArrowLeft } from 'lucide-react';
import { playSound } from '../../utils/audio';

interface CatParkViewProps {
  cat: CatState;
  onBackToRoom: () => void;
}

export const CatParkView: React.FC<CatParkViewProps> = ({ cat, onBackToRoom }) => {
  const [remoteUsers, setRemoteUsers] = useState<OnlineCatUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [recentNotification, setRecentNotification] = useState<ZenActionNotification | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const myIdRef = useRef<string | null>(null);

  // Connect to WebSocket Server
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let ws: WebSocket;
    let pingInterval: number;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          // Send Join Payload
          ws.send(
            JSON.stringify({
              type: 'join',
              payload: {
                catId: cat.id,
                name: cat.name,
                breed: cat.breed,
                level: cat.level,
                accessory: cat.accessory,
              },
            })
          );

          // Heartbeat ping every 15s
          pingInterval = window.setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 15000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'init') {
              myIdRef.current = data.payload.myId;
              const others = (data.payload.users as OnlineCatUser[]).filter(
                (u) => u.id !== data.payload.myId
              );
              setRemoteUsers(others);
            } else if (data.type === 'user_joined') {
              const newcomer = data.payload as OnlineCatUser;
              if (newcomer.id !== myIdRef.current) {
                setRemoteUsers((prev) => {
                  if (prev.some((u) => u.id === newcomer.id)) return prev;
                  return [...prev, newcomer];
                });
              }
            } else if (data.type === 'user_moved') {
              const { id, x, z, rotY, isMoving } = data.payload;
              setRemoteUsers((prev) =>
                prev.map((u) => (u.id === id ? { ...u, x, z, rotY, isMoving } : u))
              );
            } else if (data.type === 'user_action') {
              const { id, action, name, x, z } = data.payload;
              // Update user state
              setRemoteUsers((prev) =>
                prev.map((u) => (u.id === id ? { ...u, currentAction: action } : u))
              );

              // Show floating notification
              const notif: ZenActionNotification = {
                id: `act_${Date.now()}`,
                userId: id,
                name,
                action,
                x,
                z,
                timestamp: Date.now(),
              };
              setRecentNotification(notif);

              if (action === 'bow') {
                playSound.zenBowl();
              } else if (action === 'purr') {
                playSound.zenChime();
              }

              setTimeout(() => {
                setRecentNotification((curr) => (curr?.id === notif.id ? null : curr));
              }, 4000);
            } else if (data.type === 'user_left') {
              setRemoteUsers((prev) => prev.filter((u) => u.id !== data.payload.id));
            }
          } catch {}
        };

        ws.onclose = () => {
          setIsConnected(false);
        };
      } catch {
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      clearInterval(pingInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [cat]);

  // Broadcast movement
  const handleMoveMyCat = (x: number, z: number, rotY: number, isMoving: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'move',
          payload: { x, z, rotY, isMoving },
        })
      );
    }
  };

  // Broadcast Zen action
  const handlePerformAction = (action: ParkActionType) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'action',
          payload: { action },
        })
      );
    }
  };

  const totalCatsCount = remoteUsers.length + 1;

  return (
    <div className="flex-1 flex flex-col relative h-full min-h-[520px] select-none overflow-hidden bg-amber-50/20">
      {/* Top Floating Park Status Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
        {/* Left: Location & Back Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onBackToRoom}
            className="p-2 rounded-2xl bg-white/90 backdrop-blur-md border border-stone-200 text-stone-700 shadow-sm hover:bg-stone-100 transition-colors cursor-pointer"
            title="고양이 방으로 돌아가기"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-amber-200/90 shadow-sm flex items-center gap-1.5 text-xs font-black text-amber-950">
            <span>🌸</span>
            <span>냥이 선원 공원</span>
          </div>
        </div>

        {/* Right: Online Cats Counter & Help */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-1.5 text-xs font-bold text-stone-700">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'
              }`}
            />
            <Users className="w-3.5 h-3.5 text-stone-500" />
            <span>{totalCatsCount}마리 산책 중</span>
          </div>

          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="p-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-stone-200 text-stone-600 shadow-sm hover:bg-amber-50 cursor-pointer"
            title="공원 이용 안내"
          >
            <HelpCircle className="w-4 h-4 text-amber-600" />
          </button>
        </div>
      </div>

      {/* Guide Card Modal Popup */}
      {showGuide && (
        <div className="absolute top-16 left-4 right-4 z-40 bg-white/95 backdrop-blur-md p-4 rounded-3xl border-2 border-amber-200 shadow-xl text-xs space-y-2.5 animate-fade-in text-stone-700">
          <div className="flex items-center justify-between font-black text-stone-900 text-sm">
            <span>🧘 고요한 냥이 선원 안내</span>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="text-stone-400 hover:text-stone-700 cursor-pointer text-base"
            >
              ✕
            </button>
          </div>
          <p className="leading-relaxed">
            채팅 없이 <strong>침묵과 몸짓으로만 교감하는 온라인 힐링 공간</strong>입니다. 다른
            집사들이 정성껏 키운 고양이들을 실시간으로 만나보세요.
          </p>
          <ul className="space-y-1.5 text-[11px] text-stone-600 list-disc list-inside bg-amber-50/60 p-2.5 rounded-2xl border border-amber-200/60">
            <li>
              <strong>조작 방법:</strong> 좌측 하단 버튼이나 키보드(WASD / 방향키)로 이동
            </li>
            <li>
              <strong>🙇 절하기:</strong> 중앙의 황금 냥이 수호신이나 이웃 고양이에게 마음을 담아 절하기
            </li>
            <li>
              <strong>💖 골골 하트:</strong> 맑은 풍경 소리와 함께 따스한 하트 축복 보내기
            </li>
            <li>
              <strong>🧘 식빵 굽기:</strong> 조용히 발을 모으고 나란히 명상하기
            </li>
            <li>
              <strong>🌿 향 올리기:</strong> 캣닢 향을 피워 모두의 평안을 기원하기
            </li>
          </ul>
        </div>
      )}

      {/* 3D Multiplayer Canvas */}
      <div className="w-full flex-1 min-h-[480px]">
        <CatParkScene
          myCat={cat}
          remoteUsers={remoteUsers}
          onMoveMyCat={handleMoveMyCat}
          onPerformAction={handlePerformAction}
          recentActionNotification={recentNotification}
        />
      </div>
    </div>
  );
};
