'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { PDFPreview } from './pdf-preview';
import { useToast } from '@/hooks/use-toast';

interface ExportPanelProps {
  priceSheetId: string;
  zoneName: string;
  selectedProductIds?: string[];
}

export function ExportPanel({
  priceSheetId,
  zoneName,
  selectedProductIds = [],
}: ExportPanelProps) {
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
  const { toast } = useToast();

  const handleExcelExport = async () => {
    setIsExportingExcel(true);

    try {
      const response = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceSheetId,
          productIds: selectedOnly ? selectedProductIds : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `price-sheet-${zoneName}-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: 'Excel file has been downloaded',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to generate Excel file',
        variant: 'destructive',
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleBothExports = async () => {
    await handleExcelExport();
    setTimeout(() => {
      const params = selectedOnly && selectedProductIds.length > 0 ? `&productIds=${selectedProductIds.join(',')}` : '';
      const link = document.createElement('a');
      link.href = `/api/export/pdf?priceSheetId=${priceSheetId}${params}`;
      link.download = `price-sheet-${zoneName}-${Date.now()}.pdf`;
      link.click();
    }, 1000);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Export Price Sheet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="selected-only"
              checked={selectedOnly}
              onCheckedChange={(checked) => setSelectedOnly(checked === true)}
              disabled={selectedProductIds.length === 0}
            />
            <Label htmlFor="selected-only">
              Export selected products only
              {selectedProductIds.length > 0 && ` (${selectedProductIds.length} selected)`}
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={handleExcelExport}
              disabled={isExportingExcel}
              className="w-full"
            >
              {isExportingExcel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Download Excel
                </>
              )}
            </Button>

            <Button
              onClick={() => setIsPDFPreviewOpen(true)}
              variant="ghost"
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              Preview PDF
            </Button>

            <Button
              onClick={handleBothExports}
              disabled={isExportingExcel}
              variant="secondary"
              className="w-full"
            >
              {isExportingExcel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  <FileText className="mr-2 h-4 w-4" />
                  Both
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Excel exports include formulas and styling. PDF exports are print-optimized.
          </p>
        </CardContent>
      </Card>

      <PDFPreview
        priceSheetId={priceSheetId}
        zoneName={zoneName}
        isOpen={isPDFPreviewOpen}
        onClose={() => setIsPDFPreviewOpen(false)}
      />
    </>
  );
}
