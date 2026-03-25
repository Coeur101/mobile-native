export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string;
  code: string;
  chatHistory: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AppSettings {
  uiStyle: "light" | "dark" | "auto";
  baseUrl: string;
  apiKey: string;
}
