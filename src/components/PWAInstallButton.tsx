import React, { useState } from 'react';
import { Download, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  /** 'banner' renders a clean dismissible card; 'compact' renders an inline action button */
  variant?: 'banner' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'banner' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  // Automatically suppress once running as an installed standalone PWA
  if (isInstalled) {
    return null;
  }

  const handleActionClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  const buttonLabel = isInstallable
    ? 'Install App'
    : isIOS
      ? 'Install on iPhone'
      : 'Install App';

  return (
    <>
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={handleActionClick}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl bg-[#157A4B] hover:bg-[#10623B] active:scale-[0.98] text-xs font-semibold text-white transition-all whitespace-nowrap shadow-xs"
        >
          <Download className="w-4 h-4 text-[#FFE07D] shrink-0" aria-hidden="true" />
          <span>{buttonLabel}</span>
        </button>
      ) : !dismissedBanner ? (
        <section
          aria-label="Install Christmas Log on your phone"
          className="rounded-2xl bg-white border border-[#F0DFC8] p-4 shadow-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#C61D2B]/10 text-[#C61D2B] shrink-0">
              <Smartphone className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1D2B24] truncate">
                Install Christmas Log
              </p>
              <p className="text-xs text-[#6B7A71]">
                Add to your home screen for quick offline access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleActionClick}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#157A4B] hover:bg-[#10623B] text-xs font-semibold text-white transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-[#FFE07D]" aria-hidden="true" />
              <span>Install</span>
            </button>
            <button
              type="button"
              onClick={() => setDismissedBanner(true)}
              aria-label="Dismiss install prompt"
              className="inline-flex items-center justify-center min-w-[36px] min-h-[40px] rounded-lg text-[#84725F] hover:text-[#1D2B24]"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      ) : null}

      {/* Guided Mobile Home-Screen Installation Modal (iOS Safari & fallback browsers) */}
      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#181012]/55 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-guide-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGuide(false);
          }}
        >
          <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl border border-[#F0DFC8] shadow-2xl overflow-hidden">
            <div className="h-2 w-full candy-cane-trim" aria-hidden="true" />
            <div className="bg-[#C61D2B] text-white px-5 py-4 flex items-center justify-between">
              <h3 id="pwa-install-guide-title" className="font-serif text-lg font-bold">
                Install Christmas Log
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install instructions"
                className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] -mr-1.5 rounded-xl text-white/85 hover:text-white hover:bg-white/15"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm text-[#35463D]">
              <p className="text-xs text-[#6B7A71]">
                Save Christmas Log to your mobile home screen so it launches full-screen and works offline with your local storage data.
              </p>

              <div className="rounded-xl bg-[#FFF6EC] border border-[#F0DFC8] p-3.5 space-y-2">
                <p className="font-semibold text-[#1D2B24] flex items-center gap-1.5">
                  <Share className="w-4 h-4 text-[#C61D2B]" aria-hidden="true" />
                  <span>iPhone &amp; iPad (Safari)</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-[#47564E]">
                  <li>Tap the <strong>Share</strong> icon in the Safari toolbar.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> to install <strong>Xmas Log</strong>.</li>
                </ol>
              </div>

              <div className="rounded-xl bg-[#F3FBF6] border border-[#CBEAD7] p-3.5 space-y-2">
                <p className="font-semibold text-[#1D2B24] flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#157A4B]" aria-hidden="true" />
                  <span>Android (Chrome / Edge)</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-[#47564E]">
                  <li>Open the browser menu (three dots in the corner).</li>
                  <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full min-h-[46px] rounded-xl bg-[#157A4B] hover:bg-[#10623B] text-sm font-semibold text-white transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-16 md:bottom-5 left-4 z-40 inline-flex items-center gap-2 rounded-xl bg-[#1D2B24] px-3.5 py-2 text-xs font-semibold text-white shadow-lg border border-[#FFE07D]/40"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#FFE07D] shrink-0" aria-hidden="true" />
      <span>Offline mode · Saving to local storage</span>
    </div>
  );
};
