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
    method: 'POST',
    path: '/quotes',
    handler: dataHandlers.createQuote,
  },
  {
    method: 'GET',
    path: '/quotes/{quoteId}',
    handler: dataHandlers.getQuote,
  },
  {
    method: 'PUT',
    path: '/quotes/{quoteId}',
    handler: dataHandlers.updateQuote,
  },
  {
    method: 'DELETE',
    path: '/quotes/{quoteId}',
    handler: dataHandlers.deleteQuote,
  },
  {
    method: 'GET',
    path: '/quotes',
    handler: dataHandlers.listQuotes,
  },
  {
    method: 'POST',
    path: '/contracts',
    handler: dataHandlers.createContract,
  },
  {
    method: 'GET',
    path: '/contracts/{contractId}',
    handler: dataHandlers.getContract,
  },
  {
    method: 'PUT',
    path: '/contracts/{contractId}',
    handler: dataHandlers.updateContract,
  },
  {
    method: 'DELETE',
    path: '/contracts/{contractId}',
    handler: dataHandlers.deleteContract,
  },
  {
    method: 'GET',
    path: '/contracts',
    handler: dataHandlers.listContracts,
  },
  {
    method: 'POST',
    path: '/photos',
    handler: dataHandlers.createPhoto,
  },
  {
    method: 'GET',
    path: '/photos/{photoId}',
    handler: dataHandlers.getPhoto,
  },
  {
    method: 'PUT',
    path: '/photos/{photoId}',
    handler: dataHandlers.updatePhoto,
  },
  {
    method: 'DELETE',
    path: '/photos/{photoId}',
    handler: dataHandlers.deletePhoto,
  },
  {
    method: 'GET',
    path: '/photos',
    handler: dataHandlers.listPhotos,
  },
  {
    method: 'POST',
    path: '/cash-flows',
    handler: dataHandlers.createCashFlow,
  },
  {
    method: 'GET',
    path: '/cash-flows/{cashFlowId}',
    handler: dataHandlers.getCashFlow,
  },
  {
    method: 'PUT',
    path: '/cash-flows/{cashFlowId}',
    handler: dataHandlers.updateCashFlow,
  },
  {
    method: 'DELETE',
    path: '/cash-flows/{cashFlowId}',
    handler: dataHandlers.deleteCashFlow,
  },
  {
    method: 'GET',
    path: '/cash-flows',
    handler: dataHandlers.listCashFlows,
  },
];

export const handler = middy()
  .use(httpJsonBodyParser())
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(httpRouterHandler(routes))
  .use(httpErrorHandler());