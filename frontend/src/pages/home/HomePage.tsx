import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

export const HomePage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Assets Monitoring
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary">
          Track your cryptocurrency and NFT portfolio
        </Typography>
      </Box>
      
      <Paper elevation={2} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Welcome!
        </Typography>
        <Typography variant="body1" paragraph>
          This is a base frontend application built with:
        </Typography>
        <ul>
          <li>React 18+</li>
          <li>TypeScript 5+</li>
          <li>Material UI 7</li>
          <li>Redux Toolkit</li>
          <li>React Router 6</li>
          <li>Webpack 5</li>
        </ul>
        <Typography variant="body1">
          Start building your features following the FSD (Feature-Sliced Design) architecture.
        </Typography>
      </Paper>
    </Container>
  );
};
