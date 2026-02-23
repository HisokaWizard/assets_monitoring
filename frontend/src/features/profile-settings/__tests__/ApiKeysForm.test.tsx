import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiKeysForm } from '../ui/ApiKeysForm';

describe('ApiKeysForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('should render with empty initial data', () => {
    render(<ApiKeysForm onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText(/CoinMarketCap API Key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/OpenSea API Key/i)).toBeInTheDocument();
  });

  it('should render with existing keys masked', () => {
    render(
      <ApiKeysForm
        onSubmit={mockOnSubmit}
        initialData={{
          id: 1,
          userId: 1,
          coinmarketcapApiKey: 'test-api-key-12345678',
          openseaApiKey: 'opensea-key-12345678',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        }}
      />
    );
    expect(screen.getByPlaceholderText(/test\*\*\*\*5678/)).toBeInTheDocument();
  });

  it('should show validation error for short key', async () => {
    render(<ApiKeysForm onSubmit={mockOnSubmit} />);
    
    const input = screen.getByLabelText(/CoinMarketCap API Key/i);
    await userEvent.type(input, 'short');
    
    const saveButton = screen.getByText(/Save API Keys/i);
    await userEvent.click(saveButton);
    
    expect(screen.getByText(/at least 20 characters/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with form data', async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    render(<ApiKeysForm onSubmit={mockOnSubmit} />);
    
    const coinmarketcapInput = screen.getByLabelText(/CoinMarketCap API Key/i);
    await userEvent.type(coinmarketcapInput, 'test-api-key-123456789012');
    
    const saveButton = screen.getByText(/Save API Keys/i);
    await userEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        coinmarketcapApiKey: 'test-api-key-123456789012',
      });
    });
  });

  it('should show error when no keys entered', async () => {
    render(<ApiKeysForm onSubmit={mockOnSubmit} />);
    
    const saveButton = screen.getByText(/Save API Keys/i);
    await userEvent.click(saveButton);
    
    expect(screen.getByText(/Please enter at least one API key/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show success message after save', async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    render(<ApiKeysForm onSubmit={mockOnSubmit} />);
    
    const input = screen.getByLabelText(/CoinMarketCap API Key/i);
    await userEvent.type(input, 'test-api-key-123456789012');
    
    const saveButton = screen.getByText(/Save API Keys/i);
    await userEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/API keys saved successfully/i)).toBeInTheDocument();
    });
  });

  it('should disable submit while loading', () => {
    render(<ApiKeysForm onSubmit={mockOnSubmit} isLoading />);
    expect(screen.getByText(/Save API Keys/i)).toBeDisabled();
  });
});
