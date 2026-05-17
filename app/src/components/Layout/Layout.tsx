import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: 'calc(100vh - 64px)',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 3 },
          pb: { xs: 'calc(72px + env(safe-area-inset-bottom))', md: 3 },
          maxWidth: '1280px',
          width: '100%',
          mx: 'auto',
        }}
      >
        <Outlet />
      </Box>
      <Footer />
      <BottomNav />
    </Box>
  );
}
