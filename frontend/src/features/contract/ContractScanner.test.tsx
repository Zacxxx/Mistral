import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractScanner } from './ContractScanner';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe('ContractScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the contract scanner', () => {
    render(<ContractScanner />);
    expect(screen.getByText('Contract Input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste contract text here or upload a document...')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop a contract file here')).toBeInTheDocument();
  });

  it('updates contract text', async () => {
    const user = userEvent.setup();
    render(<ContractScanner />);
    const textarea = screen.getByPlaceholderText('Paste contract text here or upload a document...');
    await user.type(textarea, 'This is a test contract with penalty clauses');
    expect(textarea).toHaveValue('This is a test contract with penalty clauses');
  });

  it('scans contract and displays risk assessment', async () => {
    const user = userEvent.setup();
    render(<ContractScanner />);
    const textarea = screen.getByPlaceholderText('Paste contract text here or upload a document...');
    await user.type(textarea, 'This is a test contract with penalty clauses that should be analyzed for risks and suggestions. It needs to be at least fifty characters long.');

    const scanButton = screen.getByText('Scan for Risks');
    await user.click(scanButton);

    expect(await screen.findByText('Contract Analysis')).toBeInTheDocument();
    expect(await screen.findByText('Penalty Clause')).toBeInTheDocument();

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Contract scanned",
        expect.objectContaining({
          description: expect.stringContaining("Risk"),
        })
      );
    });
  });

  it('displays risk details and suggestions after scanning', async () => {
    const user = userEvent.setup();
    render(<ContractScanner />);
    const textarea = screen.getByPlaceholderText('Paste contract text here or upload a document...');
    await user.type(textarea, 'This is a test contract with penalty clauses that should be analyzed for risks and suggestions. It needs to be at least fifty characters long.');

    const scanButton = screen.getByText('Scan for Risks');
    await user.click(scanButton);

    expect(await screen.findByText('Risk Details')).toBeInTheDocument();
    expect(await screen.findByText('Suggested Amendments')).toBeInTheDocument();
  });
});