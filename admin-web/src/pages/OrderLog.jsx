import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, message, Select, Space, Button, Image, Avatar, Popover, Badge, Empty, Tooltip } from 'antd';
import { UserOutlined, FileImageOutlined, ShoppingOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import InvoiceModal from '../components/InvoiceModal';

const { Title, Text } = Typography;

const OrderLog = () => {
    const [monthlyOrders, setMonthlyOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(`${new Date().getFullYear()}-${new Date().getMonth() + 1}`);
    const [orderTypeFilter, setOrderTypeFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedOrder, setSelectedOrder] = useState(null); // State for Invoice Modal
    const [isModalOpen, setIsModalOpen] = useState(false);

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
            message.error('Failed to load order logic');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonthlyData(selectedMonth);
    }, [selectedMonth]);

    const columns = [
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
                let color = 'blue';
                if (status === 'DELIVERED') color = 'green';
                else if (status === 'CANCELLED') color = 'red';
                else if (status === 'READY') color = 'volcano';
                else if (status === 'CONFIRMED') color = 'cyan';
                else if (status === 'PREPARING') color = 'orange';
                return <Tag color={color} style={{ borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>{(status || 'NEW').replace(/_/g, ' ')}</Tag>;
            }
        },
        {
            title: 'Payment',
            key: 'payment',
            width: 160,
            render: (_, record) => {
                let color = 'red';
                if (record.paymentStatus === 'PAID') color = 'green';
                else if (record.paymentStatus === 'PARTIAL') color = 'orange';

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <Tag color={color} style={{ borderRadius: '6px', fontSize: '10px', fontWeight: 600, margin: 0 }}>
                            {record.paymentStatus}
                        </Tag>
                        {record.advanceStatus && record.advanceStatus !== 'PENDING' && (
                            <Text type="secondary" style={{ fontSize: '10px' }}>Adv: {record.advanceStatus.replace('UPLOADED_', '')}</Text>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'Slip',
            key: 'slip',
            width: 80,
            align: 'center',
            render: (_, record) => {
                if (record.bankSlip) {
                    const slipUrl = record.bankSlip.startsWith('http') 
                        ? record.bankSlip 
                        : `http://localhost:5000${record.bankSlip.startsWith('/') ? '' : '/'}${record.bankSlip}`;
                    
                    return (
                        <Image
                            src={slipUrl}
                            width={32}
                            height={32}
                            style={{ borderRadius: '6px', cursor: 'pointer', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                            preview={{ src: slipUrl }}
                            fallback="https://via.placeholder.com/32?text=Error"
                        />
                    );
                }
                return <Tooltip title="No Slip"><FileImageOutlined style={{ color: '#cbd5e1', fontSize: '18px' }} /></Tooltip>;
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

    const filteredOrders = monthlyOrders.filter(o => {
        const typeMatch = orderTypeFilter === 'All' || o.type === orderTypeFilter;
        let statusMatch = true;
        if (statusFilter === 'Active') {
            statusMatch = !['CANCELLED', 'DELIVERED'].includes(o.status);
        } else if (statusFilter !== 'All') {
            statusMatch = o.status === statusFilter;
        }
        return typeMatch && statusMatch;
    });

    return (
        <div style={{ paddingBottom: '40px' }}>
            <style>{`
                .premium-table .ant-table-thead > tr > th {
                    background-color: #f8fafc !important;
                    color: #475569 !important;
                    font-weight: 600 !important;
                    text-transform: uppercase !important;
                    font-size: 11px;
                    letter-spacing: 0.5px;
                    border-bottom: 2px solid #e2e8f0 !important;
                }
                .premium-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 16px !important;
                }
                .premium-table .ant-table-tbody > tr:hover > td {
                    background-color: #f8fafc !important;
                }
                .premium-select .ant-select-selector {
                    border-radius: 12px !important;
                    border-color: #e2e8f0 !important;
                    box-shadow: none !important;
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Order Log</Title>
                    <Text type="secondary" style={{ fontSize: '14px' }}>Comprehensive history of all past and current orders</Text>
                </div>
            </div>

            <Card bordered={false} style={{ borderRadius: '24px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.06)' }} bodyStyle={{ padding: '32px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: 24, padding: '20px', backgroundColor: '#f8fafc', borderRadius: '16px' }}>
                    <div>
                        <Text style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Filter by Month</Text>
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

                    <div>
                        <Text style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Order Type</Text>
                        <Select value={orderTypeFilter} onChange={setOrderTypeFilter} style={{ width: 180 }} size="large" className="premium-select">
                            <Select.Option value="All">All Types</Select.Option>
                            <Select.Option value="Standard">Standard</Select.Option>
                            <Select.Option value="Custom">Custom</Select.Option>
                            <Select.Option value="Bulk">Bulk</Select.Option>
                        </Select>
                    </div>

                    <div>
                        <Text style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Order Status</Text>
                        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 180 }} size="large" className="premium-select">
                            <Select.Option value="All">All Statuses</Select.Option>
                            <Select.Option value="Active">Active / Ongoing</Select.Option>
                            <Select.Option value="DELIVERED">Delivered</Select.Option>
                            <Select.Option value="CANCELLED">Cancelled</Select.Option>
                            <Select.Option value="NEW">New</Select.Option>
                        </Select>
                    </div>
                </div>

                <Table
                    className="premium-table"
                    columns={columns}
                    dataSource={filteredOrders}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 15, position: ['bottomCenter'], showSizeChanger: false }}
                    locale={{ emptyText: <Empty description="No orders found for this filter combination" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
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
