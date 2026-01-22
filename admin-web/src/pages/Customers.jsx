import React, { useEffect, useState } from 'react';
import { Table, Avatar, Typography, Button, Space, Card, Tag, Input, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, FilterOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All'); // 'All', 'HighLoyalty', 'Feedbacks'

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (filter === 'Feedbacks') {
                const res = await axios.get('http://localhost:5000/api/feedback', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFeedbacks(res.data);
            } else {
                const params = {};
                if (filter === 'HighLoyalty') params.minLoyalty = 1000;
                const res = await axios.get('http://localhost:5000/api/customers', {
                    headers: { Authorization: `Bearer ${token}` },
                    params
                });
                setCustomers(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filter]);

    const handleFeedbackAction = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/feedback/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData(); // Refresh
        } catch (error) {
            console.error('Action failed');
        }
    };

    // Columns for Customer Table
    const columns = [
        {
            title: 'Customer',
            key: 'customer',
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <Avatar
                        size={48}
                        style={{ backgroundColor: '#FFD6E7', color: '#E91E63', fontWeight: 'bold' }}
                    >
                        {record.name?.charAt(0)}
                    </Avatar>
                    <div>
                        <Text strong style={{ display: 'block', fontSize: 16 }}>{record.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>ID: {record.displayId}</Text>
                    </div>
                </div>
            )
        },
        {
            title: 'Contact',
            key: 'contact',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13 }}>
                    <div><MailOutlined style={{ color: '#888' }} /> {record.email}</div>
                    {record.phone && <div><PhoneOutlined style={{ color: '#888' }} /> {record.phone}</div>}
                </div>
            )
        },
        { title: 'Orders', dataIndex: 'orderCount', key: 'orderCount', align: 'center' },
        { title: 'Total Spent', dataIndex: 'totalSpent', key: 'totalSpent', render: val => `Rs.${val?.toLocaleString()}` },
        { title: 'Last Order', dataIndex: 'lastOrderDate', key: 'lastOrderDate', render: d => d ? new Date(d).toLocaleDateString() : 'N/A' },
        { title: 'Loyalty Points', dataIndex: 'loyaltyPoints', key: 'loyaltyPoints', align: 'center', render: val => <b>{val}</b> },
    ];

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <Title level={2}>Customer Management</Title>
                <Text type="secondary">Manage your customer base and relationships</Text>
            </div>

            <Card style={{ marginBottom: 20, borderRadius: 10 }}>
                <Row gutter={16} align="middle">
                    <Col>
                        <Space>
                            <Button
                                type={filter === 'All' ? 'primary' : 'default'}
                                onClick={() => setFilter('All')}
                                style={filter === 'All' ? { background: '#E91E63', borderColor: '#E91E63' } : {}}
                            >
                                All Customers
                            </Button>
                            <Button
                                type={filter === 'HighLoyalty' ? 'primary' : 'default'}
                                onClick={() => setFilter('HighLoyalty')}
                                style={filter === 'HighLoyalty' ? { background: '#E91E63', borderColor: '#E91E63' } : {}}
                            >
                                Customers above Loyalty points 1000
                            </Button>
                            <Button
                                type={filter === 'Feedbacks' ? 'primary' : 'default'}
                                onClick={() => setFilter('Feedbacks')}
                                style={filter === 'Feedbacks' ? { background: '#E91E63', borderColor: '#E91E63' } : {}}
                            >
                                Feedbacks
                            </Button>
                        </Space>
                    </Col>
                    <Col flex="auto" style={{ textAlign: 'right' }}>
                        <Input
                            placeholder="Search customers..."
                            prefix={<FilterOutlined />}
                            style={{ width: 250, borderRadius: 20 }}
                        />
                    </Col>
                </Row>
            </Card>

            {filter === 'Feedbacks' ? (
                <div>
                    {feedbacks.map(fb => (
                        <Card key={fb.id} style={{ marginBottom: 20, borderRadius: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                                <div>
                                    <Title level={4} style={{ margin: 0 }}>{fb.customer?.name || 'Unknown'}</Title>
                                    <Space style={{ marginTop: 5 }}>
                                        <Tag color="#FFD6E7" style={{ color: '#E91E63', borderRadius: 10 }}>
                                            Loyalty points {fb.customer?.loyaltyPoints || 0}
                                        </Tag>
                                        <Text type="secondary" style={{ fontSize: 12 }}>For: Order #{fb.orderId}</Text>
                                    </Space>
                                </div>
                                <Space>
                                    <Button type={fb.status === 'APPROVED' ? 'primary' : 'default'} style={{ backgroundColor: '#A5D6A7', color: '#1B5E20', border: 'none' }} onClick={() => handleFeedbackAction(fb.id, 'APPROVED')}>Approve</Button>
                                    <Button style={{ backgroundColor: '#BBDEFB', color: '#0D47A1', border: 'none' }}>Reply</Button>
                                    <Button style={{ backgroundColor: '#FFF59D', color: '#F57F17', border: 'none' }} onClick={() => handleFeedbackAction(fb.id, 'HIDDEN')}>Hide</Button>
                                </Space>
                            </div>
                            <div>
                                <div>
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} style={{ color: i < fb.rating ? '#FFC107' : '#E0E0E0', fontSize: 18 }}>★</span>
                                    ))}
                                    <Text strong style={{ marginLeft: 10 }}>{fb.title}</Text>
                                </div>
                                <Text style={{ color: '#666', marginTop: 8, display: 'block' }}>"{fb.comment}"</Text>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Table
                    columns={columns}
                    dataSource={customers}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                />
            )}
        </div>
    );
};

export default Customers;
