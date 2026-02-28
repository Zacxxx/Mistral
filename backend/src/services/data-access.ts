import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { Quote, Contract, Photo, CashFlow, DynamoDBItem, EntityType } from '../models/types';
import { QuoteSchema, ContractSchema, PhotoSchema, CashFlowSchema } from '../models/schemas';
import { DataAccessError, ValidationError, NotFoundError, ConflictError, handleDynamoDBError } from '../utils/errors';
import { retry } from '../utils/retry';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = (typeof process !== 'undefined' ? process.env.DYNAMODB_TABLE : 'test-table')!;

const getEntityKeys = (entityType: EntityType, entityId: string, projectId?: string): { PK: string; SK: string } => {
  switch (entityType) {
    case 'quote':
      return { PK: `PROJECT#${projectId}`, SK: `QUOTE#${entityId}` };
    case 'contract':
      return { PK: `PROJECT#${projectId}`, SK: `CONTRACT#${entityId}` };
    case 'photo':
      return { PK: `PROJECT#${projectId}`, SK: `PHOTO#${entityId}` };
    case 'cashFlow':
      return { PK: `PROJECT#${projectId}`, SK: `CASHFLOW#${entityId}` };
    default:
      throw new ValidationError(`Invalid entity type: ${entityType}`);
  }
};

const getGSIKeys = (entityType: EntityType, entity: any): Record<string, string> => {
  const keys: Record<string, string> = {};

  switch (entityType) {
    case 'quote':
      keys.GSI1PK = `CONTRACTOR#${entity.contractorId}`;
      keys.GSI1SK = `QUOTE#${entity.id}`;
      break;
    case 'contract':
      keys.GSI1PK = `CONTRACTOR#${entity.contractorId}`;
      keys.GSI1SK = `CONTRACT#${entity.id}`;
      keys.GSI2PK = `CUSTOMER#${entity.customerId}`;
      keys.GSI2SK = `CONTRACT#${entity.id}`;
      break;
    case 'photo':
      keys.GSI1PK = `CONTRACT#${entity.contractId}`;
      keys.GSI1SK = `PHOTO#${entity.id}`;
      break;
    case 'cashFlow':
      keys.GSI1PK = `CONTRACT#${entity.contractId}`;
      keys.GSI1SK = `CASHFLOW#${entity.id}`;
      break;
  }

  return keys;
};

