import { useState, useEffect, useCallback } from 'react';
import { Layout, Menu, Badge, Button, Avatar, Dropdown, message, Drawer } from 'antd';
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
  MenuUnfoldOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { getAlerts } from '../api';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [alerts, setAlerts] = useState({ overdueOrders: [], lowStockMaterials: [] });
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
        setDrawerVisible(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await getAlerts();
      setAlerts(response.data);
    } catch {
      console.error('获取预警信息失败');
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('已退出登录');
    navigate('/login');
  };

  const handleMenuClick = ({ key }) => {
    navigate(key);
    if (isMobile) {
      setDrawerVisible(false);
    }
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

  const siderContent = (
    <>
      <div style={{ 
        height: 64, 
        margin: 16, 
        background: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: (isMobile ? false : collapsed) ? 14 : 18,
        fontWeight: 'bold'
      }}>
        {(isMobile ? false : collapsed) ? '琥珀' : '琥珀修整平台'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {isMobile ? (
        <Drawer
          placement="left"
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          width={220}
          styles={{ body: { padding: 0, background: '#001529' }, wrapper: {} }}
          closeIcon={<CloseOutlined style={{ color: '#fff' }} />}
          headerStyle={{ background: '#001529', border: 'none' }}
        >
          {siderContent}
        </Drawer>
      ) : (
        <Sider trigger={null} collapsible collapsed={collapsed} width={220}>
          {siderContent}
        </Sider>
      )}
      <Layout style={{ overflow: 'hidden' }}>
        <Header style={{ 
          padding: '0 16px', 
          background: '#fff', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          minWidth: 0
        }}>
          <Button
            type="text"
            icon={isMobile ? (drawerVisible ? <CloseOutlined /> : <MenuUnfoldOutlined />) : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            onClick={() => isMobile ? setDrawerVisible(!drawerVisible) : setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 48, height: 64 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flexShrink: 0 }}>
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
        <Content style={{ margin: isMobile ? '12px' : '24px', background: '#f0f2f5', borderRadius: 8, padding: isMobile ? 12 : 24, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
