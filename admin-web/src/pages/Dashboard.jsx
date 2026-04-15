import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Tag, Button, Typography, Space, message, List, Avatar, Badge, Spin, Divider } from 'antd';
import { ShoppingOutlined, FireOutlined, CarOutlined, DollarOutlined, CalendarOutlined, RightOutlined, BellOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ 
        totalOrders: 0, 
        inDelivery: 0, 
        completed: 0, 
        totalRevenue: 0, 
        newOrdersCount: 0, 
        cakesToBakeToday: 0, 
        ordersToBakeToday: 0,
        totalRevenueToday: 0,
        netBalance: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [topItems, setTopItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [statsRes, ordersRes, analysisRes] = await Promise.all([
                axios.get('http://localhost:5000/api/dashboard/stats', config),
                axios.get('http://localhost:5000/api/dashboard/recent-orders', config),
                axios.get(`http://localhost:5000/api/dashboard/monthly-analysis?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`, config)
            ]);

            setStats(statsRes.data);
            setRecentOrders(ordersRes.data);
            setTopItems(analysisRes.data.topItems || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            message.error('Failed to load dashboard data'); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); 
        return () => clearInterval(interval);
    }, []);

    const theme = {
        pageBg: '#f8fafc',
        cardBg: '#ffffff',
        border: '#e2e8f0',
        textMain: '#0f172a',
        textSec: '#64748b',
        primary: '#be185d', // KaviCakes Brand Pink
        accent: '#2563eb',  // Blue
        success: '#10b981', // Green
        warning: '#f59e0b', // Orange
        danger: '#ef4444',  // Red
    };

    const ActionCard = ({ title, value, icon, color, subtext, path, urgent = false }) => (
        <Card 
            hoverable 
            onClick={() => navigate(path)}
            bordered={false} 
            style={{ 
                background: theme.cardBg, 
                borderRadius: '16px', 
                border: urgent ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`,
                height: '100%',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.3s'
            }} 
            bodyStyle={{ padding: '24px' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ 
                    padding: '12px', 
                    background: `${color}10`, 
                    borderRadius: '12px', 
                    color: color, 
                    fontSize: '24px',
                    display: 'flex'
                }}>
                    {icon}
                </div>
                <RightOutlined style={{ color: theme.textSec, fontSize: '12px' }} />
            </div>
            <div>
                <Text style={{ color: theme.textSec, fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    <Title level={1} style={{ color: theme.textMain, margin: 0, fontWeight: 900 }}>{value}</Title>
                    {urgent && (
                        <Tag color="error" style={{ borderRadius: '20px', fontWeight: 800, border: 'none', animation: 'pulse 2s infinite' }}>NEW ACTIVITIES</Tag>
                    )}
                </div>
                <Text style={{ color: color, fontSize: '13px', fontWeight: 600 }}>{subtext}</Text>
            </div>
        </Card>
    );

    const columns = [
        {
            title: 'ORDER ID',
            dataIndex: 'id',
            key: 'id',
            render: (id) => <Text style={{ color: theme.primary, fontWeight: 800 }}>#{id}</Text>
        },
        {
            title: 'CUSTOMER',
            dataIndex: 'customer',
            key: 'customer',
            render: (name) => <Text style={{ color: theme.textMain, fontWeight: 700 }}>{name}</Text>
        },
        {
            title: 'TYPE',
            key: 'type',
            render: (_, record) => {
                const isBulk = record.isBulk || record.orderType === 'BULK';
                const isCustom = record.isCustom || record.orderType === 'CUSTOM';
                const label = isBulk ? 'BULK' : isCustom ? 'CUSTOM' : 'STANDARD';
                const color = isBulk ? 'purple' : isCustom ? 'orange' : 'blue';
                return <Tag color={color} style={{ fontSize: '10px', fontWeight: 800, borderRadius: '4px' }}>{label}</Tag>
            }
        },
        {
            title: 'DELIVERY',
            dataIndex: 'deliveryDate',
            key: 'deliveryDate',
            render: (date) => (
                <div style={{ color: theme.textMain, fontWeight: 600 }}>
                    <CalendarOutlined style={{ marginRight: '8px', color: theme.primary }} />
                    {dayjs(date).format('MMM D, YYYY')}
                </div>
            )
        },
        {
            title: 'AMOUNT',
            dataIndex: 'total',
            key: 'total',
            align: 'right',
            render: (val) => <Text style={{ color: theme.textMain, fontWeight: 800 }}>Rs.{Number(val).toLocaleString()}</Text>
        },
        {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colors = { 'NEW': 'blue', 'CONFIRMED': 'cyan', 'PREPARING': 'orange', 'READY': 'volcano', 'DELIVERED': 'green', 'CANCELLED': 'red' };
                return <Tag color={colors[status] || 'default'} style={{ borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>{status}</Tag>
            }
        }
    ];

    return (
        <div style={{ padding: '24px', background: theme.pageBg, minHeight: '100vh' }}>
            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.6; }
                    100% { opacity: 1; }
                }
                .ant-card { transition: transform 0.2s; }
                .ant-card:hover { transform: translateY(-4px); }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <Title level={2} style={{ color: theme.textMain, margin: 0, fontWeight: 900, letterSpacing: '-0.5px' }}>Store Overview</Title>
                    <Text style={{ color: theme.textSec, fontSize: '16px' }}>Manage your daily production and logistics at a glance.</Text>
                </div>
                {stats.newOrdersCount > 0 && (
                    <Badge count={stats.newOrdersCount} offset={[-10, 10]}>
                        <Button 
                            type="primary" 
                            icon={<BellOutlined />} 
                            size="large" 
                            style={{ background: theme.primary, borderColor: theme.primary, borderRadius: '12px', height: '48px', fontWeight: 700 }}
                            onClick={() => navigate('/order-confirmation')}
                        >
                            New Orders Pending
                        </Button>
                    </Badge>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>
            ) : (
                <>
                    {/* TOP ACTIONABLE CARDS */}
                    <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                        <Col xs={24} sm={12} lg={6}>
                            <ActionCard 
                                title="New Orders" 
                                value={stats.newOrdersCount} 
                                icon={<ShoppingOutlined />} 
                                color={theme.accent} 
                                subtext="Waiting for confirmation"
                                path="/order-confirmation"
                                urgent={stats.newOrdersCount > 0}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <ActionCard 
                                title="Production Today" 
                                value={stats.ordersToBakeToday} 
                                icon={<FireOutlined />} 
                                color={theme.warning} 
                                subtext={`${stats.cakesToBakeToday} units to prepare`}
                                path="/production"
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <ActionCard 
                                title="Deliveries Today" 
                                value={stats.inDelivery} 
                                icon={<CarOutlined />} 
                                color={theme.success} 
                                subtext="Orders ready for dispatch"
                                path="/schedule"
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <ActionCard 
                                title="Net Balance" 
                                value={`Rs.${(stats.netBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                                icon={<DollarOutlined />} 
                                color={theme.accent} 
                                subtext="Current liquid cash"
                                path="/cashbook"
                            />
                        </Col>
                    </Row>

                    {/* TWO COLUMN SUMMARY SECTION */}
                    <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                        <Col xs={24} lg={16}>
                            <Card bordered={false} title={<span style={{ fontWeight: 800 }}>Recent Orders Activity</span>} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
                                <Table 
                                    dataSource={recentOrders.slice(0, 5)} 
                                    columns={columns} 
                                    pagination={false} 
                                    rowKey="id"
                                    size="middle"
                                />
                                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                    <Button type="link" onClick={() => navigate('/order-log')} style={{ fontWeight: 700, color: theme.primary }}>View Full Order History</Button>
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} lg={8}>
                            <Card bordered={false} title={<span style={{ fontWeight: 800 }}>Top Performance This Month</span>} style={{ borderRadius: '16px', height: '100%', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', textAlign: 'center' }}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600 }}>TOTAL SALES</Text>
                                        <Title level={4} style={{ margin: 0, fontWeight: 800 }}>{stats.totalOrders}</Title>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600 }}>REVENUE</Text>
                                        <Title level={4} style={{ margin: 0, fontWeight: 800, color: theme.success }}>Rs.{stats.totalRevenue.toLocaleString()}</Title>
                                    </div>
                                </div>
                                <Divider style={{ margin: '12px 0' }} />
                                <Text strong style={{ fontSize: '13px', color: theme.textSec, display: 'block', marginBottom: '16px' }}>MOST POPULAR ITEMS</Text>
                                <List
                                    dataSource={topItems.slice(0, 4)}
                                    renderItem={(item, i) => (
                                        <List.Item style={{ padding: '12px 0', border: 'none' }}>
                                            <List.Item.Meta
                                                avatar={<Avatar src={item.image} shape="square" size={40} style={{ borderRadius: '8px' }} />}
                                                title={<Text strong style={{ fontSize: '13px' }}>{item.name}</Text>}
                                                description={<Text type="secondary" style={{ fontSize: '11px' }}>{item.quantity} units sold</Text>}
                                            />
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </div>
    );
};

export default Dashboard;
