import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteProof } from './SiteProof';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/photo-analysis', () => ({
  photoAnalysisService: {
    initialize: vi.fn(() => Promise.resolve()),
    setProjectLocation: vi.fn(),
    analyzePhoto: vi.fn(() => Promise.resolve({
      category: 'progress',
      timestampVerified: true,
      locationTag: 'On-site',
      metadata: { timestamp: new Date() },
    })),
    generateReport: vi.fn(() => Promise.resolve({
      summary: {
        totalPhotos: 1,
        byCategory: { before: 0, after: 0, progress: 1, issue: 0 },
        timestampRange: { start: new Date(), end: new Date() },
      },
      categorizedPhotos: { before: [], after: [], progress: [], issue: [] },
    })),
  },
}));


describe('SiteProof', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders the site proof interface', () => {
    render(<SiteProof />);
    expect(screen.getByText('Site Photos')).toBeInTheDocument();
    expect(screen.getByText('Photo Gallery')).toBeInTheDocument();
    expect(screen.getByText('Take/Upload Photos')).toBeInTheDocument();
  });

  it('handles photo upload and shows success toast', async () => {
    const user = userEvent.setup();
    render(<SiteProof />);

    const file = new File(['dummy image content'], 'test.jpg', { type: 'image/jpeg' });
    const uploadButton = screen.getByText(/Take\/Upload Photos/i);
    const input = uploadButton.nextElementSibling as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "1 photo(s) added and analyzed",
        expect.objectContaining({
          description: "Photos have been categorized and verified.",
        })
      );
    });
  });

  it('displays photo previews after upload', async () => {
    const user = userEvent.setup();
    render(<SiteProof />);

    const file = new File(['dummy image content'], 'test.jpg', { type: 'image/jpeg' });
    const uploadButton = screen.getByText(/Take\/Upload Photos/i);
    const input = uploadButton.nextElementSibling as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  it('removes photo when delete button is clicked', async () => {
    const user = userEvent.setup();
    // Mock URL.createObjectURL before upload
    const mockRevoke = vi.fn();
    global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
    global.URL.revokeObjectURL = mockRevoke;

    render(<SiteProof />);

    const file = new File(['dummy image content'], 'test.jpg', { type: 'image/jpeg' });
    const uploadButton = screen.getByText(/Take\/Upload Photos/i);
    const input = uploadButton.nextElementSibling as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('×');
    expect(deleteButtons.length).toBeGreaterThan(0);

    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  it('generates report and shows success toast', async () => {
    const user = userEvent.setup();
    render(<SiteProof />);

    // Upload a photo first to enable the button
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const uploadButton = screen.getByText(/Take\/Upload Photos/i);
    const input = uploadButton.nextElementSibling as HTMLInputElement;
    await user.upload(input, file);

    const generateButton = screen.getByText('Generate Report');
    await user.click(generateButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Site proof report generated",
        expect.objectContaining({
          description: "Your timestamped report is ready for sharing.",
        })
      );
    });
  });
});