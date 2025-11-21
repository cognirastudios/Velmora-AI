
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  file?: {
    name: string;
    type: string;
  }
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: ChatMessage[];
}


export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}
