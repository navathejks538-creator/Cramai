import React from 'react';
import { X, ZoomIn, Download } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName?: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageName = 'Study Material'
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="image-preview-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="image-preview-modal-container"
        className="relative max-w-4xl max-h-[90vh] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-slate-200">
          <div className="flex items-center gap-2 truncate pr-4">
            <ZoomIn className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-sm font-medium truncate">{imageName}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              download={imageName}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Download Image"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              id="close-preview-modal-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2 flex items-center justify-center bg-slate-950">
          <img
            src={imageUrl}
            alt={imageName}
            className="max-h-[80vh] w-auto object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};
