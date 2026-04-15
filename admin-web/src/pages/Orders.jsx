import React, { useEffect, useState, useMemo } from 'react';
import {
    Typography, Tag, Select, Input, message, Spin, Empty,
    Modal, Badge, Button, Popconfirm
} from 'antd';
import {
    SearchOutlined, PictureOutlined, CalendarOutlined, BankOutlined,
    WalletOutlined, CheckCircleOutlined, CloseCircleOutlined,
    EyeOutlined, ClockCircleOutlined, CarOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import ReceivePaymentModal from '../components/ReceivePaymentModal';

const { Title, Text } = Typography;
const { Option } = Select;

const API = 'http://localhost:5000/api';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMethod, setFilterMethod] = useState('ALL');
    const [filterSlip, setFilterSlip] = useState('ALL');

    const [previewImage, setPreviewImage] = useState('');
    const [previewVisible, setPreviewVisible] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [paymentModalOrder, setPaymentModalOrder] = useState(null);

    const getToken = () => localStorage.getItem('token');

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/orders`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const relevant = res.data.filter(o =>
                !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(o.status)
            );
            setOrders(relevant);
        } catch (e) {
            message.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const filteredOrders = useMemo(() => {
        let result = orders.filter(o => {
            const matchSearch =
                o.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(o.id).includes(searchTerm);
            const pm = o.paymentMethod || '';
            const methodMatch =
                filterMethod === 'ALL' ||
                (filterMethod === 'COD' && pm === 'COD') ||
                (filterMethod === 'ONLINE' && pm !== 'COD');
            const slipMatch =
                filterSlip === 'ALL' ||
                (filterSlip === 'AWAITING' && o.bankSlip && o.advanceStatus?.startsWith('UPLOADED')) ||
                (filterSlip === 'APPROVED' && o.advanceStatus === 'APPROVED') ||
                (filterSlip === 'NONE' && !o.bankSlip);
            return matchSearch && methodMatch && slipMatch;
        });

        // Priority exactly by latest created date
        return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [orders, searchTerm, filterMethod, filterSlip]);

    const codOrders = filteredOrders.filter(o => o.paymentMethod === 'COD');
    const onlineOrders = filteredOrders.filter(o => o.paymentMethod !== 'COD');

    // Approve slip — COD = advance only, Online = full payment
    const handleApprove = async (order) => {
        const isCod = order.paymentMethod === 'COD';
        const fullPayment = !isCod; // COD = advance, Online = full
        setActionLoading(order.id);
        try {
            await axios.put(
                `${API}/orders/${order.id}/approve-payment`,
                { fullPayment },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            message.success(`✅ Payment approved for Order #${order.id}`);
            fetchOrders();
        } catch (err) {
            message.error(err.response?.data?.error || 'Approval failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (orderId) => {
        setActionLoading(orderId);
        try {
            await axios.put(
                `${API}/orders/${orderId}/reject-slip`,
                {},
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            message.success(`Slip rejected. Customer will re-upload.`);
            fetchOrders();
        } catch (err) {
            message.error(err.response?.data?.error || 'Rejection failed');
        } finally {
            setActionLoading(null);
        }
    };

    const theme = {
        pageBg: '#f8fafc', cardBg: '#ffffff', border: '#e2e8f0',
        textMain: '#0f172a', textSec: '#64748b',
        blue: '#2563eb', amber: '#d97706', green: '#16a34a',
        pink: '#be185d', red: '#dc2626'
    };

    const tagStyle = {
        borderRadius: '4px', fontWeight: 700,
        padding: '3px 10px', fontSize: '11px',
        border: 'none', textTransform: 'uppercase'
    };

    // ── Summary counts ────────────────────────────────────────────────────────
    const awaitingCount = orders.filter(o => o.bankSlip && o.advanceStatus?.startsWith('UPLOADED')).length;
    const approvedCount = orders.filter(o => o.advanceStatus === 'APPROVED').length;

    // ── Order Card ─────────────────────────────────────────────────────────────
    const OrderCard = ({ order }) => {
        const isCod = order.paymentMethod === 'COD';
        const total = parseFloat(order.total || 0);
        const advance = parseFloat(order.advanceAmount || 0);
        const balance = parseFloat(order.balanceAmount || 0);
        const hasSlip = !!order.bankSlip;
        const isApproved = order.advanceStatus === 'APPROVED';
        const isRejected = order.advanceStatus === 'REJECTED';
        const slipUploaded = hasSlip && order.advanceStatus?.startsWith('UPLOADED');
        const isPaid = order.paymentStatus === 'PAID';
        const actioning = actionLoading === order.id;

        // Colour coding for the card top bar
        const barColor = slipUploaded
            ? '#f59e0b'          // amber — needs review
            : isApproved
                ? theme.green   // green — approved
                : isRejected
                    ? theme.red // red — rejected
                    : isCod ? theme.amber : theme.blue;

        // Advance % label
        const isBulkOrCustom = order.orderType === 'BULK' || order.orderType === 'CUSTOM';
        const advancePercent = isBulkOrCustom ? '50%' : '30%';
        const expectedAdvance = total * (isBulkOrCustom ? 0.5 : 0.3);

        return (
            <div style={{
                background: theme.cardBg,
                border: `1px solid ${slipUploaded ? '#f59e0b' : theme.border}`,
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: slipUploaded
                    ? '0 0 0 2px #fde68a, 0 4px 12px rgba(245,158,11,0.12)'
                    : '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
            }}>
                {/* top colour bar */}
                <div style={{ height: 4, backgroundColor: barColor }} />

                <div style={{ padding: '20px 24px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div>
                            <Text style={{ color: theme.textSec, fontSize: 12, fontWeight: 700 }}>
                                #{order.id} · {order.customer?.name}
                            </Text>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                <CalendarOutlined style={{ color: theme.textSec, fontSize: 13 }} />
                                <Text style={{ color: theme.textMain, fontWeight: 700 }}>
                                    {order.deliveryDate ? dayjs(order.deliveryDate).format('MMM D, YYYY') : 'No date'}
                                </Text>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                            <Tag color={isCod ? 'orange' : 'blue'} style={tagStyle}>
                                {isCod ? 'COD' : 'Bank Transfer'}
                            </Tag>
                            {order.orderType && (
                                <Tag color={order.orderType === 'BULK' ? 'purple' : order.orderType === 'CUSTOM' ? 'volcano' : 'default'} style={{ ...tagStyle, fontSize: 10 }}>
                                    {order.orderType}
                                </Tag>
                            )}
                        </div>
                    </div>

                    {/* Items quick list */}
                    <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                        {order.items?.slice(0, 2).map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', fontWeight: 600, marginBottom: 2 }}>
                                <span>{item.quantity}× {item.variant?.cake?.name || item.name}</span>
                                <span>Rs.{(parseFloat(item.unitPrice || 0) * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                        {order.items?.length > 2 && (
                            <Text style={{ fontSize: 11, color: theme.textSec }}>+{order.items.length - 2} more items</Text>
                        )}
                    </div>

                    {/* Special Instructions / Edit Msg */}
                    {order.specialNotes && (
                        <div style={{
                            padding: '12px',
                            background: order.isEdited ? '#fefce8' : '#faf5ff',
                            border: order.isEdited ? '1.5px solid #fde047' : '1.5px solid #e9d5ff',
                            borderRadius: 10,
                            marginBottom: 16
                        }}>
                            <Text style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: order.isEdited ? '#a16207' : '#7e22ce', marginBottom: 4 }}>
                                {order.isEdited ? '⚠️ UPDATED INSTRUCTIONS' : 'CUSTOMER INSTRUCTIONS'}
                            </Text>
                            <p style={{ color: theme.textMain, fontSize: '13px', margin: 0, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                                "{order.specialNotes}"
                            </p>
                        </div>
                    )}

                    {/* ── PAYMENT BREAKDOWN — the main focus ── */}
                    <div style={{
                        border: `1px solid ${theme.border}`, borderRadius: 10,
                        overflow: 'hidden', marginBottom: 16
                    }}>
                        {/* Total */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${theme.border}` }}>
                            <Text style={{ color: theme.textSec, fontSize: 13 }}>Order Total</Text>
                            <Text style={{ fontWeight: 700, fontSize: 14 }}>Rs.{total.toLocaleString()}</Text>
                        </div>

                        {/* Advance */}
                        {isCod ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${theme.border}`, background: isApproved ? '#f0fdf4' : '#fff' }}>
                                <div>
                                    <Text style={{ color: theme.textSec, fontSize: 13 }}>Advance ({advancePercent})</Text>
                                    {!isApproved && (
                                        <Text style={{ display: 'block', fontSize: 11, color: '#94a3b8' }}>
                                            Expected: Rs.{expectedAdvance.toLocaleString()}
                                        </Text>
                                    )}
                                </div>
                                {isApproved
                                    ? <Text style={{ fontWeight: 700, color: theme.green, fontSize: 14 }}>− Rs.{advance.toLocaleString()} ✓</Text>
                                    : <Text style={{ fontSize: 13, color: '#94a3b8' }}>Pending</Text>
                                }
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${theme.border}`, background: isPaid ? '#f0fdf4' : '#fff' }}>
                                <Text style={{ color: theme.textSec, fontSize: 13 }}>Full Payment</Text>
                                {isPaid
                                    ? <Text style={{ fontWeight: 700, color: theme.green }}>Received ✓</Text>
                                    : <Text style={{ fontSize: 13, color: '#94a3b8' }}>Not yet received</Text>
                                }
                            </div>
                        )}

                        {/* Balance to collect — highlighted row */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 14px',
                            background: balance > 0 ? '#fffbeb' : '#f0fdf4',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <CarOutlined style={{ color: balance > 0 ? theme.amber : theme.green, fontSize: 16 }} />
                                <Text style={{ fontWeight: 800, fontSize: 13, color: balance > 0 ? theme.amber : theme.green }}>
                                    {balance > 0 ? 'To Collect on Delivery' : 'Fully Paid'}
                                </Text>
                            </div>
                            <Text style={{
                                fontWeight: 900, fontSize: 20,
                                color: balance > 0 ? theme.amber : theme.green
                            }}>
                                {balance > 0 ? `Rs.${balance.toLocaleString()}` : '✓ Rs.0'}
                            </Text>
                        </div>
                    </div>

                    {/* Slip status badge */}
                    {!hasSlip && (
                        <div style={{ textAlign: 'center', padding: '8px', color: '#94a3b8', fontSize: 12, marginBottom: 10, fontStyle: 'italic' }}>
                            No payment slip uploaded yet
                        </div>
                    )}

                    {hasSlip && isRejected && (
                        <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 10, fontSize: 12, color: theme.red, fontWeight: 700 }}>
                            Slip was rejected — customer needs to re-upload
                        </div>
                    )}

                    {slipUploaded && (
                        <div style={{ padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, marginBottom: 10, fontSize: 12, color: theme.amber, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ClockCircleOutlined />
                            Slip uploaded — awaiting your review
                        </div>
                    )}

                    {isApproved && (
                        <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 10, fontSize: 12, color: theme.green, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircleOutlined />
                            Payment slip verified &amp; approved
                        </div>
                    )}

                    {/* View slip button */}
                    {hasSlip && (
                        <Button
                            block icon={<EyeOutlined />}
                            onClick={() => { setPreviewImage(order.bankSlip); setPreviewVisible(true); }}
                            style={{
                                height: 40, borderRadius: 8, marginBottom: 10,
                                border: `1.5px solid ${theme.blue}`, color: theme.blue,
                                fontWeight: 700, background: '#eff6ff'
                            }}
                        >
                            View Payment Slip
                        </Button>
                    )}

                    {/* Approve / Reject — only when slip is uploaded and not yet approved */}
                    {slipUploaded && !isApproved && (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Popconfirm
                                title={isCod
                                    ? `Approve advance payment of Rs.${expectedAdvance.toLocaleString()} (${advancePercent})?`
                                    : `Approve full payment of Rs.${total.toLocaleString()}?`}
                                description={isCod
                                    ? `Balance Rs.${(total - expectedAdvance).toLocaleString()} will be collected on delivery.`
                                    : 'This will mark the order as fully paid.'}
                                onConfirm={() => handleApprove(order)}
                                okText="Approve"
                                cancelText="Cancel"
                                okButtonProps={{ style: { background: theme.green, borderColor: theme.green } }}
                            >
                                <Button
                                    loading={actioning}
                                    icon={<CheckCircleOutlined />}
                                    style={{
                                        flex: 1, height: 44, borderRadius: 8,
                                        background: theme.green, borderColor: theme.green,
                                        color: '#fff', fontWeight: 700
                                    }}
                                >
                                    Approve
                                </Button>
                            </Popconfirm>

                            <Popconfirm
                                title="Reject this slip?"
                                description="Customer will need to upload a new payment slip."
                                onConfirm={() => handleReject(order.id)}
                                okText="Reject"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true }}
                            >
                                <Button
                                    loading={actioning}
                                    icon={<CloseCircleOutlined />}
                                    danger
                                    style={{ flex: 1, height: 44, borderRadius: 8, fontWeight: 700 }}
                                >
                                    Reject
                                </Button>
                            </Popconfirm>
                        </div>
                    )}

                    {/* Direct Payment Collection for Walk-in Cash or balances */}
                    {balance > 0 && (!isCod || !isApproved) && (
                        <Button
                            block icon={<WalletOutlined />}
                            onClick={() => setPaymentModalOrder({ ...order, defaultAmount: isCod ? expectedAdvance : total })}
                            style={{
                                height: 40, borderRadius: 8, marginTop: 10,
                                background: '#f8fafc', borderColor: '#e2e8f0', color: '#475569',
                                fontWeight: 700
                            }}
                        >
                            Collect Cash Payment
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div style={{ padding: '24px', backgroundColor: theme.pageBg, minHeight: '100vh', color: theme.textMain }}>

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 800, color: theme.textMain }}>
                    Payment Confirmation
                </Title>
                <Text style={{ fontSize: 15, color: theme.textSec }}>
                    Review payment slips and verify advance payments before delivery.
                </Text>
            </div>

            {/* Alert bar for pending slips */}
            {!loading && awaitingCount > 0 && (
                <div style={{
                    background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
                    padding: '12px 20px', marginBottom: 24,
                    display: 'flex', alignItems: 'center', gap: 12
                }}>
                    <ClockCircleOutlined style={{ color: theme.amber, fontSize: 20 }} />
                    <Text style={{ color: theme.amber, fontWeight: 700, fontSize: 14 }}>
                        {awaitingCount} payment slip{awaitingCount > 1 ? 's' : ''} awaiting your review
                    </Text>
                    <Button
                        size="small"
                        onClick={() => setFilterSlip('AWAITING')}
                        style={{ marginLeft: 'auto', borderColor: theme.amber, color: theme.amber, fontWeight: 700 }}
                    >
                        Show Only
                    </Button>
                </div>
            )}

            {/* Summary chips */}
            {!loading && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                    {[
                        {
                            label: 'Slips Awaiting Review', value: awaitingCount,
                            bg: '#fffbeb', color: theme.amber,
                            click: () => setFilterSlip('AWAITING')
                        },
                        {
                            label: 'Payments Approved', value: approvedCount,
                            bg: '#f0fdf4', color: theme.green,
                            click: () => setFilterSlip('APPROVED')
                        },
                        {
                            label: 'Total Active Orders', value: orders.length,
                            bg: '#eff6ff', color: theme.blue,
                            click: () => setFilterSlip('ALL')
                        },
                    ].map(chip => (
                        <div
                            key={chip.label}
                            onClick={chip.click}
                            style={{
                                padding: '10px 18px', borderRadius: 8, cursor: 'pointer',
                                background: chip.bg, border: `1px solid ${chip.color}30`,
                                display: 'flex', gap: 10, alignItems: 'center',
                                transition: 'all 0.15s'
                            }}
                        >
                            <Text style={{ color: chip.color, fontWeight: 900, fontSize: 22 }}>{chip.value}</Text>
                            <Text style={{ color: chip.color, fontWeight: 600, fontSize: 12 }}>{chip.label}</Text>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
                <Input
                    prefix={<SearchOutlined style={{ color: theme.textSec }} />}
                    placeholder="Search customer or order ID..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    allowClear style={{ width: 280 }}
                    size="large"
                />
                <Select value={filterMethod} onChange={setFilterMethod} size="large" style={{ width: 160 }}>
                    <Option value="ALL">All Methods</Option>
                    <Option value="COD">COD Only</Option>
                    <Option value="ONLINE">Online/Bank</Option>
                </Select>
                <Select value={filterSlip} onChange={setFilterSlip} size="large" style={{ width: 200 }}>
                    <Option value="ALL">All Statuses</Option>
                    <Option value="AWAITING">Awaiting Review</Option>
                    <Option value="APPROVED">Approved</Option>
                    <Option value="NONE">No Slip Yet</Option>
                </Select>
                <Button onClick={fetchOrders} size="large" style={{ fontWeight: 600 }}>
                    Refresh
                </Button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
            ) : (
                <>
                    {/* COD Section */}
                    <div style={{ marginBottom: 48 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <WalletOutlined style={{ fontSize: 20, color: theme.amber }} />
                            <Title level={4} style={{ margin: 0 }}>Cash on Delivery (COD)</Title>
                            <Badge count={codOrders.length} style={{ backgroundColor: theme.amber }} />
                            <Text style={{ fontSize: 12, color: theme.textSec, marginLeft: 4 }}>
                                — Advance payment verification for COD orders
                            </Text>
                        </div>

                        {codOrders.length === 0 ? (
                            <div style={{ background: '#fff', border: `1px solid ${theme.border}`, borderRadius: 12, padding: '32px', textAlign: 'center' }}>
                                <Empty description={<span style={{ color: theme.textSec }}>No COD orders found.</span>} />
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                                {codOrders.map(o => <OrderCard key={o.id} order={o} />)}
                            </div>
                        )}
                    </div>

                    {/* Online/Bank Section */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <BankOutlined style={{ fontSize: 20, color: theme.blue }} />
                            <Title level={4} style={{ margin: 0 }}>Online / Bank Transfer</Title>
                            <Badge count={onlineOrders.length} style={{ backgroundColor: theme.blue }} />
                            <Text style={{ fontSize: 12, color: theme.textSec, marginLeft: 4 }}>
                                — Full payment verification before production
                            </Text>
                        </div>

                        {onlineOrders.length === 0 ? (
                            <div style={{ background: '#fff', border: `1px solid ${theme.border}`, borderRadius: 12, padding: '32px', textAlign: 'center' }}>
                                <Empty description={<span style={{ color: theme.textSec }}>No bank transfer orders found.</span>} />
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                                {onlineOrders.map(o => <OrderCard key={o.id} order={o} />)}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Slip Preview Modal */}
            <Modal
                open={previewVisible}
                footer={null}
                onCancel={() => setPreviewVisible(false)}
                centered
                width={700}
                title={<span style={{ fontWeight: 700 }}>Payment Slip</span>}
            >
                <img
                    alt="Payment Slip"
                    style={{ width: '100%', display: 'block', borderRadius: 8, maxHeight: '75vh', objectFit: 'contain' }}
                    src={previewImage}
                    onError={e => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/600x400?text=Slip+Preview+Unavailable';
                    }}
                />
                <div style={{ padding: '12px', textAlign: 'center' }}>
                    <a href={previewImage} target="_blank" rel="noreferrer" style={{ color: theme.blue, fontWeight: 700 }}>
                        Open in new tab ↗
                    </a>
                </div>
            </Modal>

            <ReceivePaymentModal
                open={!!paymentModalOrder}
                order={paymentModalOrder}
                onClose={() => setPaymentModalOrder(null)}
                onSuccess={() => fetchOrders()}
            />
        </div>
    );
};

export default Orders;
