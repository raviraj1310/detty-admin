"use client";

import { QRCodeCanvas } from "qrcode.react";

export default function QRCodeGenerator({ value }) {
  return (
    <div>
      <QRCodeCanvas value={value} size={100} />
    </div>
  );
}
