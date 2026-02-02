# FRONTEND.md — Руководство по разработке Frontend

## Стек технологий

- **React**: 18-19 (Functional Components + Hooks)
- **TypeScript**: 5+ (strict mode)
- **State Management**: Redux Toolkit + RTK Query
- **Routing**: React Router 6
- **UI Library**: MUI 7 (Material UI)
- **Testing**: Jest + React Testing Library (unit), Playwright (e2e/integration)
- **Build**: Webpack 5
- **Архитектура**: Feature-Sliced Design (FSD)

---

## Архитектура FSD (Feature-Sliced Design)

### Структура слоёв

```
frontend/src/
├── app/                    # Инициализация приложения
│   ├── providers/          # Провайдеры (Redux, MUI, Router)
│   ├── router/             # Конфигурация роутов
│   ├── store/              # Store конфигурация
│   ├── styles/             # Глобальные стили
│   └── index.tsx           # Точка входа
├── pages/                  # Страницы приложения
│   ├── login/
│   ├── dashboard/
│   └── assets/
├── widgets/                # Самостоятельные UI-блоки
│   ├── header/
│   ├── sidebar/
│   └── assetList/
├── features/               # Пользовательские сценарии
│   ├── auth/
│   ├── createAsset/
│   ├── updateAsset/
│   └── notificationSettings/
├── entities/               # Бизнес-сущности
│   ├── user/
│   ├── asset/
│   └── notification/
└── shared/                 # Переиспользуемые модули
    ├── api/                # API клиент, RTK Query base
    ├── ui/                 # Базовые UI-компоненты
    ├── lib/                # Утилиты, хелперы
    ├── config/             # Конфигурация
    └── types/              # Глобальные типы
```

### Принципы FSD

1. **Изоляция**: Каждый слой зависит только от нижележащих
2. **Public API**: Каждый модуль экспортирует только то, что нужно (через `index.ts`)
3. **Single Responsibility**: Один модуль = одна ответственность

### Public API паттерн

Каждый модуль имеет `index.ts` для контроля экспортов:

```typescript
// entities/user/index.ts
export { userSlice, userActions, userSelectors } from './model';
export { UserCard } from './ui';
export { useUser } from './hooks';
export type { User, UserRole } from './types';

// Запрещено импортировать напрямую из внутренних файлов
// ❌ import { UserCard } from 'entities/user/ui/UserCard';
// ✅ import { UserCard } from 'entities/user';
```

---

## Паттерны Redux Toolkit

### Структура Slice

```typescript
// entities/asset/model/assetSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Asset } from '../types';

interface AssetState {
  items: Asset[];
  selectedId: number | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AssetState = {
  items: [],
  selectedId: null,
  isLoading: false,
  error: null,
};

export const assetSlice = createSlice({
  name: 'asset',
  initialState,
  reducers: {
    setAssets: (state, action: PayloadAction<Asset[]>) => {
      state.items = action.payload;
    },
    selectAsset: (state, action: PayloadAction<number>) => {
      state.selectedId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setAssets, selectAsset, clearError } = assetSlice.actions;
```

### RTK Query для API

