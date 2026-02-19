import React from 'react';
import { Container, Typography, Box } from '@mui/material';

export const TokensPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Tokens
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Token portfolio page - coming soon
        </Typography>
      </Box>
    </Container>
  );
};
