import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Button, Typography, Space, message, Select, List, Avatar, Badge, Tooltip, Popover } from 'antd';
import { ShoppingOutlined, CarOutlined, CheckCircleOutlined, DollarOutlined, ArrowUpOutlined, UserOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const Dashboard = () => {
    const [stats, setStats] = useState({ totalOrders: 0, inDelivery: 0, completed: 0, totalRevenue: 0 });
    const [recentOrders, setRecentOrders] = useState([]);
    
    // Monthly Analysis State
    const [monthlyStats, setMonthlyStats] = useState({ totalOrders: 0, totalRevenue: 0, standardCount: 0, customCount: 0, bulkCount: 0 });
    const [monthlyOrders, setMonthlyOrders] = useState([]);
    const [topItems, setTopItems] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(`${new Date().getFullYear()}-${new Date().getMonth() + 1}`);
    const [orderTypeFilter, setOrderTypeFilter] = useState('All');
    
    const [loading, setLoading] = useState(true);

    // Helper to fetch data
    const fetchData = async () => {
        setLoading(true);
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
            if (loading) message.error('Failed to load dashboard data'); // Only show toast on first load failure
        } finally {
            setLoading(false);
        }
    };

    // Add new fetch for Monthly Analysis
    const fetchMonthlyData = async (monthStr) => {
        try {
            const token = localStorage.getItem('token');
            const [year, month] = monthStr.split('-');
            const res = await axios.get(`http://localhost:5000/api/dashboard/monthly-analysis?year=${year}&month=${month}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMonthlyStats(res.data.summary);
            setMonthlyOrders(res.data.orders);
            setTopItems(res.data.topItems);
        } catch (error) {
            console.error('Error fetching monthly stats:', error);
            message.error('Failed to load monthly analysis');
        }
    };

    useEffect(() => {
        fetchData();
        fetchMonthlyData(selectedMonth);
        const interval = setInterval(() => {
            fetchData();
            fetchMonthlyData(selectedMonth);
        }, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, [selectedMonth]);

    // Columns for Recent Orders Table
    const columns = [
        {
            title: 'Order',
            key: 'order_info',
            width: 120,
            render: (_, record) => (
                <div>
                    <Space size={4}>
                        <Text style={{ color: '#1890ff', fontWeight: 600 }}>#{record.id}</Text>
                        {record.isBulk && <Tag color="gold" style={{ fontSize: '10px', borderRadius: '4px' }}>BULK</Tag>}
                        {record.isCustom && <Tag color="purple" style={{ fontSize: '10px', borderRadius: '4px' }}>CUSTOM</Tag>}
                    </Space>
                    <div style={{ fontSize: '11px', color: '#999' }}>{new Date(record.date).toLocaleDateString()}</div>
                </div>
            )
        },
        {
            title: 'Customer',
            key: 'customer',
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#f56a00' }} />
                    <div style={{ overflow: 'hidden' }}>
                        <Text style={{ display: 'block', fontSize: '13px', fontWeight: 600 }} ellipsis>{record.customer}</Text>
                        <Text type="secondary" style={{ fontSize: '11px' }} ellipsis>{record.customerEmail}</Text>
                    </div>
                </div>
            )
        },
        {
            title: 'Items',
            dataIndex: 'items',
            key: 'items',
            width: 150,
            render: items => {
                if (!Array.isArray(items) || items.length === 0) return '-';
                const content = (
                    <div style={{ minWidth: 240, padding: '4px' }}>
                        {items.map((item, i) => {
                            const variantStr = item.variant ? `${item.variant.size?.label || ''} ${item.variant.flavor?.label || ''} ${item.variant.shape?.label || ''}`.trim() : '';
                            const fullName = item.variant?.cake?.name || item.name;
                            const custom = item.customDetails;
                            
                            return (
                                <div key={i} style={{ 
                                    padding: '8px 0', 
                                    borderBottom: i < items.length - 1 ? '1px solid #f0f0f0' : 'none'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '15px' }}>
                                        <Text style={{ fontSize: '13px', fontWeight: 600 }}>{fullName}</Text>
                                        <Tag color="blue" style={{ borderRadius: '4px', margin: 0, fontWeight: 500 }}>Qty: {item.quantity}</Tag>
                                    </div>
                                    {variantStr && <div style={{ marginTop: 2 }}><Text type="secondary" style={{ fontSize: '11px' }}>{variantStr}</Text></div>}
                                    
                                    {/* Custom Order Detail Items */}
                                    {custom && (
                                        <div style={{ marginTop: 6, padding: '6px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
                                            {custom.flavor && <div style={{ fontSize: '11px' }}><Text type="secondary">Flavor:</Text> <Text style={{ fontSize: '11px', fontWeight: 600 }}>{custom.flavor}</Text></div>}
                                            {custom.instructions && <div style={{ fontSize: '11px', marginTop: 2 }}><Text type="secondary">Notes:</Text> <em>{custom.instructions}</em></div>}
                                            {item.isBulk && record.bulkInfo && (
                                                <div style={{ borderTop: '1px solid #eee', marginTop: 4, paddingTop: 4 }}>
                                                    <div style={{ fontSize: '11px' }}><Badge status="processing" text={<Text type="secondary">Event: {record.bulkInfo.event}</Text>} /></div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
                return (
                    <Popover content={content} title="Order Items" trigger={['click', 'hover']}>
                        <Tag color="blue" style={{ borderRadius: '10px', cursor: 'pointer', padding: '2px 10px', fontWeight: 500 }}>
                            {items.length} {items.length === 1 ? 'Item' : 'Items'}
                        </Tag>
                    </Popover>
                );
            }
        },
        {
            title: 'Amount',
            dataIndex: 'total',
            key: 'total',
            align: 'right',
            render: (total) => <Text style={{ fontWeight: 600 }}>Rs.{total.toLocaleString()}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            align: 'center',
            render: (status) => {
                let color = 'blue';
                if (status === 'DELIVERED') color = 'green';
                else if (status === 'CANCELLED') color = 'red';
                else if (status === 'READY') color = 'volcano';
                else if (status === 'CONFIRMED') color = 'cyan';
                else if (status === 'PREPARING') color = 'orange';
                return <Tag color={color} style={{ borderRadius: '10px', fontSize: '11px' }}>{status.replace(/_/g, ' ')}</Tag>;
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    {record.status === 'NEW' ? (
                        <>
                        <Space size="small">
                            <Button
                                type="primary"
                                size="small"
                                icon={<CheckOutlined />}
                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', borderRadius: '4px' }}
                                onClick={() => handleStatusChange(record.id, 'CONFIRMED')}
                            >
                                Accept
                            </Button>
                            <Button
                                type="primary"
                                danger
                                size="small"
                                icon={<CloseOutlined />}
                                style={{ borderRadius: '4px' }}
                                onClick={() => handleStatusChange(record.id, 'CANCELLED')}
                            >
                                Reject
                            </Button>
                        </Space>
                        </>
                    ) : (
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.status}</Text>
                    )}
                </Space>
            ),
        },
    ];

    const handleStatusChange = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/orders/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(`Order ${newStatus.toLowerCase()}`);
            fetchData();
        } catch (error) {
            console.error('Update failed:', error);
            message.error('Failed to update status');
        }
    };

    // Stat Card Component for reusability
    const StatCard = ({ title, value, icon, color, prefix }) => (
        <Card bordered={false} className="premium-card" style={{ height: '100%', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', transition: 'all 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <Text type="secondary" style={{ fontWeight: 500, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</Text>
                    <Title level={2} style={{ margin: '12px 0 0 0', fontWeight: 600 }}>{prefix}{value.toLocaleString()}</Title>
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
        <div style={{ paddingBottom: '40px' }}>
            <style>{`
                .premium-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.08) !important;
                }
                .dashboard-title {
                    font-weight: 600 !important;
                    background: linear-gradient(90deg, #111827 0%, #E91E63 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .premium-table .ant-table-thead > tr > th {
                    background-color: #f8fafc !important;
                    color: #475569 !important;
                    font-weight: 600 !important;
                    text-transform: uppercase !important;
                    font-size: 12px;
                    border-bottom: 1px solid #e2e8f0 !important;
                }
                .premium-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #f1f5f9 !important;
                }
                .premium-table {
                    border-radius: 16px !important;
                    overflow: hidden;
                }
            `}</style>
            <Title className="dashboard-title" level={2} style={{ marginBottom: 30, fontSize: '2.2rem' }}>Dashboard Overview</Title>

            {/* Stats Row */}
            <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard title="Total Orders" value={stats.totalOrders} icon={<ShoppingOutlined />} color="#E91E63" />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard title="In Delivery" value={stats.inDelivery} icon={<CarOutlined />} color="#2196F3" />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard title="Completed" value={stats.completed} icon={<CheckCircleOutlined />} color="#10B981" />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard title="Total Revenue" value={stats.totalRevenue} prefix="Rs." icon={<DollarOutlined />} color="#F59E0B" />
                </Col>
            </Row>

            {/* Recent Orders Section */}
            <Card bordered={false} className="premium-card" style={{ borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Title level={4} style={{ margin: 0, fontWeight: 600 }}>Recent Orders</Title>
                    <Button type="link" style={{ color: '#E91E63', fontWeight: 500 }}>View All Orders</Button>
                </div>
                <Table
                    className="premium-table"
                    columns={columns}
                    dataSource={recentOrders}
                    loading={loading}
                    rowKey="id"
                    pagination={false}
                />
            </Card>

            <Title level={3} style={{ marginTop: 50, marginBottom: 20, fontWeight: 600 }}>Monthly Analytics</Title>
            
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Select
                    value={selectedMonth}
                    onChange={(val) => setSelectedMonth(val)}
                    style={{ width: 200 }}
                    size="large"
                >
                    {[0, 1, 2, 3, 4, 5].map(i => {
                        const d = new Date();
                        d.setMonth(d.getMonth() - i);
                        const val = `${d.getFullYear()}-${d.getMonth() + 1}`;
                        const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
                        return <Select.Option key={val} value={val}>{label}</Select.Option>;
                    })}
                </Select>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
                <Col xs={24} md={8}>
                    <Card bordered={false} className="premium-card" style={{ height: '100%', borderRadius: '20px', background: 'linear-gradient(135deg, #fff0f6 0%, #ffffff 100%)', boxShadow: '0 8px 30px rgba(233, 30, 99, 0.08)' }}>
                        <Statistic title={<span style={{ fontWeight: 500, color: '#8c8c8c' }}>Total Monthly Orders</span>} value={monthlyStats.totalOrders} valueStyle={{ color: '#E91E63', fontWeight: 600, fontSize: '2rem' }} />
                        <div style={{ marginTop: 15, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <Tag color="blue" style={{ borderRadius: '12px', padding: '2px 10px', fontWeight: 500 }}>Standard: {monthlyStats.standardCount}</Tag>
                            <Tag color="purple" style={{ borderRadius: '12px', padding: '2px 10px', fontWeight: 500 }}>Custom: {monthlyStats.customCount}</Tag>
                            <Tag color="gold" style={{ borderRadius: '12px', padding: '2px 10px', fontWeight: 500 }}>Bulk: {monthlyStats.bulkCount}</Tag>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card bordered={false} className="premium-card" style={{ height: '100%', borderRadius: '20px', background: 'linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)', boxShadow: '0 8px 30px rgba(82, 196, 26, 0.08)' }}>
                        <Statistic title={<span style={{ fontWeight: 500, color: '#8c8c8c' }}>Monthly Revenue</span>} value={monthlyStats.totalRevenue} prefix="Rs." valueStyle={{ color: '#52c41a', fontWeight: 600, fontSize: '2rem' }} />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card bordered={false} className="premium-card" title={<span style={{ fontWeight: 600 }}>Top Selling Items</span>} bodyStyle={{ padding: '0 24px 24px', overflowY: 'auto', maxHeight: '420px' }} style={{ height: '100%', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
                        <List
                            itemLayout="horizontal"
                            dataSource={topItems.slice(0, 5)}
                            renderItem={(item, index) => (
                                <List.Item style={{ padding: '16px 0', borderBottom: '1px solid #f8fafc' }}>
                                    <List.Item.Meta
                                        avatar={
                                            <div style={{ position: 'relative' }}>
                                                <Avatar 
                                                    src={item.image} 
                                                    shape="square" 
                                                    size={48} 
                                                    style={{ borderRadius: '12px', border: '1px solid #f1f5f9' }}
                                                    icon={<ShoppingOutlined />}
                                                />
                                                <div style={{ 
                                                    position: 'absolute',
                                                    top: -8,
                                                    left: -8,
                                                    width: '20px', 
                                                    height: '20px', 
                                                    borderRadius: '50%', 
                                                    backgroundColor: index === 0 ? '#E91E63' : index === 1 ? '#FAAD14' : index === 2 ? '#52c41a' : '#64748b',
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    color: '#fff',
                                                    fontWeight: 700,
                                                    fontSize: '10px',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}>
                                                    {index + 1}
                                                </div>
                                            </div>
                                        }
                                        title={
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <Text style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b', marginBottom: '2px' }}>{item.name}</Text>
                                                <Tag color="default" style={{ width: 'fit-content', fontSize: '10px', borderRadius: '4px', border: 'none', backgroundColor: '#f1f5f9', color: '#64748b' }}>{item.category}</Tag>
                                            </div>
                                        }
                                        description={
                                            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Sold</Text>
                                                    <Text style={{ fontWeight: 600, color: '#E91E63', fontSize: '14px' }}>{item.quantity}</Text>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Revenue</Text>
                                                    <Text style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>Rs.{item.revenue.toLocaleString()}</Text>
                                                </div>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                        {topItems.length === 0 && (
                            <div style={{ padding: '40px 0', textAlign: 'center' }}>
                                <Text type="secondary">No sales data recorded yet for this month.</Text>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            <Card bordered={false} className="premium-card" style={{ borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Title level={4} style={{ margin: 0, fontWeight: 600 }}>Monthly Order Log</Title>
                    <Select value={orderTypeFilter} onChange={setOrderTypeFilter} style={{ width: 180 }} bordered={false} className="premium-select">
                        <Select.Option value="All">All Types</Select.Option>
                        <Select.Option value="Standard">Standard Orders</Select.Option>
                        <Select.Option value="Custom">Custom Orders</Select.Option>
                        <Select.Option value="Bulk">Bulk Orders</Select.Option>
                    </Select>
                </div>
                <Table
                    className="premium-table"
                    columns={columns.map(c => c.key === 'action' ? { 
                        title: 'Action', 
                        key: 'action', 
                        render: (_, record) => <Button type="primary" shape="round" style={{ background: '#E91E63', border: 'none', boxShadow: '0 4px 14px rgba(233, 30, 99, 0.4)' }} onClick={() => window.open(`/orders?id=${record.id}`, '_blank')}>View Details</Button> 
                    } : c)}
                    dataSource={monthlyOrders.filter(o => orderTypeFilter === 'All' || o.type === orderTypeFilter)}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>

        </div>
    );
};

export default Dashboard;
