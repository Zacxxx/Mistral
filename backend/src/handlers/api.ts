import { APIGatewayProxyHandler } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';

const logger = new Logger();
const metrics = new Metrics();
const tracer = new Tracer();

const baseHandler: APIGatewayProxyHandler = async (event) => {
  logger.info('API Request', { event });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'BuildShield AI API',
      path: event.path,
      method: event.httpMethod,
    }),
  };
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(httpErrorHandler());