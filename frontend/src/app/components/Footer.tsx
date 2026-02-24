import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';
import { Email } from '@mui/icons-material';

export const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 1.5,
        px: 2,
        mt: 'auto',
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Assets Monitoring — сервис для отслеживания криптовалютных активов и NFT коллекций
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Email fontSize="small" />
            По вопросам: 
            <Link href="mailto:npa040493@gmail.com" underline="hover" color="primary">
              npa040493@gmail.com
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
