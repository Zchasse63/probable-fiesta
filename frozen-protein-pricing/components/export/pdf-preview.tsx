'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PDFPreviewProps {
  priceSheetId: string;
  zoneName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PDFPreview({ priceSheetId, zoneName, isOpen, onClose }: PDFPreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Load PDF blob when dialog opens
  useEffect(() => {
    if (!isOpen) {
      // Clean up blob URL when dialog closes
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      return;
    }

    // Generate PDF preview on client side (safer than iframe with API endpoint)
    const loadPDF = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/export/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceSheetId }),
        });

        if (!response.ok) {
          throw new Error('PDF generation failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load PDF preview. Please try downloading instead.',
          variant: 'destructive',
        });
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [isOpen, priceSheetId, toast, onClose, pdfUrl]);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      // Reuse existing blob if available
      if (pdfUrl) {
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = `price-sheet-${zoneName}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast({
          title: 'Success',
          description: 'PDF downloaded successfully',
        });
      } else {
        throw new Error('PDF not loaded');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Price Sheet Preview - {zoneName}</span>
            <Button
              onClick={handleDownload}
              disabled={isDownloading || !pdfUrl}
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm text-muted-foreground">Generating PDF preview...</p>
            </div>
          ) : pdfUrl ? (
            <object
              data={pdfUrl}
              type="application/pdf"
              className="w-full h-full"
            >
              <p className="text-center text-muted-foreground">
                PDF preview not supported. Please download the file instead.
              </p>
            </object>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
