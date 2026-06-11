import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { RequireAuth } from './components/auth/RequireAuth';
import { InfoPage } from './pages/InfoPage';

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const PaymentResultPage = lazy(() => import('./pages/PaymentResultPage').then(m => ({ default: m.PaymentResultPage })));
const MatchesPage = lazy(() => import('./pages/MatchesPage').then(m => ({ default: m.MatchesPage })));
const RankingPage = lazy(() => import('./pages/RankingPage').then(m => ({ default: m.RankingPage })));
const ParticipantsPage = lazy(() => import('./pages/ParticipantsPage').then(m => ({ default: m.ParticipantsPage })));
const RafflesPage = lazy(() => import('./pages/RafflesPage').then(m => ({ default: m.RafflesPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/pago-resultado',
    element: <PaymentResultPage />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <InfoPage />,
      },
      {
        path: 'info',
        element: <InfoPage />,
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: 'matches',
            element: <MatchesPage />,
          },
          {
            path: 'ranking',
            element: <RankingPage />,
          },
          {
            path: 'participants',
            element: <ParticipantsPage />,
          },
          {
            path: 'raffles',
            element: <RafflesPage />,
          },
          {
            path: 'admin',
            element: <AdminPage />,
          },
        ],
      },
    ],
  },
]);
