import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Mock URL APIs
if (typeof window !== 'undefined') {
  global.URL.createObjectURL = vi.fn(() => 'mock-url');
  global.URL.revokeObjectURL = vi.fn();
}

// Mock TensorFlow
vi.mock('@tensorflow/tfjs', () => ({
  ready: vi.fn(() => Promise.resolve()),
  browser: {
    fromPixels: vi.fn(() => ({
      resizeNearestNeighbor: vi.fn(() => ({
        toFloat: vi.fn(() => ({
          sub: vi.fn(() => ({
            div: vi.fn(() => ({
              expandDims: vi.fn(() => ({})),
            })),
          })),
        })),
      })),
    })),
  },
  scalar: vi.fn(() => ({})),
  dispose: vi.fn(),
}));

vi.mock('@tensorflow-models/mobilenet', () => ({
  load: vi.fn(() => Promise.resolve({
    classify: vi.fn(() => Promise.resolve([{ className: 'Mock Object', probability: 0.9 }])),
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock AWS Amplify
vi.mock('aws-amplify', () => ({
  Auth: {
    configure: vi.fn(),
    signIn: vi.fn(() => Promise.resolve({})),
    signUp: vi.fn(() => Promise.resolve({})),
    confirmSignUp: vi.fn(() => Promise.resolve({})),
    signOut: vi.fn(() => Promise.resolve({})),
    currentAuthenticatedUser: vi.fn(() => Promise.reject('No user')),
    forgotPassword: vi.fn(() => Promise.resolve({})),
    forgotPasswordSubmit: vi.fn(() => Promise.resolve({})),
  },
}));

// Mock SpeechRecognition
if (typeof window !== 'undefined') {
  (window as any).SpeechRecognition = vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    onresult: null,
    onerror: null,
    onend: null,
  }));
  (window as any).webkitSpeechRecognition = (window as any).SpeechRecognition;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});