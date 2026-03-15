import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Button, Space, Select, Popconfirm, message, Card, Segmented, Dropdown, Menu, Input, Avatar, Tooltip, Badge, Popover, Image } from 'antd';
import { DeleteOutlined, FileTextOutlined, CheckOutlined, CloseOutlined, DollarOutlined, CheckCircleOutlined, MoreOutlined, EyeOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import InvoiceModal from '../components/InvoiceModal';
import ReceivePaymentModal from '../components/ReceivePaymentModal';


const { Title, Text } = Typography;
const { Option } = Select;

const styles = `
    .order-row-hover:hover > td {
        background-color: #f5f5f5 !important;
    }
    .status-select-green .ant-select-selector { color: #52c41a !important; font-weight: bold; }
    .status-select-red .ant-select-selector { color: #f5222d !important; font-weight: bold; }
    .status-select-volcano .ant-select-selector { color: #fa541c !important; font-weight: bold; }
`;

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null); // For Invoice Modal
    const [paymentModalOrder, setPaymentModalOrder] = useState(null); // For Receive Payment Modal
    const [statusFilter, setStatusFilter] = useState('All');
    const [paymentFilter, setPaymentFilter] = useState('All');
    const [searchText, setSearchText] = useState('');

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = {};
            if (statusFilter !== 'All') params.status = statusFilter;
            if (paymentFilter !== 'All') params.paymentStatus = paymentFilter;

            const response = await axios.get('http://localhost:5000/api/orders', {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });

            setOrders(response.data);
        } catch (error) {
            console.error("Fetch error:", error);
            message.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [statusFilter, paymentFilter]);

    const handleStatusChange = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/orders/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Status updated');
            fetchOrders();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.error || 'Update failed');
        }
    };

    const handlePaymentStatusChange = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/orders/${id}/payment-status`, { paymentStatus: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Payment status updated');
            fetchOrders();
        } catch (error) {
            message.error('Update failed');
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/orders/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Order deleted');
            fetchOrders();
        } catch (error) {
            message.error('Delete failed');
        }
    };

    // Filter Chips Component
    const FilterChips = ({ title, options, value, onChange }) => (
        <div style={{ marginBottom: 15 }}>
            <Text strong style={{ marginRight: 10 }}>{title}:</Text>
            <Space wrap>
                {options.map(opt => (
                    <Tag.CheckableTag
                        key={opt}
                        checked={value === opt}
                        onChange={() => onChange(opt)}
                        style={{ border: '1px solid #d9d9d9', padding: '5px 15px', borderRadius: '20px' }}
                    >
                        {opt}
                    </Tag.CheckableTag>
                ))}
            </Space>
        </div>
    );

    const handleApprovePayment = async (id, isFull = false) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/orders/${id}/approve-payment`, { fullPayment: isFull }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(`Payment approved (${isFull ? 'Full' : 'Advance'})`);
            fetchOrders();
        } catch (error) {
            message.error(error.response?.data?.error || 'Approval failed');
        }
    };

    const columns = [
        {
            title: 'Order info',
            key: 'order_info',
            width: 140,
            render: (_, record) => (
                <div>
                    <Space size={4}>
                        <Text strong style={{ fontSize: '15px', color: '#1890ff' }}>#{record.id}</Text>
                        {record.isBulk && <Tag color="gold" style={{ fontSize: '10px', borderRadius: '4px' }}>BULK</Tag>}
                        {record.isCustom && <Tag color="purple" style={{ fontSize: '10px', borderRadius: '4px' }}>CUSTOM</Tag>}
                    </Space>
                    <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                        {new Date(record.createdAt).toLocaleDateString()}
                    </div>
                </div>
            )
        },
        {
            title: 'Customer & Delivery',
            key: 'customer_delivery',
            render: c => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar icon={<UserOutlined />} style={{ flexShrink: 0, backgroundColor: '#f56a00' }} />
                    <div style={{ overflow: 'hidden' }}>
                        <Text strong style={{ display: 'block' }} ellipsis>{c.customer?.name || 'Guest'}</Text>
                        <Text type="secondary" style={{ fontSize: '11px', display: 'block' }} ellipsis>{c.customer?.email}</Text>
                        <Tooltip title={c.address}>
                            <Text type="secondary" italic style={{ fontSize: '10px' }} ellipsis>{c.address}</Text>
                        </Tooltip>
                    </div>
                </div>
            )
        },
        {
            title: 'Items',
            dataIndex: 'items',
            key: 'items',
            width: 120,
            render: (items, record) => {
                if (!Array.isArray(items) || items.length === 0) return 'No Items';
                const content = (
                    <div style={{ minWidth: 240, padding: '4px' }}>
                        {items.map((item, i) => {
                            const variantStr = item.variant ? `${item.variant.size?.label || ''} ${item.variant.flavor?.label || ''} ${item.variant.shape?.label || ''}`.trim() : '';
                            const fullName = item.variant?.cake?.name || item.name;
                            const custom = item.customDetails;

                            return (
                                <div key={i} style={{ 
                                    padding: '8px 0', 
                                    borderBottom: i < items.length - 1 ? '1px solid #f0f0f0' : 'none'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '15px' }}>
                                        <Text strong style={{ fontSize: '13px' }}>{fullName}</Text>
                                        <Tag color="blue" style={{ borderRadius: '4px', margin: 0 }}>Qty: {item.quantity}</Tag>
                                    </div>
                                    {variantStr && <div style={{ marginTop: 2 }}><Text type="secondary" style={{ fontSize: '11px' }}>{variantStr}</Text></div>}
                                    
                                    {/* Custom Order Detail Items */}
                                    {custom && (
                                        <div style={{ marginTop: 6, padding: '6px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
                                            {custom.flavor && <div style={{ fontSize: '11px' }}><Text type="secondary">Flavor:</Text> <Text strong size="small">{custom.flavor}</Text></div>}
                                            {custom.instructions && <div style={{ fontSize: '11px', marginTop: 2 }}><Text type="secondary">Notes:</Text> <em>{custom.instructions}</em></div>}
                                            {record.isBulk && record.bulkInfo && (
                                                <div style={{ borderTop: '1px solid #eee', marginTop: 4, paddingTop: 4 }}>
                                                    <div style={{ fontSize: '11px' }}><Badge status="processing" text={<Text type="secondary">Event: {record.bulkInfo.event}</Text>} /></div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
                return (
                    <Popover content={content} title="Order Items" trigger={['click', 'hover']}>
                        <Tag color="blue" style={{ borderRadius: '10px', cursor: 'pointer', padding: '2px 10px' }}>
                            {items.length} {items.length === 1 ? 'Item' : 'Items'}
                        </Tag>
                    </Popover>
                );
            }
        },
        {
            title: 'Finance',
            key: 'finance',
            width: 160,
            align: 'right',
            render: (_, record) => {
                const balance = Number(record.balanceAmount || 0);
                const status = record.paymentStatus;
                const isPaid = status === 'PAID' || balance <= 0;

                let tagColor = 'error';
                let label = 'Pending';
                if (isPaid) { tagColor = 'success'; label = 'Paid'; }
                else if (status === 'PARTIAL' || status === 'ADVANCE_RECEIVED' || (balance > 0 && Number(record.advanceAmount) > 0)) {
                    tagColor = 'warning'; label = 'Partial';
                }

                return (
                    <div style={{ textAlign: 'right' }}>
                        <Tooltip title={
                            <div>
                                <div>Total: Rs.{Number(record.total).toLocaleString()}</div>
                                <div style={{ color: '#52c41a' }}>Advance: Rs.{Number(record.advanceAmount || 0).toLocaleString()}</div>
                                <div style={{ color: '#f5222d' }}>Balance: Rs.{Number(record.balanceAmount || 0).toLocaleString()}</div>
                            </div>
                        }>
                            <div style={{ fontWeight: 'bold' }}>Rs.{Number(record.total).toLocaleString()}</div>
                        </Tooltip>
                        <Tag color={tagColor} style={{ fontSize: '10px', marginTop: '4px', borderRadius: '10px' }}>
                            {label.toUpperCase()}
                        </Tag>
                        {record.bankSlip && (
                            <div style={{ marginTop: 6 }}>
                                <Image
                                    src={record.bankSlip}
                                    width={40}
                                    height={40}
                                    className="rounded border"
                                    style={{ 
                                        objectFit: 'cover', 
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        padding: '2px',
                                        background: '#fff'
                                    }}
                                    alt="Payment Slip"
                                />
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            render: (status, record) => {
                const statusOptions = ['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
                let color = 'blue';
                if (status === 'DELIVERED') color = 'green';
                else if (status === 'CANCELLED') color = 'red';
                else if (status === 'READY') color = 'volcano';
                else if (status === 'CONFIRMED' || status === 'ADMIN_CONFIRMED') color = 'cyan';
                else if (status === 'PREPARING') color = 'orange';
                else if (status === 'OUT_FOR_DELIVERY') color = 'geekblue';

                return (
                    <Select
                        value={status}
                        onChange={(val) => handleStatusChange(record.id, val)}
                        style={{ width: '100%', fontSize: '12px' }}
                        bordered={false}
                        className={`status-select-${color}`}
                        dropdownMatchSelectWidth={false}
                    >
                        {statusOptions.map(opt => (
                            <Option key={opt} value={opt}>
                                <Tag color={opt === status ? color : 'default'} style={{ borderRadius: '10px', fontSize: '11px' }}>
                                    {opt.replace(/_/g, ' ')}
                                </Tag>
                            </Option>
                        ))}
                    </Select>
                );
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            width: 120,
            render: (_, record) => {
                const primary = (() => {
                    if (record.status === 'NEW' && record.paymentMethod === 'COD') {
                        return (
                            <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleStatusChange(record.id, 'CONFIRMED')} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>
                                Accept
                            </Button>
                        );
                    }
                    if (Number(record.balanceAmount) > 0 && record.paymentStatus !== 'PAID') {
                        return (
                            <Button type="primary" size="small" icon={<DollarOutlined />} onClick={() => setPaymentModalOrder(record)}>
                                Payment
                            </Button>
                        );
                    }
                    if (record.bankSlip && record.paymentStatus !== 'PAID') {
                        return (
                            <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => handleApprovePayment(record.id)} style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}>
                                Appr
                            </Button>
                        );
                    }
                    return null;
                })();

                const menuItems = [
                    { key: 'view', label: 'Invoice', icon: <EyeOutlined />, onClick: () => setSelectedOrder(record) },
                    record.bankSlip && { key: 'slip', label: 'View Bank Slip', icon: <FileTextOutlined />, onClick: () => window.open(record.bankSlip, '_blank') },
                    record.status === 'NEW' && record.paymentMethod === 'COD' && { key: 'reject', label: 'Reject', danger: true, icon: <CloseOutlined />, onClick: () => handleStatusChange(record.id, 'CANCELLED') },
                    { type: 'divider' },
                    { key: 'delete', label: 'Delete', danger: true, icon: <DeleteOutlined />, onClick: () => { Popconfirm.confirm({ title: 'Delete order?', onConfirm: () => handleDelete(record.id) }); } }
                ].filter(Boolean);

                return (
                    <Space size="small">
                        {primary}
                        <Dropdown overlay={<Menu items={menuItems} />} trigger={['click']} placement="bottomRight">
                            <Button size="small" icon={<MoreOutlined />} />
                        </Dropdown>
                    </Space>
                );
            }
        }
    ];

    return (
        <div>
            <style>{styles}</style>
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Order Management</Title>
                    <Text type="secondary">Manage and track all customer orders</Text>
                </div>
                <Input
                    placeholder="Search by ID or Customer..."
                    prefix={<SearchOutlined />}
                    style={{ width: 300 }}
                    allowClear
                    size="large"
                    onChange={(e) => setSearchText(e.target.value)}
                />
            </div>

            <Card style={{ marginBottom: 15 }}>
                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Order Status</Text>
                        <Segmented
                            options={['All', 'NEW', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']}
                            value={statusFilter}
                            onChange={setStatusFilter}
                        />
                    </div>
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Payment Status</Text>
                        <Segmented
                            options={['All', 'PAID', 'PENDING', 'PARTIAL']}
                            value={paymentFilter}
                            onChange={setPaymentFilter}
                        />
                    </div>
                </div>
            </Card>

            <Table
                columns={columns}
                dataSource={orders.filter(o => 
                    o.id.toString().includes(searchText) || 
                    o.customer?.name?.toLowerCase().includes(searchText.toLowerCase())
                )}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 12 }}
                onRow={(record) => ({
                    style: {
                        background: record.isCustom ? '#f9f0ff' : record.isBulk ? '#fff7e6' : 'white',
                        transition: 'all 0.2s',
                    },
                    className: 'order-row-hover'
                })}
            />

            <InvoiceModal
                open={!!selectedOrder}
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
            />

            <ReceivePaymentModal
                open={!!paymentModalOrder}
                order={paymentModalOrder}
                onClose={() => setPaymentModalOrder(null)}
                onSuccess={fetchOrders}
            />
        </div>
    );
};

export default Orders;
