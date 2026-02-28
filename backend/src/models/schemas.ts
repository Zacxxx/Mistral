import { z } from 'zod';

export const QuoteSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  contractorId: z.string().uuid(),
  customerId: z.string().uuid(),
  amount: z.number().positive(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']),
  items: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      total: z.number().positive(),
    })
  ),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const ContractSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  quoteId: z.string().uuid(),
  contractorId: z.string().uuid(),
  customerId: z.string().uuid(),
  status: z.enum(['draft', 'active', 'completed', 'terminated']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  paymentTerms: z.string().min(1),
  termsAndConditions: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  signedAt: z.string().datetime().optional(),
});

export const PhotoSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  contractId: z.string().uuid().optional(),
  url: z.string().url(),
  thumbnailUrl: z.string().url(),
  s3Key: z.string().min(1),
  uploadedBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
});

export const CashFlowSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  contractId: z.string().uuid(),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  description: z.string().min(1),
  date: z.string().datetime(),
  category: z.string().min(1),
  status: z.enum(['pending', 'completed', 'failed']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  referenceId: z.string().optional(),
});