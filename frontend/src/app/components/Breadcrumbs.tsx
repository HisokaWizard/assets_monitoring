import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Breadcrumbs as MuiBreadcrumbs, Link as MuiLink, Typography } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const routeLabels: Record<string, string> = {
  '/': 'Home',
  '/nfts': 'NFTs',
  '/tokens': 'Tokens',
  '/profile': 'Profile',
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbs: BreadcrumbItem[] = pathnames.map((value, index) => {
    const path = `/${value}`;
    const label = routeLabels[path] || value;
    const isLast = index === pathnames.length - 1;

    return {
      label,
      path: isLast ? '' : path,
    };
  });

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <MuiBreadcrumbs
      separator={<NavigateNext fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 2 }}
    >
      <MuiLink
        component={Link}
        to="/"
        underline="hover"
        color="inherit"
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        Home
      </MuiLink>
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        if (isLast) {
          return (
            <Typography
              key={breadcrumb.path}
              color="text.primary"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              {breadcrumb.label}
            </Typography>
          );
        }

        return (
          <MuiLink
            key={breadcrumb.path}
            component={Link}
            to={breadcrumb.path}
            underline="hover"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            {breadcrumb.label}
          </MuiLink>
        );
      })}
    </MuiBreadcrumbs>
  );
};
