import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateTableCommand } from '@aws-sdk/lib-dynamodb';
import { retry } from './retry';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE!;

export const addGSI = async (indexName: string, keySchema: { AttributeName: string; KeyType: 'HASH' | 'RANGE' }[], attributeDefinitions: { AttributeName: string; AttributeType: 'S' | 'N' | 'B' }[]) => {
  try {
    await retry(async () => {
      await docClient.send(
        new UpdateTableCommand({
          TableName: TABLE_NAME,
          AttributeDefinitions: attributeDefinitions,
          GlobalSecondaryIndexUpdates: [
            {
              Create: {
                IndexName: indexName,
                KeySchema: keySchema,
                Projection: {
                  ProjectionType: 'ALL',
                },
                ProvisionedThroughput: {
                  ReadCapacityUnits: 5,
                  WriteCapacityUnits: 5,
                },
              },
            },
          ],
        })
      );
    });
  } catch (error) {
    console.error(`Failed to add GSI ${indexName}:`, error);
    throw error;
  }
};

export const migrateToV1 = async () => {
  try {
    await addGSI('GSI1', [
      { AttributeName: 'GSI1PK', KeyType: 'HASH' },
      { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
    ], [
      { AttributeName: 'GSI1PK', AttributeType: 'S' },
      { AttributeName: 'GSI1SK', AttributeType: 'S' },
    ]);
    
    await addGSI('GSI2', [
      { AttributeName: 'GSI2PK', KeyType: 'HASH' },
      { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
    ], [
      { AttributeName: 'GSI2PK', AttributeType: 'S' },
      { AttributeName: 'GSI2SK', AttributeType: 'S' },
    ]);
    
    console.log('Migration to V1 completed successfully');
  } catch (error) {
    console.error('Migration to V1 failed:', error);
    throw error;
  }
};