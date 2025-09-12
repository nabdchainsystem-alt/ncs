import React from 'react';
import { useArchive } from '../../context/ArchiveContext';
import '../../styles/archive.css';

const PreviewPanel: React.FC = () => {
  const { preview, setPreview } = useArchive();
  if (!preview) return null;
  const [pdf, setPdf] = React.useState<any>(null);
  React.useEffect(()=>{
    import('react-pdf').then((m:any)=> {
      try { m.pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${m.pdfjs.version}/pdf.worker.min.js`; } catch {}
      setPdf(m);
    }).catch(()=>{});
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center" onClick={()=> setPreview(null)}>
      <div className="bg-white rounded-xl border w-[860px] max-w-[95vw] shadow-xl" onClick={(e)=> e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b"><div className="font-semibold">Preview — {preview.name}</div><button className="text-sm border rounded px-2 py-1" onClick={()=> setPreview(null)}>Close</button></div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 border rounded-lg overflow-hidden" style={{ minHeight: 320 }}>
            {preview.type==='image' ? (
              <img src={preview.url || 'https://picsum.photos/800/450'} alt={preview.name} className="w-full h-full object-cover" />
            ) : preview.type==='pdf' && pdf ? (
              <pdf.Document file={preview.url || ''}>
                <pdf.Page pageNumber={1} width={760} />
              </pdf.Document>
            ) : preview.type==='pdf' ? (
              <iframe src={preview.url || 'about:blank'} title="pdf" className="w-full h-[320px]" />
            ) : (
              <div className="w-full h-[320px] grid place-items-center text-gray-500">(No inline preview)</div>
            )}
          </div>
          <div className="meta-panel">
            <div className="text-sm font-semibold mb-2">Metadata</div>
            <div className="text-xs text-gray-700 space-y-1">
              <div><b>Type:</b> {preview.type}</div>
              <div><b>Vendor:</b> {preview.vendor||'—'}</div>
              <div><b>Date:</b> {preview.date}</div>
              <div><b>Size:</b> {preview.size||'—'}</div>
              <div><b>Tags:</b> {(preview.tags||[]).join(', ')||'—'}</div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-2 bg-gray-900 text-white rounded text-sm">Download</button>
              <button className="px-3 py-2 border rounded text-sm">Open Original</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
