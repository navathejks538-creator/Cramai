export type StudyMode =
  | 'simple'
  | 'step_solver'
  | 'deep_concept'
  | 'high_yield'
  | 'socratic'
  | 'exam_traps';

export type AnswerLength = 'short' | 'balanced' | 'detailed';

export interface StudyAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  data: string; // Base64 or data URL
  previewUrl?: string;
  sourceType?: 'image' | 'file' | 'pasted';
  rawText?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  mode?: StudyMode;
  length?: AnswerLength;
  attachments?: StudyAttachment[];
  suggestedFollowUps?: string[];
  keyTakeaways?: string[];
}

export interface StudySession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  mode: StudyMode;
  length?: AnswerLength;
  messages: ChatMessage[];
  activeAttachment?: StudyAttachment | null;
}

export interface AnalyzeRequest {
  prompt: string;
  mode: StudyMode;
  length?: AnswerLength;
  attachments?: {
    name: string;
    mimeType: string;
    data: string;
  }[];
  history?: {
    role: 'user' | 'model';
    text: string;
  }[];
}

export interface AnalyzeResponse {
  reply: string;
  suggestedFollowUps?: string[];
  keyTakeaways?: string[];
}
