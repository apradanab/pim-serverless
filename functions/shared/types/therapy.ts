import { DynamoItem } from '../dynamo';

export interface TherapyImage {
  key: string;
  url: string;
  size?: number;
  contentType?: string;
}

export interface Therapy extends DynamoItem {
  PK: string;
  SK: string;
  Type: 'Therapy';
  GSI1PK?: string;
  GSI1SK?: string;
  therapyId: string;
  title: string;
  description: string;
  content: string;
  image?: TherapyImage;
  maxParticipants: number;
  createdAt: string;
}

export interface CreateTherapyInput {
  title: string;
  description: string;
  content: string;
  imageKey?: string;
  maxParticipants: number;
}

export interface UpdateTherapyInput extends Partial<Therapy> {
  title?: string;
  description?: string;
  content?: string;
  imageKey?: string;
}
