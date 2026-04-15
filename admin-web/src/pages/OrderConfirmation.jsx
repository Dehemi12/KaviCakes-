import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Tag, Button, Space, message, Spin, Empty, Divider, Badge } from 'antd';
import { CheckOutlined, CloseOutlined, UserOutlined, CalendarOutlined, CarOutlined, DollarOutlined, SolutionOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const OrderConfirmation = () => {
    const [pendingOrders, setPendingOrders] = useState([]);
    const [confirmedOrders, setConfirmedOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [pendingRes, confirmedRes] = await Promise.all([
                axios.get('http://localhost:5000/api/orders', {
                    params: { status: 'NEW' },
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:5000/api/orders', {
                    params: { status: 'CONFIRMED' },
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setPendingOrders(pendingRes.data);
            setConfirmedOrders(confirmedRes.data.slice(0, 10)); // Show last 10
        } catch (error) {
            console.error("Fetch error:", error);
            message.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/orders/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(newStatus === 'CONFIRMED' ? 'Order confirmed successfully!' : 'Order rejected');
            fetchOrders();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.error || 'Update failed');
        }
    };

    const tagStyle = {
        borderRadius: '6px',
        fontWeight: 800,
        padding: '4px 12px',
        fontSize: '11px',
        border: 'none',
        margin: 0,
        textTransform: 'uppercase',
        letterSpacing: '1px'
    };

    const theme = {
        pageBg: '#f8fafc',
        cardBg: '#ffffff',
        border: '#e2e8f0',
        textMain: '#0f172a',
        textSec: '#64748b',
        brandBulk: '#9333ea',
        brandCustom: '#ea580c',
        brandStandard: '#2563eb',
        success: '#10b981',
        danger: '#ef4444',
        blockBg: '#f1f5f9',
    };

    return (
        <div style={{ padding: '24px', backgroundColor: theme.pageBg, minHeight: '100vh', color: theme.textMain }}>
            <style>{`
                .order-review-card {
                    background: ${theme.cardBg};
                    border: 1px solid ${theme.border};
                    border-radius: 12px;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .order-review-card:hover {
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    border-color: #cbd5e1;
                }
                .action-btn {
                    height: 48px;
                    border-radius: 8px;
                    font-weight: 800;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex: 1;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .confirm-btn { background-color: ${theme.success}; color: white; }
                .confirm-btn:hover { background-color: #059669; }
                .reject-btn { background-color: ${theme.danger}; color: white; }
                .reject-btn:hover { background-color: #dc2626; }
                .confirmed-row:hover { background-color: ${theme.blockBg}; }
                .info-block {
                    background-color: ${theme.blockBg};
                    padding: 12px 16px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    margin-bottom: 16px;
                }
            `}</style>
            
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 800, color: theme.textMain, letterSpacing: '-0.5px' }}>Order Confirmation Review</Title>
                <Text style={{ fontSize: '15px', color: theme.textSec }}>Review incoming orders before they proceed to payment or production.</Text>
            </div>

            {/* Pending Orders Section */}
            <Title level={4} style={{ marginBottom: 20, color: '#be185d', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge status="processing" color="#be185d" /> Pending Confirmation ({pendingOrders.length})
            </Title>

            {loading && pendingOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <Spin size="large" />
                </div>
            ) : pendingOrders.length === 0 ? (
                <Card style={{ borderRadius: '12px', textAlign: 'center', padding: '40px 0', border: '1px dashed #cbd5e1', boxShadow: 'none', marginBottom: 40, background: '#ffffff' }}>
                    <Empty description={<span style={{ fontSize: '14px', color: theme.textSec }}>No new orders waiting for confirmation.</span>} />
                </Card>
            ) : (
                <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
                    {pendingOrders.map(o => {
                        const isBulk = o.isBulk || o.orderType === 'BULK';
                        const oType = isBulk ? 'BULK' : o.isCustom ? 'CUSTOM' : 'STANDARD';
                        const badgeColor = isBulk ? theme.brandBulk : o.isCustom ? theme.brandCustom : theme.brandStandard;
                        
                        return (
                            <Col xs={24} md={12} xl={8} key={o.id} style={{ display: 'flex' }}>
                                <div className="order-review-card" style={{ width: '100%' }}>
                                    <div style={{ height: '4px', width: '100%', backgroundColor: badgeColor }} />
                                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        
                                        {/* Header Row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <UserOutlined style={{ color: theme.textSec, fontSize: '18px' }} />
                                                    <Text style={{ fontSize: '18px', fontWeight: 800, color: theme.textMain }} ellipsis>{o.customer?.name || 'Guest User'}</Text>
                                                </div>
                                                <Text style={{ fontSize: '12px', color: theme.textSec, paddingLeft: '26px' }}>Order #{o.id}</Text>
                                            </div>
                                            <div>
                                                <Tag color={isBulk ? "purple" : o.isCustom ? "orange" : "blue"} style={tagStyle}>{oType}</Tag>
                                            </div>
                                        </div>

                                        {/* Date Block */}
                                        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                            <div style={{ flex: 1, backgroundColor: '#f0fdf4', padding: '12px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                                                <Text style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', marginBottom: 4, fontWeight: 700, color: '#166534' }}>Placement Day</Text>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#14532d', fontWeight: 800, fontSize: '13px' }}>
                                                    <SolutionOutlined />
                                                    <span>{dayjs(o.createdAt).format('MMM D, YYYY')}</span>
                                                </div>
                                            </div>
                                            <div style={{ flex: 1, backgroundColor: '#fff1f2', padding: '12px', borderRadius: 8, border: '1px solid #fecdd3' }}>
                                                <Text style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', marginBottom: 4, fontWeight: 700, color: '#9f1239' }}>Delivery Target</Text>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#881337', fontWeight: 800, fontSize: '13px' }}>
                                                    <CalendarOutlined />
                                                    <span>{o.deliveryDate ? dayjs(o.deliveryDate).format('MMM D, YYYY') : 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items Block */}
                                        <div className="info-block">
                                            <Text style={{ color: theme.textSec, fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Items & Quantities</Text>
                                            <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                                                {o.items?.map((item, idx) => {
                                                    const itemName = item.variant?.cake?.name || item.name;
                                                    let actualQty = item.quantity;
                                                    if (isBulk) {
                                                        const custom = item.customDetails || {};
                                                        const potentialQtyKeys = Object.keys(custom).filter(k => k.toLowerCase().includes('qty') || k.toLowerCase().includes('quantity'));
                                                        if (potentialQtyKeys.length > 0) {
                                                            const bulkQtys = potentialQtyKeys.map(k => Number(custom[k])).filter(n => !isNaN(n));
                                                            if (bulkQtys.length > 0) actualQty = Math.max(...bulkQtys);
                                                        }
                                                    }
                                                    return (
                                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                 <Text style={{ color: theme.textMain, fontSize: 13, fontWeight: 600 }}>{itemName}</Text>
                                                                 {item.variant?.size && <Text style={{ fontSize: 11, color: theme.textSec }}>{item.variant.size.label} {item.variant.flavor?.label}</Text>}
                                                            </div>
                                                            <Badge count={`x${actualQty}`} style={{ backgroundColor: '#475569', fontSize: 11, fontWeight: 700, boxShadow: 'none' }} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Special Instructions / Edit Msg */}
                                        {o.specialNotes && (
                                            <div style={{ 
                                                padding: '12px', 
                                                background: o.isEdited ? '#fefce8' : '#faf5ff', 
                                                border: o.isEdited ? '1px solid #fde047' : '1px solid #e9d5ff', 
                                                borderRadius: 8, 
                                                marginBottom: 16 
                                            }}>
                                                <Text style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: o.isEdited ? '#a16207' : '#7e22ce', marginBottom: 4 }}>
                                                    {o.isEdited ? '⚠️ UPDATED INSTRUCTIONS' : 'CUSTOMER INSTRUCTIONS'}
                                                </Text>
                                                <p style={{ color: theme.textMain, fontSize: '13px', margin: 0, fontStyle: 'italic', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                                                    "{o.specialNotes}"
                                                </p>
                                            </div>
                                        )}

                                        {/* Total Pricing */}
                                        <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', marginTop: 'auto' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <DollarOutlined style={{ color: theme.brandStandard, fontSize: '20px' }} />
                                                <Text style={{ color: '#1e3a8a', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>Total Amount</Text>
                                            </div>
                                            <Text style={{ fontSize: '22px', fontWeight: 900, color: '#1e3a8a' }}>Rs.{Number(o.total || 0).toLocaleString()}</Text>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button className="action-btn confirm-btn" onClick={() => handleStatusChange(o.id, 'CONFIRMED')}>
                                                <CheckOutlined /> Confirm
                                            </button>
                                            <button className="action-btn reject-btn" onClick={() => handleStatusChange(o.id, 'CANCELLED')}>
                                                <CloseOutlined /> Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* Recently Confirmed Section */}
            <div style={{ marginTop: 20 }}>
                <Title level={4} style={{ marginBottom: 20, color: theme.textMain, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckOutlined style={{ color: theme.success }} /> Recently Confirmed Orders
                </Title>
                
                <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', background: '#ffffff' }} bodyStyle={{ padding: '0' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${theme.border}`, textAlign: 'left', backgroundColor: theme.blockBg }}>
                                    <th style={{ padding: '16px 24px', color: theme.textSec, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>Order ID</th>
                                    <th style={{ padding: '16px 24px', color: theme.textSec, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>Customer</th>
                                    <th style={{ padding: '16px 24px', color: theme.textSec, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>Items</th>
                                    <th style={{ padding: '16px 24px', color: theme.textSec, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>Instructions</th>
                                    <th style={{ padding: '16px 24px', color: theme.textSec, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>Delivery Date</th>
                                    <th style={{ padding: '16px 24px', color: theme.textSec, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', textAlign: 'right' }}>Total</th>
                                    <th style={{ padding: '16px 24px', color: theme.textSec, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', textAlign: 'center' }}>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {confirmedOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: theme.textSec }}>No recently confirmed orders yet.</td>
                                    </tr>
                                ) : (
                                    confirmedOrders.map(o => {
                                        const isBulk = o.isBulk || o.orderType === 'BULK';
                                        const oType = isBulk ? 'BULK' : o.isCustom ? 'CUSTOM' : 'STANDARD';
                                        return (
                                            <tr key={o.id} className="confirmed-row" style={{ borderBottom: `1px solid ${theme.border}`, transition: 'all 0.2s' }}>
                                                <td style={{ padding: '16px 24px', fontWeight: 800, color: theme.textMain }}>#{o.id}</td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ fontWeight: 700, color: theme.textMain }}>{o.customer?.name}</div>
                                                    <div style={{ fontSize: '11px', color: theme.textSec }}>{o.customer?.email}</div>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <Badge count={o.items?.length || 0} style={{ backgroundColor: theme.textSec, color: '#ffffff', boxShadow: 'none' }} />
                                                </td>
                                                <td style={{ padding: '16px 24px', maxWidth: '300px' }}>
                                                    {o.specialNotes ? (
                                                        <div style={{ fontSize: '12px', fontStyle: 'italic', color: o.isEdited ? '#b45309' : theme.textSec }}>
                                                            {o.isEdited && <Badge status="warning" text={<span style={{fontSize: 10, fontWeight: 900}}>EDITED: </span>} />}
                                                            "{o.specialNotes}"
                                                        </div>
                                                    ) : <Text type="secondary" style={{ fontSize: 11 }}>N/A</Text>}
                                                </td>
                                                <td style={{ padding: '16px 24px', color: theme.textMain }}>
                                                    <div style={{ fontWeight: 700 }}>{o.deliveryDate ? dayjs(o.deliveryDate).format('MMM D, YYYY') : 'N/A'}</div>
                                                </td>
                                                <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, color: theme.textMain }}>
                                                    Rs.{Number(o.total || 0).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                    <Tag color={isBulk ? "purple" : o.isCustom ? "orange" : "blue"} style={{ borderRadius: '4px', fontSize: '10px', fontWeight: 800, border: 'none' }}>
                                                        {oType}
                                                    </Tag>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default OrderConfirmation;
