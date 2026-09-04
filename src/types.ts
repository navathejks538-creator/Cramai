export type StudyMode =
  | 'simple'
  | 'step_solver'
  | 'deep_concept'
  | 'high_yield'
  | 'socratic'
  | 'exam_traps';

export interface StudyAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  data: string; // Base64 or data URL
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  mode?: StudyMode;
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
  messages: ChatMessage[];
}

export interface AnalyzeRequest {
  prompt: string;
  mode: StudyMode;
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
