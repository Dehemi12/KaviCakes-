import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Button, Space, Select, Popconfirm, message, Card } from 'antd';
import { DeleteOutlined, FileTextOutlined, PrinterOutlined } from '@ant-design/icons';
import axios from 'axios';
import InvoiceModal from '../components/InvoiceModal';

const { Title, Text } = Typography;
const { Option } = Select;

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null); // For Invoice Modal
    const [statusFilter, setStatusFilter] = useState('All');
    const [paymentFilter, setPaymentFilter] = useState('All');

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/orders', {
                headers: { Authorization: `Bearer ${token}` },
                params: { status: statusFilter, paymentStatus: paymentFilter }
            });
            setOrders(res.data);
        } catch (error) {
            message.error('Failed to fetch orders');
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

    const columns = [
        { title: 'Order ID', dataIndex: 'id', key: 'id', render: id => <b>#{id}</b> },
        { title: 'Customer', dataIndex: 'customer', key: 'customer', render: c => c?.name || 'Unknown' },
        {
            title: 'Items',
            dataIndex: 'items',
            key: 'items',
            render: items => (
                <div style={{ fontSize: '12px', color: '#666' }}>
                    {items && items.map((item, i) => (
                        <div key={i}>{item.name} ({item.quantity})</div>
                    ))}
                </div>
            )
        },
        { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: d => new Date(d).toLocaleDateString() },
        { title: 'Total', dataIndex: 'total', key: 'total', render: t => `Rs.${t.toLocaleString()}` },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => (
                <Select
                    defaultValue={status}
                    style={{ width: 140 }}
                    onChange={(val) => handleStatusChange(record.id, val)}
                    bordered={false}
                    className={`status-select-${status}`} // Can add custom CSS for styling dropdowns
                >
                    {['NEW', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map(s => (
                        <Option key={s} value={s}>
                            <Tag color={
                                s === 'DELIVERED' ? 'green' :
                                    s === 'CANCELLED' ? 'red' :
                                        s === 'NEW' ? 'blue' : 'orange'
                            }>{s}</Tag>
                        </Option>
                    ))}
                </Select>
            )
        },
        {
            title: 'Payment',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: p => <Tag color={p === 'PAID' ? 'success' : 'warning'}>{p}</Tag>
        },
        { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<FileTextOutlined />}
                        onClick={() => setSelectedOrder(record)}
                        title="View Invoice"
                    />
                    <Popconfirm title="Delete order?" onConfirm={() => handleDelete(record.id)}>
                        <Button icon={<DeleteOutlined />} danger title="Delete" />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <Title level={2}>Order Management</Title>
                <Text type="secondary">Manage and track all customer orders</Text>
            </div>

            <Card style={{ marginBottom: 20 }}>
                <FilterChips
                    title="Order Status"
                    options={['All', 'NEW', 'CONFIRMED', 'PREPARING', 'DELIVERED', 'CANCELLED']}
                    value={statusFilter}
                    onChange={setStatusFilter}
                />
                <FilterChips
                    title="Payment Status"
                    options={['All', 'PAID', 'PENDING', 'REFUNDED']}
                    value={paymentFilter}
                    onChange={setPaymentFilter}
                />
            </Card>

            <Table
                columns={columns}
                dataSource={orders}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <InvoiceModal
                open={!!selectedOrder}
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
            />
        </div>
    );
};

export default Orders;
