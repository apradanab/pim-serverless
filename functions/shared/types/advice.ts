export interface Advice {
  PK: string;
  SK: string;
  Type: 'Advice';
  therapyId: string;
  adviceId: string;
  title: string;
  description: string;
  content: string;
  imageKey?: string;
  createdAt: string;
}

export interface CreateAdviceInput {
  title: string;
  description: string;
  content: string;
  imageKey?: string;
}

export interface UpdateAdviceInput {
  title?: string;
  description?: string;
  content?: string;
  imageKey?: string;
}
