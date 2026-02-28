import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import httpRouterHandler from '@middy/http-router';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import * as dataHandlers from './data';

const logger = new Logger();
const metrics = new Metrics();
const tracer = new Tracer();

const routes = [
  {
    method: 'GET' as any,
    path: '/',
    handler: async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => ({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'BuildShield AI API',
        path: event.path,
        method: event.httpMethod,
      }),
    }),
  },
  {
    method: 'POST' as any,
    path: '/quotes',
    handler: dataHandlers.createQuote,
  },
  {
    method: 'GET' as any,
    path: '/quotes/{quoteId}',
    handler: dataHandlers.getQuote,
  },
  {
    method: 'PUT' as any,
    path: '/quotes/{quoteId}',
    handler: dataHandlers.updateQuote,
  },
  {
    method: 'DELETE' as any,
    path: '/quotes/{quoteId}',
    handler: dataHandlers.deleteQuote,
  },
  {
    method: 'GET' as any,
    path: '/quotes',
    handler: dataHandlers.listQuotes,
  },
  {
    method: 'POST' as any,
    path: '/contracts',
    handler: dataHandlers.createContract,
  },
  {
    method: 'GET' as any,
    path: '/contracts/{contractId}',
    handler: dataHandlers.getContract,
  },
  {
    method: 'PUT' as any,
    path: '/contracts/{contractId}',
    handler: dataHandlers.updateContract,
  },
  {
    method: 'DELETE' as any,
    path: '/contracts/{contractId}',
    handler: dataHandlers.deleteContract,
  },
  {
    method: 'GET' as any,
    path: '/contracts',
    handler: dataHandlers.listContracts,
  },
  {
    method: 'POST' as any,
    path: '/photos',
    handler: dataHandlers.createPhoto,
  },
  {
    method: 'GET' as any,
    path: '/photos/{photoId}',
    handler: dataHandlers.getPhoto,
  },
  {
    method: 'PUT' as any,
    path: '/photos/{photoId}',
    handler: dataHandlers.updatePhoto,
  },
  {
    method: 'DELETE' as any,
    path: '/photos/{photoId}',
    handler: dataHandlers.deletePhoto,
  },
  {
    method: 'GET' as any,
    path: '/photos',
    handler: dataHandlers.listPhotos,
  },
  {
    method: 'POST' as any,
    path: '/cash-flows',
    handler: dataHandlers.createCashFlow,
  },
  {
    method: 'GET' as any,
    path: '/cash-flows/{cashFlowId}',
    handler: dataHandlers.getCashFlow,
  },
  {
    method: 'PUT' as any,
    path: '/cash-flows/{cashFlowId}',
    handler: dataHandlers.updateCashFlow,
  },
  {
    method: 'DELETE' as any,
    path: '/cash-flows/{cashFlowId}',
    handler: dataHandlers.deleteCashFlow,
  },
  {
    method: 'GET' as any,
    path: '/cash-flows',
    handler: dataHandlers.listCashFlows,
  },
];

export const handler = middy()
  .use(httpJsonBodyParser())
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(httpErrorHandler())
  .handler(httpRouterHandler(routes) as any);