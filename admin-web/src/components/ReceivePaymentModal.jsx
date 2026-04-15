import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Typography, Divider, message, Space, Radio, Checkbox, Tag, Image } from 'antd';
import axios from 'axios';

const { Text } = Typography;

const ReceivePaymentModal = ({ open, order, onClose, onSuccess, defaultMarkAsDelivered = false }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && order) {
            form.setFieldsValue({
                amountReceived: Number(order.defaultAmount !== undefined ? order.defaultAmount : (order.balanceAmount || 0)),
                paymentMethod: 'Cash',
                markAsDelivered: defaultMarkAsDelivered
            });
        }
    }, [open, order, form, defaultMarkAsDelivered]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/orders/${order.id}/receive-payment`, values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Payment recorded successfully');
            onSuccess();
            onClose();
        } catch (error) {
            if (error?.errorFields) return;
            console.error(error);
            message.error(error.response?.data?.error || 'Failed to record payment');
        } finally {
            setLoading(false);
        }
    };

    if (!order) return null;

    const total = Number(order.total || 0);
    const received = Number(order.advanceAmount || 0);
    const balance = Number(order.balanceAmount || 0);
    const isBulk = order.orderType === 'BULK' || order.isBulk || order.orderType === 'CUSTOM';

    return (
        <Modal
            title={`Collect Payment — Order #${order.id}`}
            open={open}
            onOk={handleOk}
            onCancel={onClose}
            confirmLoading={loading}
            okText="Confirm Payment"
            cancelText="Cancel"
            width={480}
            okButtonProps={{ size: 'large' }}
        >
            {/* Order Summary — clean, no color overload */}
            <div style={{
                padding: '12px 16px',
                background: '#fafafa',
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                marginBottom: 20,
                marginTop: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            }}>
                {/* Left: who and what */}
                <div>
                    <div style={{ marginBottom: 8 }}>
                        <Text strong style={{ fontSize: 15 }}>{order.customer?.name || 'Guest'}</Text>
                        <Tag color={isBulk ? 'gold' : 'blue'} style={{ marginLeft: 8, fontSize: 10, borderRadius: 8 }}>
                            {(order.orderType || 'REGULAR').toUpperCase()}
                        </Tag>
                    </div>

                    <Space size={20}>
                        <div>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Total</Text>
                            <Text style={{ fontSize: 13 }}>Rs.{total.toLocaleString()}</Text>
                        </div>
                        <div>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Received</Text>
                            <Text style={{ fontSize: 13 }}>Rs.{received.toLocaleString()}</Text>
                        </div>
                        <div>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Balance Due</Text>
                            <Text strong style={{ fontSize: 15, color: balance > 0 ? '#f5222d' : '#52c41a' }}>
                                Rs.{balance.toLocaleString()}
                            </Text>
                        </div>
                    </Space>
                </div>

                {/* Right: slip if exists */}
                {order.bankSlip && (
                    <div style={{ textAlign: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 10, display: 'block', marginBottom: 4 }}>Slip</Text>
                        <Image
                            src={order.bankSlip}
                            width={60}
                            height={60}
                            style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #d9d9d9' }}
                            alt="Payment Slip"
                        />
                    </div>
                )}
            </div>

            <Divider style={{ margin: '0 0 16px' }} />

            <Form
                form={form}
                layout="vertical"
                initialValues={{ paymentMethod: 'Cash', markAsDelivered: defaultMarkAsDelivered }}
            >
                <Form.Item
                    name="amountReceived"
                    label={<Text strong>Amount Received</Text>}
                    rules={[
                        { required: true, message: 'Please enter amount' },
                        { type: 'number', min: 1, message: 'Must be greater than 0' }
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        size="large"
                        formatter={v => `Rs. ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={v => v.replace(/Rs\.\s?|(,*)/g, '')}
                    />
                </Form.Item>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Form.Item name="paymentMethod" label="Method" style={{ marginBottom: 0 }}>
                        <Radio.Group>
                            <Radio value="Cash">Cash</Radio>
                            <Radio value="Online">Online / Bank</Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item name="markAsDelivered" valuePropName="checked" style={{ marginBottom: 0 }}>
                        <Checkbox>Mark as Delivered</Checkbox>
                    </Form.Item>
                </div>
            </Form>

            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 12 }}>
                Balance and payment status will update automatically after confirmation.
            </Text>
        </Modal>
    );
};

export default ReceivePaymentModal;
