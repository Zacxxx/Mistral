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

describe('QuoteEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the quote form', () => {
    render(<QuoteEngine />);
    expect(screen.getByText('Quote Input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe the project...')).toBeInTheDocument();
    expect(screen.getByText('Start Voice Input')).toBeInTheDocument();
  });

  it('adds new material fields', async () => {
    const user = userEvent.setup();
    render(<QuoteEngine />);
    const addButton = screen.getByText('Add Material');
    await user.click(addButton);
    const materialInputs = screen.getAllByPlaceholderText('Material name');
    expect(materialInputs).toHaveLength(2);
  });

  it('updates quote description', async () => {
    const user = userEvent.setup();
    render(<QuoteEngine />);
    const description = screen.getByPlaceholderText('Describe the project...');
    await user.type(description, 'New kitchen renovation');
    expect(description).toHaveValue('New kitchen renovation');
  });

  it('submits the form and shows success toast', async () => {
    const user = userEvent.setup();
    render(<QuoteEngine />);
    
    await user.type(screen.getByPlaceholderText('Describe the project...'), 'Test project');
    await user.type(screen.getAllByPlaceholderText('Material name')[0], 'Cement');
    await user.type(screen.getAllByPlaceholderText('Quantity')[0], '10');
    await user.type(screen.getAllByPlaceholderText('Unit Price')[0], '5');
    await user.type(screen.getByPlaceholderText('Total labor cost'), '1000');
    
    const submitButton = screen.getByText('Generate Quote');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Quote generated",
        expect.objectContaining({
          description: "Your intelligent quote has been created successfully.",
        })
      );
    });
  });

  it('handles voice input toggle', async () => {
    const user = userEvent.setup();
    render(<QuoteEngine />);
    const voiceButton = screen.getByText('Start Voice Input');
    await user.click(voiceButton);
    expect(screen.getByText('Stop Recording')).toBeInTheDocument();
  });

  it('shows error when microphone is not available', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'SpeechRecognition').mockImplementationOnce(() => undefined as any);
    vi.spyOn(window, 'webkitSpeechRecognition').mockImplementationOnce(() => undefined as any);
    
    render(<QuoteEngine />);
    const voiceButton = screen.getByText('Start Voice Input');
    await user.click(voiceButton);
    
    expect(screen.getByText('Voice input is not supported in your browser.')).toBeInTheDocument();
  });
});