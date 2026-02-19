import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/providers/store';
import { Container, Typography, Box, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { Collections, Token, AccountCircle, Logout } from '@mui/icons-material';
import { logout } from '../../features/auth';

interface NavCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  isLogout?: boolean;
}

const NavCard: React.FC<NavCardProps> = ({ title, description, icon, onClick, isLogout }) => {
  return (
    <Card elevation={3}>
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Box sx={{ color: isLogout ? 'error.main' : 'primary.main', mb: 2 }}>
            {icon}
          </Box>
          <Typography variant="h5" component="h2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const navItems = [
    {
      title: 'NFTs',
      description: 'View your NFT portfolio',
      icon: <Collections sx={{ fontSize: 48 }} />,
      onClick: () => navigate('/nfts'),
    },
    {
      title: 'Tokens',
      description: 'View your token holdings',
      icon: <Token sx={{ fontSize: 48 }} />,
      onClick: () => navigate('/tokens'),
    },
    {
      title: 'Profile',
      description: 'Manage your account',
      icon: <AccountCircle sx={{ fontSize: 48 }} />,
      onClick: () => navigate('/profile'),
    },
    {
      title: 'Logout',
      description: 'Sign out of your account',
      icon: <Logout sx={{ fontSize: 48 }} />,
      onClick: handleLogout,
      isLogout: true,
    },
  ];

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

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {navItems.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <NavCard
              title={item.title}
              description={item.description}
              icon={item.icon}
              onClick={item.onClick}
              isLogout={item.isLogout}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};
