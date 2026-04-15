import React, { useState } from 'react';
import { Modal, Button, Typography, Image, Descriptions, message, Space, Tag, Alert } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const PaymentApprovalModal = ({ open, order, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);

    if (!order) return null;

    const total = Number(order.total || 0);
    const isOnline = order.paymentMethod === 'ONLINE_PAYMENT' || order.paymentMethod === 'BANK_TRANSFER';
    const isBulk = order.orderType === 'BULK' || order.isBulk || order.orderType === 'CUSTOM' || order.isCustom;
    
    const advancePercentage = isBulk ? 0.50 : 0.30;
    const requiredAmount = isOnline ? total : (total * advancePercentage);
    
    const isFullPayment = order.advanceStatus === 'UPLOADED_FULL';

    const handleApprove = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/orders/${order.id}/approve-payment`, {
                fullPayment: isFullPayment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Payment slip approved successfully');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.error || 'Approval failed');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/orders/${order.id}/reject-slip`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Payment slip rejected');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.error || 'Rejection failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={null}
            open={open}
            onCancel={onClose}
            footer={null}
            width={850}
            centered
            bodyStyle={{ padding: 0 }}
        >
            <div style={{ padding: '24px' }}>
                <Title level={4} style={{ marginBottom: 24 }}>Payment Confirmation</Title>
                <div style={{ display: 'flex', gap: '24px' }}>
                    {/* Left: Slip Preview */}
                    <div style={{ flex: 1 }}>
                        <Text strong style={{ display: 'block', marginBottom: 12, fontSize: '14px', color: '#595959' }}>
                            Uploaded Payment Slip
                        </Text>
                        <div style={{ 
                            border: '1px solid #f0f0f0', 
                            borderRadius: '12px', 
                            backgroundColor: '#fafafa', 
                            height: '450px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                        }}>
                            {order.bankSlip ? (
                                <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Image
                                        src={order.bankSlip}
                                        alt="Bank Slip"
                                        style={{ 
                                            maxWidth: '100%', 
                                            maxHeight: '450px', 
                                            objectFit: 'contain'
                                        }}
                                        wrapperStyle={{ height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                    />
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 48, marginBottom: 8, opacity: 0.2 }}>📄</div>
                                    <Text type="secondary">No slip uploaded yet</Text>
                                </div>
                            )}
                        </div>
                    </div>

                <div style={{ flex: 1.2 }}>
                    <Alert
                        message={isOnline ? "Online Payment Verification" : "COD Advance Verification"}
                        description={
                            isOnline
                                ? "This order requires full payment to be approved before starting preparation."
                                : "This is a COD order. A partial advance payment is required to start preparation."
                        }
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="Order ID">
                            <Text strong>#{order.id}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Customer">
                            {order.customer?.name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Total Amount">
                            <Text strong>Rs. {total.toLocaleString()}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Required Payment">
                            <Text mark strong style={{ fontSize: '16px' }}>
                                Rs. {requiredAmount.toLocaleString()}
                            </Text>
                            {isOnline ? (
                                <Tag color="blue" style={{ marginLeft: 8 }}>FULL (100%)</Tag>
                            ) : (
                                <Tag color="orange" style={{ marginLeft: 8 }}>ADVANCE ({(advancePercentage * 100)}%)</Tag>
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Payment Details">
                            {isFullPayment ? <Tag color="success">Full Payment Slip</Tag> : <Tag color="warning">Advance Payment Slip</Tag>}
                        </Descriptions.Item>
                    </Descriptions>

                    <Space style={{ marginTop: 20, width: '100%', justifyContent: 'flex-end' }}>
                        <Button 
                            danger
                            onClick={handleReject} 
                            loading={loading}
                            icon={<CloseCircleOutlined />}
                        >
                            Reject Slip
                        </Button>
                        <Button 
                            type="primary" 
                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                            loading={loading}
                            icon={<CheckCircleOutlined />}
                            onClick={handleApprove}
                        >
                            Confirm & Set as Paid
                        </Button>
                    </Space>
                </div>
                </div>
            </div>
        </Modal>
    );
};

export default PaymentApprovalModal;
