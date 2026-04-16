import React, { useEffect, useState, useRef } from 'react';
import { Modal, Button, Typography, Row, Col, Divider, Table, Tag, Spin, message } from 'antd';
import { 
    PrinterOutlined, SendOutlined, WalletOutlined, ShoppingOutlined, 
    UserOutlined, EnvironmentOutlined, CalendarOutlined, InfoCircleOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const InvoiceModal = ({ open, order, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [invoiceData, setInvoiceData] = useState(null);
    const printRef = useRef();

    useEffect(() => {
        if (open && order) {
            fetchInvoice();
        } else {
            setInvoiceData(null);
        }
    }, [open, order]);

    const fetchInvoice = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/orders/${order.id}/invoice`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInvoiceData(res.data);
        } catch (error) {
            console.error('Error fetching invoice:', error);
            // If it's not delivered, we might still want to show a preview for admins
            // But for now, just show the error if the status isn't allowed
            if (error.response?.status === 403) {
                 message.warning('Order must be DELIVERED to view the finalized invoice.');
            } else {
                 message.error('Failed to load invoice details.');
            }
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleSendInvoice = async () => {
        try {
            await axios.post(`http://localhost:5000/api/orders/${order.id}/invoice/send`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            message.success('Invoice email triggered to customer!');
        } catch (error) {
            message.error('Failed to send invoice.');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!order) return null;

    const { invoice, order: fullOrder } = invoiceData || {};

    const columns = [
        { 
            title: 'Item Description', 
            dataIndex: 'name', 
            key: 'name',
            render: (text, record) => (
                <div>
                    <Text strong>{text}</Text>
                    {record.variant && (
                        <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>
                            {record.variant.size} • {record.variant.flavor} • {record.variant.shape}
                        </div>
                    )}
                </div>
            )
        },
        { title: 'Qty', dataIndex: 'quantity', key: 'quantity', align: 'center' },
        { title: 'Unit Price (LKR)', dataIndex: 'unitPrice', key: 'unitPrice', align: 'right', render: (val) => parseFloat(val).toLocaleString() },
        {
            title: 'Total (LKR)',
            key: 'total',
            align: 'right',
            render: (_, record) => (parseFloat(record.unitPrice) * record.quantity).toLocaleString()
        },
    ];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            width={460}
            centered
            footer={[
                <Button key="close" onClick={onClose}>
                    Close
                </Button>,
                <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
                    Print
                </Button>,
            ]}
            title={
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                    🧾 Receipt / Tax Invoice
                </span>
            }
            bodyStyle={{ padding: 0 }}
        >
            <Spin spinning={loading}>
                {invoiceData ? (
                    <div ref={printRef} style={{ padding: '24px', background: '#fff', color: '#334155', fontFamily: 'system-ui, sans-serif' }} className="invoice-printable">
                         <style>{`
                            @media print {
                                body * { visibility: hidden; }
                                .invoice-printable, .invoice-printable * { visibility: visible; }
                                .invoice-printable { position: absolute; left: 0; top: 0; width: 100%; max-width: 400px; margin: 0 auto; border: none !important; }
                                .ant-modal-close, .ant-modal-footer, .ant-modal-header { display: none !important; }
                            }
                        `}</style>

                        {/* Invoice Header */}
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <Title level={3} style={{ color: '#be185d', margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>KaviCakes</Title>
                            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 4 }}>1st Lane, Wabada Road, Kadawatha</Text>
                            <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>077 123 4567 • Kavicakes@gmail.com</Text>
                        </div>

                        {/* Meta Info */}
                        <div style={{ borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', padding: '12px 0', display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div>
                                <Text style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Invoice No:</Text>
                                <Text strong style={{ fontSize: 13 }}>#{invoice.invoiceNumber}</Text>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <Text style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Date:</Text>
                                <Text strong style={{ fontSize: 13 }}>{dayjs(invoice.issuedAt).format('DD MMM YYYY')}</Text>
                            </div>
                        </div>

                        {/* Customer & Delivery */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                            <div style={{ flex: 1 }}>
                                <Text style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Billed To</Text>
                                <Text strong style={{ display: 'block', fontSize: 13, lineHeight: '16px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{fullOrder.customer?.name || 'Customer'}</Text>
                                <Text style={{ fontSize: 12, color: '#475569', display: 'block' }}>{fullOrder.customer?.phone || 'N/A'}</Text>
                            </div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                                <Text style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Delivery Target</Text>
                                <Text strong style={{ display: 'block', fontSize: 13, lineHeight: '16px' }}>{dayjs(fullOrder.deliveryDate).format('DD MMM')}</Text>
                            </div>
                        </div>

                        <Divider dashed style={{ margin: '20px 0' }} />

                        {/* Items Table */}
                        <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 12 }}>Order Summary</Text>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {fullOrder.items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ paddingRight: 12 }}>
                                        <Text strong style={{ fontSize: 13, display: 'block', lineHeight: 1.2 }}>{item.name}</Text>
                                        <Text style={{ fontSize: 11, color: '#94a3b8', display: 'block', textTransform: 'uppercase', marginTop: 2 }}>
                                            {item.quantity} x Rs. {parseFloat(item.unitPrice).toLocaleString()}
                                            {item.variant ? ` • ${item.variant.size}` : ''}
                                        </Text>
                                    </div>
                                    <Text style={{ fontSize: 13, fontWeight: 500 }}>Rs. {(parseFloat(item.unitPrice) * item.quantity).toLocaleString()}</Text>
                                </div>
                            ))}
                            {fullOrder.delivery?.deliveryFee > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
                                    <Text style={{ fontSize: 13, color: '#64748b' }}>Delivery Charge</Text>
                                    <Text style={{ fontSize: 13, fontWeight: 500 }}>Rs. {parseFloat(fullOrder.delivery.deliveryFee).toLocaleString()}</Text>
                                </div>
                            )}
                        </div>

                        <Divider style={{ margin: '20px 0' }} />

                        {/* Payment Summary */}
                        <div style={{ padding: '0 4px', marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <Text style={{ color: '#64748b', fontSize: 13 }}>Subtotal</Text>
                                <Text style={{ fontSize: 13 }}>Rs. {parseFloat(fullOrder.subtotal).toLocaleString()}</Text>
                            </div>
                            
                            {fullOrder.loyaltyDiscount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <Text style={{ color: '#be185d', fontSize: 13 }}>Discount (Loyalty)</Text>
                                    <Text style={{ color: '#be185d', fontSize: 13 }}>-Rs. {parseFloat(fullOrder.loyaltyDiscount).toLocaleString()}</Text>
                                </div>
                            )}
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0', paddingTop: 12, borderTop: '1px dashed #e2e8f0' }}>
                                <Text strong style={{ fontSize: 16 }}>Total Amount</Text>
                                <Text strong style={{ fontSize: 18, color: '#be185d', fontWeight: 700 }}>Rs. {parseFloat(fullOrder.total).toLocaleString()}</Text>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: 12 }}>
                                <Text style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>{fullOrder.paymentMethod} •</Text>
                                <Text strong style={{ fontSize: 11, color: fullOrder.paymentStatus === 'PAID' ? '#10b981' : '#f59e0b', textTransform: 'uppercase' }}>{fullOrder.paymentStatus}</Text>
                            </div>
                        </div>

                        {/* Delivery Footer */}
                        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 16, textAlign: 'center' }}>
                            <Text style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>{fullOrder.address || fullOrder.delivery?.address || 'Store Pickup'}</Text>
                            {fullOrder.specialNotes && (
                                <Text style={{ fontSize: 12, color: '#be185d', display: 'block', marginTop: 6 }}>Note: {fullOrder.specialNotes}</Text>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{ marginTop: 24, textAlign: 'center' }}>
                            <Text style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'block' }}>Thank you 💖</Text>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                         <Text type="secondary">Select an order to view the full receipt.</Text>
                    </div>
                )}
            </Spin>
        </Modal>
    );
};

export default InvoiceModal;
