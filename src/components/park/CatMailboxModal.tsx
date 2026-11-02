import React, { useState } from 'react';
import { CatNote } from '../../types/park';
import { Mail, Languages, Loader2, X, Heart, MessageSquare } from 'lucide-react';
import { playSound } from '../../utils/audio';

interface CatMailboxModalProps {
  notes: CatNote[];
  onClose: () => void;
}

export const CatMailboxModal: React.FC<CatMailboxModalProps> = ({ notes, onClose }) => {
  const [translatedMap, setTranslatedMap] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const handleTranslate = async (noteId: string, text: string) => {
    if (translatedMap[noteId]) return;
    setLoadingMap((prev) => ({ ...prev, [noteId]: true }));
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLang: 'ko',
        }),
      });
      const data = await res.json();
      setTranslatedMap((prev) => ({
        ...prev,
        [noteId]: data.translatedText || `[번역] ${text}`,
      }));
      playSound.zenChime();
    } catch {
      setTranslatedMap((prev) => ({
        ...prev,
        [noteId]: `[번역] ${text}`,
      }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [noteId]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-100 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-400 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            <h3 className="font-bold text-base">냥이 우체통</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-medium">
              {notes.length}통
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Note List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {notes.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
              <p className="text-xs">아직 도착한 쪽지가 없습니다.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                광장에서 다른 고양이들에게 먼저 따뜻한 인사를 남겨보세요!
              </p>
            </div>
          ) : (
            notes.map((note) => {
              const isTranslating = !!loadingMap[note.id];
              const translated = translatedMap[note.id];

              return (
                <div
                  key={note.id}
                  className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100/80 hover:bg-amber-50 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {note.senderBreed === 'tuxedo'
                          ? '🎩'
                          : note.senderBreed === 'calico'
                          ? '🌸'
                          : note.senderBreed === 'white'
                          ? '❄️'
                          : '🐾'}
                      </span>
                      <span className="text-xs font-bold text-amber-950">
                        {note.senderName}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(note.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed bg-white/90 p-2.5 rounded-xl border border-amber-100/50">
                    {note.message}
                  </p>

                  {/* AI Translation result */}
                  {translated && (
                    <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 leading-relaxed">
                      <div className="font-semibold text-indigo-700 flex items-center gap-1 mb-0.5">
                        <Languages className="w-3 h-3" /> AI 한국어 번역
                      </div>
                      {translated}
                    </div>
                  )}

                  {/* Action row */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleTranslate(note.id, note.message)}
                      disabled={isTranslating || !!translated}
                      className="px-2.5 py-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 bg-white rounded-lg border border-indigo-100 flex items-center gap-1 shadow-2xs disabled:opacity-50"
                    >
                      {isTranslating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Languages className="w-3 h-3" />
                      )}
                      {translated ? '번역 완료' : '한국어로 번역'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
