import { Amplify } from 'aws-amplify';
import {
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  getCurrentUser as amplifyGetCurrentUser,
  fetchAuthSession,
  resetPassword,
  confirmResetPassword,
  updateUserAttributes as amplifyUpdateUserAttributes,
  updatePassword
} from 'aws-amplify/auth';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID || '',
      identityPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID || '',
      loginWith: {
        oauth: {
          domain: process.env.NEXT_PUBLIC_AWS_COGNITO_OAUTH_DOMAIN || '',
          scopes: ['phone', 'email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
          redirectSignIn: [process.env.NEXT_PUBLIC_AWS_COGNITO_REDIRECT_SIGN_IN || ''],
          redirectSignOut: [process.env.NEXT_PUBLIC_AWS_COGNITO_REDIRECT_SIGN_OUT || ''],
          responseType: 'code'
        }
      }
    }
  }
});

export const signUp = async (email: string, password: string, name: string) => {
  const { isSignUpComplete, userId, nextStep } = await amplifySignUp({
    username: email,
    password,
    options: {
      userAttributes: {
        email,
        name
      }
    }
  });
  return { isSignUpComplete, userId, nextStep };
};

export const confirmSignUp = async (email: string, code: string) => {
  await amplifyConfirmSignUp({ username: email, confirmationCode: code });
};

export const signIn = async (email: string, password: string) => {
  const { isSignedIn, nextStep } = await amplifySignIn({ username: email, password });
  return { isSignedIn, nextStep };
};

export const signOut = async () => {
  await amplifySignOut({ global: true });
};

export const getCurrentUser = async () => {
  try {
    const user = await amplifyGetCurrentUser();
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
  // fetchAuthSession handles token refresh automatically in v6
  return await fetchAuthSession({ forceRefresh: true });
};

export const forgotPassword = async (email: string) => {
  await resetPassword({ username: email });
};

export const forgotPasswordSubmit = async (email: string, code: string, newPassword: string) => {
  await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
};

export const getUserAttributes = async () => {
  try {
    const session = await fetchAuthSession();
    // In v6, user attributes are often retrieved via fetchUserAttributes if needed, 
    // but session tokens usually contain what's needed.
    // For specific attribute access:
    // const attributes = await fetchUserAttributes();
    // return attributes;
    return session.tokens?.idToken?.payload || null;
  } catch {
    return null;
  }
};

export const updateUserAttributes = async (attributes: Record<string, string>) => {
  await amplifyUpdateUserAttributes({ userAttributes: attributes });
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  await updatePassword({ oldPassword, newPassword });
};

export const verifyUserAttribute = async (attribute: string) => {
  // v6 uses resendSignUpCode or similar or confirmUserAttribute
  // Mapping to common use case:
  console.log(`Attribute verification for ${attribute} not directly mapped in v6 helper without specific API`);
};