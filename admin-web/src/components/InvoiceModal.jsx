import React from 'react';
import { Modal, Button, Typography, Row, Col, Divider, Table, Tag } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import axios from 'axios';

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
        { title: 'Item', dataIndex: 'name', key: 'name' },
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
            width={800}
            footer={[
                <Button key="close" onClick={onClose}>Close</Button>,
                <Button key="send" type="primary" icon={<SendOutlined />} onClick={handleSendInvoice} style={{ background: '#E91E63', borderColor: '#E91E63' }}>
                    Send to Customer
                </Button>,
            ]}
            title={<Title level={4}>Invoice</Title>}
        >
            <div style={{ padding: '20px' }}>
                <Row justify="space-between">
                    <Col>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '24px' }}>🍰</span>
                            <Title level={3} style={{ margin: 0, color: '#E91E63' }}>KaviCakes</Title>
                        </div>
                        <Text>123 Baker Street, Colombo</Text><br />
                        <Text>contact@kavicakes.com</Text><br />
                        <Text>+94 77 123 4567</Text>
                    </Col>
                    <Col style={{ textAlign: 'right' }}>
                        <Title level={4} style={{ color: '#E91E63', margin: 0 }}>INVOICE</Title>
                        <Text>Invoice #: INV-{order.id}</Text><br />
                        <Text>Date: {new Date(order.createdAt).toLocaleDateString()}</Text><br />
                        <div style={{ marginTop: 10 }}>
                            <Tag color={order.paymentStatus === 'PAID' ? 'green' : 'red'}>{order.paymentStatus}</Tag>
                        </div>
                    </Col>
                </Row>

                <Divider />

                <Row gutter={24}>
                    <Col span={12}>
                        <Title level={5}>Bill To:</Title>
                        <Text strong>{order.customer?.name}</Text><br />
                        <Text>{order.address}</Text><br />
                        <Text>{order.customer?.email}</Text>
                    </Col>
                    <Col span={12}>
                        <Title level={5}>Payment Info:</Title>
                        <Text>Method: {order.paymentMethod}</Text><br />
                        <Text>Order Status: <Tag color="blue">{order.status}</Tag></Text>
                    </Col>
                </Row>

                <Table
                    dataSource={order.items || []}
                    columns={columns}
                    pagination={false}
                    rowKey="name"
                    style={{ marginTop: '20px' }}
                />

                <Row justify="end" style={{ marginTop: '20px' }}>
                    <Col span={8} style={{ textAlign: 'right' }}>
                        <Title level={4} style={{ color: '#E91E63' }}>Total: Rs.{order.total.toLocaleString()}</Title>
                    </Col>
                </Row>

                <div style={{ marginTop: '40px', textAlign: 'center', color: '#888' }}>
                    <Text type="secondary">Thank You for Your Business!</Text>
                </div>
            </div>
        </Modal>
    );
};

export default InvoiceModal;
