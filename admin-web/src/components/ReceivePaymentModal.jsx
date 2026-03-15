import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Typography, Descriptions, Divider, message, Space, Radio, Checkbox } from 'antd';
import axios from 'axios';

const { Text, Title } = Typography;

const ReceivePaymentModal = ({ open, order, onClose, onSuccess, defaultMarkAsDelivered = false }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && order) {
            form.setFieldsValue({
                amountReceived: Number(order.balanceAmount || 0),
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
            console.error(error);
            message.error(error.response?.data?.error || 'Failed to record payment');
        } finally {
            setLoading(false);
        }
    };

    if (!order) return null;

    const total = Number(order.total || 0);
    const advance = Number(order.advanceAmount || 0);
    const balance = Number(order.balanceAmount || 0);

    return (
        <Modal
            title={<Title level={4}>Receive Payment - Order #{order.id}</Title>}
            open={open}
            onOk={handleOk}
            onCancel={onClose}
            confirmLoading={loading}
            okText="Confirm Payment"
            cancelText="Cancel"
            width={500}
        >
            <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Customer">{order.customer?.name}</Descriptions.Item>
                <Descriptions.Item label="Total Order Amount">
                    <Text strong>Rs.{total.toLocaleString()}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Advance Already Paid">
                    <Text type="success">Rs.{advance.toLocaleString()}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Remaining Balance">
                    <Text type="danger" strong>Rs.{balance.toLocaleString()}</Text>
                </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Record New Payment</Divider>

            <Form
                form={form}
                layout="vertical"
                initialValues={{ paymentMethod: 'Cash', markAsDelivered: defaultMarkAsDelivered }}
            >
                <Form.Item
                    name="amountReceived"
                    label="Amount Received"
                    rules={[
                        { required: true, message: 'Please enter amount' },
                        { type: 'number', min: 1, message: 'Amount must be greater than 0' }
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        formatter={value => `Rs. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/Rs\.\s?|(,*)/g, '')}
                    />
                </Form.Item>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Form.Item name="paymentMethod" label="Payment Method">
                        <Radio.Group>
                            <Radio value="Cash">Cash</Radio>
                            <Radio value="Online">Online/Bank</Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item name="markAsDelivered" valuePropName="checked" style={{ marginTop: 24 }}>
                        <Checkbox>Mark as Delivered</Checkbox>
                    </Form.Item>
                </div>
            </Form>

            <Text type="secondary" style={{ fontSize: '11px' }}>
                * After confirmation, the order balance will be updated, status will be changed if checked, and a transaction will be logged.
            </Text>
        </Modal>
    );
};

export default ReceivePaymentModal;
