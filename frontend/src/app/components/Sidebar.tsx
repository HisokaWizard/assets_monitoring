import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Button, IconButton, Typography } from '@mui/material';
import { Collections, Token, AccountCircle, Logout, MenuOpen, Menu } from '@mui/icons-material';
import { useAppDispatch } from '../../app/providers/store';
import { logout } from '../../features/auth';

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    title: 'NFTs',
    path: '/nfts',
    icon: <Collections />,
  },
  {
    title: 'Tokens',
    path: '/tokens',
    icon: <Token />,
  },
  {
    title: 'Profile',
    path: '/profile',
    icon: <AccountCircle />,
  },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <Box
      sx={{
        width: isOpen ? 200 : 56,
        flexShrink: 0,
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconButton onClick={() => setIsOpen(!isOpen)} color="primary">
          {isOpen ? <MenuOpen /> : <Menu />}
        </IconButton>
      </Box>
      
      {isOpen && (
        <Box sx={{ px: 1, pb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
            Menu
          </Typography>
        </Box>
      )}
      
      <List sx={{ flex: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActive}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  minHeight: 48,
                  justifyContent: isOpen ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isOpen ? 2 : 'auto',
                    justifyContent: 'center',
                    color: 'primary.main',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {isOpen && <ListItemText primary={item.title} />}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 1 }}>
        <Button
          variant={isOpen ? 'outlined' : 'text'}
          color="error"
          fullWidth={isOpen}
          startIcon={isOpen ? <Logout /> : <Logout />}
          onClick={handleLogout}
          sx={{ 
            justifyContent: isOpen ? 'flex-start' : 'center',
            minWidth: 'auto',
          }}
        >
          {isOpen && 'Logout'}
        </Button>
      </Box>
    </Box>
  );
};
