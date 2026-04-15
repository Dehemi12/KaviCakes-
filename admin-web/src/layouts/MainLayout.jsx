import React from 'react';
import { Layout, Menu, Avatar, Typography, Badge } from 'antd';
import {
    AppstoreOutlined,
    ShoppingOutlined,
    UserOutlined,
    LogoutOutlined,
    BellOutlined,
    CalendarOutlined,
    DollarOutlined,
    SettingOutlined,
    CodeSandboxOutlined,
    BuildOutlined,
    FileImageOutlined,
    AreaChartOutlined,
    CheckCircleOutlined,
    SafetyCertificateOutlined,
    HistoryOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const menuItems = [
        { key: '/', icon: <AppstoreOutlined />, label: 'Dashboard' },
        {
            key: 'order-management',
            icon: <ShoppingOutlined />,
            label: 'Order Management',
            children: [
                { key: '/order-confirmation', icon: <CheckCircleOutlined />, label: 'Order Confirmation' },
                { key: '/orders', icon: <SafetyCertificateOutlined />, label: 'Payment Confirmation' },
                { key: '/production', icon: <BuildOutlined />, label: 'Production Queue' },
                { key: '/schedule', icon: <CalendarOutlined />, label: 'Delivery Schedule' },
                { key: '/order-log', icon: <HistoryOutlined />, label: 'Order Log' },
            ],
        },
        { key: '/cakes', icon: <CodeSandboxOutlined />, label: 'Products' },
        { key: '/customers', icon: <UserOutlined />, label: 'Customers' },
        { key: '/notifications', icon: <BellOutlined />, label: 'Notifications' },
        { key: '/cashbook', icon: <DollarOutlined />, label: 'Cashbook' },
        { key: '/site-content', icon: <FileImageOutlined />, label: 'Site Content' },
        { type: 'divider' }, // Visual separator
        { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
        { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
    ];

    const handleMenuClick = (e) => {
        if (e.key === 'logout') {
            logout();
            navigate('/login');
        } else {
            navigate(e.key);
        }
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={250} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🍰</span>
                    <Title level={4} style={{ margin: 0, color: '#333' }}>KaviCakes</Title>
                </div>

                <Menu
                    mode="inline"
                    defaultOpenKeys={['order-management']}
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={handleMenuClick}
                    style={{ borderRight: 0 }}
                    theme="light"
                />
            </Sider>

            <Layout>
                <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', boxShadow: '0 2px 8px #f0f1f2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Text type="secondary">Welcome back, {user?.name || 'Admin'}!</Text>

                        <Badge dot>
                            <BellOutlined style={{ fontSize: '20px', cursor: 'pointer' }} />
                        </Badge>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Avatar style={{ backgroundColor: '#be185d' }} icon={<UserOutlined />} />
                            <Text strong>{user?.name || 'Admin User'}</Text>
                        </div>
                    </div>
                </Header>

                <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: '#fff', borderRadius: '8px' }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
