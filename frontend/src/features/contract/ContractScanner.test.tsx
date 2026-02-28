import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    expect(screen.getByPlaceholderText('Paste contract text here...')).toBeInTheDocument();
    expect(screen.getByText('Upload Contract Document')).toBeInTheDocument();
  });

  it('updates contract text', async () => {
    const user = userEvent.setup();
    render(<ContractScanner />);
    const textarea = screen.getByPlaceholderText('Paste contract text here...');
    await user.type(textarea, 'This is a test contract with penalty clauses');
    expect(textarea).toHaveValue('This is a test contract with penalty clauses');
  });

  it('scans contract and displays risk assessment', async () => {
    const user = userEvent.setup();
    render(<ContractScanner />);
    const scanButton = screen.getByText('Scan for Risks');
    await user.click(scanButton);
    
    await waitFor(() => {
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      expect(screen.getByText('72/100')).toBeInTheDocument();
      expect(screen.getByText('Late penalty clause disproportionate to project value')).toBeInTheDocument();
      expect(screen.getByText('Missing weather delay condition')).toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith(
        "Contract scanned",
        expect.objectContaining({
          description: "Risk assessment completed successfully.",
        })
      );
    });
  });

  it('displays risk details and suggestions after scanning', async () => {
    const user = userEvent.setup();
    render(<ContractScanner />);
    const scanButton = screen.getByText('Scan for Risks');
    await user.click(scanButton);
    
    await waitFor(() => {
      expect(screen.getByText('Risk Details')).toBeInTheDocument();
      expect(screen.getByText('Suggested Amendments')).toBeInTheDocument();
      expect(screen.getByText('Add weather and supplier delay conditions')).toBeInTheDocument();
    });
  });
});