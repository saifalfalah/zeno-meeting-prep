import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PDFDownloadButton } from '@/components/brief/PDFDownloadButton';

// Mock fetch globally
global.fetch = vi.fn();

describe('PDFDownloadButton', () => {
  const mockBriefId = '123e4567-e89b-12d3-a456-426614174000';
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    originalCreateElement = document.createElement;
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.createElement = originalCreateElement;
  });

  it('should render download button with correct text', () => {
    render(<PDFDownloadButton briefId={mockBriefId} />);

    const button = screen.getByRole('button', { name: /download pdf/i });
    expect(button).toBeTruthy();
  });

  it('should have download icon', () => {
    render(<PDFDownloadButton briefId={mockBriefId} />);

    // Check for SVG icon
    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should initiate download on click', async () => {
    const mockBlob = new Blob(['fake pdf'], { type: 'application/pdf' });
    const mockResponse = {
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
      headers: {
        get: vi.fn((key: string) => {
          if (key === 'Content-Disposition') {
            return 'attachment; filename="test.pdf"';
          }
          return null;
        }),
      },
    };

    vi.mocked(global.fetch).mockResolvedValue(mockResponse as any);

    // Mock URL.createObjectURL and URL.revokeObjectURL
    const mockObjectURL = 'blob:mock-url';
    global.URL.createObjectURL = vi.fn(() => mockObjectURL);
    global.URL.revokeObjectURL = vi.fn();

    // Mock link click
    const mockClick = vi.fn();
    const mockLink = {
      href: '',
      download: '',
      click: mockClick,
      style: {},
    };
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'a') {
        return mockLink as any;
      }
      return originalCreateElement.call(document, tagName);
    }) as any;

    render(<PDFDownloadButton briefId={mockBriefId} />);

    const button = screen.getByRole('button', { name: /download pdf/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/research/briefs/${mockBriefId}/pdf`);
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockLink.href).toBe(mockObjectURL);
      expect(mockLink.download).toMatch(/\.pdf$/);
      expect(mockClick).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockObjectURL);
    });
  });

  it('should show loading state while downloading', async () => {
    const mockBlob = new Blob(['fake pdf'], { type: 'application/pdf' });
    let resolveDownload: (value: any) => void;
    const downloadPromise = new Promise((resolve) => {
      resolveDownload = resolve;
    });

    vi.mocked(global.fetch).mockReturnValue(downloadPromise as any);

    render(<PDFDownloadButton briefId={mockBriefId} />);

    const button = screen.getByRole('button', { name: /download pdf/i });
    fireEvent.click(button);

    // Check loading state
    await waitFor(() => {
      expect(button.textContent).toContain('Downloading');
      expect(button).toBeDisabled();
    });

    // Resolve download
    resolveDownload!({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    // Check button returns to normal state
    await waitFor(() => {
      expect(button.textContent).toContain('Download PDF');
      expect(button).not.toBeDisabled();
    });
  });

  it('should show error state on download failure', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as any);

    render(<PDFDownloadButton briefId={mockBriefId} />);

    const button = screen.getByRole('button', { name: /download pdf/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/failed to download/i)).toBeTruthy();
    });
  });

  it('should allow retry after error', async () => {
    // First call fails
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as any);

    render(<PDFDownloadButton briefId={mockBriefId} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/failed to download/i)).toBeTruthy();
    });

    // Second call succeeds
    const mockBlob = new Blob(['fake pdf'], { type: 'application/pdf' });
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
      headers: {
        get: vi.fn(() => 'attachment; filename="test.pdf"'),
      },
    } as any);

    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    const mockClick = vi.fn();
    const mockLink = {
      href: '',
      download: '',
      click: mockClick,
      style: {},
    };
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'a') {
        return mockLink as any;
      }
      return originalCreateElement.call(document, tagName);
    }) as any;

    // Click retry
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(mockClick).toHaveBeenCalled();
    });
  });

  it('should handle network errors gracefully', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    render(<PDFDownloadButton briefId={mockBriefId} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/failed to download/i)).toBeTruthy();
    });
  });

  it('should use custom button text if provided', () => {
    render(<PDFDownloadButton briefId={mockBriefId} buttonText="Export as PDF" />);

    expect(screen.getByText('Export as PDF')).toBeTruthy();
  });

  it('should apply custom className', () => {
    render(<PDFDownloadButton briefId={mockBriefId} className="custom-class" />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });
});
