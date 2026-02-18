/**
 * @fileoverview Страница регистрации нового пользователя.
 *
 * Форма регистрации с валидацией и обработкой состояний.
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
  CircularProgress,
  MenuItem,
  Link
} from '@mui/material';
import { useRegister } from '../../features/auth/hooks';
import { RegisterDto } from '../../shared/api/auth/types';

interface RegisterPageProps {
  /**
   * Callback при отправке формы.
   */
  onSubmit?: (data: RegisterDto) => void;
  
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
 * Страница регистрации нового пользователя.
 *
 * Отображает форму регистрации с валидацией.
 */
export const RegisterPage: React.FC<RegisterPageProps> = ({ onSubmit }) => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useRegister();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
    confirmPassword?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Некорректный email';
    }
    
    if (!password) {
      newErrors.password = 'Пароль обязателен';
    } else if (password.length < 6) {
      newErrors.password = 'Пароль должен быть минимум 6 символов';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Подтверждение пароля обязательно';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      const data = { email, password, role };
      
      if (onSubmit) {
        onSubmit(data);
      } else {
        try {
          await register(data);
          navigate('/login', { replace: true });
        } catch {
          // Error is handled by useRegister
        }
      }
    }
  };

  const displayError = error ? (error as Error).message || 'Ошибка регистрации' : null;

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
          Регистрация
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
          
          <TextField
            label="Подтверждение пароля"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword}
            fullWidth
            margin="normal"
            disabled={isLoading}
          />
          
          <TextField
            label="Роль"
            select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            fullWidth
            margin="normal"
            disabled={isLoading}
          >
            <MenuItem value="user">Пользователь</MenuItem>
            <MenuItem value="admin">Администратор</MenuItem>
          </TextField>
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading}
            sx={{ mt: 3 }}
            startIcon={isLoading ? <CircularProgress size={20} data-testid="circular-progress" /> : null}
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link 
              href="/login" 
              underline="hover"
              sx={{ cursor: 'pointer' }}
            >
              Уже есть аккаунт? Войти
            </Link>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};
