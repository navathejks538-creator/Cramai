import React from 'react';
import { Paperclip, Image as ImageIcon, FileText, X } from 'lucide-react';
import { StudyAttachment } from '../types';

interface ActiveContextCardProps {
  attachment: StudyAttachment;
  onRemove: () => void;
  onPreviewImage?: (url: string, name: string) => void;
}

export const ActiveContextCard: React.FC<ActiveContextCardProps> = ({
  attachment,
  onRemove,
  onPreviewImage
}) => {
  const isImage = attachment.mimeType.startsWith('image/') || !!attachment.previewUrl;
  const isPasted = attachment.sourceType === 'pasted' || attachment.name.toLowerCase().includes('pasted');

  const getIcon = () => {
    if (isImage) {
      return <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />;
    }
    if (isPasted) {
      return <FileText className="w-3.5 h-3.5 text-amber-600" />;
    }
    return <Paperclip className="w-3.5 h-3.5 text-emerald-600" />;
  };

  const getLabel = () => {
    if (isImage) return 'Using this image';
    if (isPasted) return 'Using this material';
    return 'Using this study material';
  };

  return (
    <div
      id="active-material-context-card"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-xs max-w-full animate-in fade-in"
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="shrink-0">{getIcon()}</span>
        <span
          className={`font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-[200px] ${
            isImage && attachment.previewUrl && onPreviewImage ? 'cursor-pointer hover:underline text-indigo-700' : ''
          }`}
          onClick={() => {
            if (isImage && attachment.previewUrl && onPreviewImage) {
              onPreviewImage(attachment.previewUrl, attachment.name);
            }
          }}
          title={attachment.name}
        >
          {attachment.name}
        </span>
        <span className="text-slate-400 text-[11px] hidden xs:inline">•</span>
        <span className="text-slate-500 text-[11px] font-medium hidden sm:inline whitespace-nowrap">
          {getLabel()}
        </span>
      </div>

      <button
        type="button"
        id="remove-active-material-btn"
        onClick={onRemove}
        className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-1.5 py-0.5 rounded-md transition-colors shrink-0 cursor-pointer ml-1"
        title="Remove material from context (conversation remains active)"
      >
        <span>Remove</span>
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
