// src/components/dashboard/view-actions.tsx
"use client";

import React, { useState } from 'react';
import screenfull from 'screenfull';
import { Button } from '@/components/ui/button';
import { Expand, Minimize, Printer } from 'lucide-react';

interface ViewActionsProps {
  contentRef: React.RefObject<HTMLElement>;
}

export function ViewActions({ contentRef }: ViewActionsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePrint = () => {
    const printableElement = contentRef.current;
    if (printableElement) {
        // Find the specific printable content inside the ref
        const printableContent = printableElement.querySelector('.printable-content');
        if (!printableContent) {
            console.error("Printable content not found.");
            return;
        }

        const originalContents = document.body.innerHTML;
        const printContents = printableContent.innerHTML;

        // Temporarily hide the original body content
        Array.from(document.body.children).forEach(child => {
            (child as HTMLElement).style.display = 'none';
        });

        // Create a temporary container for printing
        const printContainer = document.createElement('div');
        printContainer.innerHTML = printContents;
        document.body.appendChild(printContainer);

        window.print();

        // Restore the original body
        document.body.removeChild(printContainer);
        Array.from(document.body.children).forEach(child => {
            (child as HTMLElement).style.display = '';
        });
    }
  };

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
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="mr-2 h-4 w-4" />
        Imprimir/PDF
      </Button>
      <Button variant="outline" size="sm" onClick={handleFullscreen}>
        {isFullscreen ? <Minimize className="mr-2 h-4 w-4" /> : <Expand className="mr-2 h-4 w-4" />}
        {isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
      </Button>
    </div>
  );
}
