export interface Advice {
  PK: string;
  SK: string;
  Type: 'Advice';
  therapyId: string;
  adviceId: string;
  title: string;
  description: string;
  content: string;
  image?: string;
  createdAt: string;
}

export interface CreateAdviceInput {
  title: string;
  description: string;
  content: string;
  image?: string;
}

export interface UpdateAdviceInput {
  title?: string;
  description?: string;
  content?: string;
  image?: string;
}
