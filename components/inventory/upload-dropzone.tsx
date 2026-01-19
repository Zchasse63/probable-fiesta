/**
 * Upload Dropzone Component
 * Drag-and-drop Excel file upload with preview
 * Phase 2: Database Schema & Core Data Management
 */

'use client';

import { useState, useCallback } from 'react';
import { Upload, CheckCircle, AlertCircle, XCircle, Edit2 } from 'lucide-react';
import { parseInventoryExcel, ParsedRow } from '@/lib/utils/excel-parser';
import { parsePackSizeSync } from '@/lib/utils/pack-size-parser';
import { toast } from 'sonner';

// Circuit breaker check helper (client-side)
async function isAIAvailable(): Promise<boolean> {
  try {
    const response = await fetch('/api/ai/health', { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

interface UploadDropzoneProps {
  onUploadComplete: (data: ParsedRow[], file: File) => void;
}

export function UploadDropzone({ onUploadComplete }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editingCategory, setEditingCategory] = useState<{ rowIndex: number; value: string } | null>(null);

  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const validExtensions = ['.xlsx', '.xls'];

    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidType && !hasValidExtension) {
      toast.error('Invalid file format. Please upload .xlsx or .xls files only.');
      return false;
    }

    return true;
  };

  const handleFile = useCallback(async (file: File) => {
    if (!validateFile(file)) {
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);
    setProgress(25);

    try {
      // Parse Excel file
      const parsed = await parseInventoryExcel(file);
      setProgress(40);

      // Process pack sizes with AI fallback for unparseable formats
      const unparseableRows = parsed.filter(
        row => row.pack_size && parsePackSizeSync(row.pack_size) === null
      );

      // Check if AI is available before attempting calls
      const aiAvailable = await isAIAvailable();

      if (!aiAvailable && unparseableRows.length > 0) {
        toast.warning(`AI unavailable: ${unparseableRows.length} pack sizes could not be parsed. You can manually enter case weights.`);
      }

      // Call API route for AI pack size parsing (server-side only) if available
      const packSizePromises = aiAvailable ? unparseableRows
        .slice(0, 30) // Limit to avoid rate limits
        .map(async (row) => {
          try {
            const response = await fetch('/api/ai/parse-pack-size', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ packSize: row.pack_size, description: row.description }),
            });
            if (response.ok) {
              const result = await response.json();
              if (result.case_weight_lbs !== null) {
                row.case_weight_lbs = result.case_weight_lbs;
              }
            }
          } catch (err) {
            // AI pack size parsing failed - show user-friendly message once
            if (row === unparseableRows[0]) {
              toast.error('AI pack size parsing failed. Manual entry required for unparseable pack sizes.');
            }
          }
        }) : [];

      await Promise.all(packSizePromises);
      setProgress(55);

      // Auto-categorize products without categories (Phase 5 AI integration)
      const uncategorizedRows = parsed.filter(row => !row.category && row.description);

      if (!aiAvailable && uncategorizedRows.length > 0) {
        toast.info(`AI unavailable: ${uncategorizedRows.length} products need manual categorization.`);
      }

      const categorizePromises = aiAvailable ? uncategorizedRows
        .slice(0, 50) // Limit to first 50 products to avoid rate limits
        .map(async (row) => {
          try {
            const response = await fetch('/api/ai/categorize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ description: row.description }),
            });

            if (response.ok) {
              const result = await response.json();
              row.category = result.category;
              row.ai_suggested = true;
            }
          } catch (err) {
            // AI categorization failed - notify user once
            if (row === uncategorizedRows[0]) {
              toast.warning('AI categorization failed. Manual categorization required.');
            }
          }
        }) : [];

      // Process in batches of 5
      for (let i = 0; i < categorizePromises.length; i += 5) {
        await Promise.all(categorizePromises.slice(i, i + 5));
        setProgress(55 + ((i + 5) / categorizePromises.length) * 30);
      }

      setProgress(90);
      setParsedData(parsed);
      setProgress(100);

      const categorizedCount = parsed.filter(r => r.ai_suggested).length;
      const packSizeParsedCount = parsed.filter(r => r.case_weight_lbs).length;
      toast.success(
        `Parsed ${parsed.length} rows successfully` +
        (categorizedCount > 0 ? ` (${categorizedCount} auto-categorized)` : '') +
        (packSizeParsedCount > 0 ? ` (${packSizeParsedCount} pack sizes parsed by AI)` : '')
      );
      onUploadComplete(parsed, file);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to parse file');
      setSelectedFile(null);
      setParsedData([]);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 500);
    }
  }, [onUploadComplete]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const getValidationIcon = (row: ParsedRow) => {
    // Check for missing required fields
    if (!row.item_code || !row.description || !row.pack_size) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }

    // Check if pack size can be parsed
    const caseWeight = parsePackSizeSync(row.pack_size);
    if (caseWeight === null) {
      return <AlertCircle className="h-4 w-4 text-warning-500" />;
    }

    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-colors cursor-pointer
          ${isDragging
            ? 'border-primary bg-primary-50'
            : 'border-border hover:border-border bg-card'
          }
        `}
      >
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <Upload className={`h-12 w-12 ${isDragging ? 'text-primary' : 'text-muted-foreground/60'}`} />

          <div className="text-center">
            <p className="text-lg font-medium text-foreground/80">
              {isProcessing ? 'Processing...' : 'Drop your Excel file here'}
            </p>
            <p className="text-sm text-muted-foreground/80 mt-1">
              or click to browse (.xlsx, .xls)
            </p>
          </div>

          {selectedFile && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{selectedFile.name}</span>
              <span className="text-muted-foreground/60 ml-2">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}

          {isProcessing && (
            <div className="w-full max-w-xs">
              <div className="h-2 bg-accent rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted px-4 py-2 border-b">
            <h3 className="font-medium text-foreground">
              Preview ({parsedData.length} rows)
            </h3>
            <p className="text-sm text-muted-foreground/80 mt-1">
              Showing first 10 rows
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent border-b">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-foreground/80">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-foreground/80">Item Code</th>
                  <th className="px-4 py-2 text-left font-medium text-foreground/80">Description</th>
                  <th className="px-4 py-2 text-left font-medium text-foreground/80">Pack Size</th>
                  <th className="px-4 py-2 text-left font-medium text-foreground/80">Brand</th>
                  <th className="px-4 py-2 text-left font-medium text-foreground/80">Category</th>
                  <th className="px-4 py-2 text-left font-medium text-foreground/80">Cases</th>
                  <th className="px-4 py-2 text-left font-medium text-foreground/80">Unit Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsedData.slice(0, 10).map((row, index) => (
                  <tr key={index} className="hover:bg-accent">
                    <td className="px-4 py-2">{getValidationIcon(row)}</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.item_code}</td>
                    <td className="px-4 py-2">{row.description}</td>
                    <td className="px-4 py-2">{row.pack_size}</td>
                    <td className="px-4 py-2">{row.brand || '—'}</td>
                    <td className="px-4 py-2">
                      {editingCategory?.rowIndex === index ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingCategory.value}
                            onChange={(e) => setEditingCategory({ rowIndex: index, value: e.target.value })}
                            className="px-2 py-1 text-sm border rounded w-32"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const updated = [...parsedData];
                                updated[index].category = editingCategory.value;
                                updated[index].ai_suggested = false;
                                setParsedData(updated);
                                setEditingCategory(null);
                              } else if (e.key === 'Escape') {
                                setEditingCategory(null);
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              const updated = [...parsedData];
                              updated[index].category = editingCategory.value;
                              updated[index].ai_suggested = false;
                              setParsedData(updated);
                              setEditingCategory(null);
                            }}
                            className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="px-2 py-1 text-xs bg-accent text-foreground/80 rounded hover:bg-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {row.category ? (
                            <span className={row.ai_suggested ? 'text-primary text-xs' : ''}>
                              {row.category}
                              {row.ai_suggested && (
                                <span className="ml-1 px-1.5 py-0.5 bg-primary-100 text-primary rounded text-xs">
                                  AI Suggested
                                </span>
                              )}
                            </span>
                          ) : (
                            '—'
                          )}
                          <button
                            onClick={() => setEditingCategory({ rowIndex: index, value: row.category || '' })}
                            className="p-1 text-muted-foreground/60 hover:text-muted-foreground"
                            title="Edit category"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">{row.cases_available || '—'}</td>
                    <td className="px-4 py-2">
                      {row.unit_cost ? `$${row.unit_cost.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-muted px-4 py-2 border-t flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground/80">Valid</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-warning-500" />
              <span className="text-muted-foreground/80">Pack size unparseable (AI fallback in Phase 5)</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-destructive" />
              <span className="text-muted-foreground/80">Missing required fields</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
