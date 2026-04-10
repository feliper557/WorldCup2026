import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { RequireAuth } from './components/auth/RequireAuth';
import {
  LoginPage,
  RegisterPage,
  MatchesPage,
  RankingPage,
  ParticipantsPage,
  InfoPage,
  RafflesPage,
  AdminPage,
  PaymentResultPage,
} from './pages';

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
