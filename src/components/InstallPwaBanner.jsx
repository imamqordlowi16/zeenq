import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';

export default function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    setIsIOS(isIosDevice);

    // If already installed, do not show
    if (isStandalone) {
      return;
    }

    // Check if user dismissed banner recently
    const dismissedAt = localStorage.getItem('zeenq_pwa_dismissed');
    if (dismissedAt) {
      const daysPassed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysPassed < 3) {
        return; // do not bother user for 3 days
      }
    }

    // Handle Chrome/Android install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If iOS and not standalone, show after a short delay
    if (isIosDevice && !isStandalone) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem('zeenq_pwa_dismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <>
      <div
        className="glass-panel no-print"
        style={{
          position: 'fixed',
          bottom: '72px',
          left: '16px',
          right: '16px',
          maxWidth: '480px',
          margin: '0 auto',
          zIndex: 990,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
          border: '1px solid var(--primary)',
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-emerald))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0
            }}
          >
            <Smartphone size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
              Pasang ZeenQ di HP
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Akses cepat dari layar utama & offline tanpa browser
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleInstallClick}
            className="btn btn-primary btn-sm"
            style={{ padding: '7px 14px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px' }}
          >
            <Download size={14} />
            <span>Pasang</span>
          </button>
          <button
            onClick={handleDismiss}
            title="Tutup ajakan pasang"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* iOS Modal Guide */}
      {showIOSGuide && (
        <div
          className="modal-backdrop"
          onClick={() => setShowIOSGuide(false)}
          style={{ zIndex: 1000 }}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '380px' }}
          >
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Cara Pasang di iPhone/iPad</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowIOSGuide(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
              <p style={{ marginBottom: '14px' }}>
                Untuk memasang aplikasi ZeenQ di iOS (Safari):
              </p>
              <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>1. Ketuk tombol</span>
                  <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Share size={16} style={{ color: 'var(--primary)' }} /> Bagikan (Share)
                  </strong>
                  <span>di bawah browser Safari.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>2. Gulir ke bawah & pilih</span>
                  <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <PlusSquare size={16} style={{ color: 'var(--accent-emerald)' }} /> Tambah ke Layar Utama (Add to Home Screen)
                  </strong>.
                </li>
                <li>3. Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas.</li>
              </ol>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => setShowIOSGuide(false)}
                style={{ width: '100%' }}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
