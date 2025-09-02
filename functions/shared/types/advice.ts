import { DynamoItem } from '../dynamo';

export interface AdviceImage {
  key: string;
  url: string;
  size?: number;
  contentType?: string;
}

export interface Advice extends DynamoItem{
  PK: string;
  SK: string;
  Type: 'Advice';
  therapyId: string;
  adviceId: string;
  title: string;
  description: string;
  content: string;
  image?: AdviceImage;
  createdAt: string;
}

export interface CreateAdviceInput {
  title: string;
  description: string;
  content: string;
  imageKey?: string;
}

export interface UpdateAdviceInput extends Partial<Advice> {
  title?: string;
  description?: string;
  content?: string;
  imageKey?: string;
}
