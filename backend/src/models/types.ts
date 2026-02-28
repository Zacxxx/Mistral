export type Quote = {
  id: string;
  projectId: string;
  contractorId: string;
  customerId: string;
  amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  notes?: string;
};

export type Contract = {
  id: string;
  projectId: string;
  quoteId: string;
  contractorId: string;
  customerId: string;
  status: 'draft' | 'active' | 'completed' | 'terminated';
  startDate: string;
  endDate?: string;
  paymentTerms: string;
  termsAndConditions: string;
  createdAt: string;
  updatedAt: string;
  signedAt?: string;
};

export type Photo = {
  id: string;
  projectId: string;
  contractId?: string;
  url: string;
  thumbnailUrl: string;
  s3Key: string;
  uploadedBy: string;
  createdAt: string;
  description?: string;
  tags?: string[];
  location?: {
    lat: number;
    lng: number;
  };
};

export type CashFlow = {
  id: string;
  projectId: string;
  contractId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  referenceId?: string;
};

export type DynamoDBItem = {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  [key: string]: any;
};

export type EntityType = 'quote' | 'contract' | 'photo' | 'cashFlow';

export type DataAccessError = {
  code: string;
  message: string;
  retryable: boolean;
};