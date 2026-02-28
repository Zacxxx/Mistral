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
      id: '00000000-0000-4000-a000-000000000001',
      projectId: '00000000-0000-4000-a000-000000000002',
      contractorId: '00000000-0000-4000-a000-000000000003',
      customerId: '00000000-0000-4000-a000-000000000004',
      amount: 1500,
      status: 'draft',
      items: [{ description: 'Cement', quantity: 10, unitPrice: 5, total: 50 }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(result).toBe(true);
  });

  it('retrieves a quote record', async () => {
    dynamoDBMock.on(GetCommand).resolves({
      Item: {
        PK: 'PROJECT#user123',
        SK: 'QUOTE#quote123',
        id: 'quote123',
        projectId: 'user123',
        projectDescription: 'Test project',
        materials: [{ name: 'Cement', quantity: 10, unitPrice: 5 }],
        laborCost: 1000,
        margin: 20,
      },
    });

    const { getQuote } = await import('./data-access');
    const result = await getQuote('user123', 'quote123');

    expect(result).toEqual(expect.objectContaining({
      projectId: 'user123',
      id: 'quote123',
      projectDescription: 'Test project',
      materials: [{ name: 'Cement', quantity: 10, unitPrice: 5 }],
      laborCost: 1000,
      margin: 20,
    }));
  });

  it('updates a contract record', async () => {
    dynamoDBMock.on(UpdateCommand).resolves({
      Attributes: {
        PK: 'PROJECT#user123',
        SK: 'CONTRACT#contract123',
        id: 'contract123',
        projectId: 'user123',
        termsAndConditions: 'Updated contract text',
        status: 'active',
        riskScore: 75,
        riskDetails: ['Test risk'],
      },
    });

    const { updateContract } = await import('./data-access');
    const result = await updateContract('user123', 'contract123', {
      termsAndConditions: 'Updated contract text',
      status: 'active',
    });

    expect(result).toEqual(expect.objectContaining({
      projectId: 'user123',
      id: 'contract123',
      termsAndConditions: 'Updated contract text',
      status: 'active',
    }));
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
          PK: 'PROJECT#user123',
          SK: 'CASHFLOW#2026-03',
          entityType: 'cashFlow',
          id: 'cf123',
          projectId: 'user123',
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
      expect.objectContaining({
        projectId: 'user123',
        month: '2026-03',
        incoming: 8000,
        outgoing: 5000,
        net: 3000,
      }),
    ]);
  });
});