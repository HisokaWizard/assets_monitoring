import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <Box
        component='main'
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ flexShrink: 0, px: 0, pb: 1 }}>
          <Breadcrumbs />
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            px: 3,
          }}
        >
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};