const validateEntity = (entityType: EntityType, data: any) => {
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
        throw new ValidationError(`Invalid entity type: ${entityType}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', (error as any).errors || (error as any).issues);
    }
    throw error;
  }
};

export const createEntity = async <T>(entityType: EntityType, entity: T & { projectId: string }): Promise<T> => {
  const validatedEntity = validateEntity(entityType, entity) as any;

  if (!validatedEntity.id) {
    validatedEntity.id = uuidv4();
  }

  const now = new Date().toISOString();
  validatedEntity.createdAt = validatedEntity.createdAt || now;
  validatedEntity.updatedAt = validatedEntity.updatedAt || now;

  const keys = getEntityKeys(entityType, validatedEntity.id, validatedEntity.projectId);
  const gsiKeys = getGSIKeys(entityType, validatedEntity);

  const item: DynamoDBItem = {
    ...keys,
    ...gsiKeys,
    entityType,
    ...validatedEntity,
  };

  try {
    await retry(async () => {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
          ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)',
        })
      );
    });

    return validatedEntity;
  } catch (error) {
    throw handleDynamoDBError(error);
  }
};

export const getEntity = async <T>(entityType: EntityType, entityId: string, projectId: string): Promise<T> => {
  const keys = getEntityKeys(entityType, entityId, projectId);

  try {
    const result = await retry(async () => {
      return await docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: keys,
        })
      );
    });

    if (!result.Item) {
      throw new NotFoundError(`${entityType} not found`);
    }

    return result.Item as T;
  } catch (error) {
    throw handleDynamoDBError(error);
  }
};

export const updateEntity = async <T>(entityType: EntityType, entityId: string, projectId: string, updates: Partial<T>): Promise<T> => {
  const keys = getEntityKeys(entityType, entityId, projectId);

  const now = new Date().toISOString();
  const updateExpressionParts = [];
  const expressionAttributeValues: Record<string, any> = {};
  const expressionAttributeNames: Record<string, string> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (key !== 'id' && key !== 'projectId' && key !== 'createdAt') {
      updateExpressionParts.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }
  }

  if (updateExpressionParts.length === 0) {
    throw new ValidationError('No valid fields to update');
  }

  updateExpressionParts.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = now;

  const updateExpression = `SET ${updateExpressionParts.join(', ')}`;

  try {
    const result = await retry(async () => {
      return await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: keys,
          UpdateExpression: updateExpression,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: 'ALL_NEW',
          ConditionExpression: 'attribute_exists(PK) AND attribute_exists(SK)',
        })
      );
    });

    return result.Attributes as T;
  } catch (error) {
    if (error instanceof DataAccessError && error.code === 'CONDITION_FAILED') {
      throw new NotFoundError(`${entityType} not found`);
    }
    throw handleDynamoDBError(error);
  }
};

export const deleteEntity = async (entityType: EntityType, entityId: string, projectId: string): Promise<void> => {
  const keys = getEntityKeys(entityType, entityId, projectId);

  try {
    await retry(async () => {
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: keys,
          ConditionExpression: 'attribute_exists(PK) AND attribute_exists(SK)',
        })
      );
    });
  } catch (error) {
    if (error instanceof DataAccessError && error.code === 'CONDITION_FAILED') {
      throw new NotFoundError(`${entityType} not found`);
    }
    throw handleDynamoDBError(error);
  }
};

export const queryEntities = async <T>(
  entityType: EntityType,
  indexName: string | null,
  keyCondition: string,
  expressionAttributeValues: Record<string, any>,
  limit?: number,
  lastEvaluatedKey?: Record<string, any>
): Promise<{ items: T[]; lastEvaluatedKey?: Record<string, any> }> => {
  try {
    const result = await retry(async () => {
      return await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: indexName || undefined,
          KeyConditionExpression: keyCondition,
          ExpressionAttributeValues: expressionAttributeValues,
          Limit: limit,
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );
    });

    return {
      items: result.Items?.filter((item) => item.entityType === entityType) as T[] || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  } catch (error) {
    throw handleDynamoDBError(error);
  }
};

export const listQuotesByProject = async (projectId: string): Promise<Quote[]> => {
  const result = await queryEntities<Quote>('quote', null, 'PK = :pk', { ':pk': `PROJECT#${projectId}` });
  return result.items;
};

export const listQuotesByContractor = async (contractorId: string): Promise<Quote[]> => {
  const result = await queryEntities<Quote>('quote', 'GSI1', 'GSI1PK = :pk', { ':pk': `CONTRACTOR#${contractorId}` });
  return result.items;
};

export const listContractsByProject = async (projectId: string): Promise<Contract[]> => {
  const result = await queryEntities<Contract>('contract', null, 'PK = :pk', { ':pk': `PROJECT#${projectId}` });
  return result.items;
};

export const listContractsByContractor = async (contractorId: string): Promise<Contract[]> => {
  const result = await queryEntities<Contract>('contract', 'GSI1', 'GSI1PK = :pk', { ':pk': `CONTRACTOR#${contractorId}` });
  return result.items;
};

export const listContractsByCustomer = async (customerId: string): Promise<Contract[]> => {
  const result = await queryEntities<Contract>('contract', 'GSI2', 'GSI2PK = :pk', { ':pk': `CUSTOMER#${customerId}` });
  return result.items;
};

export const listPhotosByProject = async (projectId: string): Promise<Photo[]> => {
  const result = await queryEntities<Photo>('photo', null, 'PK = :pk', { ':pk': `PROJECT#${projectId}` });
  return result.items;
};

export const listPhotosByContract = async (contractId: string): Promise<Photo[]> => {
  const result = await queryEntities<Photo>('photo', 'GSI1', 'GSI1PK = :pk', { ':pk': `CONTRACT#${contractId}` });
  return result.items;
};

export const listCashFlowsByProject = async (projectId: string): Promise<CashFlow[]> => {
  const result = await queryEntities<CashFlow>('cashFlow', null, 'PK = :pk', { ':pk': `PROJECT#${projectId}` });
  return result.items;
};

export const listCashFlowsByContract = async (contractId: string): Promise<CashFlow[]> => {
  const result = await queryEntities<CashFlow>('cashFlow', 'GSI1', 'GSI1PK = :pk', { ':pk': `CONTRACT#${contractId}` });
  return result.items;
};

// Helper functions for tests and specific use cases
export const createQuote = async (quote: any): Promise<boolean> => {
  await createEntity('quote', quote);
  return true;
};

export const getQuote = async (projectId: string, quoteId: string): Promise<Quote> => {
  return getEntity<Quote>('quote', quoteId, projectId);
};

export const updateContract = async (projectId: string, contractId: string, updates: Partial<Contract>): Promise<Contract> => {
  return updateEntity<Contract>('contract', contractId, projectId, updates);
};

export const deleteSiteProof = async (projectId: string, photoId: string): Promise<boolean> => {
  await deleteEntity('photo', photoId, projectId);
  return true;
};

export const queryCashFlow = async (projectId: string, month: string): Promise<CashFlow[]> => {
  const result = await queryEntities<CashFlow>(
    'cashFlow',
    null,
    'PK = :pk AND begins_with(SK, :sk)',
    {
      ':pk': `PROJECT#${projectId}`,
      ':sk': `CASHFLOW#${month}`,
    }
  );
  return result.items;
};