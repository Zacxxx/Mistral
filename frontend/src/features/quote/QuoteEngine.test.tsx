import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteEngine } from './QuoteEngine';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/material-pricing', () => ({
  fetchMaterialPrices: vi.fn(() => Promise.resolve({
    cement: 5.5,
    lumber: 4.2,
  })),
  compareMaterialPrices: vi.fn(() => []),
  getRegionalPreferences: vi.fn(() => ({ region: 'us-east' })),
  setRegionalPreferences: vi.fn(),
  getCachedPrices: vi.fn(() => ({})),
}));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('QuoteEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  it('renders the quote form', () => {
    renderWithClient(<QuoteEngine />);
    expect(screen.getByText('Quote Input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe the project...')).toBeInTheDocument();
    expect(screen.getByText('Start Voice Input')).toBeInTheDocument();
  });

  it('adds new material fields', async () => {
    const user = userEvent.setup();
    renderWithClient(<QuoteEngine />);
    const addButton = screen.getByText('Add Item');
    await user.click(addButton);
    const itemInputs = screen.getAllByPlaceholderText('Item name');
    expect(itemInputs).toHaveLength(2);
  });

  it('updates quote description', async () => {
    const user = userEvent.setup();
    renderWithClient(<QuoteEngine />);
    const description = screen.getByPlaceholderText('Describe the project...');
    await user.type(description, 'New kitchen renovation');
    expect(description).toHaveValue('New kitchen renovation');
  });

  it('submits the form and shows success toast', async () => {
    const user = userEvent.setup();
    renderWithClient(<QuoteEngine />);

    await user.type(screen.getByPlaceholderText('Describe the project...'), 'Test project');
    const itemInputs = await screen.findAllByPlaceholderText('Item name');
    await user.type(itemInputs[0], 'Cement');

    const qtyInputs = await screen.findAllByPlaceholderText('Quantity');
    await user.type(qtyInputs[0], '10');

    const priceInputs = await screen.findAllByPlaceholderText('Unit Price');
    await user.type(priceInputs[0], '5');

    const submitButton = screen.getByText('Generate Quote');
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Quote generated",
        expect.objectContaining({
          description: "Your intelligent quote with margin simulation has been created successfully.",
        })
      );
    });
  });

  it('handles voice input toggle', async () => {
    const user = userEvent.setup();
    renderWithClient(<QuoteEngine />);
    const voiceButton = screen.getByText('Start Voice Input');
    await user.click(voiceButton);
    expect(await screen.findByText('Stop Recording')).toBeInTheDocument();
  });

  it('shows error when microphone is not available', async () => {
    const user = userEvent.setup();

    // We don't restore all mocks as it breaks vitest imports in some environments
    // Instead we just manually set the globals to undefined
    const originalSR = (window as any).SpeechRecognition;
    const originalWSR = (window as any).webkitSpeechRecognition;
    (window as any).SpeechRecognition = undefined;
    (window as any).webkitSpeechRecognition = undefined;

    renderWithClient(<QuoteEngine />);
    const voiceButton = screen.getByText('Start Voice Input');
    await user.click(voiceButton);

    expect(await screen.findByText('Voice input is not supported in your browser.')).toBeInTheDocument();

    // Restore for other tests
    (window as any).SpeechRecognition = originalSR;
    (window as any).webkitSpeechRecognition = originalWSR;
  });
});