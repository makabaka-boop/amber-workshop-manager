import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login';
import MainLayout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WorkOrders from './pages/WorkOrders';
import Stones from './pages/Stones';
import Customers from './pages/Customers';
import Materials from './pages/Materials';
import Sandpaper from './pages/Sandpaper';
import { verifyToken } from './api';

const ProtectedRoute = ({ children, authStatus }) => {
  if (authStatus === 'checking') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }
  if (authStatus !== 'authed') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  // 'checking' | 'authed' | 'guest'
  const [authStatus, setAuthStatus] = useState(() => {
    return localStorage.getItem('token') ? 'checking' : 'guest';
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthStatus('guest');
      return;
    }
    verifyToken()
      .then(() => setAuthStatus('authed'))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthStatus('guest');
      });
  }, []);

  const handleLoginSuccess = () => setAuthStatus('authed');

  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/" element={
            <ProtectedRoute authStatus={authStatus}>
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
          <Route path="*" element={
            authStatus === 'checking' ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
              }}>
                <Spin size="large" tip="加载中..." />
              </div>
            ) : (
              <Navigate to={authStatus === 'authed' ? '/' : '/login'} replace />
            )
          } />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
