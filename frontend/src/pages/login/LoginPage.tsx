/**
 * @fileoverview Страница входа в систему.
 *
 * Форма аутентификации с валидацией и обработкой состояний.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  CircularProgress 
} from '@mui/material';
import { useLogin } from '../../features/auth/hooks';
import { LoginDto } from '../../shared/api/auth/types';

interface LoginPageProps {
  /**
   * Callback при отправке формы.
   */
  onSubmit?: (data: LoginDto) => void;
  
  /**
   * Флаг загрузки.
   */
  isLoading?: boolean;
  
  /**
   * Сообщение об ошибке.
   */
  error?: string | null;
}

/**
 * Страница входа в систему.
 *
 * Отображает форму аутентификации с валидацией.
 */
export const LoginPage: React.FC<LoginPageProps> = ({ onSubmit }) => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Некорректный email';
    }
    
    if (!password) {
      newErrors.password = 'Пароль обязателен';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      const data = { email, password };
      
      if (onSubmit) {
        onSubmit(data);
      } else {
        try {
          await login(data);
          navigate('/', { replace: true });
        } catch {
          // Error is handled by useLogin
        }
      }
    }
  };

  const displayError = error ? (error as Error).message || 'Ошибка входа' : null;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.100',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Вход в систему
        </Typography>
        
        {displayError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {displayError}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={Boolean(errors.email)}
            helperText={errors.email}
            fullWidth
            margin="normal"
            disabled={isLoading}
          />
          
          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={Boolean(errors.password)}
            helperText={errors.password}
            fullWidth
            margin="normal"
            disabled={isLoading}
          />
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading}
            sx={{ mt: 3 }}
            startIcon={isLoading ? <CircularProgress size={20} data-testid="circular-progress" /> : null}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};
