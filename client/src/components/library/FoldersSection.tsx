import * as React from "react";

/** Folder model (بسيط ومباشر) */
type Folder = {
  id: string;
  name: string;
  filesCount: number;
  size: string; // e.g. "26.40 GB"
};

/** بيانات افتراضية (تقدري تبعتي folders كـ prop لو حبيتي) */
const DEFAULT_FOLDERS: Folder[] = [
  { id: "images", name: "Images", filesCount: 345, size: "26.40 GB" },
  { id: "docs", name: "Documents", filesCount: 130, size: "26.40 GB" },
  { id: "apps", name: "Apps", filesCount: 130, size: "26.40 GB" },
  { id: "downloads", name: "Downloads", filesCount: 345, size: "26.40 GB" },
];

export default function FoldersSection({
  title = "All Folders",
  folders = DEFAULT_FOLDERS,
  onViewAll,
}: {
  title?: string;
  folders?: Folder[];
  onViewAll?: () => void;
}) {
  return (
    <section className="w-full">
      {/* Grid 2x2 (responsive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {folders.map((f) => (
          <FolderCard key={f.id} folder={f} />
        ))}
      </div>
    </section>
  );
}

function FolderCard({ folder }: { folder: Folder }) {
  return (
    <div className="card card-p flex items-center justify-between">
      {/* Left: icon + meta */}
      <div className="flex items-start gap-3">
        <FolderIcon />
        <div>
          <div className="text-sm font-medium text-gray-900">{folder.name}</div>
          <div className="text-xs text-gray-500">{folder.filesCount} Files</div>
        </div>
      </div>

      {/* Right: size + menu */}
      <div className="flex items-center gap-2">
        <div className="text-xs text-gray-600">{folder.size}</div>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-50 text-gray-500"
          aria-label="More"
        >
          <KebabIcon />
        </button>
      </div>
    </div>
  );
}

/** أيقونة مجلد بسيطة (SVG) */
function FolderIcon() {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-50">
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-yellow-500"
        fill="currentColor"
      >
        <path d="M10.4 5.2l1.3 1.3c.3.3.7.5 1.1.5H19c1.1 0 2 .9 2 2v7.8c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7.2c0-1.1.9-2 2-2h3.6c.4 0 .8.2 1.1.5z" />
      </svg>
    </span>
  );
}

/** أيقونة قائمة ثلاث نقاط (kebab) */
function KebabIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="6" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="18" r="1.5" />
    </svg>
  );
}