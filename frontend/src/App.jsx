import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login';
import MainLayout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WorkOrders from './pages/WorkOrders';
import Stones from './pages/Stones';
import Customers from './pages/Customers';
import Materials from './pages/Materials';
import Sandpaper from './pages/Sandpaper';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
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
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
