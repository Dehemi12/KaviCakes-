import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Typography, Tag, Select, DatePicker, message, Spin, Empty, Image, Badge, Tooltip, Drawer, Button, Space, Divider } from 'antd';
import {
    CalendarOutlined, FireOutlined, CheckCircleOutlined, UserOutlined,
    ClockCircleOutlined, InfoCircleOutlined, ReloadOutlined,
    AppstoreOutlined, ShoppingOutlined, EnvironmentOutlined,
    FileTextOutlined, RocketOutlined, WalletOutlined, CameraOutlined,
    EyeOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;

const BASE_URL = 'http://localhost:5000';
const API = `${BASE_URL}/api`;

const getImgUrl = (path) => {
    if (!path || path === '') return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${BASE_URL}/${cleanPath}`;
};

const TYPE = {
    BULK:     { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', label: 'BULK' },
    CUSTOM:   { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', label: 'CUSTOM' },
    STANDARD: { color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', label: 'STANDARD' },
};

const getType = (order) =>
    order.isBulk || order.orderType === 'BULK' || !!order.bulkOrder ? 'BULK'
    : order.isCustom || order.orderType === 'CUSTOM' || !!order.customOrder ? 'CUSTOM'
    : 'STANDARD';

const UrgencyBadge = ({ deliveryDate }) => {
    const days = deliveryDate ? dayjs(deliveryDate).diff(dayjs(), 'day') : null;
    if (days === null) return null;
    const color = days < 0 ? '#ef4444' : days === 0 ? '#f97316' : days === 1 ? '#eab308' : '#22c55e';
    const label = days < 0 ? 'OVERDUE' : days === 0 ? 'TODAY' : days === 1 ? 'TOMORROW' : `${days}d left`;
    return (
        <span style={{ background: color, color: '#fff', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 4 }}>{label}</span>
    );
};

const SpecRow = ({ label, value }) => value ? (
    <div style={{ display: 'flex', gap: 12, fontSize: 13, marginBottom: 8, borderBottom: '1px dashed #f1f5f9', paddingBottom: 4 }}>
        <span style={{ color: '#64748b', width: 100, flexShrink: 0 }}>{label}</span>
        <span style={{ color: '#0f172a', fontWeight: 600 }}>{value}</span>
    </div>
) : null;

const OrderDetailView = ({ order }) => {
    if (!order) return null;
    const oType = getType(order);
    const t = TYPE[oType];

    return (
        <div style={{ padding: '0 4px' }}>
            {/* Status Section */}
            <div style={{ background: order.paymentStatus === 'PAID' ? '#f0fdf4' : '#fff7ed', border: `1px solid ${order.paymentStatus === 'PAID' ? '#bbf7d0' : '#fed7aa'}`, padding: '12px 16px', borderRadius: 12, marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
                <Space><WalletOutlined /><Text style={{ fontWeight: 700 }}>Payment: {order.paymentStatus}</Text></Space>
                <Tag color={order.paymentStatus === 'PAID' ? 'success' : 'warning'}>{order.status}</Tag>
            </div>

            {/* Customer */}
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 24, border: '1px solid #e2e8f0' }}>
                <Space size={12} style={{ marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, background: '#fff', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}><UserOutlined /></div>
                    <div><Text style={{ display: 'block', fontSize: 16, fontWeight: 800 }}>{order.customer?.name}</Text><Text style={{ color: '#64748b' }}>{order.customer?.phone}</Text></div>
                </Space>
                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                    <span>📅 Due: <strong>{dayjs(order.deliveryDate).format('MMM D, YYYY')}</strong></span>
                    <span>🏷️ Type: <strong>{oType}</strong></span>
                </div>
            </div>

            {/* Notes */}
            {order.specialNotes && (
                <div style={{ padding: 16, background: order.isEdited ? '#fff1f2' : '#fffbeb', borderLeft: `4px solid ${order.isEdited ? '#f43f5e' : '#f59e0b'}`, borderRadius: 8, marginBottom: 24 }}>
                    <Text style={{ display: 'block', fontWeight: 900, fontSize: 12, color: order.isEdited ? '#f43f5e' : '#f59e0b', marginBottom: 4 }}>
                        {order.isEdited ? '⚠️ UPDATED BY CUSTOMER' : 'PRODUCTION NOTES'}
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: 600 }}>{order.specialNotes}</Text>
                </div>
            )}

            <Title level={5} style={{ marginBottom: 16, marginTop: 32, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 }}>Items to Produce</Title>

            {order.items?.map((item, idx) => {
                const custom = item.customDetails || {};
                const variant = item.variant || item.cakevariant || {};
                
                // Priority image mapping
                const designImg = custom.designImage || custom.design_image || custom.reference_image || custom.referenceImage;
                const thumb = getImgUrl(designImg || item.image || variant?.cake?.imageUrl);
                
                // Priority quantity mapping
                const displayQty = order.bulkOrder?.quantity || custom.qty_estimate || custom.quantity || item.quantity;

                return (
                    <div key={idx} style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ width: 80, height: 80, flexShrink: 0 }}>
                                <Image src={thumb} width="100%" height="100%" style={{ borderRadius: 8, objectFit: 'cover', border: '1px solid #f1f5f9' }} fallback="https://placehold.co/80x80/f1f5f9/94a3b8?text=Cake" />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Text style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{item.name || 'Custom Order'}</Text>
                                    <Tag color={t.color} style={{ margin: 0, fontWeight: 700 }}>{oType}</Tag>
                                </div>
                                <div style={{ marginTop: 8 }}>
                                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Production target: </Text>
                                    <Text style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{displayQty} units</Text>
                                </div>
                            </div>
                        </div>

                        <Divider style={{ margin: '16px 0 12px 0' }} />

                        <div style={{ display: 'grid', gap: 4 }}>
                            {oType === 'STANDARD' && (
                                <>
                                    <SpecRow label="Size" value={variant.size?.label || variant.cakesize?.label} />
                                    <SpecRow label="Flavor" value={variant.flavor?.label || variant.cakeflavor?.label} />
                                </>
                            )}
                            {oType === 'CUSTOM' && (
                                <>
                                    <SpecRow label="Size" value={custom.cake_size || custom.cakeSize} />
                                    <SpecRow label="Flavor" value={custom.flavor} />
                                    <SpecRow label="Frosting" value={custom.frosting_type} />
                                    {custom.message && (
                                        <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6, marginTop: 8, borderLeft: `3px solid ${t.color}` }}>
                                            <Text style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 2 }}>WRITING ON CAKE</Text>
                                            <Text style={{ fontSize: 14, fontWeight: 700 }}>"{custom.message}"</Text>
                                        </div>
                                    )}
                                    {designImg && (
                                        <div style={{ marginTop: 12 }}>
                                           <Text style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6 }}>UPLOADED DESIGN</Text>
                                           <Image src={getImgUrl(designImg)} style={{ borderRadius: 8, maxHeight: 200, width: '100%', objectFit: 'contain', background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                                        </div>
                                    )}
                                </>
                            )}
                            {oType === 'BULK' && (
                                <>
                                    <SpecRow label="Event" value={order.bulkOrder?.eventName || custom.event_name} />
                                    <SpecRow label="Org" value={order.bulkOrder?.organization || custom.organization} />
                                    <SpecRow label="Core Product" value={custom.product_unit} />
                                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                        {(custom.reference_image || custom.referenceImage) && (
                                            <div style={{ flex: 1, background: '#f8fafc', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                                <Text style={{ fontSize: 10, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6 }}>REFERENCE IMAGE</Text>
                                                <Image src={getImgUrl(custom.reference_image || custom.referenceImage)} style={{ borderRadius: 6, width: '100%', maxHeight: 150, objectFit: 'cover' }} />
                                            </div>
                                        )}
                                        {(custom.packaging_design_file || custom.packagingDesignFile) && (
                                            <div style={{ flex: 1, background: '#f8fafc', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                                <Text style={{ fontSize: 10, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6 }}>PACKAGING DESIGN</Text>
                                                <Image src={getImgUrl(custom.packaging_design_file || custom.packagingDesignFile)} style={{ borderRadius: 6, width: '100%', maxHeight: 150, objectFit: 'cover' }} />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const OrderCard = ({ order, onAction, actionLabel, actionClass, onShowDetails }) => {
    const oType = getType(order);
    const t = TYPE[oType];
    const isOverdue = dayjs(order.deliveryDate).isBefore(dayjs(), 'day');
    
    // Thumbnail prioritization
    const custom = order.items?.[0]?.customDetails || {};
    const designImg = custom.designImage || custom.design_image || custom.reference_image || custom.referenceImage;
    const thumb = getImgUrl(designImg || order.items?.[0]?.image || order.items?.[0]?.variant?.cake?.imageUrl);
    const displayQty = order.bulkOrder?.quantity || custom.qty_estimate || custom.quantity || order.items?.[0]?.quantity;

    return (
        <div onClick={() => onShowDetails(order)} className="production-card" style={{ background: '#fff', border: `1.5px solid ${isOverdue ? '#fee2e2' : '#f1f5f9'}`, borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', gap: 12 }}>
                <Image src={thumb} width={60} height={60} preview={false} style={{ borderRadius: 8, objectFit: 'cover' }} fallback="https://placehold.co/60?text=🎂" />
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Space><Text style={{ fontWeight: 900 }}>#{order.id}</Text><Tag color={t.color} style={{ fontSize: 9 }}>{t.label}</Tag></Space>
                        <UrgencyBadge deliveryDate={order.deliveryDate} />
                    </div>
                    <Text strong ellipsis>{order.customer?.name}</Text>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <Tag color={order.paymentStatus === 'PAID' ? 'success' : 'warning'} style={{ fontSize: 9 }}>{order.paymentStatus}</Tag>
                        <Text style={{ fontWeight: 800, fontSize: 12 }}>Qty: {displayQty}</Text>
                    </div>
                </div>
            </div>
            <Button type="primary" className={actionClass} icon={actionClass==='start-btn'?<RocketOutlined/>:<CheckCircleOutlined/>} onClick={(e)=>{e.stopPropagation();onAction(order.id)}} block style={{ marginTop: 12, height: 38, borderRadius: 8, fontWeight: 800 }}>{actionLabel}</Button>
        </div>
    );
};

const Production = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('ALL');
    const [dateFilter, setDateFilter] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } });
            const filteredData = res.data.filter(o => ['CONFIRMED', 'ADMIN_CONFIRMED', 'PREPARING'].includes(o.status));
            setOrders(filteredData);
        } catch (e) { message.error('Failed to load production orders'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleStatusUpdate = async (id, nextStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API}/orders/${id}/status`, { status: nextStatus }, { headers: { Authorization: `Bearer ${token}` } });
            message.success(nextStatus === 'PREPARING' ? 'Baking Started!' : 'Order Ready!');
            fetchOrders();
        } catch (e) { message.error(e.response?.data?.error || 'Update failed'); }
    };

    const isAuthorizedToPrepare = (o) => {
        const paymentAuthorized = (o.paymentStatus === 'PAID' || o.advanceStatus === 'APPROVED');
        
        // Date Constraint: Only show in queue if within 4 days of delivery
        // If no delivery date, we show it anyway (safety fallback)
        const withinDateRange = o.deliveryDate 
            ? dayjs(o.deliveryDate).startOf('day').diff(dayjs().startOf('day'), 'day') <= 4 
            : true;

        return paymentAuthorized && withinDateRange;
    };

    const filteredOrders = useMemo(() => orders.filter(o => {
        if (!isAuthorizedToPrepare(o)) return false;
        const oType = getType(o);
        const typeMatch = filterType === 'ALL' || filterType === oType;
        const dateMatch = !dateFilter || dayjs(o.deliveryDate).isSame(dateFilter, 'day');
        return typeMatch && dateMatch;
    }), [orders, filterType, dateFilter]);

    const queue = filteredOrders.filter(o => o.status !== 'PREPARING');
    const progress = filteredOrders.filter(o => o.status === 'PREPARING');

    return (
        <div style={{ padding: 32, background: '#f9f9fa', minHeight: '100vh' }}>
            <style>{`.production-card:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); } .start-btn { background: #2563eb !important; border: none; } .ready-btn { background: #10b981 !important; border: none; }`}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={2}>Production Floor</Title>
                <Space>
                    <Select value={filterType} onChange={setFilterType} style={{ width: 140 }}><Option value="ALL">All Orders</Option><Option value="STANDARD">Standard</Option><Option value="CUSTOM">Custom</Option><Option value="BULK">Bulk</Option></Select>
                    <DatePicker onChange={setDateFilter} placeholder="Filter Date" />
                    <Button icon={<ReloadOutlined />} onClick={fetchOrders} />
                </Space>
            </div>
            {loading ? <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div> : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                    <div style={{ background: '#f1f3f6', borderRadius: 16, padding: 12 }}>
                        <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}><Text strong>READY TO BAKE</Text><Badge count={queue.length} color="#2563eb" /></div>
                        {queue.map(o => <OrderCard key={o.id} order={o} onAction={(id)=>handleStatusUpdate(id, 'PREPARING')} actionLabel="Start Baking" actionClass="start-btn" onShowDetails={setSelectedOrder} />)}
                    </div>
                    <div style={{ background: '#f1f3f6', borderRadius: 16, padding: 12 }}>
                        <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}><Text strong>IN PROGRESS</Text><Badge count={progress.length} color="#10b981" /></div>
                        {progress.map(o => <OrderCard key={o.id} order={o} onAction={(id)=>handleStatusUpdate(id, 'READY')} actionLabel="Mark Ready" actionClass="ready-btn" onShowDetails={setSelectedOrder} />)}
                    </div>
                </div>
            )}
            <Drawer title={<Text strong>Order Specifications #{selectedOrder?.id}</Text>} width={500} open={!!selectedOrder} onClose={()=>setSelectedOrder(null)}>
                <OrderDetailView order={selectedOrder} />
            </Drawer>
        </div>
    );
};

export default Production;
