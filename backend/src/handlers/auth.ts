import { APIGatewayProxyHandler } from 'aws-lambda';
import { Auth } from 'aws-amplify';
import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand, ForgotPasswordCommand, ConfirmForgotPasswordCommand, GetUserCommand, UpdateUserAttributesCommand, ChangePasswordCommand, VerifyUserAttributeCommand, ResendConfirmationCodeCommand } from '@aws-sdk/client-cognito-identity-provider';
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

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

const signUpHandler: APIGatewayProxyHandler = async (event) => {
  const { email, password, name } = event.body as any;

  const params = {
    ClientId: process.env.AWS_COGNITO_USER_POOL_CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'name', Value: name }
    ]
  };

  try {
    const command = new SignUpCommand(params);
    await cognitoClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'User registered successfully' })
    };
  } catch (error) {
    logger.error('Sign up error', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to register user' })
    };
  }
};

const confirmSignUpHandler: APIGatewayProxyHandler = async (event) => {
  const { email, code } = event.body as any;

  const params = {
    ClientId: process.env.AWS_COGNITO_USER_POOL_CLIENT_ID,
    Username: email,
    ConfirmationCode: code
  };

  try {
    const command = new ConfirmSignUpCommand(params);
    await cognitoClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'User confirmed successfully' })
    };
  } catch (error) {
    logger.error('Confirm sign up error', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to confirm user' })
    };
  }
};

const signInHandler: APIGatewayProxyHandler = async (event) => {
  const { email, password } = event.body as any;

  const params = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: process.env.AWS_COGNITO_USER_POOL_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password
    }
  };

  try {
    const command = new InitiateAuthCommand(params);
    const response = await cognitoClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({
        accessToken: response.AuthenticationResult?.AccessToken,
        idToken: response.AuthenticationResult?.IdToken,
        refreshToken: response.AuthenticationResult?.RefreshToken,
        expiresIn: response.AuthenticationResult?.ExpiresIn
      })
    };
  } catch (error) {
    logger.error('Sign in error', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to sign in' })
    };
  }
};

const forgotPasswordHandler: APIGatewayProxyHandler = async (event) => {
  const { email } = event.body as any;

  const params = {
    ClientId: process.env.AWS_COGNITO_USER_POOL_CLIENT_ID,
    Username: email
  };

  try {
    const command = new ForgotPasswordCommand(params);
    await cognitoClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Password reset code sent' })
    };
  } catch (error) {
    logger.error('Forgot password error', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send password reset code' })
    };
  }
};

const confirmForgotPasswordHandler: APIGatewayProxyHandler = async (event) => {
  const { email, code, newPassword } = event.body as any;

  const params = {
    ClientId: process.env.AWS_COGNITO_USER_POOL_CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword
  };

  try {
    const command = new ConfirmForgotPasswordCommand(params);
    await cognitoClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Password reset successfully' })
    };
  } catch (error) {
    logger.error('Confirm forgot password error', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to reset password' })
    };
  }
};

const getUserHandler: APIGatewayProxyHandler = async (event) => {
  const { accessToken } = event.headers?.Authorization?.replace('Bearer ', '') ? event.headers : event.body as any;

  const params = {
    AccessToken: accessToken
  };

  try {
    const command = new GetUserCommand(params);
    const response = await cognitoClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({
        username: response.Username,
        userAttributes: response.UserAttributes
      })
    };
  } catch (error) {
    logger.error('Get user error', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get user' })
    };
  }
};

const updateUserAttributesHandler: APIGatewayProxyHandler = async (event) => {
  const { accessToken, userAttributes } = event.body as any;

  const params = {
    AccessToken: accessToken,
    UserAttributes: Object.entries(userAttributes).map(([Name, Value]) => ({ Name, Value }))
  };

  try {
    const command = new UpdateUserAttributesCommand(params);
    await cognitoClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'User attributes updated successfully' })
    };
  } catch (error) {
    logger.error('Update user attributes error', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update user attributes' })
    };
  }
};

const changePasswordHandler: APIGatewayProxyHandler = async (event) => {
  const { accessToken, previousPassword, proposedPassword } = event.body as any;

  const params = {
    AccessToken: accessToken,
    PreviousPassword: previousPassword,
    ProposedPassword: proposedPassword
  };

  try {
    const command = new ChangePasswordCommand(params);
    await cognitoClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Password changed successfully' })
    };
  } catch (error) {
    logger.error('Change password error', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to change password' })
    };
  }
};

const verifyUserAttributeHandler: APIGatewayProxyHandler = async (event) => {
  const { accessToken, attributeName } = event.body as any;

  const params = {
    AccessToken: accessToken,
    AttributeName: attributeName
  };

  try {
    const command = new VerifyUserAttributeCommand(params);
    await cognitoClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Verification code sent' })
    };
  } catch (error) {
    logger.error('Verify user attribute error', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send verification code' })
    };
  }
};

const resendConfirmationCodeHandler: APIGatewayProxyHandler = async (event) => {
  const { email } = event.body as any;

  const params = {
    ClientId: process.env.AWS_COGNITO_USER_POOL_CLIENT_ID,
    Username: email
  };

  try {
    const command = new ResendConfirmationCodeCommand(params);
    await cognitoClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Confirmation code resent' })
    };
  } catch (error) {
    logger.error('Resend confirmation code error', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to resend confirmation code' })
    };
  }
};

const refreshTokenHandler: APIGatewayProxyHandler = async (event) => {
  const { refreshToken } = event.body as any;

  const params = {
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: process.env.AWS_COGNITO_USER_POOL_CLIENT_ID,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken
    }
  };

  try {
    const command = new InitiateAuthCommand(params);
    const response = await cognitoClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({
        accessToken: response.AuthenticationResult?.AccessToken,
        idToken: response.AuthenticationResult?.IdToken,
        expiresIn: response.AuthenticationResult?.ExpiresIn
      })
    };
  } catch (error) {
    logger.error('Refresh token error', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to refresh token' })
    };
  }
};

export const signUp = middy(signUpHandler)
  .use(httpJsonBodyParser())
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(httpErrorHandler());

export const confirmSignUp = middy(confirmSignUpHandler)
  .use(httpJsonBodyParser())
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(httpErrorHandler());

export const signIn = middy(signInHandler)
  .use(httpJsonBodyParser())
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(httpErrorHandler());

export const forgotPassword = middy(forgotPasswordHandler)
  .use(httpJsonBodyParser())
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(httpErrorHandler());

export const confirmForgotPassword = middy(confirmForgotPasswordHandler)
  .use(httpJsonBodyParser())
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(httpErrorHandler());

export const getUser = middy(getUserHandler)
  .use(httpJsonBodyParser())
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(httpErrorHandler());

export const updateUserAttributes = middy(updateUserAttributesHandler)
  .use(httpJsonBodyParser())
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(httpErrorHandler());

export const changePassword = middy(changePasswordHandler)
  .use(httpJsonBodyParser())
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(httpErrorHandler());

export const verifyUserAttribute = middy(verifyUserAttributeHandler)
  .use(httpJsonBodyParser())
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(httpErrorHandler());

export const resendConfirmationCode = middy(resendConfirmationCodeHandler)
  .use(httpJsonBodyParser())
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(httpErrorHandler());

export const refreshToken = middy(refreshTokenHandler)
  .use(httpJsonBodyParser())
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(httpErrorHandler());