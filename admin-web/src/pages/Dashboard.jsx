import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Button, Typography, Space } from 'antd';
import { ShoppingOutlined, CarOutlined, CheckCircleOutlined, DollarOutlined, ArrowUpOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const Dashboard = () => {
    const [stats, setStats] = useState({ totalOrders: 0, inDelivery: 0, completed: 0, totalRevenue: 0 });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Helper to fetch data
    const fetchData = async () => {
        setLoading(true);
        // Dummy Data implementation
        const dummyStats = {
            totalOrders: 1543,
            inDelivery: 45,
            completed: 1450,
            totalRevenue: 2540000
        };

        const dummyRecentOrders = [
            { id: 1089, customer: 'Amal Perera', date: '2023-10-25', total: 4500, status: 'NEW' },
            { id: 1088, customer: 'Kavindi Ratnayake', date: '2023-10-24', total: 8500, status: 'CONFIRMED' },
            { id: 1087, customer: 'Dinusha Jayathilake', date: '2023-10-24', total: 2500, status: 'PREPARING' },
            { id: 1086, customer: 'Thilini Rajapakse', date: '2023-10-23', total: 1500, status: 'OUT_FOR_DELIVERY' },
            { id: 1085, customer: 'Didul Chamikara', date: '2023-10-22', total: 3000, status: 'DELIVERED' },
        ];

        setTimeout(() => {
            setStats(dummyStats);
            setRecentOrders(dummyRecentOrders);
            setLoading(false);
        }, 500);

        /* 
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [statsRes, ordersRes] = await Promise.all([
                axios.get('http://localhost:5000/api/dashboard/stats', config),
                axios.get('http://localhost:5000/api/dashboard/recent-orders', config)
            ]);

            setStats(statsRes.data);
            setRecentOrders(ordersRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
        */
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Columns for Recent Orders Table
    const columns = [
        { title: 'Order ID', dataIndex: 'id', key: 'id', render: (id) => `# ${id}` },
        { title: 'Customer', dataIndex: 'customer', key: 'customer' },
        { title: 'Date', dataIndex: 'date', key: 'date', render: (date) => new Date(date).toLocaleDateString() },
        { title: 'Total', dataIndex: 'total', key: 'total', render: (total) => `Rs.${total.toLocaleString()}` },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'blue';
                if (status === 'COMPLETED') color = 'green';
                if (status === 'CANCELLED') color = 'red';
                if (status === 'IN_DELIVERY') color = 'orange';
                return <Tag color={color}>{status}</Tag>;
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="link" style={{ color: '#52c41a', padding: 0 }}>Accept</Button>
                    <Button type="link" danger style={{ padding: 0 }}>Reject</Button>
                </Space>
            ),
        },
    ];

    // Stat Card Component for reusability
    const StatCard = ({ title, value, icon, color, prefix }) => (
        <Card bordered={false} style={{ height: '100%', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <Text type="secondary">{title}</Text>
                    <Title level={3} style={{ margin: '10px 0' }}>{prefix}{value.toLocaleString()}</Title>
                </div>
                <div style={{
                    backgroundColor: color,
                    borderRadius: '50%',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '20px'
                }}>
                    {icon}
                </div>
            </div>
        </Card>
    );

    return (
        <div>
            <Title level={2} style={{ marginBottom: 30 }}>Dashboard</Title>

            {/* Stats Row */}
            <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard title="Total Orders" value={stats.totalOrders} icon={<ShoppingOutlined />} color="#E91E63" />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard title="In Delivery" value={stats.inDelivery} icon={<CarOutlined />} color="#2196F3" />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard title="Completed" value={stats.completed} icon={<CheckCircleOutlined />} color="#52c41a" />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard title="Total Revenue" value={stats.totalRevenue} prefix="Rs." icon={<DollarOutlined />} color="#FAAD14" />
                </Col>
            </Row>

            {/* Recent Orders Section */}
            <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Title level={4} style={{ margin: 0 }}>Recent Orders</Title>
                    <Button type="link" style={{ color: '#E91E63' }}>View All Orders</Button>
                </div>
                <Table
                    columns={columns}
                    dataSource={recentOrders}
                    loading={loading}
                    rowKey="id"
                    pagination={false}
                />
            </Card>
        </div>
    );
};

export default Dashboard;
