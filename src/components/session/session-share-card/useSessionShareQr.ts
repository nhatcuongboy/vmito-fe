import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { SessionShareTemplateId, SessionShareThemeMeta } from './types';

export const useSessionShareQr = ({
  locale,
  sessionId,
  templateId,
  theme,
}: {
  locale: string;
  sessionId: string;
  templateId: SessionShareTemplateId;
  theme: SessionShareThemeMeta;
}) => {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    const url = `${window.location.origin}/${locale}/sessions/${sessionId}`;
    const qrWidth =
      templateId === 'story-vertical'
        ? 180
        : templateId === 'legacy-portrait'
          ? 80
          : 150;

    QRCode.toDataURL(url, {
      margin: 0,
      width: qrWidth,
      color: {
        dark: theme.qr,
        light: '#FFFFFF',
      },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('Error generating QR code:', err));
  }, [locale, sessionId, templateId, theme.qr]);

  return qrDataUrl;
};
