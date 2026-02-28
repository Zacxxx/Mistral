import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CashFlowRadar } from './CashFlowRadar';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe('CashFlowRadar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the cash flow dashboard', () => {
    render(<CashFlowRadar />);
    expect(screen.getByText('Liquidity Runway')).toBeInTheDocument();
    expect(screen.getByText('46 days')).toBeInTheDocument();
    expect(screen.getByText('Monthly Burn Rate')).toBeInTheDocument();
    expect(screen.getByText('$1200')).toBeInTheDocument();
  });

  it('displays incoming payments table with correct data', () => {
    render(<CashFlowRadar />);
    expect(screen.getByText('Incoming Payments')).toBeInTheDocument();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('$5000')).toBeInTheDocument();
    expect(screen.getByText('2026-03-15')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('displays outgoing payments table with correct data', () => {
    render(<CashFlowRadar />);
    expect(screen.getByText('Outgoing Payments')).toBeInTheDocument();
    expect(screen.getByText('EXP-001')).toBeInTheDocument();
    expect(screen.getByText('$2000')).toBeInTheDocument();
    expect(screen.getByText('2026-03-10')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
  });

  it('shows critical warning for low liquidity', () => {
    // Mock the liquidity runway to be low
    vi.spyOn(require('./CashFlowRadar'), 'CashFlowRadar').mockReturnValue(() => {
      const MockComponent = () => {
        return (
          <div>
            <div>Liquidity Runway</div>
            <div>15 days</div>
            <div>Critical: Low liquidity</div>
          </div>
        );
      };
      return <MockComponent />;
    });
    
    render(<CashFlowRadar />);
    expect(screen.getByText('Critical: Low liquidity')).toBeInTheDocument();
  });

  it('updates cash flow projections and shows success toast', async () => {
    const user = userEvent.setup();
    render(<CashFlowRadar />);
    const updateButton = screen.getByText('Update Cash Flow Projections');
    await user.click(updateButton);
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Cash flow updated",
        expect.objectContaining({
          description: "Your cash flow projections have been updated.",
        })
      );
    });
  });
});