import { handler } from './api';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@aws-lambda-powertools/logger', () => ({
  Logger: class {
    info = vi.fn();
    error = vi.fn();
    debug = vi.fn();
    warn = vi.fn();
    clearBuffer = vi.fn();
    addContext = vi.fn();
    addPersistentLogAttributes = vi.fn();
  },
}));

vi.mock('@aws-lambda-powertools/metrics', () => ({
  Metrics: class {
    addMetric = vi.fn();
    publishStoredMetrics = vi.fn();
  },
}));

vi.mock('@aws-lambda-powertools/tracer', () => ({
  Tracer: class {
    captureLambdaHandler = vi.fn();
    addRootSegmentAttributes = vi.fn();
  },
}));

vi.mock('@aws-lambda-powertools/logger/middleware', () => ({
  injectLambdaContext: vi.fn(() => ({ before: vi.fn() })),
}));
vi.mock('@aws-lambda-powertools/tracer/middleware', () => ({
  captureLambdaHandler: vi.fn(() => ({ before: vi.fn(), after: vi.fn(), onError: vi.fn() })),
}));
vi.mock('@aws-lambda-powertools/metrics/middleware', () => ({
  logMetrics: vi.fn(() => ({ before: vi.fn(), after: vi.fn(), onError: vi.fn() })),
}));


vi.mock('./data', () => ({
  createQuote: vi.fn(async () => ({ statusCode: 200, body: JSON.stringify({ message: 'BuildShield AI API', path: '/quotes', method: 'POST' }) })),
  getQuote: vi.fn(async () => ({ statusCode: 200, body: JSON.stringify({}) })),
  updateQuote: vi.fn(async () => ({ statusCode: 200, body: JSON.stringify({}) })),
  deleteQuote: vi.fn(async () => ({ statusCode: 204, body: '' })),
  listQuotes: vi.fn(async () => ({ statusCode: 200, body: JSON.stringify([]) })),
  createContract: vi.fn(async () => ({ statusCode: 200, body: JSON.stringify({}) })),
  getContract: vi.fn(async () => ({ statusCode: 200, body: JSON.stringify({}) })),
  updateContract: vi.fn(async () => ({ statusCode: 200, body: JSON.stringify({}) })),
  deleteContract: vi.fn(async () => ({ statusCode: 204, body: '' })),
  listContracts: vi.fn(async () => ({ statusCode: 200, body: JSON.stringify([]) })),
  createPhoto: vi.fn(async () => ({ statusCode: 200, body: JSON.stringify({}) })),
  getPhoto: vi.fn(async () => ({ statusCode: 200, body: JSON.stringify({}) })),
  updatePhoto: vi.fn(async () => ({ statusCode: 200, body: JSON.stringify({}) })),
  deletePhoto: vi.fn(async () => ({ statusCode: 204, body: '' })),
  listPhotos: vi.fn(async () => ({ statusCode: 200, body: JSON.stringify([]) })),
  createCashFlow: vi.fn(async () => ({ statusCode: 200, body: JSON.stringify({}) })),
  getCashFlow: vi.fn(async () => ({ statusCode: 200, body: JSON.stringify({}) })),
  updateCashFlow: vi.fn(async () => ({ statusCode: 200, body: JSON.stringify({}) })),
  deleteCashFlow: vi.fn(async () => ({ statusCode: 204, body: '' })),
  listCashFlows: vi.fn(async () => ({ statusCode: 200, body: JSON.stringify([]) })),
}));

describe('API Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns successful response for root path', async () => {
    const event = {
      path: '/',
      httpMethod: 'GET',
      body: '{}',
      isBase64Encoded: false,
      headers: { 'content-type': 'application/json' },
      multiValueHeaders: { 'content-type': ['application/json'] },
      requestContext: { httpMethod: 'GET', path: '/' },
    } as unknown as APIGatewayProxyEvent;

    const result = await (handler as any)(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('BuildShield AI API');
    expect(body.path).toBe('/');
    expect(body.method).toBe('GET');
  });

  it('returns successful response for proxy path', async () => {
    const event = {
      path: '/quotes',
      httpMethod: 'POST',
      body: '{}',
      isBase64Encoded: false,
      headers: { 'content-type': 'application/json' },
      multiValueHeaders: { 'content-type': ['application/json'] },
      requestContext: { httpMethod: 'POST', path: '/quotes' },
    } as unknown as APIGatewayProxyEvent;

    const result = await (handler as any)(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('BuildShield AI API');
    expect(body.path).toBe('/quotes');
    expect(body.method).toBe('POST');
  });

  it('handles JSON body parsing', async () => {
    const event = {
      path: '/contracts',
      httpMethod: 'POST',
      body: JSON.stringify({ text: 'Test contract' }),
      isBase64Encoded: false,
      headers: { 'content-type': 'application/json' },
      multiValueHeaders: { 'content-type': ['application/json'] },
      requestContext: { httpMethod: 'POST', path: '/contracts' },
    } as unknown as APIGatewayProxyEvent;

    const result = await (handler as any)(event);
    expect(result.statusCode).toBe(200);
  });
});