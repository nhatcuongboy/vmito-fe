export enum EFeedbackType {
  CONTACT = 'CONTACT',
  BUG_REPORT = 'BUG_REPORT',
}

export enum EFeedbackStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export interface IFeedback {
  id: string;
  type: EFeedbackType;
  userId: string;
  title: string;
  description: string;
  imageUrl?: string;
  imagePublicId?: string;
  status: EFeedbackStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface ICreateFeedbackRequest {
  type: EFeedbackType;
  title: string;
  description: string;
  imageUrl?: string;
  imagePublicId?: string;
}
