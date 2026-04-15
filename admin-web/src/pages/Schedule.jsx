import React, { useState, useEffect } from 'react';
import { Typography, Segmented, Row, Col, Empty, message, Tag, Spin } from 'antd';
import { CarOutlined, ShopOutlined, CheckCircleOutlined, ClockCircleOutlined, UserOutlined, PhoneOutlined, EnvironmentOutlined, CalendarOutlined, DollarOutlined, ExceptionOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import ReceivePaymentModal from '../components/ReceivePaymentModal';

const { Title, Text } = Typography;

const Schedule = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Delivery');
    const [paymentModalOrder, setPaymentModalOrder] = useState(null);

    const fetchLogisticsOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const logistics = res.data.filter(o =>
                o.status && ['READY', 'OUT_FOR_DELIVERY'].includes(o.status.toUpperCase())
            ).sort((a, b) => {
                // Determine full Date objects taking time into account for sorting
                const dateAStr = a.deliveryDate ? new Date(a.deliveryDate).toISOString().split('T')[0] : '9999-12-31';
                const timeAStr = a.delivery?.approximateDeliveryTime || '23:59';
                const dateTimeA = new Date(`${dateAStr}T${timeAStr}:00`);

                const dateBStr = b.deliveryDate ? new Date(b.deliveryDate).toISOString().split('T')[0] : '9999-12-31';
                const timeBStr = b.delivery?.approximateDeliveryTime || '23:59';
                const dateTimeB = new Date(`${dateBStr}T${timeBStr}:00`);
                
                return dateTimeA - dateTimeB;
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

    const theme = {
        pageBg: '#f8fafc',
        cardBg: '#ffffff',
        border: '#e2e8f0',
        textMain: '#0f172a',
        textSec: '#64748b',
        accentBg: '#2563eb',
        warningBg: '#d97706',
        dangerBg: '#dc2626',
        successBg: '#10b981',
        sectionBg: '#f1f5f9',
    };

    return (
        <div style={{ padding: '24px', backgroundColor: theme.pageBg, minHeight: '100vh', color: theme.textMain }}>
            <style>{`
                .premium-card {
                    background: ${theme.cardBg};
                    border: 1px solid ${theme.border};
                    border-radius: 12px;
                    transition: all 0.2s ease-in-out;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .card-section {
                    background: ${theme.sectionBg};
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 12px;
                }
                .action-btn {
                    width: 100%;
                    height: 52px;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 800;
                    text-transform: uppercase;
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 8px;
                    border: none;
                    transition: all 0.2s;
                    margin-top: auto;
                }
                .btn-warning { background: ${theme.warningBg}; color: white; }
                .btn-success { background: ${theme.successBg}; color: white; }
            `}</style>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800, color: theme.textMain, letterSpacing: '-0.5px' }}>Delivery Schedule</Title>
                    <Text style={{ fontSize: '15px', color: theme.textSec }}>Logistics overview • Active {activeTab}s ({displayOrders.length})</Text>
                </div>

                <Segmented
                    options={[
                        { label: 'DELIVERIES', value: 'Delivery', icon: <CarOutlined /> },
                        { label: 'PICKUPS', value: 'Pickup', icon: <ShopOutlined /> }
                    ]}
                    value={activeTab}
                    onChange={setActiveTab}
                    size="large"
                />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
            ) : (
                <Row gutter={[24, 24]}>
                    {displayOrders.length === 0 ? (
                        <Col span={24}>
                            <div className="premium-card" style={{ padding: '40px', textAlign: 'center' }}>
                                <Empty description={<span style={{ color: theme.textSec }}>No active schedules found.</span>} />
                            </div>
                        </Col>
                    ) : (
                        displayOrders.map(order => {
                            const isOut = order.status === 'OUT_FOR_DELIVERY';
                            const balance = Number(order.balanceAmount || 0);

                            return (
                                <Col xs={24} md={12} lg={12} xl={8} key={order.id} style={{ display: 'flex' }}>
                                    <div className="premium-card" style={{ width: '100%', overflow: 'hidden' }}>
                                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' }}>
                                            <div>
                                                <Text style={{ color: theme.textSec, fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>ORDER ID</Text><br/>
                                                <Text style={{ color: theme.textMain, fontSize: '18px', fontWeight: 900 }}>#{order.id}</Text>
                                            </div>
                                            <Tag color={isOut ? "blue" : "green"} style={{ margin: 0, fontWeight: 800, borderRadius: '4px' }}>
                                                {isOut ? "TRANSIT" : "READY"}
                                            </Tag>
                                        </div>

                                        <div style={{ padding: '20px', backgroundColor: '#ffffff' }}>
                                            <div className="card-section">
                                                <Text style={{ color: theme.accentBg, fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Customer Information</Text>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                    <UserOutlined style={{ color: theme.textSec }} />
                                                    <Text style={{ color: theme.textMain, fontWeight: 700, fontSize: '15px' }}>{order.customer?.name || 'Guest'}</Text>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <PhoneOutlined style={{ color: theme.successBg }} />
                                                    <Text style={{ color: theme.textMain, fontWeight: 700 }}>
                                                        {order.customer?.phone || 'N/A'}
                                                    </Text>
                                                </div>
                                            </div>

                                            <div className="card-section" style={{ borderLeft: `3px solid ${theme.accentBg}` }}>
                                                <Text style={{ color: theme.textMain, fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Schedule Details</Text>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#fffbeb', padding: '12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <Text style={{ color: '#b45309', fontSize: '12px', fontWeight: 800 }}>DATE</Text>
                                                        <Text style={{ color: '#92400e', fontSize: '16px', fontWeight: 900 }}>{dayjs(order.deliveryDate).format('DD MMM YYYY')}</Text>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <Text style={{ color: '#b45309', fontSize: '12px', fontWeight: 800 }}>TIME</Text>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400e', fontWeight: 900, fontSize: '18px' }}>
                                                            <ClockCircleOutlined />
                                                            {order.delivery?.approximateDeliveryTime || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {activeTab === 'Delivery' && (
                                                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${theme.border}` }}>
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                            <EnvironmentOutlined style={{ color: theme.dangerBg, marginTop: '4px' }} />
                                                            <Text style={{ color: theme.textMain, fontWeight: 600, fontSize: '14px', lineHeight: '1.4' }}>
                                                                {order.delivery?.address || order.address || 'Address not provided'}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="card-section">
                                                <Text style={{ color: theme.textMain, fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Order Contents</Text>
                                                <ul style={{ paddingLeft: '20px', margin: 0, color: theme.textMain, fontSize: '14px', fontWeight: 600 }}>
                                                    {order.items?.map((i, idx) => (
                                                        <li key={idx} style={{ marginBottom: '6px' }}><span style={{ color: theme.textSec }}>{i.quantity}x</span> {i.name}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {order.specialNotes && (
                                                <div style={{ padding: '12px', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '8px', marginBottom: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                        <ExceptionOutlined style={{ color: '#ea580c' }} />
                                                        <Text style={{ color: '#ea580c', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase' }}>Attention: Special Notes</Text>
                                                    </div>
                                                    <Text style={{ color: '#ea580c', fontSize: '14px', fontStyle: 'italic' }}>{order.specialNotes}</Text>
                                                </div>
                                            )}

                                            {balance > 0 && (
                                                <div style={{ padding: '16px', backgroundColor: '#fef3c7', border: `1px solid #fde68a`, borderRadius: '8px', textAlign: 'center', marginBottom: '12px' }}>
                                                    <Text style={{ color: theme.warningBg, fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Cash to Collect (COD)</Text><br/>
                                                    <Text style={{ color: theme.warningBg, fontSize: '24px', fontWeight: 900 }}>Rs.{balance.toLocaleString()}</Text>
                                                </div>
                                            )}
                                            {balance <= 0 && (
                                                <div style={{ padding: '12px', backgroundColor: '#d1fae5', border: `1px solid #a7f3d0`, borderRadius: '8px', textAlign: 'center', marginBottom: '12px' }}>
                                                    <Text style={{ color: theme.successBg, fontWeight: 800, fontSize: '14px' }}>PAID IN FULL</Text>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ padding: '0 20px 20px 20px', marginTop: 'auto', backgroundColor: '#ffffff' }}>
                                            {balance > 0 ? (
                                                <button 
                                                    className="action-btn btn-warning" 
                                                    onClick={() => setPaymentModalOrder(order)}
                                                >
                                                    <DollarOutlined /> Collect Rs.{balance.toLocaleString()} & Complete
                                                </button>
                                            ) : (
                                                <button 
                                                    className="action-btn btn-success" 
                                                    onClick={() => updateStatus(order.id, 'DELIVERED')}
                                                >
                                                    <CheckCircleOutlined /> {activeTab === 'Delivery' ? 'Mark Delivered' : 'Mark Picked Up'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </Col>
                            );
                        })
                    )}
                </Row>
            )}

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
