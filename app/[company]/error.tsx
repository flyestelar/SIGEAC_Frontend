'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex items-start justify-center p-10">
      <div className="w-full max-w-lg space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded border border-red-500/30 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-foreground">Algo salió mal</h2>
            <p className="text-xs text-muted-foreground">Ocurrió un error inesperado en esta página</p>
          </div>
        </div>

        {/* Error details */}
        <div className="rounded-lg border bg-background p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Detalles del error
          </p>
          <pre className="mt-2 whitespace-pre-wrap break-all text-xs text-foreground/80 font-mono">
            {error.message || 'No hay información adicional disponible.'}
          </pre>
          {error.digest && <p className="mt-2 text-[10px] text-muted-foreground font-mono">Digest: {error.digest}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button onClick={reset} variant="default" size="sm">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Reintentar
          </Button>
          <Button onClick={() => (window.location.href = '/')} variant="outline" size="sm">
            <Home className="mr-1.5 h-3.5 w-3.5" />
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
