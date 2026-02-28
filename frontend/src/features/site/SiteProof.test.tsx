import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteProof } from './SiteProof';
import { toast } from 'sonner';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe('SiteProof', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        "1 photo(s) added",
        expect.objectContaining({
          description: "Photos will be processed and categorized automatically.",
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
    
    // Mock URL.createObjectURL
    const mockCreateObjectURL = vi.fn(() => 'blob:test-url');
    global.URL.createObjectURL = mockCreateObjectURL;
    
    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
    });
  });

  it('removes photo when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<SiteProof />);
    
    const file = new File(['dummy image content'], 'test.jpg', { type: 'image/jpeg' });
    const uploadButton = screen.getByText(/Take\/Upload Photos/i);
    const input = uploadButton.nextElementSibling as HTMLInputElement;
    
    await user.upload(input, file);
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByText('×');
      if (deleteButtons.length > 0) {
        user.click(deleteButtons[0]);
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
      }
    });
  });

  it('generates report and shows success toast', async () => {
    const user = userEvent.setup();
    render(<SiteProof />);
    const generateButton = screen.getByText('Generate Report');
    await user.click(generateButton);
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Site proof report generated",
        expect.objectContaining({
          description: "Your timestamped PDF report is ready for download.",
        })
      );
    });
  });
});