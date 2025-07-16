// src/components/dashboard/view-actions.tsx
"use client";

import React, { useState } from 'react';
import ReactToPrint, { useReactToPrint } from 'react-to-print';
import screenfull from 'screenfull';
import { Button } from '@/components/ui/button';
import { Expand, Minimize, Printer } from 'lucide-react';

interface ViewActionsProps {
  contentRef: React.RefObject<HTMLElement>;
}

export function ViewActions({ contentRef }: ViewActionsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    if (screenfull.isEnabled && contentRef.current) {
      screenfull.toggle(contentRef.current);
    }
  };
  
  // Listener for fullscreen change
  React.useEffect(() => {
    const changeHandler = () => {
      if (screenfull.isEnabled) {
        setIsFullscreen(screenfull.isFullscreen);
      }
    };

    if (screenfull.isEnabled) {
      screenfull.on('change', changeHandler);
    }

    return () => {
      if (screenfull.isEnabled) {
        screenfull.off('change', changeHandler);
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-2 no-print">
       <ReactToPrint
        trigger={() => (
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir/PDF
          </Button>
        )}
        content={() => contentRef.current}
        documentTitle='Project View'
        pageStyle={`
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
        `}
      />
      <Button variant="outline" size="sm" onClick={handleFullscreen}>
        {isFullscreen ? <Minimize className="mr-2 h-4 w-4" /> : <Expand className="mr-2 h-4 w-4" />}
        {isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
      </Button>
    </div>
  );
}
