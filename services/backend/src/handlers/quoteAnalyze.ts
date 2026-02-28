import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { analyzeQuoteInputSchema } from "@buildshield/shared/schemas";

export const main: APIGatewayProxyHandlerV2 = async (event) => {
  const rawBody = event.body ?? "{}";
  const parsedBody = JSON.parse(rawBody);
  const result = analyzeQuoteInputSchema.safeParse(parsedBody);

  if (!result.success) {
    return {
      statusCode: 400,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*"
      },
      body: JSON.stringify({
        error: "invalid_payload",
        details: result.error.flatten()
      })
    };
  }

  const { totalAmount, durationDays, materialRatio } = result.data;
  const grossMargin = Math.max(0, 1 - materialRatio);
  const durationRisk = durationDays > 18 ? "high" : durationDays > 10 ? "medium" : "low";

  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*"
    },
    body: JSON.stringify({
      quoteAmount: totalAmount,
      estimatedGrossMarginPct: Number((grossMargin * 100).toFixed(1)),
      durationRisk,
      recommendation:
        durationRisk === "high"
          ? "Ajouter une clause de révision délai et un buffer de marge."
          : "Risque délai acceptable pour ce niveau de devis."
    })
  };
};
