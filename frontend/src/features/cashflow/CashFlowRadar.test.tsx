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

vi.mock('@/lib/finance-utils', async () => {
  const actual = await vi.importActual<any>('@/lib/finance-utils');
  return {
    ...actual,
    calculateLiquidityRunway: vi.fn().mockReturnValue(15),
  };
});

describe('CashFlowRadar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the cash flow dashboard', () => {
    render(<CashFlowRadar />);
    expect(screen.getByText('Liquidity Runway')).toBeInTheDocument();
    expect(screen.getByText('Monthly Burn Rate')).toBeInTheDocument();
  });

  it('shows critical warning for low liquidity', () => {
    render(<CashFlowRadar />);
    expect(screen.getByText('15 days')).toBeInTheDocument();
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