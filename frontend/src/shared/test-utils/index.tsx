import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { theme } from '../../app/styles/theme';
import { store } from '../../app/providers/store';

interface WrapperProps {
  children: ReactNode;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    ...renderOptions
  }: {
    initialEntries?: string[];
  } & Omit<RenderOptions, 'wrapper'> = {}
) {
  const testStore = store;

  function CustomWrapper({ children }: WrapperProps) {
    return (
      <Provider store={testStore}>
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={initialEntries}>
            {children}
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    );
  }

  return {
    store: testStore,
    ...render(ui, { wrapper: CustomWrapper, ...renderOptions }),
  };
}

export * from '@testing-library/react';
