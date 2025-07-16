// src/components/dashboard/project-gallery-modal.tsx
"use client";

import type { Attachment } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { FileText, Download } from "lucide-react";
import { Button } from "../ui/button";

interface ProjectGalleryModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  attachments: Attachment[];
}

export function ProjectGalleryModal({
  isOpen,
  onOpenChange,
  attachments,
}: ProjectGalleryModalProps) {
  const downloadAttachment = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Galeria de Anexos do Projeto</DialogTitle>
          <DialogDescription>
            Visualize todos os arquivos e imagens anexados às tarefas deste projeto.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-hidden -mx-6 px-6">
          <ScrollArea className="h-full pr-4">
            {attachments.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {attachments.map((att) => (
                  <div key={att.id} className="group relative border rounded-lg overflow-hidden shadow-sm">
                    {att.type.startsWith("image/") ? (
                      <Image
                        src={att.url}
                        alt={att.name}
                        width={200}
                        height={200}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-muted flex flex-col items-center justify-center p-4">
                        <FileText className="w-12 h-12 text-muted-foreground" />
                        <p className="mt-2 text-xs text-center text-muted-foreground truncate w-full">{att.name}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/70 flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <div>
                         <h4 className="text-white text-sm font-semibold truncate">{att.name}</h4>
                         <p className="text-xs text-gray-300 truncate">Tarefa: {att.taskName}</p>
                       </div>
                       <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => downloadAttachment(att.url, att.name)}
                          className="w-full"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Baixar
                        </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Nenhum anexo encontrado neste projeto.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