```typescript
// shared/api/baseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseApi = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Asset', 'User', 'Notification'],
  endpoints: () => ({}),
});

// entities/asset/api/assetApi.ts
import { baseApi } from 'shared/api';
import { Asset, CreateAssetDto, UpdateAssetDto } from '../types';

export const assetApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAssets: builder.query<Asset[], void>({
      query: () => '/assets',
      providesTags: ['Asset'],
    }),
    getAssetById: builder.query<Asset, number>({
      query: (id) => `/assets/${id}`,
      providesTags: (result, error, id) => [{ type: 'Asset', id }],
    }),
    createAsset: builder.mutation<Asset, CreateAssetDto>({
      query: (body) => ({
        url: '/assets',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Asset'],
    }),
    updateAsset: builder.mutation<Asset, { id: number; data: UpdateAssetDto }>({
      query: ({ id, data }) => ({
        url: `/assets/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Asset', id }],
    }),
    deleteAsset: builder.mutation<void, number>({
      query: (id) => ({
        url: `/assets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Asset'],
    }),
  }),
});

export const {
  useGetAssetsQuery,
  useGetAssetByIdQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
} = assetApi;
```

### Селекторы

```typescript
// entities/asset/model/selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from 'app/store';

const selectAssetState = (state: RootState) => state.asset;

export const selectAllAssets = createSelector(
  [selectAssetState],
  (assetState) => assetState.items
);

export const selectSelectedAsset = createSelector(
  [selectAssetState],
  (assetState) => assetState.items.find(a => a.id === assetState.selectedId)
);

export const selectAssetsByType = (type: 'crypto' | 'nft') =>
  createSelector([selectAllAssets], (assets) =>
    assets.filter((asset) => asset.type === type)
  );
```

### Async Thunks

```typescript
// features/auth/model/loginThunk.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from 'shared/api';
import { LoginDto, AuthResponse } from './types';

export const loginThunk = createAsyncThunk<
  AuthResponse,
  LoginDto,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await authApi.login(credentials);
    localStorage.setItem('token', response.token);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

// В slice
extraReducers: (builder) => {
  builder
    .addCase(loginThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(loginThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
    })
    .addCase(loginThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Unknown error';
    });
}
```

---

## Паттерны React Router 6

### Конфигурация роутов

```typescript
// app/router/router.tsx
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from 'widgets/layout';
import { LoginPage } from 'pages/login';
import { DashboardPage } from 'pages/dashboard';
import { AssetsPage } from 'pages/assets';
import { useAuth } from 'entities/user';

const PrivateRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = () => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/assets',
            element: <AssetsPage />,
          },
          {
            path: '/assets/:id',
            element: <AssetDetailPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

// app/index.tsx
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export const App = () => {
  return <RouterProvider router={router} />;
};
```

### Lazy Loading

```typescript
// pages/assets/index.ts
import { lazy } from 'react';

export const AssetsPage = lazy(() => import('./AssetsPage'));

// app/router.tsx
import { Suspense } from 'react';

{
  path: '/assets',
  element: (
    <Suspense fallback={<PageLoader />}>
      <AssetsPage />
    </Suspense>
  ),
}
```

### Layout с Outlet

```typescript
// widgets/layout/MainLayout.tsx
import { Outlet } from 'react-router-dom';
import { Header } from 'widgets/header';
import { Sidebar } from 'widgets/sidebar';

export const MainLayout = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Header />
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};
```

---

## Паттерны React компонентов

### Functional Component шаблон

```typescript
// entities/asset/ui/AssetCard/AssetCard.tsx
import { memo } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { Asset } from '../../types';

interface AssetCardProps {
  asset: Asset;
  onClick?: (id: number) => void;
  selected?: boolean;
}

export const AssetCard = memo<AssetCardProps>(function AssetCard({
  asset,
  onClick,
  selected = false,
}) {
  const handleClick = () => {
    onClick?.(asset.id);
  };

  return (
    <Card
      onClick={handleClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        border: selected ? '2px solid primary.main' : 'none',
      }}
    >
      <CardContent>
        <Typography variant="h6">{asset.symbol}</Typography>
        <Typography color="text.secondary">{asset.amount}</Typography>
      </CardContent>
    </Card>
  );
});
```

### Custom Hooks

```typescript
// entities/asset/hooks/useAssets.ts
import { useMemo } from 'react';
import { useGetAssetsQuery } from '../api';
import { selectAssetsByType } from '../model';
import { useAppSelector } from 'shared/lib';

export const useAssets = (type?: 'crypto' | 'nft') => {
  const { data: assets, isLoading, error } = useGetAssetsQuery();
  
  const filteredAssets = useMemo(() => {
    if (!type || !assets) return assets;
    return assets.filter(asset => asset.type === type);
  }, [assets, type]);

  return {
    assets: filteredAssets,
    isLoading,
    error,
  };
};

// entities/user/hooks/useAuth.ts
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, selectUser, logout } from '../model';

export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
  };

  return {
    user,
    isAuthenticated,
    logout: handleLogout,
  };
};
```

### Композиция компонентов

```typescript
// features/createAsset/ui/CreateAssetForm/CreateAssetForm.tsx
import { useState } from 'react';
import { Box, Button, TextField } from '@mui/material';
import { useCreateAssetMutation } from 'entities/asset';
import { AssetTypeSelect } from './AssetTypeSelect';
import { PriceInput } from './PriceInput';

interface FormData {
  type: 'crypto' | 'nft';
  symbol: string;
  amount: number;
  price: number;
}

export const CreateAssetForm = () => {
  const [formData, setFormData] = useState<FormData>({
    type: 'crypto',
    symbol: '',
    amount: 0,
    price: 0,
  });

  const [createAsset, { isLoading }] = useCreateAssetMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAsset(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <AssetTypeSelect
        value={formData.type}
        onChange={(type) => setFormData({ ...formData, type })}
      />
      <TextField
        label="Symbol"
        value={formData.symbol}
        onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
      />
      <PriceInput
        value={formData.price}
        onChange={(price) => setFormData({ ...formData, price })}
      />
      <Button type="submit" disabled={isLoading}>
        Create Asset
      </Button>
    </Box>
  );
};
```

---

## Паттерны TypeScript

### Strict Mode конфигурация

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "app/*": ["src/app/*"],
      "pages/*": ["src/pages/*"],
      "widgets/*": ["src/widgets/*"],
      "features/*": ["src/features/*"],
      "entities/*": ["src/entities/*"],
      "shared/*": ["src/shared/*"]
    }
  }
}
```

### Discriminated Unions

```typescript
// entities/asset/types/asset.ts
export interface BaseAsset {
  id: number;
  amount: number;
  middlePrice: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CryptoAsset extends BaseAsset {
  type: 'crypto';
  symbol: string;
  fullName: string;
  currentPrice: number;
}

export interface NFTAsset extends BaseAsset {
  type: 'nft';
  collectionName: string;
  floorPrice: number;
  traitPrice: number;
}

export type Asset = CryptoAsset | NFTAsset;

// Type guard
export const isCryptoAsset = (asset: Asset): asset is CryptoAsset =>
  asset.type === 'crypto';

export const isNFTAsset = (asset: Asset): asset is NFTAsset =>
  asset.type === 'nft';
```

### Генерация типов из Backend

```typescript
// shared/api/generated/types.ts
// Генерируется автоматически из OpenAPI/Swagger backend

// Используем openapi-typescript:
// npx openapi-typescript http://localhost:3000/api-json --output src/shared/api/generated/types.ts

export type components = {
  schemas: {
    Asset: {
      id: number;
      type: 'crypto' | 'nft';
      amount: number;
      middlePrice: number;
      // ...
    };
    CreateAssetDto: {
      type: 'crypto' | 'nft';
      amount: number;
      // ...
    };
    // ...
  };
};

// Переэкспорт для удобства
export type Asset = components['schemas']['Asset'];
export type CreateAssetDto = components['schemas']['CreateAssetDto'];
```

---

## Паттерны тестирования (TDD)

### Unit-тесты компонентов (Jest + RTL)

```typescript
// entities/asset/ui/AssetCard/AssetCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetCard } from './AssetCard';

const mockAsset = {
  id: 1,
  type: 'crypto' as const,
  symbol: 'BTC',
  amount: 1.5,
  middlePrice: 50000,
  userId: 1,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('AssetCard', () => {
  it('should render asset information', () => {
    render(<AssetCard asset={mockAsset} />);
    
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('1.5')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<AssetCard asset={mockAsset} onClick={onClick} />);
    
    fireEvent.click(screen.getByText('BTC'));
    
    expect(onClick).toHaveBeenCalledWith(1);
  });

  it('should show selected state', () => {
    render(<AssetCard asset={mockAsset} selected />);
    
    const card = screen.getByRole('article');
    expect(card).toHaveStyle({ border: '2px solid' });
  });
});
```

### Тестирование Redux slices

```typescript
// entities/asset/model/assetSlice.test.ts
import { assetSlice, setAssets, selectAsset } from './assetSlice';

const { reducer } = assetSlice;

describe('assetSlice', () => {
  const initialState = {
    items: [],
    selectedId: null,
    isLoading: false,
    error: null,
  };

  it('should handle setAssets', () => {
    const assets = [{ id: 1, symbol: 'BTC' }];
    const nextState = reducer(initialState, setAssets(assets));
    
    expect(nextState.items).toEqual(assets);
  });

  it('should handle selectAsset', () => {
    const nextState = reducer(initialState, selectAsset(1));
    
    expect(nextState.selectedId).toBe(1);
  });
});
```

### Тестирование hooks

```typescript
// entities/asset/hooks/useAssets.test.ts
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useAssets } from './useAssets';

const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      asset: assetReducer,
    },
    preloadedState,
  });
};

