import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Smartphone, Download, X, CheckCircle, ExternalLink } from 'lucide-react';
import { playSound } from '../../utils/audio';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already running standalone on Android, no need for install button
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>앱 모드로 실행 중</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    playSound.meow();
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
        title="스마트폰에 안드로이드 앱으로 설치하기"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>앱 설치</span>
      </button>

      {/* Android & Mobile App Install Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border-2 border-emerald-200 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl shadow-inner border border-emerald-300">
                🤖
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900">
                  안드로이드 앱(PWA)으로 설치하기
                </h3>
                <p className="text-xs text-stone-500">
                  스마트폰 홈 화면에 아이콘을 생성하고 전체화면 앱으로 즐기세요!
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-stone-700 space-y-2.5">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>안드로이드 (Chrome / 삼성 인터넷) 설치 방법</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed text-stone-600">
                <li>
                  브라우저 상단 또는 하단의 <strong className="text-stone-800">더보기 메뉴(⋮)</strong>를 터치합니다.
                </li>
                <li>
                  <strong className="text-stone-800">'홈 화면에 추가'</strong> 또는 <strong className="text-stone-800">'앱 설치'</strong>를 선택합니다.
                </li>
                <li>
                  스마트폰 바탕화면에 <strong>'냥이투두'</strong> 아이콘이 생성되며, 브라우저 주소창 없는 <strong>순수 전체화면 앱</strong>으로 실행됩니다!
                </li>
              </ol>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-[11px] text-stone-500 space-y-1">
              <span className="font-bold text-stone-700 block">💡 Play 스토어용 실제 APK/AAB 배포</span>
              <span>
                현재 PWA 규격(Manifest, Service Worker, 512px 아이콘)이 모두 갖춰져 있어, Google 공식 <strong>Bubblewrap (TWA)</strong>이나 <strong>PWABuilder</strong>를 통해 그대로 Google Play 스토어 등록용 APK 파일로 패키징할 수 있습니다!
              </span>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors"
              >
                확인 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
