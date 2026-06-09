import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import MainLayout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WorkOrders from './pages/WorkOrders';
import Stones from './pages/Stones';
import Customers from './pages/Customers';
import Materials from './pages/Materials';
import Sandpaper from './pages/Sandpaper';
import api from './api';

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AuthInitializer = ({ children }) => {
  const [checking, setChecking] = useState(() => {
    const token = localStorage.getItem('token');
    return !!token && !isTokenExpired(token);
  });

  useEffect(() => {
    if (!checking) return;
    api.get('/users')
      .then(() => setChecking(false))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      });
  }, [checking]);

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
        <Spin size="large" tip="验证登录状态..." />
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <AuthInitializer>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="work-orders" element={<WorkOrders />} />
              <Route path="stones" element={<Stones />} />
              <Route path="customers" element={<Customers />} />
              <Route path="materials" element={<Materials />} />
              <Route path="sandpaper" element={<Sandpaper />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthInitializer>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