const wrapper = (store: ReturnType<typeof createTestStore>) => {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
};

describe('useAssets', () => {
  it('should return filtered assets by type', () => {
    const store = createTestStore({
      asset: {
        items: [
          { id: 1, type: 'crypto', symbol: 'BTC' },
          { id: 2, type: 'nft', collectionName: 'BAYC' },
        ],
      },
    });

    const { result } = renderHook(() => useAssets('crypto'), {
      wrapper: wrapper(store),
    });

    expect(result.current.assets).toHaveLength(1);
    expect(result.current.assets[0].type).toBe('crypto');
  });
});
```

### E2E тесты (Playwright)

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can login', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('user sees error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'wrong');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});

// e2e/assets.spec.ts
test.describe('Assets CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Login перед каждым тестом
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('user can create new asset', async ({ page }) => {
    await page.click('text=Add Asset');
    await page.selectOption('[name="type"]', 'crypto');
    await page.fill('[name="symbol"]', 'ETH');
    await page.fill('[name="amount"]', '10');
    await page.click('text=Create');
    
    await expect(page.locator('text=ETH')).toBeVisible();
  });
});
```

### Page Object Model (Playwright)

```typescript
// e2e/pages/LoginPage.ts
import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async expectError(message: string) {
    await expect(this.page.locator(`text=${message}`)).toBeVisible();
  }
}

// e2e/pages/DashboardPage.ts
export class DashboardPage {
  constructor(private page: Page) {}

  async expectLoaded() {
    await expect(this.page).toHaveURL('/dashboard');
    await expect(this.page.locator('text=Dashboard')).toBeVisible();
  }

  async openAssets() {
    await this.page.click('text=Assets');
  }
}
```

