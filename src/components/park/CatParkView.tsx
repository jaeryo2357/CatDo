import React, { useState, useEffect, useRef } from 'react';
import { CatState } from '../../types/cat';
import { OnlineCatUser, ParkActionType, ParkActionNotification, CatNote } from '../../types/park';
import { CatParkScene } from './CatParkScene';
import { CatProfileModal } from './CatProfileModal';
import { CatMailboxModal } from './CatMailboxModal';
import { Users, HelpCircle, ArrowLeft, Mail, Heart, Fish, Compass, Sparkles } from 'lucide-react';
import { playSound } from '../../utils/audio';

interface CatParkViewProps {
  cat: CatState;
  onBackToRoom: () => void;
  onUpdateCatState: (updater: (prev: CatState) => CatState) => void;
}

export const CatParkView: React.FC<CatParkViewProps> = ({ cat, onBackToRoom, onUpdateCatState }) => {
  const [remoteUsers, setRemoteUsers] = useState<OnlineCatUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showNearbyDrawer, setShowNearbyDrawer] = useState(false);
  const [selectedCat, setSelectedCat] = useState<OnlineCatUser | null>(null);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [notes, setNotes] = useState<CatNote[]>([]);
  const [recentNotification, setRecentNotification] = useState<ParkActionNotification | null>(null);

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
          // Send Join Payload with butler's interest tags & fullness
          ws.send(
            JSON.stringify({
              type: 'join',
              payload: {
                catId: cat.id,
                name: cat.name,
                breed: cat.breed,
                level: cat.level,
                accessory: cat.accessory,
                fullness: cat.fullness,
                happiness: cat.happiness,
                likesCount: cat.likesCount || 0,
                interests: cat.interests || ['#성실집사'],
                isPublicInterests: cat.isPublicInterests ?? true,
                bio: cat.bio || '오늘도 냥이와 함께 행복한 하루 만들기!',
                ownerName: '나의 집사',
                rescuedCount: cat.kindnessKarma || 0,
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
              if (data.payload.notes) {
                setNotes(data.payload.notes);
              }
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
              setRemoteUsers((prev) =>
                prev.map((u) => (u.id === id ? { ...u, currentAction: action } : u))
              );

              const notif: ParkActionNotification = {
                id: `act_${Date.now()}`,
                userId: id,
                name,
                action,
                x,
                z,
                timestamp: Date.now(),
              };
              setRecentNotification(notif);

              setTimeout(() => {
                setRecentNotification((curr) => (curr?.id === notif.id ? null : curr));
              }, 4000);
            } else if (data.type === 'cat_liked') {
              const { targetId, senderName, targetName } = data.payload;
              // Update liked cat count
              setRemoteUsers((prev) =>
                prev.map((u) =>
                  u.id === targetId || u.catId === targetId
                    ? { ...u, likesCount: u.likesCount + 1 }
                    : u
                )
              );

              // If my cat was liked
              if (targetId === cat.id || targetId === myIdRef.current) {
                onUpdateCatState((prev) => ({
                  ...prev,
                  likesCount: (prev.likesCount || 0) + 1,
                  happiness: Math.min(100, prev.happiness + 5),
                }));
                playSound.zenChime();
              }

              const notif: ParkActionNotification = {
                id: `like_${Date.now()}`,
                userId: targetId,
                name: senderName,
                targetName,
                action: 'like',
                x: 0,
                z: 0,
                timestamp: Date.now(),
              };
              setRecentNotification(notif);
              setTimeout(() => {
                setRecentNotification((curr) => (curr?.id === notif.id ? null : curr));
              }, 4000);
            } else if (data.type === 'stray_fed') {
              const { targetId, targetName, senderName, newFullness } = data.payload;
              setRemoteUsers((prev) =>
                prev.map((u) =>
                  u.id === targetId || u.catId === targetId
                    ? { ...u, fullness: newFullness, isHungry: false, currentAction: 'purr' }
                    : u
                )
              );

              // If my cat was fed by someone else
              if (targetId === cat.id || targetId === myIdRef.current) {
                onUpdateCatState((prev) => ({
                  ...prev,
                  fullness: newFullness,
                  happiness: Math.min(100, prev.happiness + 20),
                }));
                playSound.purr();
              }

              const notif: ParkActionNotification = {
                id: `rescue_${Date.now()}`,
                userId: targetId,
                name: senderName,
                targetName,
                action: 'rescued_food',
                x: 0,
                z: 0,
                timestamp: Date.now(),
              };
              setRecentNotification(notif);
              setTimeout(() => {
                setRecentNotification((curr) => (curr?.id === notif.id ? null : curr));
              }, 4000);
            } else if (data.type === 'new_note') {
              const newNote = data.payload as CatNote;
              setNotes((prev) => [...prev, newNote]);
              playSound.zenChime();
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
  }, [cat.id]);

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

  // Broadcast Park action
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

  // Like a cat
  const handleLikeCat = (targetCatId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'like_cat',
          payload: { targetId: targetCatId },
        })
      );
    }
  };

  // Rescue & feed a hungry stray cat
  const handleFeedStray = (targetCatId: string) => {
    if (cat.coins < 10) return;

    // Deduct 10 coins, add karma to local user
    onUpdateCatState((prev) => ({
      ...prev,
      coins: prev.coins - 10,
      kindnessKarma: (prev.kindnessKarma || 0) + 1,
      exp: prev.exp + 15,
    }));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'feed_stray',
          payload: { targetId: targetCatId },
        })
      );
    }
  };

  // Send whisper note
  const handleSendNote = (receiverCatId: string, message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'send_note',
          payload: {
            receiverCatId,
            message,
            senderName: cat.name,
            senderBreed: cat.breed,
            senderAccessory: cat.accessory,
          },
        })
      );
    }
  };

  const totalCatsCount = remoteUsers.length + 1;
  const hungryCount = remoteUsers.filter((u) => u.isHungry || u.fullness <= 30).length;

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
            <span>🌿</span>
            <span>냥이 광장 & 놀이터</span>
          </div>
        </div>

        {/* Right: Mailbox, Radar & Online Cats Counter */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Mailbox Button */}
          <button
            type="button"
            onClick={() => setIsMailboxOpen(true)}
            className="relative p-2 rounded-2xl bg-white/90 backdrop-blur-md border border-amber-200 text-amber-900 shadow-sm hover:bg-amber-50 cursor-pointer flex items-center gap-1"
            title="냥이 우체통 열기"
          >
            <Mail className="w-4 h-4" />
            {notes.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1" />
            )}
          </button>

          {/* Nearby Cats Radar Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowNearbyDrawer(!showNearbyDrawer)}
            className={`p-2 rounded-2xl backdrop-blur-md border shadow-sm transition flex items-center gap-1 cursor-pointer text-xs font-bold ${
              hungryCount > 0
                ? 'bg-red-50 border-red-200 text-red-700 animate-pulse'
                : 'bg-white/90 border-stone-200 text-stone-700'
            }`}
            title="주변 고양이 목록 열기"
          >
            <Compass className="w-4 h-4" />
            {hungryCount > 0 && <span>배고픈 냥이 {hungryCount}</span>}
          </button>

          {/* Online Counter */}
          <div className="bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-1.5 text-xs font-bold text-stone-700">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'
              }`}
            />
            <Users className="w-3.5 h-3.5 text-stone-500" />
            <span>{totalCatsCount}</span>
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
            <span>🌿 냥이 광장 & 놀이터 안내</span>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="text-stone-400 hover:text-stone-700 cursor-pointer text-base"
            >
              ✕
            </button>
          </div>
          <p className="leading-relaxed">
            내가 키운 고양이와 함께 넓은 공원을 산책하고, 다른 집사들의 고양이와 교감하는 따뜻한 온라인 공간입니다.
          </p>
          <ul className="space-y-1.5 text-[11px] text-stone-600 list-disc list-inside bg-amber-50/60 p-2.5 rounded-2xl border border-amber-200/60">
            <li>
              <strong>고양이 탐색:</strong> 3D 화면의 고양이를 탭하거나 우측 상단 나침반을 눌러 프로필을 확인하세요.
            </li>
            <li>
              <strong>ToDo 관심사:</strong> 집사가 공개한 ToDo 관심사 태그(#코딩, #운동 등)를 보고 응원 하트를 남길 수 있습니다.
            </li>
            <li>
              <strong>외국어 쪽지 번역:</strong> 해외 집사와도 AI 원클릭 번역으로 따뜻한 응원 쪽지를 주고받을 수 있습니다.
            </li>
            <li>
              <strong>배고픈 냥이 구출:</strong> 오랫동안 접속하지 않아 굶고 있는 고양이에게 멸치 간식을 나눠주고 천사 집사 카르마를 쌓아보세요!
            </li>
          </ul>
        </div>
      )}

      {/* Nearby Cats Quick Drawer */}
      {showNearbyDrawer && (
        <div className="absolute top-16 right-4 z-40 w-72 bg-white/95 backdrop-blur-md p-3.5 rounded-3xl border-2 border-amber-200 shadow-xl text-xs space-y-2 animate-fade-in max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-600" /> 광장의 고양이들 ({totalCatsCount})
            </span>
            <button
              onClick={() => setShowNearbyDrawer(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 pt-1">
            {/* My own cat */}
            <div className="p-2 bg-amber-50/80 rounded-xl border border-amber-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">👑</span>
                <div>
                  <div className="font-bold text-amber-950">{cat.name} (내 고양이)</div>
                  <div className="text-[10px] text-amber-700">Lv.{cat.level} · 포만감 {cat.fullness}%</div>
                </div>
              </div>
            </div>

            {/* Other cats in park */}
            {remoteUsers.map((user) => {
              const isHungry = user.isHungry || user.fullness <= 30;
              return (
                <div
                  key={user.id}
                  onClick={() => {
                    setSelectedCat(user);
                    setShowNearbyDrawer(false);
                  }}
                  className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isHungry
                      ? 'bg-red-50/80 border-red-200 hover:bg-red-100/80'
                      : 'bg-slate-50 hover:bg-amber-50/60 border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {user.breed === 'tuxedo'
                        ? '🎩'
                        : user.breed === 'calico'
                        ? '🌸'
                        : user.breed === 'white'
                        ? '❄️'
                        : '🐾'}
                    </span>
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        {user.name}
                        {isHungry && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-red-500 text-white font-bold rounded-full">
                            배고픔
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Lv.{user.level} · {user.ownerName || '집사'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                    <Heart className="w-3 h-3 fill-rose-500" />
                    {user.likesCount}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3D Multiplayer Playground Canvas */}
      <div className="w-full flex-1 min-h-[480px]">
        <CatParkScene
          myCat={cat}
          remoteUsers={remoteUsers}
          onMoveMyCat={handleMoveMyCat}
          onPerformAction={handlePerformAction}
          onSelectCat={(user) => setSelectedCat(user)}
          recentActionNotification={recentNotification}
        />
      </div>

      {/* Cat Profile Modal */}
      {selectedCat && (
        <CatProfileModal
          targetCat={selectedCat}
          myCat={cat}
          onClose={() => setSelectedCat(null)}
          onLike={handleLikeCat}
          onFeedStray={handleFeedStray}
          onSendNote={handleSendNote}
        />
      )}

      {/* Cat Whisper Mailbox Modal */}
      {isMailboxOpen && (
        <CatMailboxModal notes={notes} onClose={() => setIsMailboxOpen(false)} />
      )}
    </div>
  );
};
