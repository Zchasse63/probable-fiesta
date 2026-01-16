/**
 * Customer Import Modal Component
 * CSV/Excel file upload with column mapping and validation
 * Phase 3: Customer Management & Geocoding
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, CheckCircle, XCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  parseCustomerFile,
  mapColumns,
  autoDetectColumns,
  validateCustomers,
} from '@/lib/utils/customer-parser';
import type { Insert } from '@/lib/supabase/types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResult {
  row: number;
  errors: ValidationError[];
}

// Available customer schema fields for mapping
const CUSTOMER_FIELDS = [
  { value: '', label: 'Skip Column' },
  { value: 'company_name', label: 'Company Name *' },
  { value: 'address', label: 'Address *' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'zip', label: 'ZIP Code' },
  { value: 'customer_type', label: 'Customer Type' },
  { value: 'contact_name', label: 'Contact Name' },
  { value: 'contact_email', label: 'Contact Email' },
  { value: 'contact_phone', label: 'Contact Phone' },
  { value: 'notes', label: 'Notes' },
];

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<(string | number | null)[][] | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [mappedCustomers, setMappedCustomers] = useState<Partial<Insert<'customers'>>[]>([]);
  const [validationResults, setValidationResults] = useState<{
    valid: Insert<'customers'>[];
    invalid: ValidationResult[];
  } | null>(null);
  const [shouldGeocode, setShouldGeocode] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  // Parse file when selected
  const handleFile = useCallback(async (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    const validExtensions = ['.xlsx', '.xls', '.csv'];

    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidType && !hasValidExtension) {
      toast.error('Invalid file format. Please upload .xlsx, .xls, or .csv files only.');
      return;
    }

    setSelectedFile(file);

    try {
      const data = await parseCustomerFile(file);

      if (data.length === 0) {
        toast.error('File is empty');
        return;
      }

      setFileData(data);

      // Auto-detect column mappings
      const headers = data[0];
      const headerValues = Object.values(headers);
      const detectedMapping = autoDetectColumns(headerValues);
      setColumnMapping(detectedMapping);

      toast.success(`File loaded with ${data.length - 1} rows`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to parse file');
      setSelectedFile(null);
      setFileData(null);
    }
  }, []);

  // Update mapped customers when mapping changes
  useEffect(() => {
    if (fileData && Object.keys(columnMapping).length > 0) {
      const customers = mapColumns(fileData, columnMapping);
      setMappedCustomers(customers);

      // Validate customers
      const results = validateCustomers(customers);
      setValidationResults(results);
    }
  }, [fileData, columnMapping]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleMappingChange = (fileColumn: string, schemaField: string) => {
    setColumnMapping((prev) => {
      const newMapping = { ...prev };

      if (schemaField === '') {
        // Remove mapping if "Skip Column" selected
        delete newMapping[fileColumn];
      } else {
        newMapping[fileColumn] = schemaField;
      }

      return newMapping;
    });
  };

  const handleImport = async () => {
    if (!validationResults) {
      toast.error('No data to import');
      return;
    }

    if (validationResults.valid.length === 0) {
      toast.error('No valid customers to import');
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: validationResults.valid.length });

    try {
      const response = await fetch('/api/customers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customers: validationResults.valid,
          shouldGeocode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      const result = await response.json();

      toast.success(
        `Successfully imported ${result.imported} customer(s)${
          result.failed > 0 ? `, ${result.failed} failed` : ''
        }`
      );

      // Reset state and close modal
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setFileData(null);
    setColumnMapping({});
    setMappedCustomers([]);
    setValidationResults(null);
    setShouldGeocode(false);
    setImportProgress({ current: 0, total: 0 });
    onClose();
  };

  const getValidationStatus = (rowIndex: number) => {
    if (!validationResults) return null;

    const invalidResult = validationResults.invalid.find((inv) => inv.row === rowIndex + 2);

    if (invalidResult) {
      return {
        valid: false,
        errors: invalidResult.errors,
      };
    }

    return {
      valid: true,
      errors: [],
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Import Customers</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* File Upload */}
            {!fileData && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-lg p-12
                  transition-colors cursor-pointer
                  ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 bg-white'
                  }
                `}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="flex flex-col items-center justify-center space-y-4">
                  <Upload
                    className={`h-16 w-16 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
                  />

                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-700">
                      Drop your CSV or Excel file here
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      or click to browse (.csv, .xlsx, .xls)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Column Mapping */}
            {fileData && fileData.length > 0 && (
              <div className="space-y-6">
                {/* File Info */}
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile?.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {fileData.length - 1} rows detected
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFileData(null);
                      setSelectedFile(null);
                      setColumnMapping({});
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                {/* Column Mapping Interface */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Map Columns</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {fileData[0].map((header: string | number | null, index: number) => {
                      const headerStr = header?.toString() || `Column ${index + 1}`;
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {headerStr}
                            </label>
                          </div>
                          <div className="flex-1">
                            <select
                              value={columnMapping[headerStr] || ''}
                              onChange={(e) => handleMappingChange(headerStr, e.target.value)}
                              className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                              {CUSTOMER_FIELDS.map((field) => (
                                <option key={field.value} value={field.value}>
                                  {field.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Preview Table */}
                {mappedCustomers.length > 0 && validationResults && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        Preview (first 10 rows)
                      </h3>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-gray-600">
                            {validationResults.valid.length} valid
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span className="text-gray-600">
                            {validationResults.invalid.length} invalid
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 border-b">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">
                                Status
                              </th>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">
                                Company
                              </th>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">
                                Address
                              </th>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">
                                City
                              </th>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">
                                State
                              </th>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">
                                ZIP
                              </th>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">
                                Contact
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {mappedCustomers.slice(0, 10).map((customer, index) => {
                              const status = getValidationStatus(index);
                              return (
                                <tr
                                  key={index}
                                  className={`hover:bg-gray-50 ${
                                    !status?.valid ? 'bg-red-50' : ''
                                  }`}
                                >
                                  <td className="px-4 py-2">
                                    {status?.valid ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <div className="relative group">
                                        <XCircle className="h-4 w-4 text-red-500 cursor-help" />
                                        {status?.errors && status.errors.length > 0 && (
                                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                                            {status.errors.map((err, i) => (
                                              <div key={i} className="mb-1 last:mb-0">
                                                <span className="font-medium">{err.field}:</span>{' '}
                                                {err.message}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-2">{customer.company_name || '—'}</td>
                                  <td className="px-4 py-2">{customer.address || '—'}</td>
                                  <td className="px-4 py-2">{customer.city || '—'}</td>
                                  <td className="px-4 py-2">{customer.state || '—'}</td>
                                  <td className="px-4 py-2">{customer.zip || '—'}</td>
                                  <td className="px-4 py-2">
                                    {customer.contact_name || customer.contact_email || '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {mappedCustomers.length > 10 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Showing 10 of {mappedCustomers.length} rows
                      </p>
                    )}
                  </div>
                )}

                {/* Geocode Option */}
                {validationResults && validationResults.valid.length > 0 && (
                  <div className="flex items-center gap-2 bg-blue-50 px-4 py-3 rounded-lg">
                    <input
                      type="checkbox"
                      id="geocode-all"
                      checked={shouldGeocode}
                      onChange={(e) => setShouldGeocode(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="geocode-all" className="text-sm text-gray-700">
                      Geocode all addresses during import (may take longer)
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Import Progress */}
            {isImporting && (
              <div className="bg-blue-50 px-4 py-3 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Importing {importProgress.current} of {importProgress.total}...
                </p>
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{
                      width: `${
                        importProgress.total > 0
                          ? (importProgress.current / importProgress.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <button
              onClick={handleClose}
              disabled={isImporting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            {validationResults && validationResults.valid.length > 0 && (
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting
                  ? 'Importing...'
                  : `Import ${validationResults.valid.length} Customer(s)`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
