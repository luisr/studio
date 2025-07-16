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
      // Temporariamente adiciona uma classe ao body para impressão
      document.body.classList.add('printing');
      
      // Armazena o conteúdo original para restaurar depois
      const originalContents = document.body.innerHTML;
      const printContents = printableElement.innerHTML;
      
      // Substitui o corpo do documento pelo conteúdo imprimível
      document.body.innerHTML = printContents;
      
      window.print();
      
      // Restaura o conteúdo original do corpo
      document.body.innerHTML = originalContents;
      // Remove a classe de impressão
      document.body.classList.remove('printing');
       // Recarrega o estado do react, se necessário (um simples reload pode ser mais fácil em alguns casos)
      window.location.reload();
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