import React, { useState } from 'react';
import { OnlineCatUser } from '../../types/park';
import { CatState, CAT_BREEDS } from '../../types/cat';
import { Heart, Sparkles, Send, Fish, AlertCircle, Languages, Loader2, X, CheckCircle2 } from 'lucide-react';
import { playSound } from '../../utils/audio';

interface CatProfileModalProps {
  targetCat: OnlineCatUser;
  myCat: CatState;
  onClose: () => void;
  onLike: (catId: string) => void;
  onFeedStray: (catId: string) => void;
  onSendNote: (catId: string, message: string) => void;
}

export const CatProfileModal: React.FC<CatProfileModalProps> = ({
  targetCat,
  myCat,
  onClose,
  onLike,
  onFeedStray,
  onSendNote,
}) => {
  const [noteText, setNoteText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [previewTranslation, setPreviewTranslation] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [liked, setLiked] = useState(false);
  const [fedSuccess, setFedSuccess] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  const breedInfo = CAT_BREEDS.find((b) => b.id === targetCat.breed) || CAT_BREEDS[0];
  const isHungry = targetCat.fullness <= 30;
  const isSelf = targetCat.catId === myCat.id || targetCat.id === myCat.id;

  const handleLike = () => {
    if (liked) return;
    playSound.zenChime();
    setLiked(true);
    onLike(targetCat.id);
  };

  const handleFeed = () => {
    if (myCat.coins < 10) {
      playSound.meow();
      setFeedError('멸치 코인이 부족합니다! (10캔 필요)');
      setTimeout(() => setFeedError(null), 3000);
      return;
    }
    playSound.munch();
    setFedSuccess(true);
    onFeedStray(targetCat.id);
  };

  const handleTranslateNote = async () => {
    if (!noteText.trim()) return;
    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: noteText,
          targetLang: 'ko',
        }),
      });
      const data = await res.json();
      if (data.translatedText) {
        setPreviewTranslation(data.translatedText);
      }
    } catch {
      setPreviewTranslation(`[AI 번역 미리보기] ${noteText}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSend = () => {
    if (!noteText.trim()) return;
    playSound.zenChime();
    onSendNote(targetCat.id, noteText);
    setIsSent(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative bg-gradient-to-br from-amber-400 via-orange-300 to-amber-200 p-5 text-center text-amber-950">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/70 hover:bg-white text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Cat Avatar Badge */}
          <div className="w-20 h-20 mx-auto rounded-full bg-white shadow-md p-1 border-4 border-amber-200/80 flex items-center justify-center">
            <span className="text-4xl">
              {targetCat.breed === 'cheese'
                ? '🐱'
                : targetCat.breed === 'tuxedo'
                ? '🎩'
                : targetCat.breed === 'calico'
                ? '🌸'
                : targetCat.breed === 'white'
                ? '❄️'
                : '🐈'}
            </span>
          </div>

          <h3 className="text-xl font-bold mt-2 flex items-center justify-center gap-1.5">
            {targetCat.name}
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 text-amber-800 font-semibold">
              Lv.{targetCat.level}
            </span>
          </h3>

          <p className="text-xs text-amber-900/80 mt-0.5">
            {breedInfo.name} · 집사 <span className="font-semibold">{targetCat.ownerName || '방랑집사'}</span>
          </p>
        </div>

        {/* Body Contents */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Hunger Alert Badge if Starving */}
          {isHungry && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-red-800">배고픔 경보! (포만감 {targetCat.fullness}%)</div>
                  <div className="text-[11px] text-red-600">
                    집사님이 바빠서 굶주려 있어요. 간식을 나눠주세요!
                  </div>
                  {feedError && (
                    <div className="text-[11px] text-red-700 font-bold bg-red-100 p-1 rounded-lg mt-1">
                      {feedError}
                    </div>
                  )}
                </div>
              </div>
              {!isSelf && (
                <button
                  onClick={handleFeed}
                  disabled={fedSuccess}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-xs shrink-0 flex items-center gap-1 disabled:opacity-50"
                >
                  <Fish className="w-3.5 h-3.5" />
                  {fedSuccess ? '챙겨줌!' : '간식 주기'}
                </button>
              )}
            </div>
          )}

          {/* Bio & Intro */}
          <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-100/60">
            <div className="text-[11px] text-amber-700 font-medium mb-1">🐾 집사 & 냥이 소개</div>
            <p className="text-xs text-slate-700 leading-relaxed italic">
              "{targetCat.bio || '오늘도 서로 격려하며 따뜻한 하루를 만들어가요!'}"
            </p>
          </div>

          {/* Butler's ToDo Interest Tags */}
          {targetCat.isPublicInterests && targetCat.interests && targetCat.interests.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                집사의 ToDo 관심사 태그
              </div>
              <div className="flex flex-wrap gap-1.5">
                {targetCat.interests.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Likes & Stats */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-center flex-1 border-r border-slate-200">
              <div className="text-[11px] text-slate-500">받은 응원 하트</div>
              <div className="text-base font-bold text-rose-500 flex items-center justify-center gap-1">
                <Heart className="w-4 h-4 fill-rose-500" />
                {targetCat.likesCount + (liked ? 1 : 0)}
              </div>
            </div>
            <div className="text-center flex-1">
              <div className="text-[11px] text-slate-500">포만감 상태</div>
              <div className="text-base font-bold text-amber-600">
                {targetCat.fullness}% {targetCat.fullness > 70 ? '😋' : isHungry ? '😿' : '🙂'}
              </div>
            </div>
          </div>

          {/* Action Row: Like & Cheer */}
          {!isSelf && (
            <div className="flex gap-2">
              <button
                onClick={handleLike}
                disabled={liked}
                className={`flex-1 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition ${
                  liked
                    ? 'bg-rose-100 text-rose-600 border border-rose-300'
                    : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
                {liked ? '응원 완료! ❤️' : '응원 하트 보내기'}
              </button>
            </div>
          )}

          {/* Send Whisper Note Section */}
          {!isSelf && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  💌 따뜻한 응원 쪽지 남기기
                </span>
                <button
                  type="button"
                  onClick={handleTranslateNote}
                  disabled={!noteText.trim() || isTranslating}
                  className="text-[11px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-40"
                >
                  {isTranslating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Languages className="w-3 h-3" />
                  )}
                  AI 번역
                </button>
              </div>

              <div className="relative">
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="친절하고 따뜻한 격려의 말을 전해보세요~ (외국어 자동번역 가능)"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none text-slate-800"
                  maxLength={150}
                />
              </div>

              {previewTranslation && (
                <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 leading-relaxed">
                  <div className="font-semibold text-indigo-700 flex items-center gap-1 mb-0.5">
                    <Languages className="w-3 h-3" /> 번역 미리보기
                  </div>
                  {previewTranslation}
                </div>
              )}

              {isSent ? (
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 쪽지가 전달되었습니다!
                </div>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!noteText.trim()}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" /> 쪽지 보내기
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
