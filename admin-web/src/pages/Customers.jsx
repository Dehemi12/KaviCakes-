import React, { useEffect, useState } from 'react';
import { Table, Avatar, Typography, Button, Space, Card, Tag, Input, Row, Col, Modal } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, FilterOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All'); // 'All', 'HighLoyalty', 'Feedbacks'

    // Reply State
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedFeedbackId, setSelectedFeedbackId] = useState(null);
    const [replyText, setReplyText] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (filter === 'Feedbacks') {
                const res = await axios.get('http://localhost:5000/api/feedback', config);
                setFeedbacks(res.data);
            } else {
                const res = await axios.get('http://localhost:5000/api/customers', config);
                let data = res.data;
                if (filter === 'HighLoyalty') {
                    data = data.filter(c => c.loyaltyPoints >= 1000);
                }
                setCustomers(data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to fetch data: ' + (error.response?.data?.error || error.message));
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
            console.error('Action failed', error);
            alert('Action failed: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleOpenReply = (id) => {
        setSelectedFeedbackId(id);
        const fb = feedbacks.find(f => f.id === id);
        setReplyText(fb.reply || '');
        setReplyModalOpen(true);
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/feedback/${selectedFeedbackId}/reply`,
                { reply: replyText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setReplyModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Reply failed', error);
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
                        style={{ backgroundColor: '#FFD6E7', color: '#be185d', fontWeight: 'bold' }}
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
                                style={filter === 'All' ? { background: '#be185d', borderColor: '#be185d' } : {}}
                            >
                                All Customers
                            </Button>
                            <Button
                                type={filter === 'HighLoyalty' ? 'primary' : 'default'}
                                onClick={() => setFilter('HighLoyalty')}
                                style={filter === 'HighLoyalty' ? { background: '#be185d', borderColor: '#be185d' } : {}}
                            >
                                Customers above Loyalty points 1000
                            </Button>
                            <Button
                                type={filter === 'Feedbacks' ? 'primary' : 'default'}
                                onClick={() => setFilter('Feedbacks')}
                                style={filter === 'Feedbacks' ? { background: '#be185d', borderColor: '#be185d' } : {}}
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
                                        <Tag color={fb.status === 'APPROVED' ? 'success' : fb.status === 'HIDDEN' ? 'default' : 'warning'}>
                                            {fb.status}
                                        </Tag>
                                        <Tag color="#FFD6E7" style={{ color: '#be185d', borderRadius: 10 }}>
                                            Loyalty points {fb.customer?.loyaltyPoints || 0}
                                        </Tag>
                                        <Text type="secondary" style={{ fontSize: 12 }}>For: Order #{fb.orderId}</Text>
                                    </Space>
                                </div>
                                <Space>
                                    {fb.status !== 'APPROVED' && (
                                        <Button type="primary" style={{ backgroundColor: '#A5D6A7', color: '#1B5E20', border: 'none' }} onClick={() => handleFeedbackAction(fb.id, 'APPROVED')}>Approve</Button>
                                    )}
                                    <Button style={{ backgroundColor: '#BBDEFB', color: '#0D47A1', border: 'none' }} onClick={() => handleOpenReply(fb.id)}>
                                        {fb.reply ? 'Edit Reply' : 'Reply'}
                                    </Button>
                                    {fb.status !== 'HIDDEN' && (
                                        <Button style={{ backgroundColor: '#FFF59D', color: '#F57F17', border: 'none' }} onClick={() => handleFeedbackAction(fb.id, 'HIDDEN')}>Hide</Button>
                                    )}
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

                                {fb.reply && (
                                    <div style={{ marginTop: 15, padding: 15, background: '#f5f5f5', borderRadius: 8, borderLeft: '3px solid #be185d' }}>
                                        <Text strong style={{ color: '#be185d', display: 'block', marginBottom: 5 }}>Admin Reply</Text>
                                        <Text>{fb.reply}</Text>
                                    </div>
                                )}
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

            {/* Reply Modal */}
            <Modal
                title="Reply to Feedback"
                open={replyModalOpen}
                onCancel={() => setReplyModalOpen(false)}
                onOk={handleSendReply}
                okText="Send Reply"
                okButtonProps={{ style: { backgroundColor: '#be185d', borderColor: '#be185d' } }}
            >
                <Input.TextArea
                    rows={4}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write your reply here..."
                />
            </Modal>
        </div>
    );
};

export default Customers;