---

## Интеграция с бэкендом

### Axios instance с interceptors

```typescript
// shared/api/axios.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - добавление токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - обработка ошибок и refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('/auth/refresh', { refreshToken });
        const { token } = response.data;
        
        localStorage.setItem('token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Logout пользователя
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### Обработка ошибок API

```typescript
// shared/api/errorHandler.ts
import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export const getErrorMessage = (
  error: FetchBaseQueryError | SerializedError | undefined
): string => {
  if (!error) return 'Unknown error';

  if ('data' in error) {
    return (error.data as { message?: string })?.message || 'Server error';
  }

  if ('message' in error) {
    return error.message || 'Error';
  }

  return 'Unknown error';
};

// Использование в компоненте
const [createAsset, { isLoading, error }] = useCreateAssetMutation();
const errorMessage = getErrorMessage(error);
```

---

## Паттерны MUI

### Theme Provider

```typescript
// app/providers/ThemeProvider.tsx
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>;
};
```

### sx prop vs styled components

```typescript
// sx prop - для простых случаев
<Box
  sx={{
    display: 'flex',
    gap: 2,
    p: 2,
    bgcolor: 'background.paper',
    borderRadius: 1,
  }}
>
  <Typography>Content</Typography>
</Box>

// styled - для переиспользуемых компонентов
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
  '&:hover': {
    boxShadow: theme.shadows[6],
  },
}));
```

### Адаптивный дизайн

```typescript
import { useTheme, useMediaQuery } from '@mui/material';

