import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { Quote, Contract, Photo, CashFlow, EntityType } from '../models/types';
import { DataAccessError } from './errors';
import { retry } from './retry';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE!;

export const syncEntities = async <T extends { id: string; projectId: string; entityType: EntityType }>(
  entities: T[],
  entityType: EntityType
): Promise<{ success: boolean; failedItems?: Array<{ item: T; error: string }> }> => {
  if (entities.length === 0) {
    return { success: true };
  }
  
  const putRequests = entities.map((entity) => ({
    PutRequest: {
      Item: entity,
    },
  }));
  
  try {
    await retry(async () => {
      const batchSize = 25;
      for (let i = 0; i < putRequests.length; i += batchSize) {
        const batch = putRequests.slice(i, i + batchSize);
        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [TABLE_NAME]: batch,
            },
          })
        );
      }
    });
    
    return { success: true };
  } catch (error) {
    const failedItems = entities.map((item) => ({
      item,
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
    
    return {
      success: false,
      failedItems,
    };
  }
};

export const getSyncStatus = async (projectId: string, lastSyncToken?: string): Promise<{
  syncToken: string;
  changes: Array<Quote | Contract | Photo | CashFlow>;
}> => {
  // In a real implementation, this would query DynamoDB for changes since lastSyncToken
  // For now, return an empty response
  return {
    syncToken: new Date().toISOString(),
    changes: [],
  };
};