import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';

const dynamoDBMock = mockClient(DynamoDBDocumentClient);

describe('Data Access Layer', () => {
  beforeEach(() => {
    dynamoDBMock.reset();
  });

  it('creates a quote record', async () => {
    dynamoDBMock.on(PutCommand).resolves({
      $metadata: { httpStatusCode: 200 },
    });
    
    const { createQuote } = await import('./data-access');
    const result = await createQuote({
      userId: 'user123',
      projectDescription: 'Test project',
      materials: [{ name: 'Cement', quantity: 10, unitPrice: 5 }],
      laborCost: 1000,
      margin: 20,
    });
    
    expect(result).toBe(true);
  });

  it('retrieves a quote record', async () => {
    dynamoDBMock.on(GetCommand).resolves({
      Item: {
        PK: 'USER#user123',
        SK: 'QUOTE#quote123',
        projectDescription: 'Test project',
        materials: [{ name: 'Cement', quantity: 10, unitPrice: 5 }],
        laborCost: 1000,
        margin: 20,
      },
    });
    
    const { getQuote } = await import('./data-access');
    const result = await getQuote('user123', 'quote123');
    
    expect(result).toEqual({
      userId: 'user123',
      quoteId: 'quote123',
      projectDescription: 'Test project',
      materials: [{ name: 'Cement', quantity: 10, unitPrice: 5 }],
      laborCost: 1000,
      margin: 20,
    });
  });

  it('updates a contract record', async () => {
    dynamoDBMock.on(UpdateCommand).resolves({
      Attributes: {
        PK: 'USER#user123',
        SK: 'CONTRACT#contract123',
        text: 'Updated contract text',
        riskScore: 75,
        riskDetails: ['Test risk'],
      },
    });
    
    const { updateContract } = await import('./data-access');
    const result = await updateContract('user123', 'contract123', {
      text: 'Updated contract text',
      riskScore: 75,
      riskDetails: ['Test risk'],
    });
    
    expect(result).toEqual({
      userId: 'user123',
      contractId: 'contract123',
      text: 'Updated contract text',
      riskScore: 75,
      riskDetails: ['Test risk'],
    });
  });

  it('deletes a site proof record', async () => {
    dynamoDBMock.on(DeleteCommand).resolves({
      $metadata: { httpStatusCode: 200 },
    });
    
    const { deleteSiteProof } = await import('./data-access');
    const result = await deleteSiteProof('user123', 'proof123');
    
    expect(result).toBe(true);
  });

  it('queries cash flow records', async () => {
    dynamoDBMock.on(QueryCommand).resolves({
      Items: [
        {
          PK: 'USER#user123',
          SK: 'CASHFLOW#2026-03',
          month: '2026-03',
          incoming: 8000,
          outgoing: 5000,
          net: 3000,
        },
      ],
    });
    
    const { queryCashFlow } = await import('./data-access');
    const result = await queryCashFlow('user123', '2026-03');
    
    expect(result).toEqual([
      {
        userId: 'user123',
        month: '2026-03',
        incoming: 8000,
        outgoing: 5000,
        net: 3000,
      },
    ]);
  });
});