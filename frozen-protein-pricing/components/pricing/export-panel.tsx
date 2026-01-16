'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { PDFPreview } from '../export/pdf-preview';
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
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
  const { toast } = useToast();

  // Sanitize zone name for filename
  const sanitizeZoneName = (name: string): string => {
    return name
      .replace(/[^a-zA-Z0-9-_\s]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/^\.+/, '') // Remove leading dots
      .slice(0, 50); // Max 50 chars
  };

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
      a.download = `price-sheet-${sanitizeZoneName(zoneName)}-${Date.now()}.xlsx`;
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

  const handlePDFExport = async () => {
    setIsExportingPDF(true);

    try {
      const params = new URLSearchParams({
        priceSheetId,
        ...(selectedOnly && selectedProductIds.length > 0
          ? { productIds: selectedProductIds.join(',') }
          : {}),
      });

      const response = await fetch(`/api/export/pdf?${params}`);

      if (!response.ok) {
        throw new Error('PDF export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `price-sheet-${sanitizeZoneName(zoneName)}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: 'PDF file has been downloaded',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to generate PDF file',
        variant: 'destructive',
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleBothExports = async () => {
    // Prevent concurrent operations
    if (isExportingExcel || isExportingPDF) {
      toast({
        title: 'Export in Progress',
        description: 'Please wait for current export to complete',
        variant: 'destructive',
      });
      return;
    }

    setIsExportingExcel(true);
    setIsExportingPDF(true);

    // Execute both exports concurrently with progress tracking
    const results = await Promise.allSettled([
      handleExcelExportInternal(),
      handlePDFExportInternal(),
    ]);

    const failures = results.filter(r => r.status === 'rejected');
    const successes = results.filter(r => r.status === 'fulfilled');

    if (failures.length === 2) {
      toast({
        title: 'Export Failed',
        description: 'Both exports failed. Please try again.',
        variant: 'destructive',
      });
    } else if (failures.length === 1) {
      toast({
        title: 'Partial Success',
        description: `${successes.length} of 2 exports completed successfully.`,
      });
    } else {
      toast({
        title: 'Export Successful',
        description: 'Excel and PDF files have been downloaded',
      });
    }

    setIsExportingExcel(false);
    setIsExportingPDF(false);
  };

  // Internal handlers without state management for concurrent execution
  const handleExcelExportInternal = async () => {
    const response = await fetch('/api/export/excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceSheetId,
        productIds: selectedOnly ? selectedProductIds : undefined,
      }),
    });

    if (!response.ok) throw new Error('Excel export failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price-sheet-${sanitizeZoneName(zoneName)}-${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handlePDFExportInternal = async () => {
    const params = new URLSearchParams({
      priceSheetId,
      ...(selectedOnly && selectedProductIds.length > 0
        ? { productIds: selectedProductIds.join(',') }
        : {}),
    });

    const response = await fetch(`/api/export/pdf?${params}`);

    if (!response.ok) throw new Error('PDF export failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price-sheet-${sanitizeZoneName(zoneName)}-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
              variant="outline"
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              Preview PDF
            </Button>

            <Button
              onClick={handleBothExports}
              disabled={isExportingExcel || isExportingPDF}
              variant="secondary"
              className="w-full"
            >
              {isExportingExcel || isExportingPDF ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
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
