import { handler } from './api';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@aws-lambda-powertools/logger', () => ({
  Logger: vi.fn(() => ({
    info: vi.fn(),
  })),
}));

vi.mock('@aws-lambda-powertools/metrics', () => ({
  Metrics: vi.fn(() => ({
    addMetric: vi.fn(),
  })),
}));

vi.mock('@aws-lambda-powertools/tracer', () => ({
  Tracer: vi.fn(() => ({
    captureLambdaHandler: vi.fn(),
  })),
}));

describe('API Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns successful response for root path', async () => {
    const event = {
      path: '/',
      httpMethod: 'GET',
    } as APIGatewayProxyEvent;
    
    const result = await handler(event);
    
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
    } as APIGatewayProxyEvent;
    
    const result = await handler(event);
    
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
      headers: { 'Content-Type': 'application/json' },
    } as APIGatewayProxyEvent;
    
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
  });
});