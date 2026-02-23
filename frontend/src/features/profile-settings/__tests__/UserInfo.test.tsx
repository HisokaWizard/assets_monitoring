import { render, screen } from '@testing-library/react';
import { UserInfo } from '../ui/UserInfo';

describe('UserInfo', () => {
  const defaultProps = {
    email: 'test@example.com',
    role: 'user',
    createdAt: '2024-01-15T10:30:00.000Z',
  };

  it('should render user email', () => {
    render(<UserInfo {...defaultProps} />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should render role as chip', () => {
    render(<UserInfo {...defaultProps} />);
    expect(screen.getByText('USER')).toBeInTheDocument();
  });

  it('should render admin role with secondary color', () => {
    render(<UserInfo {...defaultProps} role="admin" />);
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('should render created date formatted', () => {
    render(<UserInfo {...defaultProps} />);
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
  });

  it('should render title', () => {
    render(<UserInfo {...defaultProps} />);
    expect(screen.getByText('Account Information')).toBeInTheDocument();
  });
});
