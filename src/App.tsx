import { useState, useCallback } from 'react';
import {
  FileUploader,
  BinderSelector,
  PaperSelector,
  MarginToggle,
  ContentPositionEditor,
  PagePreview,
  GenerateButton,
} from './components';
import { processFiles } from './services/contentProcessor';
import { generatePdf } from './services/pdfGenerator';
import type { ContentPage, BinderType, PaperSize, PageSide } from './types';

function App() {
  // State
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [binderType, setBinderType] = useState<BinderType>('a5-20-hole');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [enablePadding, setEnablePadding] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);

  // Handle file upload
  const handleFilesSelected = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    try {
      // Pass current page count so new pages continue the alternating pattern
      const newPages = await processFiles(files, pages.length);
      setPages((prev) => [...prev, ...newPages]);
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Error processing files. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [pages.length]);

  // Handle page removal
  const handleRemovePage = useCallback((index: number) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
    setSelectedPageIndex(null);
    setEditingPageIndex(null);
  }, []);

  // Handle page selection (open position editor)
  const handleSelectPage = useCallback((index: number) => {
    setSelectedPageIndex(index);
    setEditingPageIndex(index);
  }, []);

  // Handle position change
  const handlePositionChange = useCallback(
    (position: ContentPage['position']) => {
      if (editingPageIndex === null) return;

      setPages((prev) =>
        prev.map((page, i) => (i === editingPageIndex ? { ...page, position } : page))
      );
    },
    [editingPageIndex]
  );

  // Handle per-page side change
  const handlePageSideChange = useCallback((index: number, pageSide: PageSide) => {
    setPages((prev) =>
      prev.map((page, i) => (i === index ? { ...page, pageSide } : page))
    );
  }, []);

  // Handle PDF generation
  const handleGenerate = useCallback(async () => {
    if (pages.length === 0) return;

    setIsGenerating(true);
    try {
      const pdfBytes = await generatePdf({
        pages,
        binderType,
        paperSize,
        pageSide: 'left', // This is now unused but kept for type compatibility
        enablePadding,
      });

      // Create blob and download
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `binder-print-${binderType}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [pages, binderType, paperSize, enablePadding]);

  // Clear all pages
  const handleClearAll = useCallback(() => {
    setPages([]);
    setSelectedPageIndex(null);
    setEditingPageIndex(null);
  }, []);

  // Get current page for editor
  const editingPage = editingPageIndex !== null ? pages[editingPageIndex] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Binder Print</h1>
          <p className="text-sm text-gray-600">
            Create duplex-ready PDFs with cutting outlines for binder holes
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Settings */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Settings</h2>

              <BinderSelector value={binderType} onChange={setBinderType} />

              <PaperSelector value={paperSize} onChange={setPaperSize} />

              <MarginToggle value={enablePadding} onChange={setEnablePadding} />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <GenerateButton
                onClick={handleGenerate}
                disabled={pages.length === 0}
                isGenerating={isGenerating}
              />
            </div>
          </div>

          {/* Right column - Upload and Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Upload Content</h2>
                {pages.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <FileUploader onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <PagePreview
                pages={pages}
                binderType={binderType}
                paperSize={paperSize}
                enablePadding={enablePadding}
                selectedIndex={selectedPageIndex}
                onSelectPage={handleSelectPage}
                onRemovePage={handleRemovePage}
                onPageSideChange={handlePageSideChange}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Position Editor Modal */}
      {editingPage && (
        <ContentPositionEditor
          page={editingPage}
          binderType={binderType}
          paperSize={paperSize}
          pageSide={editingPage.pageSide}
          enablePadding={enablePadding}
          onPositionChange={handlePositionChange}
          onClose={() => {
            setEditingPageIndex(null);
            setSelectedPageIndex(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
