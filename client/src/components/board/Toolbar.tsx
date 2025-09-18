import * as React from 'react';
import {
  Plus,
  Link2,
  Save,
  Download,
  Upload,
  RefreshCcw,
  ZoomIn,
  ZoomOut,
  LayoutGrid,
  LifeBuoy,
  Target,
  Activity,
} from 'lucide-react';
import Button from '../ui/Button';

const DEPARTMENTS = ['All', 'Production', 'Finance', 'Warehouse', 'Logistics', 'QA', 'Operations', 'Others'];

type ToolbarProps = {
  filter: string;
  linkMode: boolean;
  snapToGrid: boolean;
  perfMode: boolean;
  onAddCard: () => void;
  onToggleLinkMode: () => void;
  onSave: () => void;
  onExport: () => string;
  onImport: (payload: string) => void;
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onArrange: () => void;
  onFilterChange: (value: string) => void;
  onToggleSnap: () => void;
  onTogglePerf: () => void;
  onShowHelp: () => void;
};

function downloadJSON(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function Toolbar({
  filter,
  linkMode,
  snapToGrid,
  perfMode,
  onAddCard,
  onToggleLinkMode,
  onSave,
  onExport,
  onImport,
  onReset,
  onZoomIn,
  onZoomOut,
  onArrange,
  onFilterChange,
  onToggleSnap,
  onTogglePerf,
  onShowHelp,
}: ToolbarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      onImport(text);
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const payload = onExport();
    downloadJSON(`board-export-${Date.now()}.json`, payload);
  };

  return (
    <div className="board-toolbar-shadow flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" className="h-9 px-3 text-sm shadow-sm" onClick={onAddCard}>
          <span className="inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            Add Card
          </span>
        </Button>
        <Button
          variant={linkMode ? 'secondary' : 'ghost'}
          size="sm"
          className={`h-9 px-3 text-sm ${linkMode ? 'bg-primary-100 text-primary-600' : 'text-gray-600'}`}
          onClick={onToggleLinkMode}
          aria-pressed={linkMode}
        >
          <span className="inline-flex items-center gap-1.5">
            <Link2 className="h-4 w-4" />
            Link Mode
          </span>
        </Button>
        <Button variant="ghost" size="sm" className="h-9 px-3 text-sm text-gray-600" onClick={onSave}>
          <span className="inline-flex items-center gap-1.5">
            <Save className="h-4 w-4" />
            Save Layout
          </span>
        </Button>
        <Button variant="ghost" size="sm" className="h-9 px-3 text-sm text-gray-600" onClick={handleExport}>
          <span className="inline-flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            Export JSON
          </span>
        </Button>
        <Button variant="ghost" size="sm" className="h-9 px-3 text-sm text-gray-600" onClick={handleImportClick}>
          <span className="inline-flex items-center gap-1.5">
            <Upload className="h-4 w-4" />
            Import JSON
          </span>
        </Button>
        <Button variant="ghost" size="sm" className="h-9 px-3 text-sm text-gray-600" onClick={onReset}>
          <span className="inline-flex items-center gap-1.5">
            <RefreshCcw className="h-4 w-4" />
            Reset to Seed
          </span>
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <Target className="h-4 w-4 text-gray-400" />
            Filter
          </span>
          <select
            className="border-0 bg-transparent text-gray-800 focus:outline-none"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 px-3 text-sm ${snapToGrid ? 'text-primary-600' : 'text-gray-600'}`}
          onClick={onToggleSnap}
          aria-pressed={snapToGrid}
        >
          <span className="inline-flex items-center gap-1.5">
            <LayoutGrid className="h-4 w-4" />
            Snap
          </span>
        </Button>
        <Button
          variant={perfMode ? 'secondary' : 'ghost'}
          size="sm"
          className={`h-9 px-3 text-sm ${perfMode ? 'bg-emerald-100 text-emerald-600' : 'text-gray-600'}`}
          onClick={onTogglePerf}
          aria-pressed={perfMode}
        >
          <span className="inline-flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            Perf Mode
          </span>
        </Button>
        <Button variant="ghost" size="sm" className="h-9 px-3 text-sm text-gray-600" onClick={onZoomIn}>
          <span className="inline-flex items-center gap-1.5">
            <ZoomIn className="h-4 w-4" />
            Zoom In
          </span>
        </Button>
        <Button variant="ghost" size="sm" className="h-9 px-3 text-sm text-gray-600" onClick={onZoomOut}>
          <span className="inline-flex items-center gap-1.5">
            <ZoomOut className="h-4 w-4" />
            Zoom Out
          </span>
        </Button>
        <Button variant="ghost" size="sm" className="h-9 px-3 text-sm text-gray-600" onClick={onArrange}>
          <span className="inline-flex items-center gap-1.5">
            Arrange
          </span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-sm text-gray-600"
          onClick={onShowHelp}
        >
          <span className="inline-flex items-center gap-1.5">
            <LifeBuoy className="h-4 w-4" />
            Help
          </span>
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default Toolbar;
