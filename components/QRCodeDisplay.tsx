'use client';

import { QRCodeCanvas } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export default function QRCodeDisplay({ value, size = 128 }: QRCodeDisplayProps) {
  return (
    <div className="mt-4">
      <p className="mb-2">QR Code: <strong>{value}</strong></p>
      <QRCodeCanvas value={value} size={size} />
    </div>
  );
}