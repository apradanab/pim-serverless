import { DynamoItem } from '../dynamo';

export interface Appointment extends DynamoItem {
  PK: string;
  SK: string;
  Type: 'Appointment';
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  appointmentId: string;
  therapyId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'PENDING' | 'OCCUPIED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  adminNotes?: string;
  createdAt: string;
}

export interface CreateAppointmentInput {
  therapyId: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface UpdateAppointmentInput extends Partial<Appointment> {
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: AppointmentStatus;
  notes?: string;
  adminNotes?: string;
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  OCCUPIED = 'OCCUPIED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  AVAILABLE = 'AVAILABLE'
}
