import { z } from 'zod';
import { QuoteSchema, ContractSchema, PhotoSchema, CashFlowSchema } from '../models/schemas';

export const validateEntity = (entityType: string, data: any) => {
  try {
    switch (entityType) {
      case 'quote':
        return QuoteSchema.parse(data);
      case 'contract':
        return ContractSchema.parse(data);
      case 'photo':
        return PhotoSchema.parse(data);
      case 'cashFlow':
        return CashFlowSchema.parse(data);
      default:
        throw new Error(`Invalid entity type: ${entityType}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
};

export const validatePartialEntity = (entityType: string, data: any) => {
  const baseSchema = z.object({});
  
  const schemaMap: Record<string, z.ZodObject<any>> = {
    quote: QuoteSchema,
    contract: ContractSchema,
    photo: PhotoSchema,
    cashFlow: CashFlowSchema,
  };
  
  if (!schemaMap[entityType]) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }
  
  const schema = schemaMap[entityType].partial();
  return baseSchema.extend(schema.shape).parse(data);
};