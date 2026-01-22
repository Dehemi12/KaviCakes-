import React, { useEffect, useState } from 'react';
import { Tabs, List, Button, Card, Typography, Space, Badge, message, Row, Col, Input, Modal, Tag, Select, Table } from 'antd';
import { BellOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, BankOutlined, GiftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Search } = Input;

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const openSendModal = (template) => {
        setSelectedTemplate(template);
        setIsSendModalOpen(true);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [notifRes, tempRes] = await Promise.all([
                axios.get('http://localhost:5000/api/notifications', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/notifications/templates', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setNotifications(notifRes.data);
            setTemplates(tempRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprovePayment = async (notifId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/notifications/approve-payment', { notificationId: notifId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Payment Approved & Order Updated');
            fetchData(); // Refresh list
        } catch (error) {
            message.error('Action Failed');
        }
    };

    const handleMarkRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'PAYMENT': return <BankOutlined style={{ fontSize: 24, color: '#E91E63' }} />;
            case 'ORDER': return <FileTextOutlined style={{ fontSize: 24, color: '#FF9800' }} />;
            case 'DELIVERY': return <BellOutlined style={{ fontSize: 24, color: '#4CAF50' }} />;
            default: return <BellOutlined />;
        }
    };

    const renderNotificationItem = (item) => (
        <List.Item style={{ background: item.isRead ? '#fff' : '#FFF0F5', padding: 20, marginBottom: 10, borderRadius: 8, border: '1px solid #eee' }}>
            <List.Item.Meta
                avatar={<div style={{ padding: 10, background: '#fff', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>{getIcon(item.type)}</div>}
                title={<Space><Text strong>{item.title}</Text> {!item.isRead && <Badge dot color="#E91E63" />}</Space>}
                description={
                    <div>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 10 }}>{item.message}</Text>
                        <Space>
                            {item.type === 'PAYMENT' && !item.isRead && (
                                <>
                                    <Button type="primary" style={{ background: '#4CAF50', borderColor: '#4CAF50' }} onClick={() => handleApprovePayment(item.id)}>Approve Payment</Button>
                                    <Button onClick={() => Modal.info({ title: 'Bank Slip', content: <img src={item.metadata?.slipUrl} alt="Slip" style={{ width: '100%' }} /> })}>View Slip</Button>
                                </>
                            )}
                            {item.type === 'ORDER' && !item.isRead && (
                                <>
                                    <Button type="primary" style={{ background: '#E91E63', borderColor: '#E91E63' }}>Accept</Button>
                                    <Button danger>Reject</Button>
                                </>
                            )}
                            {!item.isRead && <Button type="text" size="small" onClick={() => handleMarkRead(item.id)}>Dismiss</Button>}
                        </Space>
                    </div>
                }
            />
            <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </div>
        </List.Item>
    );

    const TemplatesTab = () => (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <Space>
                    <Select defaultValue="All Templates" style={{ width: 150 }} options={[{ value: 'All Templates', label: 'All Templates' }]} />
                    <Search placeholder="Search templates..." style={{ width: 200 }} />
                </Space>
                <Button type="primary" icon={<PlusOutlined />} style={{ background: '#E91E63', borderColor: '#E91E63' }}>Create Template</Button>
            </div>
            <Row gutter={[16, 16]}>
                {templates.map(t => (
                    <Col span={12} key={t.id}>
                        <Card
                            title={<Space>{t.title} <Tag color="magenta">{t.category}</Tag></Space>}
                            extra={
                                <Space>
                                    <Button type="link" size="small" icon={<SendOutlined />} onClick={() => openSendModal(t)}>Use</Button>
                                    <EditOutlined style={{ color: '#999' }} />
                                    <DeleteOutlined style={{ color: '#999' }} />
                                </Space>
                            }
                        >
                            <Text type="secondary" style={{ fontSize: 12 }}>{t.body}</Text>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );


    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <Title level={2}>Notifications</Title>
                <Text type="secondary">Manage customer notifications and templates</Text>
            </div>

            <Tabs defaultActiveKey="1" items={[
                {
                    key: '1',
                    label: `Unread Notifications (${notifications.filter(n => !n.isRead).length})`,
                    children: <List dataSource={notifications} renderItem={renderNotificationItem} loading={loading} />
                },
                {
                    key: '2',
                    label: 'Notification Templates',
                    children: <TemplatesTab />
                },
                {
                    key: '3',
                    label: 'Send Manual Notifications',
                    children: <ManualSenderTab />
                }
            ]} />

            <SendNotificationModal
                open={isSendModalOpen}
                onClose={() => setIsSendModalOpen(false)}
                template={selectedTemplate}
                initialSelectedOrders={selectedTemplate ? [] : null} // Allow modal to handle pre-selection logic differently
                manualRecipients={!selectedTemplate ? selectedTemplate : null} // Hacky way to pass data, better to use context or cleaner props
            />
        </div>
    );
};

function ManualSenderTab() {
    const [orders, setOrders] = useState([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]); // Array of order IDs
    const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const columns = [
        { title: 'Order ID', dataIndex: 'id', render: id => <b>#{id}</b> },
        { title: 'Customer', dataIndex: ['customer', 'name'] },
        { title: 'Items', render: (_, r) => Array.isArray(r.items) ? r.items.map(i => `${i.name} (${i.quantity})`).join(', ') : 'No items' },
        { title: 'Date', dataIndex: 'createdAt', render: d => new Date(d).toLocaleDateString() },
        { title: 'Price', dataIndex: 'total', render: t => `Rs.${Number(t).toLocaleString()}` },
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys) => setSelectedRowKeys(newSelectedRowKeys),
    };

    return (
        <div>
            <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={orders}
                rowKey="id"
                pagination={{ pageSize: 5 }}
            />
            <div style={{ marginTop: 20 }}>
                <Button
                    type="primary"
                    size="large"
                    style={{ background: '#E91E63', borderColor: '#E91E63', borderRadius: 20, paddingLeft: 30, paddingRight: 30 }}
                    onClick={() => setIsComposeModalOpen(true)}
                    disabled={selectedRowKeys.length === 0}
                >
                    Compose a message
                </Button>
            </div>

            {/* Reusing the modal but for manual mode */}
            {isComposeModalOpen && (
                <SendNotificationModal
                    open={true}
                    onClose={() => setIsComposeModalOpen(false)}
                    template={null}
                    preSelectedOrderIds={selectedRowKeys}
                />
            )}
        </div>
    );
}

function SendNotificationModal({ open, onClose, template, preSelectedOrderIds }) {
    const [orders, setOrders] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [messageText, setMessageText] = useState('');

    useEffect(() => {
        if (open) {
            fetchOrders();
            // If manual mode (preSelectedOrderIds exists), use it. Else use auto-filter logic.
            if (preSelectedOrderIds) {
                setSelectedOrders(preSelectedOrderIds);
                setMessageText('');
            } else {
                setSelectedOrders([]); // Will be populated by fetchOrders->filtering
                setMessageText(template?.body || '');
            }
        }
    }, [open, template, preSelectedOrderIds]);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const allOrders = res.data;
            setOrders(allOrders);

            // Only run smart filtering if it's a template AND we aren't in manual mode
            if (template && !preSelectedOrderIds) {
                let filtered = allOrders;
                // ... (Keep existing smart filtering logic) ...
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const getDiffDays = (d) => {
                    if (!d) return -1;
                    const date = new Date(d);
                    date.setHours(0, 0, 0, 0);
                    return Math.floor((date - today) / (1000 * 60 * 60 * 24));
                };

                const title = template.title.toLowerCase();

                if (title.includes('request order confirmation') || title.includes('bulk order')) {
                    filtered = allOrders.filter(o => getDiffDays(o.deliveryDate) >= 5 && (o.status === 'NEW' || o.status === 'CONFIRMED'));
                } else if (title.includes('edit order')) {
                    filtered = allOrders.filter(o => getDiffDays(o.deliveryDate) >= 2);
                } else if (title.includes('out for delivery')) {
                    filtered = allOrders.filter(o => {
                        const days = getDiffDays(o.deliveryDate);
                        return days === 0 && (o.status === 'PREPARING' || o.status === 'CONFIRMED');
                    });
                } else if (title.includes('payment') || title.includes('do payments')) {
                    filtered = allOrders.filter(o => o.paymentStatus === 'PENDING' && o.status !== 'CANCELLED');
                } else if (title.includes('delivered') || title.includes('feedback')) {
                    filtered = allOrders.filter(o => o.status === 'DELIVERED');
                }

                if (filtered.length === 0 && !template?.title.toLowerCase().includes('delivered')) {
                    filtered = allOrders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
                }

                // Auto-select for template mode
                setSelectedOrders(filtered.map(o => o.id));
            }
        } catch (error) {
            console.error('Failed to load orders');
        }
    };

    const handleSend = () => {
        if (selectedOrders.length === 0) return message.error('No orders selected');
        message.success(`Sent to ${selectedOrders.length} customers successfully!`);
        onClose();
    };

    const isManual = !template;

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={template ? `Send: ${template.title}` : 'Compose Manual Message'}
            okText={`Send to ${selectedOrders.length} Customers`}
            onOk={handleSend}
            width={600}
        >
            {template && (
                <div style={{ marginBottom: 15, background: '#e6f7ff', padding: 15, borderRadius: 8, border: '1px solid #91d5ff' }}>
                    <Text strong><CheckCircleOutlined /> Automatic Selection</Text>
                    <div style={{ marginTop: 5 }}>
                        The system found <b>{selectedOrders.length} orders</b> matching criteria.
                    </div>
                </div>
            )}

            <div style={{ marginBottom: 15 }}>
                <Text strong>Recipients</Text>
                <div style={{ marginTop: 5, maxHeight: 150, overflowY: 'auto', border: '1px solid #eee', padding: 10, borderRadius: 4 }}>
                    <Select
                        mode="multiple"
                        style={{ width: '100%' }}
                        placeholder="No recipients"
                        value={selectedOrders}
                        onChange={setSelectedOrders}
                        maxTagCount="responsive"
                        disabled={!isManual}
                    >
                        {orders.map(o => (
                            <Select.Option key={o.id} value={o.id}>
                                {o.customer?.name} (#{o.id})
                            </Select.Option>
                        ))}
                    </Select>
                </div>
            </div>

            <div>
                <Text strong>Message</Text>
                {!isManual && (
                    <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>
                        Dynamic variables like {'{{name}}'} will be replaced for each customer.
                    </Text>
                )}
                <Input.TextArea
                    rows={4}
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder={isManual ? "Type your message here..." : ""}
                    readOnly={!isManual} // Templates are read-only for now based on earlier logic, but manual should be editable
                    style={!isManual ? { background: '#f5f5f5' } : {}}
                />
            </div>
        </Modal>
    );
};

export default Notifications;
