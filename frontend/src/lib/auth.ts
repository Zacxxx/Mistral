"use client"

import { Amplify, Auth } from 'aws-amplify';
import { CognitoHostedUIIdentityProvider } from '@aws-amplify/auth';
import { fetchAuthSession } from 'aws-amplify/auth';

Amplify.configure({
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID,
    identityPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID,
    mandatorySignIn: false,
    authenticationFlowType: 'USER_PASSWORD_AUTH',
    oauth: {
      domain: process.env.NEXT_PUBLIC_AWS_COGNITO_OAUTH_DOMAIN,
      scope: ['phone', 'email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
      redirectSignIn: process.env.NEXT_PUBLIC_AWS_COGNITO_REDIRECT_SIGN_IN,
      redirectSignOut: process.env.NEXT_PUBLIC_AWS_COGNITO_REDIRECT_SIGN_OUT,
      responseType: 'code',
      providers: [CognitoHostedUIIdentityProvider.Google, CognitoHostedUIIdentityProvider.Facebook]
    }
  }
});

export const signUp = async (email: string, password: string, name: string) => {
  const { user } = await Auth.signUp({
    username: email,
    password,
    attributes: {
      email,
      name
    }
  });
  return user;
};

export const confirmSignUp = async (email: string, code: string) => {
  await Auth.confirmSignUp(email, code);
};

export const signIn = async (email: string, password: string) => {
  const user = await Auth.signIn(email, password);
  return user;
};

export const signOut = async () => {
  await Auth.signOut({ global: true });
};

export const getCurrentUser = async () => {
  try {
    const user = await Auth.currentAuthenticatedUser();
    return user;
  } catch {
    return null;
  }
};

export const getAccessToken = async () => {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() || null;
  } catch {
    return null;
  }
};

export const getIdToken = async () => {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch {
    return null;
  }
};

export const refreshToken = async () => {
  const session = await fetchAuthSession();
  if (session.tokens?.refreshToken) {
    await Auth.refreshSession(session.tokens.refreshToken);
    return await fetchAuthSession();
  }
  throw new Error('No refresh token available');
};

export const forgotPassword = async (email: string) => {
  await Auth.forgotPassword(email);
};

export const forgotPasswordSubmit = async (email: string, code: string, newPassword: string) => {
  await Auth.forgotPasswordSubmit(email, code, newPassword);
};

export const socialSignIn = async (provider: CognitoHostedUIIdentityProvider) => {
  await Auth.federatedSignIn({ provider });
};

export const getUserAttributes = async () => {
  try {
    const user = await Auth.currentAuthenticatedUser();
    return user.attributes;
  } catch {
    return null;
  }
};

export const updateUserAttributes = async (attributes: Record<string, string>) => {
  const user = await Auth.currentAuthenticatedUser();
  await Auth.updateUserAttributes(user, attributes);
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  const user = await Auth.currentAuthenticatedUser();
  await Auth.changePassword(user, oldPassword, newPassword);
};

export const verifyUserAttribute = async (attribute: string) => {
  await Auth.verifyCurrentUserAttribute(attribute);
};

export const verifyUserAttributeSubmit = async (attribute: string, code: string) => {
  await Auth.verifyCurrentUserAttributeSubmit(attribute, code);
};