import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

export const main: APIGatewayProxyHandlerV2 = async () => {
  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*"
    },
    body: JSON.stringify({
      status: "ok",
      service: "buildshield-api",
      timestamp: new Date().toISOString()
    })
  };
};
