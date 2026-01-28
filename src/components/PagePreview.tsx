import type { ContentPage, BinderType, PaperSize, PageSide } from '../types';
import { PAPER_SIZES } from '../types';
import { BINDER_SPECS } from '../services/binderSpecs';

interface PagePreviewProps {
  pages: ContentPage[];
  binderType: BinderType;
  paperSize: PaperSize;
  enablePadding: boolean;
  selectedIndex: number | null;
  onSelectPage: (index: number) => void;
  onRemovePage: (index: number) => void;
  onPageSideChange: (index: number, pageSide: PageSide) => void;
}

const THUMBNAIL_SCALE = 0.5; // Scale for thumbnails (pixels per mm)

export const PagePreview = ({
  pages,
  binderType,
  paperSize,
  enablePadding,
  selectedIndex,
  onSelectPage,
  onRemovePage,
  onPageSideChange,
}: PagePreviewProps) => {
  const paper = PAPER_SIZES[paperSize];

  const thumbWidth = paper.width * THUMBNAIL_SCALE;
  const thumbHeight = paper.height * THUMBNAIL_SCALE;

  if (pages.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No pages to preview</p>
        <p className="text-sm mt-1">Upload files to see preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">
          Pages ({pages.length})
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {pages.map((page, index) => (
          <PageThumbnail
            key={page.id}
            page={page}
            index={index}
            binderType={binderType}
            paperSize={paperSize}
            enablePadding={enablePadding}
            isSelected={selectedIndex === index}
            thumbWidth={thumbWidth}
            thumbHeight={thumbHeight}
            onSelect={() => onSelectPage(index)}
            onRemove={() => onRemovePage(index)}
            onPageSideChange={(pageSide) => onPageSideChange(index, pageSide)}
          />
        ))}
      </div>
    </div>
  );
};

interface PageThumbnailProps {
  page: ContentPage;
  index: number;
  binderType: BinderType;
  paperSize: PaperSize;
  enablePadding: boolean;
  isSelected: boolean;
  thumbWidth: number;
  thumbHeight: number;
  onSelect: () => void;
  onRemove: () => void;
  onPageSideChange: (pageSide: PageSide) => void;
}

const PageThumbnail = ({
  page,
  index,
  binderType,
  paperSize,
  enablePadding,
  isSelected,
  thumbWidth,
  thumbHeight,
  onSelect,
  onRemove,
  onPageSideChange,
}: PageThumbnailProps) => {
  const spec = BINDER_SPECS[binderType];
  const paper = PAPER_SIZES[paperSize];
  const binderPaper = PAPER_SIZES[spec.paperSize];
  const pageSide = page.pageSide;

  const padding = enablePadding ? 5 : 0;
  const holeMargin = spec.edgeDistance + spec.holeDiameter / 2 + padding;

  // Content area position
  const contentX =
    ((paper.width - binderPaper.width) / 2 + (pageSide === 'right' ? holeMargin : 0)) * THUMBNAIL_SCALE;
  const contentY = ((paper.height - binderPaper.height) / 2) * THUMBNAIL_SCALE;
  const contentWidth = (binderPaper.width - holeMargin) * THUMBNAIL_SCALE;
  const contentHeight = binderPaper.height * THUMBNAIL_SCALE;

  // Image dimensions
  const imgWidthMm = (page.originalWidth / 150) * 25.4;
  const imgHeightMm = (page.originalHeight / 150) * 25.4;
  const { position } = page;

  return (
    <div
      className={`
        relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
      `}
      onClick={onSelect}
    >
      {/* Page number badge */}
      <div className="absolute top-1 left-1 z-10 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
        {index + 1}
      </div>

      {/* Page side toggle */}
      <div
        className="absolute top-1 left-7 z-10 flex"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onPageSideChange('left')}
          className={`
            px-1.5 py-0.5 text-xs font-medium rounded-l border transition-all
            ${pageSide === 'left'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white/80 text-gray-600 border-gray-300 hover:bg-gray-100'}
          `}
          title="Left page (holes on right)"
        >
          L
        </button>
        <button
          onClick={() => onPageSideChange('right')}
          className={`
            px-1.5 py-0.5 text-xs font-medium rounded-r border-t border-r border-b transition-all
            ${pageSide === 'right'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white/80 text-gray-600 border-gray-300 hover:bg-gray-100'}
          `}
          title="Right page (holes on left)"
        >
          R
        </button>
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-1 right-1 z-10 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Thumbnail preview */}
      <div
        className="relative bg-white"
        style={{ width: thumbWidth, height: thumbHeight }}
      >
        {/* Binder page outline */}
        {paperSize !== spec.paperSize && (
          <div
            className="absolute border border-dashed border-blue-200"
            style={{
              left: ((paper.width - binderPaper.width) / 2) * THUMBNAIL_SCALE,
              top: ((paper.height - binderPaper.height) / 2) * THUMBNAIL_SCALE,
              width: binderPaper.width * THUMBNAIL_SCALE,
              height: binderPaper.height * THUMBNAIL_SCALE,
            }}
          />
        )}

        {/* Content area */}
        <div
          className="absolute bg-gray-50 border border-gray-200"
          style={{
            left: contentX,
            top: contentY,
            width: contentWidth,
            height: contentHeight,
          }}
        />

        {/* Image */}
        <div
          className="absolute overflow-hidden"
          style={{
            left: contentX,
            top: contentY,
            width: contentWidth,
            height: contentHeight,
          }}
        >
          <img
            src={page.dataUrl}
            alt={`Page ${index + 1}`}
            className="object-cover"
            style={{
              position: 'absolute',
              left: position.x * THUMBNAIL_SCALE,
              top: position.y * THUMBNAIL_SCALE,
              width: imgWidthMm * position.scale * THUMBNAIL_SCALE,
              height: imgHeightMm * position.scale * THUMBNAIL_SCALE,
            }}
          />
        </div>

        {/* Hole indicators */}
        <HoleIndicators
          binderType={binderType}
          paperSize={paperSize}
          pageSide={pageSide}
        />
      </div>

      {/* Edit indicator */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-white text-xs text-center">Click to edit position</p>
      </div>
    </div>
  );
};

interface HoleIndicatorsProps {
  binderType: BinderType;
  paperSize: PaperSize;
  pageSide: PageSide;
}

const HoleIndicators = ({ binderType, paperSize, pageSide }: HoleIndicatorsProps) => {
  const spec = BINDER_SPECS[binderType];
  const paper = PAPER_SIZES[paperSize];
  const binderPaper = PAPER_SIZES[spec.paperSize];

  const holePositions = spec.getHolePositions(binderPaper.height);
  const holeX =
    pageSide === 'left'
      ? ((paper.width - binderPaper.width) / 2 + binderPaper.width - spec.edgeDistance) * THUMBNAIL_SCALE
      : ((paper.width - binderPaper.width) / 2 + spec.edgeDistance) * THUMBNAIL_SCALE;

  const holeSize = spec.holeDiameter * THUMBNAIL_SCALE;

  return (
    <>
      {holePositions.map((posY, i) => (
        <div
          key={i}
          className="absolute rounded-full border border-gray-400 bg-gray-100"
          style={{
            left: holeX - holeSize / 2,
            top: ((paper.height - binderPaper.height) / 2 + posY) * THUMBNAIL_SCALE - holeSize / 2,
            width: holeSize,
            height: holeSize,
          }}
        />
      ))}
    </>
  );
};
