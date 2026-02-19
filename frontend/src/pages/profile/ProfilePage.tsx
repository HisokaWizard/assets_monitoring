import React from 'react';
import { Container, Typography, Box } from '@mui/material';

export const ProfilePage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          User profile page - coming soon
        </Typography>
      </Box>
    </Container>
  );
};
