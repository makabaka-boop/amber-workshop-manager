import { useState, useEffect } from 'react';
import { Layout, Menu, Badge, Button, Avatar, Dropdown, message, Grid } from 'antd';
import { 
  DashboardOutlined, 
  UnorderedListOutlined, 
  GoldOutlined, 
  UserOutlined, 
  ShoppingOutlined,
  BellOutlined,
  LogoutOutlined,
  ToolOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { getAlerts } from '../api';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const MainLayout = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [collapsed, setCollapsed] = useState(isMobile);
  const [alerts, setAlerts] = useState({ overdueOrders: [], lowStockMaterials: [] });
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await getAlerts();
      setAlerts(response.data);
    } catch (error) {
      console.error('获取预警信息失败');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('已退出登录');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  const alertCount = alerts.overdueOrders.length + alerts.lowStockMaterials.length;

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '首页仪表板',
    },
    {
      key: '/work-orders',
      icon: <UnorderedListOutlined />,
      label: '工单管理',
    },
    ...(user.role === 'clerk' ? [
      {
        key: '/stones',
        icon: <GoldOutlined />,
        label: '原石档案',
      },
      {
        key: '/customers',
        icon: <UserOutlined />,
        label: '客户委托',
      },
      {
        key: '/materials',
        icon: <ShoppingOutlined />,
        label: '耗材管理',
      },
      {
        key: '/sandpaper',
        icon: <ToolOutlined />,
        label: '砂纸粒度',
      }
    ] : [])
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {isMobile && !collapsed && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 999,
          }}
          onClick={() => setCollapsed(true)}
        />
      )}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={200}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: isMobile ? 'fixed' : 'relative',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: isMobile ? 1000 : 'auto'
        }}
      >
        <div style={{ 
          height: 64, 
          margin: 16, 
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 'bold'
        }}>
          {collapsed ? '琥珀' : '琥珀修整平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => {
            navigate(key);
            if (isMobile) setCollapsed(true);
          }}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: isMobile ? '0 12px' : '0 24px', 
          background: '#fff', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: isMobile ? 48 : 64, height: 64 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
            <Badge count={alertCount} size="small">
              <Button 
                type="text" 
                icon={<BellOutlined style={{ fontSize: 18 }} />}
                onClick={() => message.info(`超期工单: ${alerts.overdueOrders.length}个, 低库存: ${alerts.lowStockMaterials.length}种`)}
              />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                {!isMobile && <span>{user.username} ({user.role === 'clerk' ? '店员' : '工匠'})</span>}
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ 
          margin: isMobile ? '12px' : '24px', 
          background: '#f0f2f5', 
          borderRadius: 8, 
          padding: isMobile ? 12 : 24,
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
