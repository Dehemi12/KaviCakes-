import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Typography, Row, Col, Space, message, Badge, Empty, Spin, Divider, Image, Statistic, Tabs, Descriptions, Tooltip, Modal } from 'antd';
import {
    ClockCircleOutlined,
    CheckCircleOutlined,
    FireOutlined,
    PrinterOutlined,
    UserOutlined,
    CalendarOutlined,
    ExclamationCircleOutlined,
    ShoppingOutlined,
    AppstoreOutlined,
    InteractionOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Production = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('queue');
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter relevant orders
            const productionOrders = res.data.filter(o =>
                ['CONFIRMED', 'ADMIN_CONFIRMED', 'PREPARING'].includes(o.status)
            ).sort((a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate));

            setOrders(productionOrders);
        } catch (error) {
            console.error(error);
            message.error("Failed to load production orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const moveToPreparing = async (order) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/orders/${order.id}/status`, { status: 'PREPARING' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(`Order #${order.id} started production`);
            fetchOrders();
        } catch (error) {
            message.error("Failed to update status");
        }
    };

    const moveToReady = async (order) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/orders/${order.id}/status`, { status: 'READY' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(`Order #${order.id} marked as READY`);
            fetchOrders();
        } catch (error) {
            message.error("Failed to update status");
        }
    };

    // Helper to check valid payment for production
    const isPaymentValid = (o) => ['PAID', 'PAYMENT_APPROVED_BY_ADMIN', 'ADVANCE_RECEIVED'].includes(o.paymentStatus);

    const getFilteredOrders = () => {
        // Filter out unpaid orders globally for production view
        const validOrders = orders.filter(isPaymentValid);

        if (activeTab === 'queue') {
            return validOrders.filter(o => ['CONFIRMED', 'ADMIN_CONFIRMED'].includes(o.status));
        }
        if (activeTab === 'progress') {
            return validOrders.filter(o => o.status === 'PREPARING');
        }
        return validOrders; // All valid production orders
    };

    const displayedOrders = getFilteredOrders();

    // Counts match the filtered view
    const validOrdersForCounts = orders.filter(isPaymentValid);
    const queueCount = validOrdersForCounts.filter(o => ['CONFIRMED', 'ADMIN_CONFIRMED'].includes(o.status)).length;
    const progressCount = validOrdersForCounts.filter(o => o.status === 'PREPARING').length;

    const items = [
        {
            key: 'queue',
            label: `Production Queue (${queueCount})`,
            children: <div />, // Content rendered below
            icon: <AppstoreOutlined />
        },
        {
            key: 'progress',
            label: `In Progress (${progressCount})`,
            children: <div />,
            icon: <FireOutlined />
        },
        {
            key: 'all',
            label: 'All Orders',
            children: <div />,
            icon: <InteractionOutlined />
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Production Floor</Title>
                <Text type="secondary">Manage Kitchen Workflow & Preparation</Text>
            </div>

            <div style={{ marginBottom: 16, display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Space>
                    <div style={{ width: 20, height: 20, background: '#fff', border: '1px solid #ddd', borderRadius: 4 }}></div>
                    <Text>Standard</Text>
                </Space>
                <Space>
                    <div style={{ width: 20, height: 20, background: '#f9f0ff', border: '1px solid #d3adf7', borderRadius: 4 }}></div>
                    <Text>Custom</Text>
                </Space>
                <Space>
                    <div style={{ width: 20, height: 20, background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 4 }}></div>
                    <Text>Bulk</Text>
                </Space>
            </div>

            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={12}>
                    <Card bordered={false}>
                        <Statistic
                            title="Pending in Queue"
                            value={queueCount}
                            valueStyle={{ color: '#faad14' }}
                            prefix={<AppstoreOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card bordered={false}>
                        <Statistic
                            title="Currently Preparing"
                            value={progressCount}
                            valueStyle={{ color: '#cf1322' }}
                            prefix={<FireOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={items}
                type="card"
                size="large"
                style={{ marginBottom: 20 }}
            />

            <Row gutter={[16, 16]}>
                {displayedOrders.length === 0 ? (
                    <Col span={24}><Empty description="No orders in this stage" /></Col>
                ) : (
                    displayedOrders.map(order => {
                        const isPreparing = order.status === 'PREPARING';
                        const isUrgent = order.orderType === 'URGENT';
                        const isBulk = order.isBulk || order.orderType === 'BULK';

                        // Restriction Logic
                        const isPaid = ['PAID', 'PAYMENT_APPROVED_BY_ADMIN', 'ADVANCE_RECEIVED'].includes(order.paymentStatus);
                        const daysToDelivery = dayjs(order.deliveryDate).diff(dayjs(), 'day');
                        // Allow if urgent regardless of date. If regular, must be within 3 days.
                        const isDateValid = isUrgent || daysToDelivery <= 3;

                        let prepBlockReason = null;
                        if (!isPaid) prepBlockReason = "Payment Pending (Advance Required)";
                        else if (!isDateValid) prepBlockReason = `Too Early (${daysToDelivery} days till Due)`;

                        return (
                            <Col xs={24} lg={12} xl={8} key={order.id}>
                                <Card
                                    hoverable
                                    onClick={() => setSelectedOrder(order)}
                                    className={isUrgent ? 'urgent-card' : ''}
                                    style={{
                                        borderTop: isUrgent ? '4px solid #f5222d' : (isBulk ? '4px solid #722ed1' : '4px solid #1890ff'),
                                        height: '100%',
                                        background: order.isCustom ? '#f9f0ff' : isBulk ? '#fff7e6' : 'white'
                                    }}
                                    title={
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Space>
                                                <Text code strong>#{order.id}</Text>
                                                {isUrgent && <Tag color="red">URGENT</Tag>}
                                                {isBulk && <Tag color="purple">BULK</Tag>}
                                            </Space>
                                            <Tag color={isPreparing ? "orange" : "cyan"}>
                                                {isPreparing ? "IN OVEN" : "QUEUED"}
                                            </Tag>
                                        </div>
                                    }
                                    actions={[
                                        !isPreparing ? (
                                            <Tooltip title={prepBlockReason || "Start Kitchen Work"}>
                                                <span style={{ width: '100%', display: 'block', padding: '0 8px' }}>
                                                    <Button
                                                        type="primary"
                                                        block
                                                        onClick={(e) => { e.stopPropagation(); moveToPreparing(order); }}
                                                        icon={<FireOutlined />}
                                                        disabled={!!prepBlockReason}
                                                        danger={!!prepBlockReason}
                                                    >
                                                        Start Prep
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                        ) : (
                                            <Button type="primary" block style={{ background: '#52c41a', borderColor: '#52c41a' }} icon={<CheckCircleOutlined />} onClick={(e) => { e.stopPropagation(); moveToReady(order); }}>Mark Ready</Button>
                                        )
                                    ]}
                                >
                                    <div style={{ textAlign: 'center', marginBottom: 15, padding: 10, background: '#fff0f6', borderRadius: 8, border: '1px dashed #ffadd2' }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>DUE DATE</Text>
                                        <Title level={3} style={{ margin: 0, color: '#c41d7f' }}>
                                            {dayjs(order.deliveryDate).format('MMM D')}
                                        </Title>
                                        <Text strong>{dayjs(order.deliveryDate).format('dddd, h:mm A')}</Text>
                                    </div>

                                    <Descriptions column={1} size="small" bordered>
                                        <Descriptions.Item label="Customer">{order.customer?.name}</Descriptions.Item>
                                        <Descriptions.Item label="Items">
                                            <List
                                                size="small"
                                                dataSource={order.items}
                                                renderItem={item => (
                                                    <List.Item style={{ padding: '8px 0' }}>
                                                        <List.Item.Meta
                                                            avatar={<Image width={40} src={item.image} fallback="https://via.placeholder.com/40" />}
                                                            title={`${item.quantity}x ${item.name}`}
                                                            description={item.variant?.flavor?.label || item.variantDescription}
                                                        />
                                                    </List.Item>
                                                )}
                                            />
                                        </Descriptions.Item>
                                        {order.specialNotes && (
                                            <Descriptions.Item label="Notes">
                                                <Text type="warning"><ExclamationCircleOutlined /> {order.specialNotes}</Text>
                                            </Descriptions.Item>
                                        )}
                                    </Descriptions>
                                </Card>
                            </Col>
                        );
                    })
                )}
            </Row>

            <Modal
                title={`Order #${selectedOrder?.id} Details`}
                open={!!selectedOrder}
                onCancel={() => setSelectedOrder(null)}
                footer={[
                    <Button key="close" onClick={() => setSelectedOrder(null)}>Close</Button>
                ]}
                width={700}
            >
                {selectedOrder && (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Customer">
                            <Text strong>{selectedOrder.customer?.name}</Text>
                            <br />
                            <Text type="secondary">{selectedOrder.customer?.phone}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Delivery Info">
                            <Space direction="vertical">
                                <Text><CalendarOutlined /> {dayjs(selectedOrder.deliveryDate).format('dddd, MMMM D, YYYY')}</Text>
                                <Text><ClockCircleOutlined /> {dayjs(selectedOrder.deliveryDate).format('h:mm A')}</Text>
                                <Tag color={selectedOrder.deliveryType === 'delivery' ? 'blue' : 'orange'}>
                                    {selectedOrder.deliveryType?.toUpperCase()}
                                </Tag>
                                {selectedOrder.deliveryType === 'delivery' && (
                                    <Text>{selectedOrder.deliveryAddress}</Text>
                                )}
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Special Instructions">
                            {selectedOrder.specialNotes ? (
                                <Text type="warning" strong><ExclamationCircleOutlined /> {selectedOrder.specialNotes}</Text>
                            ) : <Text type="secondary">None</Text>}
                        </Descriptions.Item>
                        <Descriptions.Item label="Order Items">
                            <List
                                itemLayout="horizontal"
                                dataSource={selectedOrder.items}
                                renderItem={item => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={<Image width={60} src={item.image} fallback="https://via.placeholder.com/60" />}
                                            title={<Text strong>{item.quantity}x {item.name}</Text>}
                                            description={
                                                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                                                    {item.customDetails ? (
                                                        <div className="text-xs bg-gray-50 p-2 rounded border">
                                                            <div className="font-bold text-pink-600 mb-1">Custom Specs:</div>
                                                            {item.customDetails.cakeSize && <div>Size: {item.customDetails.cakeSize}</div>}
                                                            {item.customDetails.flavor && <div>Flavor: {item.customDetails.flavor}</div>}
                                                            {item.customDetails.cakeShape && <div>Shape: {item.customDetails.cakeShape}</div>}
                                                            {item.customDetails.message && <div className="mt-1">Message: <strong>{item.customDetails.message}</strong></div>}
                                                            {item.customDetails.instructions && <div className="mt-1 text-red-500">Note: {item.customDetails.instructions}</div>}
                                                            {item.customDetails.designImage && (
                                                                <div className="mt-2">
                                                                    <div className="text-xs text-gray-400 mb-1">Ref Image:</div>
                                                                    <Image src={item.customDetails.designImage} width={80} />
                                                                </div>
                                                            )}
                                                            {/* Bulk Order Extra Fields */}
                                                            {item.customDetails.colorTheme && <div>Color: <strong>{item.customDetails.colorTheme}</strong></div>}
                                                            {item.customDetails.packingInstructions && <div className="mt-1 text-blue-600">Packing: {item.customDetails.packingInstructions}</div>}
                                                            {item.customDetails.referenceImage && (
                                                                <div className="mt-2">
                                                                    <div className="text-xs text-gray-400 mb-1">Ref Image:</div>
                                                                    <Image src={item.customDetails.referenceImage} width={80} />
                                                                </div>
                                                            )}
                                                            {item.customDetails.packingImage && (
                                                                <div className="mt-2">
                                                                    <div className="text-xs text-gray-400 mb-1">Packing Ref:</div>
                                                                    <Image src={item.customDetails.packingImage} width={80} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        item.variant && (
                                                            <>
                                                                {item.variant.flavor && <Text>Flavor: {item.variant.flavor.label}</Text>}
                                                                {item.variant.size && <Text>Size: {item.variant.size.label}</Text>}
                                                                {item.variant.shape && <Text>Shape: {item.variant.shape.label}</Text>}
                                                            </>
                                                        )
                                                    )}
                                                    {item.description && <Text type="secondary">{item.description}</Text>}
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
};

export default Production;
