export interface Therapy {
  PK: string;
  SK: string; 
  Type: 'Therapy';
  therapyId: string;
  title: string;
  description: string;
  content: string;
  image?: string;
  isGroup: boolean;
  createdAt: string;
}

export interface CreateTherapyInput {
  title: string;
  description: string;
  content: string;
  image?: string;
  isGroup?: boolean;
}

export interface UpdateTherapyInput {
  title?: string;
  description?: string;
  content?: string;
  image?: string;
  isGroup?: boolean;
}
