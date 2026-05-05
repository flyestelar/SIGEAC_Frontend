"use client";

import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useRef } from "react";

interface QRGeneratorProps {
  value: string;
  fileName?: string;
  bgColor?: string;
  fgColor?: string;
  size?: number;
  showLink?: boolean;
  showDownloadButton?: boolean;
}

export default function QRGenerator({
  value,
  fileName = "qr-code",
  bgColor = "#ffffff",
  fgColor = "#000000",
  size = 200,
  showLink = false,
  showDownloadButton = false,
}: QRGeneratorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const canvas = wrapperRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={wrapperRef}>
        <QRCodeCanvas
          value={value}
          size={size}
          bgColor={bgColor}
          fgColor={fgColor}
          level="H"
        />
      </div>

      {showLink && (
        <p className="text-xs text-muted-foreground text-center break-all max-w-[240px]">
          {value}
        </p>
      )}

      {showDownloadButton && (
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Descargar
        </Button>
      )}
    </div>
  );
}
