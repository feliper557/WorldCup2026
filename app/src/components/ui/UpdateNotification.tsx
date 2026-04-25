/// <reference types="vite-plugin-pwa/react" />
import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { logout } from '../../services/auth';

export function UpdateNotification() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();

  useEffect(() => {
    if (!needRefresh) return;
    logout();
    updateServiceWorker(true);
  }, [needRefresh, updateServiceWorker]);

  return null;
}
