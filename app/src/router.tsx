import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { RequireAuth } from './components/auth/RequireAuth';
import {
  LoginPage,
  MatchesPage,
  RankingPage,
  ParticipantsPage,
  InfoPage,
  RafflesPage,
  AdminPage,
} from './pages';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: <MatchesPage />,
          },
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
            path: 'info',
            element: <InfoPage />,
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
