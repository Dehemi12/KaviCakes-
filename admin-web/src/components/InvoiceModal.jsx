import React from 'react';
import { Modal, Button, Typography, Row, Col, Divider, Table, Tag } from 'antd';
import { SendOutlined, WalletOutlined, ShoppingOutlined, UserOutlined, EnvironmentOutlined, CalendarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const InvoiceModal = ({ open, order, onClose }) => {
    if (!order) return null;

    const handleSendInvoice = async () => {
        try {
            await axios.post(`http://localhost:5000/api/orders/${order.id}/invoice/send`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            Modal.success({ content: 'Invoice sent successfully to customer!' });
            onClose();
        } catch (error) {
            Modal.error({ content: 'Failed to send invoice.' });
        }
    };

    const columns = [
        { 
            title: 'Item', 
            dataIndex: 'name', 
            key: 'name',
            render: (text, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong>{text}</Text>
                    {record.description && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.description}</Text>
                    )}
                    {record.customDetails && typeof record.customDetails === 'object' && (
                        <div style={{ marginTop: '4px', background: '#fafafa', padding: '8px', borderRadius: '8px', fontSize: '11px', border: '1px solid #f0f0f0' }}>
                            {Object.entries(record.customDetails).map(([k, v]) => {
                                if (!v) return null;
                                // Ignore long urls or raw JSON strings
                                if (typeof v === 'string' && v.startsWith('http')) {
                                    return <div key={k}><Text strong style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</Text>: <a href={v} target="_blank" rel="noopener noreferrer">View Image</a></div>;
                                }
                                return <div key={k}><Text strong style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</Text>: {String(v)}</div>;
                            })}
                        </div>
                    )}
                </div>
            )
        },
        { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', align: 'center' },
        { title: 'Price', dataIndex: 'price', key: 'price', render: (val) => `Rs.${val.toLocaleString()}` },
        {
            title: 'Total',
            key: 'total',
            align: 'right',
            render: (_, record) => `Rs.${(record.price * record.quantity).toLocaleString()}`
        },
    ];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            width={900}
            centered
            footer={[
                <Button key="close" onClick={onClose} size="large" style={{ borderRadius: '8px' }}>
                    Close
                </Button>,
                <Button 
                    key="send" 
                    type="primary" 
                    icon={<SendOutlined />} 
                    onClick={handleSendInvoice} 
                    size="large"
                    style={{ 
                        background: '#be185d', 
                        borderColor: '#be185d', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(233, 30, 99, 0.2)'
                    }}
                >
                    Send to Customer
                </Button>,
            ]}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShoppingOutlined style={{ color: '#be185d' }} />
                    <Title level={4} style={{ margin: 0 }}>Order Details & Invoice</Title>
                </div>
            }
            bodyStyle={{ padding: 0 }}
        >
            <div style={{ padding: '0', background: '#f8f9fa' }}>
                {/* Header Section */}
                <div style={{ 
                    padding: '32px', 
                    background: 'white', 
                    borderBottom: '1px solid #f0f0f0' 
                }}>
                    <Row justify="space-between" align="top">
                        <Col>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    background: '#fff0f6', 
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '28px'
                                }}>🍰</div>
                                <div>
                                    <Title level={3} style={{ margin: 0, color: '#be185d', letterSpacing: '-0.5px' }}>KaviCakes</Title>
                                    <Text type="secondary" style={{ fontSize: '13px' }}>Premium Designer Cakes</Text>
                                </div>
                            </div>
                            <div style={{ paddingLeft: '60px' }}>
                                <Text type="secondary" style={{ display: 'block' }}>123 Baker Street, Colombo</Text>
                                <Text type="secondary" style={{ display: 'block' }}>contact@kavicakes.com</Text>
                                <Text type="secondary" style={{ display: 'block' }}>+94 77 123 4567</Text>
                            </div>
                        </Col>
                        <Col style={{ textAlign: 'right' }}>
                            <Title level={4} style={{ color: '#be185d', margin: 0, fontSize: '24px' }}>INVOICE</Title>
                            <Text strong style={{ display: 'block', fontSize: '16px', marginTop: '4px' }}>
                                INV-#{order.id}
                            </Text>
                            <Text type="secondary">
                                Placed: {dayjs(order.createdAt).format('MMMM D, YYYY')}
                            </Text>
                            <div style={{ marginTop: 12 }}>
                                <Tag 
                                    color={order.paymentStatus === 'PAID' ? 'success' : 'error'} 
                                    style={{ padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold' }}
                                >
                                    {order.paymentStatus}
                                </Tag>
                            </div>
                        </Col>
                    </Row>
                </div>

                <div style={{ padding: '32px' }}>
                    {/* Customer & Delivery Information Cards */}
                    <Row gutter={24} style={{ marginBottom: '32px' }}>
                        <Col span={12}>
                            <Card 
                                title={<Space><UserOutlined style={{ color: '#be185d' }} />Customer Information</Space>}
                                bordered={false}
                                style={{ height: '100%', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>NAME</Text>
                                        <Text strong style={{ fontSize: '15px' }}>{order.customer?.name || 'Guest Customer'}</Text>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>CONTACT</Text>
                                        <Text style={{ display: 'block' }}>{order.customer?.email}</Text>
                                        <Text>{order.phoneNumber || order.customer?.phone || 'N/A'}</Text>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card 
                                title={<Space><EnvironmentOutlined style={{ color: '#be185d' }} />Delivery Details</Space>}
                                bordered={false}
                                style={{ height: '100%', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>DELIVERY ADDRESS</Text>
                                        <Text strong style={{ fontSize: '14px' }}>{order.address || 'Pick-up from Store'}</Text>
                                    </div>
                                    <div style={{ display: 'flex', gap: '24px', marginTop: '4px' }}>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>DELIVERY DATE</Text>
                                            <Space>
                                                <CalendarOutlined style={{ color: '#be185d', fontSize: '12px' }} />
                                                <Text strong>{dayjs(order.deliveryDate).format('dddd, MMMM D, YYYY')}</Text>
                                            </Space>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Order Items Table */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '32px' }}>
                        <Title level={5} style={{ marginBottom: '20px' }}>
                            <Space><ShoppingOutlined /> Purchased Items</Space>
                        </Title>
                        <Table
                            dataSource={order.items || []}
                            columns={columns}
                            pagination={false}
                            rowKey={(record, index) => `${record.name}-${index}`}
                            style={{ border: 'none' }}
                        />
                        
                        <div style={{ 
                            marginTop: '24px', 
                            padding: '24px', 
                            background: '#fff0f6', 
                            borderRadius: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <Space direction="vertical" size={0}>
                                <Text type="secondary">PAYMENT METHOD</Text>
                                <Space>
                                    <WalletOutlined style={{ color: '#be185d' }} />
                                    <Text strong>{order.paymentMethod?.replace(/_/g, ' ')}</Text>
                                </Space>
                            </Space>
                            <div style={{ textAlign: 'right' }}>
                                <Text type="secondary" style={{ fontSize: '16px' }}>GRAND TOTAL</Text>
                                <Title level={2} style={{ margin: 0, color: '#be185d' }}>Rs. {order.total.toLocaleString()}</Title>
                            </div>
                        </div>
                    </div>

                    {/* Special Instructions */}
                    {(order.specialNotes || order.deliveryStatus) && (
                        <div style={{ 
                            background: '#e6f7ff', 
                            padding: '16px 20px', 
                            borderRadius: '12px', 
                            border: '1px solid #91d5ff',
                            display: 'flex',
                            gap: '12px'
                        }}>
                            <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '18px', marginTop: '3px' }} />
                            <div>
                                <Text strong style={{ color: '#0050b3' }}>Special Instructions / Delivery Notes:</Text>
                                <div style={{ marginTop: '4px' }}>
                                    <Text style={{ color: '#0050b3' }}>{order.specialNotes || 'No special instructions provided.'}</Text>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ padding: '32px', textAlign: 'center', background: 'white', borderTop: '1px solid #f0f0f0' }}>
                    <Text type="secondary" style={{ fontSize: '14px', fontStyle: 'italic' }}>
                        "Baking memories, one cake at a time."
                    </Text>
                    <div style={{ marginTop: '8px' }}>
                        <Title level={5} style={{ margin: 0, color: '#bfbfbf', fontWeight: 300 }}>KaviCakes Sweet Support Team</Title>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default InvoiceModal;
