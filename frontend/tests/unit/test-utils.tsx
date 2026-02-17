import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../src/app/styles/theme';
import { store } from '../../src/app/providers/store';
import { RootState } from '../../src/app/providers/store';

interface WrapperProps {
  children: ReactNode;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {} as Partial<RootState>,
    ...renderOptions
  }: {
    preloadedState?: Partial<RootState>;
  } & Omit<RenderOptions, 'wrapper'> = {}
) {
  const testStore = store;

  function CustomWrapper({ children }: WrapperProps) {
    return (
      <Provider store={testStore}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </Provider>
    );
  }

  return {
    store: testStore,
    ...render(ui, { wrapper: CustomWrapper, ...renderOptions }),
  };
}

export * from '@testing-library/react';
