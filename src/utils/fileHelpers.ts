import { StudyAttachment } from '../types';

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsDataURL(file);
  });
}

export async function processSelectedFiles(files: FileList | File[]): Promise<StudyAttachment[]> {
  const attachments: StudyAttachment[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Limit to 20MB per file
    if (file.size > 20 * 1024 * 1024) {
      alert(`File "${file.name}" exceeds the 20MB limit.`);
      continue;
    }

    try {
      const dataUrl = await readFileAsBase64(file);
      const isImage = file.type.startsWith('image/');

      attachments.push({
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        data: dataUrl,
        previewUrl: isImage ? dataUrl : undefined
      });
    } catch (err) {
      console.error('Failed to read file:', file.name, err);
    }
  }

  return attachments;
}
