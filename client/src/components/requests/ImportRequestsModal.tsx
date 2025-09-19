import React from 'react';
import { UploadCloud, X } from 'lucide-react';
import Button from '../ui/Button';

type ImportRequestsModalProps = {
  open: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void> | void;
};

export default function ImportRequestsModal({ open, onClose, onImport }: ImportRequestsModalProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setFile(null);
      setError(null);
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open]);

  const acceptFile = React.useCallback((next?: File | null) => {
    if (!next) {
      setFile(null);
      return;
    }
    const lower = next.name.toLowerCase();
    if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
      setError('Please upload an .xlsx file generated from the template.');
      setFile(null);
      return;
    }
    setError(null);
    setFile(next);
  }, []);

  const handleFiles = React.useCallback((list?: FileList | null) => {
    if (!list || list.length === 0) {
      acceptFile(null);
      return;
    }
    acceptFile(list[0]);
  }, [acceptFile]);

  const handleImport = React.useCallback(async () => {
    if (!file) return;
    try {
      setIsImporting(true);
      setError(null);
      await onImport(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsImporting(false);
      setFile(null);
      onClose();
    } catch (err: any) {
      setIsImporting(false);
      setError(err?.message || 'Import failed. Please try again.');
    }
  }, [file, onClose, onImport]);

  const stopIfBusy = React.useCallback(() => {
    if (!isImporting) onClose();
  }, [isImporting, onClose]);

  const onDrop = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isImporting) return;
    handleFiles(event.dataTransfer.files);
  }, [handleFiles, isImporting]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" onClick={stopIfBusy} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="requests-import-title"
        className="relative z-[101] w-[min(520px,96vw)] rounded-2xl border bg-white shadow-card"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="text-base font-semibold" id="requests-import-title">Import Requests</div>
          <button
            type="button"
            aria-label="Close"
            onClick={stopIfBusy}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            disabled={isImporting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 text-sm text-gray-600">
          <div
            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}
            onDrop={onDrop}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center"
          >
            <UploadCloud className="h-9 w-9 text-indigo-500" aria-hidden="true" />
            <div className="text-sm font-semibold text-gray-900">Drop your completed template</div>
            <div className="text-xs text-gray-500">Upload the Purchase Request template (.xlsx)</div>
            <button
              type="button"
              className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              Browse files
            </button>
            {file ? (
              <div className="mt-2 text-xs font-medium text-indigo-600">
                Selected: {file.name}
              </div>
            ) : null}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => handleFiles(event.currentTarget.files)}
            className="sr-only"
          />

          <div className="rounded-xl bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-500">
            <div className="font-semibold text-gray-700">How it works</div>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Download the latest template from the actions menu.</li>
              <li>Fill in request header details and line items.</li>
              <li>Upload the completed sheet here to create requests in bulk.</li>
            </ol>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={stopIfBusy}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleImport}
            disabled={!file || isImporting}
          >
            {isImporting ? 'Importing…' : 'Start Import'}
          </Button>
        </div>
      </div>
    </div>
  );
}
