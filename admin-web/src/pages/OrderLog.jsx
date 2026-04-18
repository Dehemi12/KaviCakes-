import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, message, Select, Space, Button, Image, Avatar, Popover, Badge, Empty, Tooltip, Tabs, Steps, DatePicker } from 'antd';
import { UserOutlined, FileImageOutlined, ShoppingOutlined, CheckCircleFilled, ClockCircleFilled, RocketOutlined, GiftOutlined, SyncOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import InvoiceModal from '../components/InvoiceModal';

const { Title, Text } = Typography;

const OrderLog = () => {
    const [monthlyOrders, setMonthlyOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(`${new Date().getFullYear()}-${new Date().getMonth() + 1}`);
    const [orderTypeFilter, setOrderTypeFilter] = useState('All');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [activeTab, setActiveTab] = useState('1');

    const fetchMonthlyData = async (monthStr) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [year, month] = monthStr.split('-');
            const res = await axios.get(`http://localhost:5000/api/dashboard/monthly-analysis?year=${year}&month=${month}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMonthlyOrders(res.data.orders);
        } catch (error) {
            console.error('Error fetching order log:', error);
            message.error('Failed to load order log');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonthlyData(selectedMonth);
    }, [selectedMonth]);

    // --- SHARED COMPONENTS ---
    const getStatusConfig = (status) => {
        switch (status) {
            case 'DELIVERED': return { color: 'green', icon: <CheckCircleFilled /> };
            case 'CANCELLED': return { color: 'red', icon: <ClockCircleFilled /> };
            case 'READY': return { color: 'volcano', icon: <RocketOutlined /> };
            case 'CONFIRMED': return { color: 'cyan', icon: <CheckCircleFilled /> };
            case 'PREPARING': return { color: 'orange', icon: <SyncOutlined spin /> };
            case 'NEW': return { color: 'blue', icon: <GiftOutlined /> };
            default: return { color: 'default', icon: null };
        }
    };

    // --- ACTIVE ORDER COLUMNS ---
    const activeColumns = [
        {
            title: 'Order Number',
            key: 'id',
            width: 100,
            render: (_, record) => (
                <div>
                    <Text style={{ color: '#be185d', fontWeight: 700, fontSize: '14px' }}>#{record.id}</Text>
                    <div style={{ marginTop: '2px' }}>
                        {record.type === 'Bulk' ? <Tag color="gold" style={{ fontSize: '9px', lineHeight: '14px', borderRadius: '4px' }}>BULK</Tag> : 
                         record.type === 'Custom' ? <Tag color="purple" style={{ fontSize: '9px', lineHeight: '14px', borderRadius: '4px' }}>CUSTOM</Tag> : 
                         <Tag color="blue" style={{ fontSize: '9px', lineHeight: '14px', borderRadius: '4px' }}>STD</Tag>}
                    </div>
                </div>
            )
        },
        {
            title: 'Order Life Cycle',
            key: 'flow',
            width: 320,
            render: (_, record) => {
                const stages = ['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'];
                const currentIdx = stages.indexOf(record.status);
                
                return (
                    <div style={{ padding: '4px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                             {getStatusConfig(record.status).icon}
                             <Text strong style={{ fontSize: '13px', color: '#0f172a', textTransform: 'capitalize' }}>
                                 {record.status?.toLowerCase().replace(/_/g, ' ')}
                             </Text>
                             <Text type="secondary" style={{ fontSize: '10px', marginLeft: 'auto' }}>
                                 Updated: {dayjs(record.updatedAt).format('hh:mm A')}
                             </Text>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {stages.map((s, idx) => (
                                <Tooltip title={s} key={s}>
                                    <div 
                                        style={{ 
                                            height: '6px', 
                                            flex: 1, 
                                            backgroundColor: idx <= currentIdx ? '#be185d' : '#f1f5f9', 
                                            borderRadius: '3px',
                                            transition: 'all 0.3s ease'
                                        }} 
                                    />
                                </Tooltip>
                            ))}
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Placed Date',
            dataIndex: 'date',
            key: 'date',
            render: (date) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text style={{ fontSize: '13px', fontWeight: 500 }}>{dayjs(date).format('DD MMM YYYY')}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{dayjs(date).format('hh:mm A')}</Text>
                </div>
            )
        },
        {
            title: 'Confirmations',
            key: 'confirmations',
            render: (_, record) => (
                <Space direction="vertical" size={2}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Badge status={['NEW'].includes(record.status) ? "default" : "success"} />
                        <Text style={{ fontSize: '11px', color: '#475569' }}>Order: {['NEW', 'ADMIN_CONFIRMED'].includes(record.status) ? 'No' : 'Yes'}</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Badge status={record.paymentStatus === 'PAID' || record.advanceStatus === 'APPROVED' ? "success" : "processing"} />
                        <Text style={{ fontSize: '11px', color: '#475569' }}>Payment: {record.paymentStatus === 'PAID' || record.advanceStatus === 'APPROVED' ? 'Yes' : 'Pending'}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Payment Type',
            key: 'payment_details',
            render: (_, record) => {
                const isFull = record.paymentStatus === 'PAID';
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Tag color={isFull ? 'green' : 'orange'} style={{ border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: 600, width: 'fit-content' }}>
                            {isFull ? 'FULL PAYMENT' : 'ADVANCE (30%)'}
                        </Tag>
                        {record.paymentDate && (
                            <Text type="secondary" style={{ fontSize: '10px' }}>
                                Last Pay: {dayjs(record.paymentDate).format('DD/MM/YY')}
                            </Text>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'Preparation Start',
            key: 'production',
            render: (_, record) => {
                const scheduledDate = record.deliveryDate ? dayjs(record.deliveryDate).subtract(2, 'day') : null;
                const isStarted = !!record.productionStartDate;
                
                return (
                    <div style={{ backgroundColor: isStarted ? '#f8fafc' : '#fff7ed', padding: '6px 10px', borderRadius: '8px', border: isStarted ? '1px solid #e2e8f0' : '1px solid #ffedd5' }}>
                       {isStarted ? (
                           <div style={{ display: 'flex', flexDirection: 'column' }}>
                               <Text style={{ fontSize: '11px', fontWeight: 800, color: '#0ea5e9', letterSpacing: '0.5px' }}>● STARTED</Text>
                               <Text style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{dayjs(record.productionStartDate).format('DD MMM')}</Text>
                               <Text type="secondary" style={{ fontSize: '10px' }}>{dayjs(record.productionStartDate).format('hh:mm A')}</Text>
                           </div>
                       ) : (
                           <div style={{ display: 'flex', flexDirection: 'column' }}>
                               <Text style={{ fontSize: '11px', fontWeight: 800, color: '#f97316', letterSpacing: '0.5px' }}>○ SCHEDULED</Text>
                               <Text style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                                   {scheduledDate ? scheduledDate.format('DD MMM') : 'N/A'}
                               </Text>
                               <Text type="secondary" style={{ fontSize: '10px' }}>{scheduledDate ? 'Start by morning' : 'Set date first'}</Text>
                           </div>
                       )}
                    </div>
                );
            }
        },
        {
            title: 'Delivery Expected',
            dataIndex: 'deliveryDate',
            key: 'deliveryDate',
            render: (date) => (
                <div style={{ padding: '8px 12px', backgroundColor: '#fff1f2', borderRadius: '10px', border: '1px solid #fecdd3', width: 'fit-content', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#f43f5e', fontWeight: 800, marginBottom: '2px', letterSpacing: '0.5px' }}>DUE DATE</div>
                    <Text style={{ fontSize: '13px', fontWeight: 800, color: '#be185d' }}>
                        {date ? dayjs(date).format('DD MMM') : 'N/A'}
                    </Text>
                </div>
            )
        }
    ];

    // --- PAST ORDER COLUMNS (As existing) ---
    const pastColumns = [
        {
            title: 'Order',
            key: 'order_info',
            width: 140,
            render: (_, record) => (
                <div>
                    <Space size={4}>
                        <Text style={{ color: '#be185d', fontWeight: 600 }}>#{record.id}</Text>
                        {record.type === 'Bulk' && <Tag color="gold" style={{ fontSize: '10px', borderRadius: '4px' }}>BULK</Tag>}
                        {record.type === 'Custom' && <Tag color="purple" style={{ fontSize: '10px', borderRadius: '4px' }}>CUSTOM</Tag>}
                    </Space>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                        {new Date(record.date).toLocaleDateString()}
                    </div>
                </div>
            )
        },
        {
            title: 'Customer',
            key: 'customer',
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} />
                    <div style={{ overflow: 'hidden' }}>
                        <Text style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155' }} ellipsis>{record.customer}</Text>
                        <Text type="secondary" style={{ fontSize: '11px' }} ellipsis>{record.customerEmail}</Text>
                    </div>
                </div>
            )
        },
        {
            title: 'Items Summary',
            dataIndex: 'items',
            key: 'items',
            width: 180,
            render: items => {
                if (!Array.isArray(items) || items.length === 0) return '-';
                const content = (
                    <div style={{ minWidth: 200, padding: '4px' }}>
                        {items.map((item, i) => (
                            <div key={i} style={{ padding: '6px 0', borderBottom: i < items.length - 1 ? '1px solid #f0f0f0' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: '12px' }}>{item.name}</Text>
                                <Text strong style={{ fontSize: '12px' }}>x{item.quantity}</Text>
                            </div>
                        ))}
                    </div>
                );
                return (
                    <Popover content={content} title="Order Items" trigger="hover">
                        <Tag color="pink" style={{ borderRadius: '12px', cursor: 'pointer', padding: '2px 12px', fontWeight: 600 }}>
                            <ShoppingOutlined style={{ marginRight: '4px' }}/> {items.length} {items.length === 1 ? 'Item' : 'Items'}
                        </Tag>
                    </Popover>
                );
            }
        },
        {
            title: 'Amount',
            dataIndex: 'total',
            key: 'total',
            align: 'right',
            width: 120,
            render: (total) => <Text style={{ fontWeight: 600, color: '#0f172a' }}>Rs. {total.toLocaleString()}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            render: (status) => {
                const config = getStatusConfig(status);
                return <Tag color={config.color} style={{ borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>{(status || 'NEW').replace(/_/g, ' ')}</Tag>;
            }
        },
        {
            title: 'Action',
            key: 'action',
            width: 130,
            align: 'right',
            render: (_, record) => (
                <Button 
                    type="primary" 
                    size="small" 
                    shape="round" 
                    style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', boxShadow: 'none', fontWeight: 500 }} 
                    onClick={() => {
                        setSelectedOrder(record);
                        setIsModalOpen(true);
                    }}
                >
                    Details
                </Button>
            ),
        },
    ];

    // Active orders get all filters (Type + Delivery Date OR Scheduled Start Date)
    const activeOrders = monthlyOrders
        .filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status))
        .filter(o => {
            const typeMatch = orderTypeFilter === 'All' || o.type === orderTypeFilter;
            
            let dateMatch = true;
            if (selectedDate) {
                const deliveryMatch = o.deliveryDate && dayjs(o.deliveryDate).isSame(selectedDate, 'day');
                const scheduledMatch = o.deliveryDate && dayjs(o.deliveryDate).subtract(2, 'day').isSame(selectedDate, 'day');
                dateMatch = deliveryMatch || scheduledMatch;
            }
            return typeMatch && dateMatch;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

        
    // Past orders only filter by status (All history for this month)
    const pastOrders = monthlyOrders
        .filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const items = [
        {
            key: '1',
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge count={activeOrders.length} offset={[10, 0]} color="#be185d">
                        <Text strong style={{ color: activeTab === '1' ? '#be185d' : 'inherit', fontSize: '15px' }}>Active Order Log</Text>
                    </Badge>
                </span>
            ),
            children: (
                <Table
                    className="premium-table"
                    columns={activeColumns}
                    dataSource={activeOrders}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 12, position: ['bottomCenter'], showSizeChanger: false }}
                    locale={{ emptyText: <Empty description="No active tasks for this date" /> }}
                />
            ),
        },
        {
            key: '2',
            label: <Text strong style={{ fontSize: '15px', color: activeTab === '2' ? '#be185d' : 'inherit' }}>Past Order Log</Text>,
            children: (
                <Table
                    className="premium-table"
                    columns={pastColumns}
                    dataSource={pastOrders}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 10, position: ['bottomCenter'], showSizeChanger: false }}
                    locale={{ emptyText: <Empty description="No history found" /> }}
                />
            ),
        },
    ];

    return (
        <div style={{ paddingBottom: '40px' }}>
            <style>{`
                .premium-table .ant-table-thead > tr > th {
                    background-color: #f8fafc !important;
                    color: #475569 !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    font-size: 11px;
                    letter-spacing: 0.5px;
                    border-bottom: 2px solid #e2e8f0 !important;
                    padding: 16px !important;
                }
                .ant-picker {
                    border-radius: 12px !important;
                    border-color: #e2e8f0 !important;
                }
                .ant-tabs-ink-bar {
                    background: #be185d !important;
                    height: 3px !important;
                }
                .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #be185d !important;
                }
                .premium-select .ant-select-selector {
                    border-radius: 12px !important;
                    border-color: #e2e8f0 !important;
                    box-shadow: none !important;
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', fontSize: '32px' }}>Order Tracking System</Title>
                    <Text type="secondary" style={{ fontSize: '15px', color: '#64748b' }}>Real-time operations dashboard for production and logistics</Text>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Filter by Task Date</div>
                         <div style={{ display: 'flex', gap: '8px' }}>
                            <DatePicker 
                                placeholder="All Days" 
                                onChange={(date) => setSelectedDate(date)} 
                                format="DD MMM YYYY"
                                allowClear
                                size="large"
                            />
                            <Select
                                value={selectedMonth}
                                onChange={(val) => setSelectedMonth(val)}
                                style={{ width: 220 }}
                                size="large"
                                className="premium-select"
                            >
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => {
                                    const d = new Date();
                                    d.setMonth(d.getMonth() - i);
                                    const val = `${d.getFullYear()}-${d.getMonth() + 1}`;
                                    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
                                    return <Select.Option key={val} value={val}>{label}</Select.Option>;
                                })}
                            </Select>
                         </div>
                    </div>
                </div>
            </div>

            <Card bordered={false} style={{ borderRadius: '28px', boxShadow: '0 20px 50px -12px rgba(0,0,0,0.08)' }} bodyStyle={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 24 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f8fafc', padding: '12px 20px', borderRadius: '16px' }}>
                        <Text strong style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Filter Type:</Text>
                        <Select value={orderTypeFilter} onChange={setOrderTypeFilter} style={{ width: 140 }} size="middle" variant="borderless">
                            <Select.Option value="All">All Types</Select.Option>
                            <Select.Option value="Standard">Standard</Select.Option>
                            <Select.Option value="Custom">Custom</Select.Option>
                            <Select.Option value="Bulk">Bulk</Select.Option>
                        </Select>
                   </div>
                </div>

                <Tabs 
                    activeKey={activeTab} 
                    onChange={setActiveTab} 
                    items={items} 
                    size="large"
                    tabBarStyle={{ marginBottom: '32px', borderBottom: '2px solid #f1f5f9' }}
                />
            </Card>

            <InvoiceModal 
                open={isModalOpen} 
                order={selectedOrder} 
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedOrder(null);
                }} 
            />
        </div>
    );
};

export default OrderLog;