const ResponsiveComponent = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={isMobile ? 12 : 6}>
        <AssetList compact={isMobile} />
      </Grid>
    </Grid>
  );
};

// Или через sx
<Box
  sx={{
    width: { xs: '100%', sm: '50%', md: '33%' },
    display: { xs: 'none', md: 'block' },
  }}
/>
```

---

## ESLint и Prettier конфигурация

### ESLint

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y', 'fsd'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    'fsd/layer-imports': [
      'error',
      {
        // Запретить импорт из верхних слоёв
        alias: '@',
        ignoreImportPatterns: ['**/store', '**/router'],
      },
    ],
    'fsd/public-api-imports': 'error',
    'fsd/path-checker': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
```

### Prettier

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

### Pre-commit hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

---

## Команды

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm start

# Сборка production
npm run build

# Запуск unit-тестов
npm test

# Запуск тестов в watch режиме
npm run test:watch

# Запуск тестов с покрытием
npm run test:coverage

# Запуск конкретного теста
npm test -- AssetCard.test.tsx

# Запуск E2E тестов (Playwright)
npm run test:e2e

# Запуск E2E в UI режиме
npm run test:e2e:ui

# Генерация типов из backend
npm run generate:types

# Линтинг
npm run lint

# Линтинг с автофиксом
npm run lint:fix

# Форматирование
npm run format

# Type check
npm run type-check
```

---

## Чеклист создания новой фичи (TDD)

### Шаг 1: Подготовка
- [ ] Проанализировать требования (входные данные, ожидаемый результат)
- [ ] Определить какие слои затронуты (entities/features/widgets/pages)
- [ ] Определить необходимые API endpoints
- [ ] Создать структуру папок по FSD

### Шаг 2: Red (написать тесты)
- [ ] Написать unit-тесты для компонентов (файл `ComponentName.test.tsx`)
- [ ] Написать тесты для slice/hooks
- [ ] Запустить тесты — должны упасть (RED)

### Шаг 3: Green (минимальная реализация)
- [ ] Создать types (DTO, Entity types)
- [ ] Создать API (RTK Query endpoints)
- [ ] Создать slice (state, actions)
- [ ] Создать UI-компоненты (минимальный функционал)
- [ ] Создать hooks
- [ ] Запустить тесты — должны проходить (GREEN)

### Шаг 4: Рефакторинг
- [ ] Улучшить имена переменных и функций
- [ ] Вынести повторяющуюся логику
- [ ] Оптимизировать селекторы (createSelector)
- [ ] Добавить мемоизацию (useMemo, useCallback, React.memo)
- [ ] Убедиться, что тесты проходят после рефакторинга

### Шаг 5: Интеграция
- [ ] Добавить Public API exports в `index.ts`
- [ ] Добавить роут в `app/router/` (если нужна страница)
- [ ] Интегрировать в `pages/` или `widgets/`

### Шаг 6: E2E тесты
- [ ] Написать Playwright тесты для user flow
- [ ] Добавить Page Object Model если нужно
- [ ] Запустить e2e тесты

### Шаг 7: Финализация
- [ ] Проверить линтинг: `npm run lint`
- [ ] Проверить форматирование: `npm run format`
- [ ] Проверить типы: `npm run type-check`
- [ ] Запустить все тесты: `npm test`

---

## Примеры структуры фичи

```
features/createAsset/
├── index.ts                    # Public API
├── api/
│   └── createAssetApi.ts       # RTK Query mutation
├── model/
│   ├── index.ts
│   ├── slice.ts                # Slice (если нужен локальный state)
│   ├── selectors.ts            # Селекторы
│   └── types.ts                # Локальные типы
├── ui/
│   ├── CreateAssetForm/
│   │   ├── index.ts
│   │   ├── CreateAssetForm.tsx
│   │   └── CreateAssetForm.test.tsx
│   └── AssetTypeSelect/
│       ├── index.ts
│       └── AssetTypeSelect.tsx
└── hooks/
    ├── index.ts
    └── useCreateAsset.ts       # Кастомный хук
```
