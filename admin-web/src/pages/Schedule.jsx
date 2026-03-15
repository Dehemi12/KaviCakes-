import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Button, Typography, Card, Row, Col, Segmented, Tag, List, message, Descriptions, Modal, Empty, Divider, Table, Space, Image } from 'antd';
import { CarOutlined, ShopOutlined, CheckCircleOutlined, ClockCircleOutlined, UserOutlined, PhoneOutlined, EnvironmentOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import ReceivePaymentModal from '../components/ReceivePaymentModal';

const { Title, Text } = Typography;

const Schedule = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('List'); // 'List', 'Calendar', or 'Table'
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [activeTab, setActiveTab] = useState('Delivery');
    const [currentOrder, setCurrentOrder] = useState(null); // For detail modal
    const [paymentModalOrder, setPaymentModalOrder] = useState(null);

    const fetchLogisticsOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Filter strictly for Ready (Production Done) or Out for Delivery
            const logistics = res.data.filter(o =>
                ['READY', 'OUT_FOR_DELIVERY'].includes(o.status.toUpperCase())
            ).sort((a, b) => {
                const dateA = a.deliveryDate ? new Date(a.deliveryDate) : new Date(8640000000000000);
                const dateB = b.deliveryDate ? new Date(b.deliveryDate) : new Date(8640000000000000);
                return dateA - dateB;
            });

            setOrders(logistics);
        } catch (error) {
            console.error(error);
            message.error("Failed to load schedule");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogisticsOrders();
    }, []);

    const updateStatus = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(`Order #${orderId} marked as ${newStatus}`);
            fetchLogisticsOrders();
        } catch (error) {
            message.error(error.response?.data?.error || "Failed to update status");
        }
    };

    const getFilteredOrders = () => {
        return orders.filter(o => {
            const method = o.delivery?.deliveryMethod || o.deliveryMethod || 'Standard';
            const isPickup = String(method).toLowerCase() === 'pickup';
            if (activeTab === 'Delivery') return !isPickup;
            return isPickup;
        });
    };

    const displayOrders = getFilteredOrders();

    const dateCellRender = (value) => {
        const listData = displayOrders.filter(o => o.deliveryDate && dayjs(o.deliveryDate).isSame(value, 'day'));
        return (
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {listData.map(item => (
                    <li key={item.id}>
                        <Badge status={item.status === 'OUT_FOR_DELIVERY' ? 'processing' : 'success'} text={`#${item.id}`} />
                    </li>
                ))}
            </ul>
        );
    };

    const tableColumns = [
        { title: 'Order ID', dataIndex: 'id', key: 'id', render: id => <b>#{id}</b> },
        { title: 'Customer', dataIndex: 'customer', key: 'customer', render: c => c?.name || 'N/A' },
        {
            title: 'Delivery Date',
            dataIndex: 'deliveryDate',
            key: 'deliveryDate',
            render: d => dayjs(d).format('MMM D, YYYY')
        },
        {
            title: 'Payment Method',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            render: m => <Tag>{m}</Tag>
        },
        {
            title: 'Balance to Collect',
            dataIndex: 'balanceAmount',
            key: 'balanceAmount',
            render: (bal, record) => {
                const balance = Number(bal);
                if (balance > 0) {
                    return (
                        <Space direction="vertical" size={0}>
                            <Text type="danger" strong>Rs.{balance.toLocaleString()}</Text>
                            {record.paymentMethod === 'COD' && (
                                <Tag color="volcano" style={{ fontSize: '10px' }}>COLLECT ON DELIVERY</Tag>
                            )}
                        </Space>
                    );
                }
                return <Text type="success">Rs.0 (Fully Paid)</Text>;
            }
        },
        {
            title: 'Payment Status',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (status, record) => {
                const balance = Number(record.balanceAmount || 0);
                let tag = <Tag color="error">PENDING</Tag>;
                if (balance <= 0) tag = <Tag color="success">PAID</Tag>;
                else if (Number(record.advanceAmount) > 0) tag = <Tag color="warning">PARTIAL</Tag>;
                
                return (
                    <Space direction="vertical" size={4}>
                        {tag}
                        {record.bankSlip && (
                            <Image 
                                src={record.bankSlip} 
                                width={36} 
                                height={36} 
                                className="rounded" 
                                style={{ 
                                    objectFit: 'cover', 
                                    borderRadius: '4px', 
                                    border: '1px solid #eee',
                                    display: 'block'
                                }} 
                                alt="Slip"
                            />
                        )}
                    </Space>
                );
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => {
                const balance = Number(record.balanceAmount || 0);
                const isDelivered = record.status === 'DELIVERED';

                if (isDelivered) return <Tag color="success">COMPLETED</Tag>;

                return (
                    <Space>
                        {balance > 0 ? (
                            <Button
                                size="small"
                                type="primary"
                                icon={<DollarOutlined />}
                                style={{ backgroundColor: '#1890ff' }}
                                onClick={() => setPaymentModalOrder(record)}
                            >
                                Deliver & Complete Payment
                            </Button>
                        ) : (
                            <Button
                                size="small"
                                type="primary"
                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                onClick={() => updateStatus(record.id, 'DELIVERED')}
                            >
                                {activeTab === 'Delivery' ? 'Mark Delivered' : 'Mark Picked Up'}
                            </Button>
                        )}
                    </Space>
                );
            }
        }
    ];

    return (
        <div style={{ padding: 0 }}>
            <div style={{ marginBottom: 20, background: '#fff', padding: 24, borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>Logistics & Schedule</Title>
                        <Text type="secondary">Manage Pickups and Deliveries • {orders.length} Active</Text>
                    </div>
                    <Segmented
                        options={['List', 'Table', 'Calendar']}
                        value={viewMode}
                        onChange={setViewMode}
                    />
                </div>

                <Segmented
                    block
                    options={[
                        { label: 'DELIVERIES', value: 'Delivery', icon: <CarOutlined /> },
                        { label: 'PICKUPS', value: 'Pickup', icon: <ShopOutlined /> }
                    ]}
                    value={activeTab}
                    onChange={setActiveTab}
                    size="large"
                />
            </div>

            <div style={{ padding: 24 }}>
                {viewMode === 'Calendar' ? (
                    <Card>
                        <Calendar cellRender={(current, info) => {
                            if (info.type === 'date') return dateCellRender(current);
                            return info.originNode;
                        }} />
                    </Card>
                ) : viewMode === 'Table' ? (
                    <Card bodyStyle={{ padding: 0 }}>
                        <Table
                            columns={tableColumns}
                            dataSource={displayOrders}
                            rowKey="id"
                            loading={loading}
                            pagination={{ pageSize: 15 }}
                        />
                    </Card>
                ) : (
                    <Row gutter={[16, 16]}>
                        {displayOrders.length === 0 ? (
                            <Col span={24}><Empty description="No active tasks in this view" /></Col>
                        ) : (
                            displayOrders.map(order => {
                                const isOut = order.status === 'OUT_FOR_DELIVERY';
                                const balance = Number(order.balanceAmount || 0);
                                return (
                                    <Col xs={24} md={12} lg={8} key={order.id}>
                                        <Card
                                            hoverable
                                            title={
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>#{order.id} - {order.customer?.name}</span>
                                                    <Tag color={isOut ? "processing" : "success"}>{order.status.replace(/_/g, ' ')}</Tag>
                                                </div>
                                            }
                                            actions={[
                                                balance > 0 ? (
                                                    <Button type="primary" icon={<DollarOutlined />} onClick={() => setPaymentModalOrder(order)}>
                                                        Deliver & Complete Payment
                                                    </Button>
                                                ) : (
                                                    <Button type="primary" style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={() => updateStatus(order.id, 'DELIVERED')}>
                                                        {activeTab === 'Delivery' ? 'Delivered' : 'Picked Up'}
                                                    </Button>
                                                )
                                            ]}
                                        >
                                            <Descriptions column={1} size="small">
                                                <Descriptions.Item label="Due"><CalendarOutlined /> {dayjs(order.deliveryDate).format('MMM D, YYYY')}</Descriptions.Item>
                                                <Descriptions.Item label="Payment">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                        <Space>
                                                            <Tag color={balance > 0 ? "warning" : "success"}>
                                                                {balance > 0 ? "PARTIAL" : "PAID"}
                                                            </Tag>
                                                            {balance > 0 && <Text type="danger" strong>Rs.{balance.toLocaleString()}</Text>}
                                                        </Space>
                                                        {order.bankSlip && (
                                                            <Image 
                                                                src={order.bankSlip} 
                                                                width={36} 
                                                                height={36} 
                                                                style={{ 
                                                                    objectFit: 'cover', 
                                                                    borderRadius: '4px', 
                                                                    border: '1px solid #eee' 
                                                                }} 
                                                                alt="Slip" 
                                                            />
                                                        )}
                                                    </div>
                                                </Descriptions.Item>
                                                <Descriptions.Item label="Contact"><PhoneOutlined /> {order.customer?.phone || 'N/A'}</Descriptions.Item>
                                                {activeTab === 'Delivery' && (
                                                    <Descriptions.Item label="Address"><EnvironmentOutlined /> {order.delivery?.address || order.address}</Descriptions.Item>
                                                )}
                                                <Descriptions.Item label="Items">
                                                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                                                        {order.items?.map(i => (
                                                            <li key={i.id}>{i.quantity}x {i.name}</li>
                                                        ))}
                                                    </ul>
                                                </Descriptions.Item>
                                            </Descriptions>
                                        </Card>
                                    </Col>
                                );
                            })
                        )}
                    </Row>
                )}
            </div>

            <ReceivePaymentModal
                open={!!paymentModalOrder}
                order={paymentModalOrder}
                onClose={() => setPaymentModalOrder(null)}
                onSuccess={fetchLogisticsOrders}
                defaultMarkAsDelivered={true}
            />
        </div>
    );
};

export default Schedule;
