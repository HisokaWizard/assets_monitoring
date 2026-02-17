import { render, screen } from '@testing-library/react';
import { HomePage } from '../HomePage';

describe('HomePage', () => {
  it('should render main title', () => {
    render(<HomePage />);
    expect(screen.getByText('Assets Monitoring')).toBeInTheDocument();
  });

  it('should render subtitle with description', () => {
    render(<HomePage />);
    expect(screen.getByText('Track your cryptocurrency and NFT portfolio')).toBeInTheDocument();
  });

  it('should render welcome message', () => {
    render(<HomePage />);
    expect(screen.getByText('Welcome!')).toBeInTheDocument();
  });

  it('should render list of technologies', () => {
    render(<HomePage />);
    expect(screen.getByText('React 18+')).toBeInTheDocument();
    expect(screen.getByText('TypeScript 5+')).toBeInTheDocument();
    expect(screen.getByText('Material UI 7')).toBeInTheDocument();
    expect(screen.getByText('Redux Toolkit')).toBeInTheDocument();
    expect(screen.getByText('React Router 6')).toBeInTheDocument();
    expect(screen.getByText('Webpack 5')).toBeInTheDocument();
  });

  it('should render architecture description', () => {
    render(<HomePage />);
    expect(
      screen.getByText(/Start building your features following the FSD/)
    ).toBeInTheDocument();
  });

  it('should render in a Container component', () => {
    render(<HomePage />);
    const container = screen.getByText('Assets Monitoring').closest('.MuiContainer-root');
    expect(container).toBeInTheDocument();
  });

  it('should render in a Paper component', () => {
    render(<HomePage />);
    const paper = screen.getByText('Welcome!').closest('.MuiPaper-root');
    expect(paper).toBeInTheDocument();
  });
});
