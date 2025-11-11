import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import { DashboardPage } from './pages/DashboardPage';
import { ScenesPage } from './pages/ScenesPage';
import { ControlPage } from './pages/ControlPage';
import { SettingsPage } from './pages/SettingsPage';
import { ConnectionPage } from './pages/ConnectionPage';
import { FixturePatchingPage } from './pages/FixturePatchingPage';
import { Layout } from './components/Layout';

export function App() {
  const { serverUrl, connected, connect } = useStore();

  useEffect(() => {
    if (serverUrl && !connected) {
      connect();
    }
  }, [serverUrl, connected, connect]);

  if (!serverUrl) {
    return <ConnectionPage />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/scenes" element={<ScenesPage />} />
          <Route path="/control" element={<ControlPage />} />
          <Route path="/fixtures" element={<FixturePatchingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
