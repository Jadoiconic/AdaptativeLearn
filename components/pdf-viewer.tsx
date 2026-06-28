'use client';

import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Use CDN worker matching the pdfjs version bundled by react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  height?: number;
}

export default function PdfViewer({ url, height = 560 }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  }, []);

  const onLoadError = useCallback((err: Error) => {
    setLoading(false);
    setError(err.message || 'Could not load PDF');
  }, []);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM19 9.5h-1.5v-1H19v1z" />
          </svg>
          {numPages > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="px-2 py-0.5 text-xs rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                ‹
              </button>
              <span className="text-xs text-slate-600 tabular-nums">
                {page} / {numPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, numPages))}
                disabled={page >= numPages}
                className="px-2 py-0.5 text-xs rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                ›
              </button>
            </div>
          )}
        </div>
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download
        </a>
      </div>

      {/* Document area */}
      <div
        className="overflow-auto bg-slate-200 flex flex-col items-center py-4 gap-2"
        style={{ minHeight: height }}
      >
        {loading && !error && (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Loading PDF…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-600 py-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-sm font-medium text-slate-700">Could not render PDF</p>
            <p className="text-xs text-slate-400 text-center max-w-xs">
              This may be an older upload. Re-upload the file to fix preview, or use the download link.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Open / Download directly →
            </a>
          </div>
        )}

        <Document
          file={url}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading={null}
          error={null}
        >
          {!error && (
            <Page
              pageNumber={page}
              renderTextLayer
              renderAnnotationLayer
              width={700}
              className="shadow-lg"
            />
          )}
        </Document>
      </div>
    </div>
  );
}
