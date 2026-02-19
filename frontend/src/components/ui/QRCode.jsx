import { useMemo } from 'react';

/**
 * Composant QR Code simple utilisant une API en ligne
 * Pour un usage en production, utiliser une bibliothèque comme qrcode.react
 */
const QRCode = ({ value, size = 150, className = '' }) => {
  const qrCodeUrl = useMemo(() => {
    if (!value) return null;
    // Utiliser une API QR code en ligne (QR Server)
    const encodedValue = encodeURIComponent(value);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}`;
  }, [value, size]);

  if (!value || !qrCodeUrl) {
    return (
      <div 
        className={`bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-slate-500 dark:text-slate-400">Pas de données</span>
      </div>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      <img
        src={qrCodeUrl}
        alt={`QR Code pour ${value}`}
        className="rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
        style={{ width: size, height: size }}
      />
    </div>
  );
};

export default QRCode;

