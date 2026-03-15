import React, { useEffect, useState } from 'react';
import { 
    Table, Button, Card, Typography, Space, Row, Col, 
    Statistic, Tag, Modal, Form, Input, Select, DatePicker, 
    message, Divider, Tooltip as AntTooltip, InputNumber, 
    Avatar, Empty
} from 'antd';
import { 
    DollarCircleOutlined, 
    SwapOutlined, 
    PlusOutlined, 
    MinusOutlined, 
    SearchOutlined, 
    FileTextOutlined,
    EditOutlined,
    DeleteOutlined,
    FilterOutlined,
    CalendarOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import './Cashbook.css'; // I will create this for custom styles

const { Title, Text } = Typography;
const { Option } = Select;

const Cashbook = () => {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        pendingReceivables: 0
    });
    const [loading, setLoading] = useState(true);
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState([null, null]);
    const [form] = Form.useForm();

    const fetchData = async (start = null, end = null) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = {};
            if (start && end) {
                params.startDate = start.format('YYYY-MM-DD');
                params.endDate = end.format('YYYY-MM-DD');
            }

            const [trxRes, sumRes] = await Promise.all([
                axios.get('http://localhost:5000/api/transactions', { 
                    headers: { Authorization: `Bearer ${token}` },
                    params
                }),
                axios.get('http://localhost:5000/api/transactions/summary', { 
                    headers: { Authorization: `Bearer ${token}` },
                    params
                })
            ]);

            const trxData = trxRes.data.transactions || [];
            const openingBalance = trxRes.data.openingBalance || 0;

            // Calculate running balance starting from opening balance
            let currentBalance = openingBalance;
            const trxWithBalance = [...trxData].reverse().map(t => {
                if (t.type === 'INCOME') currentBalance += t.amount;
                else currentBalance -= t.amount;
                return { ...t, runningBalance: currentBalance };
            }).reverse();

            setTransactions(trxWithBalance);
            setSummary(sumRes.data);
        } catch (error) {
            console.error(error);
            message.error('Failed to load financial data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddTransaction = async (values, type) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/transactions', {
                ...values,
                type
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(`${type === 'INCOME' ? 'Income' : 'Expense'} added successfully`);
            setIsIncomeModalOpen(false);
            setIsExpenseModalOpen(false);
            form.resetFields();
            fetchData(dateRange[0], dateRange[1]);
        } catch (error) {
            message.error('Failed to add transaction');
        }
    };

    const filteredTransactions = transactions.filter(t => 
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.amount.toString().includes(searchTerm)
    );

    const columns = [
        {
            title: 'Date & Time',
            key: 'date_time',
            width: 150,
            render: (_, r) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong>{new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{new Date(r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </div>
            )
        },
        {
            title: 'Details',
            dataIndex: 'description',
            key: 'details',
            render: (text, r) => (
                <div>
                    <Text style={{ fontSize: '14px' }}>{text}</Text>
                    {r.isOrder && <Tag color="blue" style={{ marginLeft: 8, fontSize: '10px' }}>ORDER</Tag>}
                </div>
            )
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: c => <Text type="secondary" style={{ fontSize: '13px' }}>{c || 'General'}</Text>
        },
        {
            title: 'Mode',
            dataIndex: 'paymentMode',
            key: 'mode',
            render: m => <Tag color={m === 'Bank' ? 'cyan' : 'default'} style={{ borderRadius: '4px' }}>{m || 'Cash'}</Tag>
        },
        {
            title: 'Bill',
            dataIndex: 'billUrl',
            key: 'bill',
            align: 'center',
            render: url => url ? <a href={url} target="_blank" rel="noreferrer"><FileTextOutlined style={{ color: '#E91E63' }} /></a> : '-'
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right',
            render: (amt, r) => (
                <Text strong style={{ color: r.type === 'INCOME' ? '#10b981' : '#ef4444', fontSize: '15px' }}>
                    {r.type === 'INCOME' ? '+' : '-'} {Number(amt).toLocaleString()}
                </Text>
            )
        },
        {
            title: 'Balance',
            dataIndex: 'runningBalance',
            key: 'balance',
            align: 'right',
            render: bal => <Text strong style={{ color: '#1e293b' }}>{Number(bal).toLocaleString()}</Text>
        }
    ];

    return (
        <div className="cashbook-container">
            {/* Header section with Buttons */}
            <div className="cashbook-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                        <Title level={2} style={{ marginBottom: 0 }}>Cashbook</Title>
                        <Tag color="geekblue" style={{ borderRadius: '4px', padding: '0 8px' }}>
                            Gross Balance: Rs. {(summary?.netBalance || 0).toLocaleString()}
                        </Tag>
                    </div>
                    <Text type="secondary">Financial accounts and daily transaction logs</Text>
                </div>
                <Space size="middle">
                    <Button 
                        type="primary" 
                        size="large" 
                        icon={<PlusOutlined />} 
                        onClick={() => setIsIncomeModalOpen(true)}
                        className="btn-cash-in"
                    >
                        Cash In
                    </Button>
                    <Button 
                        type="primary" 
                        size="large" 
                        icon={<MinusOutlined />} 
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="btn-cash-out"
                    >
                        Cash Out
                    </Button>
                </Space>
            </div>

            {/* Summary Cards Section */}
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                <Col xs={24} md={8}>
                    <Card className="summary-card income">
                        <Space align="center" size="middle">
                            <div className="icon-wrapper income">
                                <PlusOutlined />
                            </div>
                            <div>
                                <Text type="secondary" className="card-label">Cash In</Text>
                                <div className="card-value">Rs. {(summary?.totalIncome || 0).toLocaleString()}</div>
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="summary-card expense">
                        <Space align="center" size="middle">
                            <div className="icon-wrapper expense">
                                <MinusOutlined />
                            </div>
                            <div>
                                <Text type="secondary" className="card-label">Cash Out</Text>
                                <div className="card-value">Rs. {(summary?.totalExpenses || 0).toLocaleString()}</div>
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="summary-card balance">
                        <Space align="center" size="middle">
                            <div className="icon-wrapper balance">
                                <SwapOutlined />
                            </div>
                            <div>
                                <Text type="secondary" className="card-label">Net Balance</Text>
                                <div className="card-value">
                                    Rs. {(summary?.netBalance || 0).toLocaleString()}
                                </div>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>

            {/* Filter & Search Bar */}
            <Card className="filter-card">
                <Row gutter={16} align="middle">
                    <Col xs={24} md={12}>
                        <Input 
                            placeholder="Search by details, category or amount..." 
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
                            size="large"
                            className="search-input"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </Col>
                    <Col xs={24} md={8}>
                        <DatePicker.RangePicker 
                            size="large" 
                            style={{ width: '100%' }}
                            onChange={dates => {
                                setDateRange(dates || [null, null]);
                                fetchData(dates ? dates[0] : null, dates ? dates[1] : null);
                            }}
                        />
                    </Col>
                    <Col xs={24} md={4}>
                        <Button 
                            block 
                            size="large" 
                            icon={<FilterOutlined />}
                            onClick={() => fetchData()}
                        >
                            Reset
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Transactions Table */}
            <Card className="table-card" bodyStyle={{ padding: 0 }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: '16px' }}>Showing {filteredTransactions.length} entries</Text>
                    <Space size="small">
                        <Button icon={<CalendarOutlined />}>Monthly View</Button>
                        <Button icon={<InfoCircleOutlined />}>Daily Logs</Button>
                    </Space>
                </div>
                <Table 
                    rowSelection={{ type: 'checkbox' }}
                    dataSource={filteredTransactions} 
                    columns={columns} 
                    loading={loading} 
                    rowKey="id" 
                    pagination={{ pageSize: 15 }}
                    locale={{ emptyText: <Empty description="No transactions found for the selected period." /> }}
                />
            </Card>

            {/* Modals for Cash In / Out */}
            <Modal
                title={<span style={{ color: '#10b981' }}><PlusOutlined /> Add Cash In (Income)</span>}
                open={isIncomeModalOpen}
                onCancel={() => setIsIncomeModalOpen(false)}
                footer={null}
                centered
                className="transaction-modal"
            >
                <Form form={form} layout="vertical" onFinish={v => handleAddTransaction(v, 'INCOME')} initialValues={{ paymentMode: 'Cash' }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="amount" label="Amount (Rs)" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} size="large" prefix="Rs." placeholder="0.00" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true }]}>
                                <Select size="large">
                                    <Option value="Cash">Cash</Option>
                                    <Option value="Bank">Bank Transfer</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                        <Select placeholder="Select Income Category" size="large">
                            <Option value="Sale">Sale (Manual)</Option>
                            <Option value="Investment">Investment</Option>
                            <Option value="Refund">Refund</Option>
                            <Option value="Other">Other</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="description" label="Details / Remark" rules={[{ required: true }]}>
                        <Input.TextArea rows={3} placeholder="What is this income for?" />
                    </Form.Item>
                    <Form.Item name="date" label="Date & Time" initialValue={null}>
                        <Input type="datetime-local" size="large" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large" className="btn-save-income">
                        Save Income
                    </Button>
                </Form>
            </Modal>

            <Modal
                title={<span style={{ color: '#ef4444' }}><MinusOutlined /> Add Cash Out (Expense)</span>}
                open={isExpenseModalOpen}
                onCancel={() => setIsExpenseModalOpen(false)}
                footer={null}
                centered
                className="transaction-modal"
            >
                <Form form={form} layout="vertical" onFinish={v => handleAddTransaction(v, 'EXPENSE')} initialValues={{ paymentMode: 'Cash' }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="amount" label="Amount (Rs)" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} size="large" prefix="Rs." placeholder="0.00" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true }]}>
                                <Select size="large">
                                    <Option value="Cash">Cash</Option>
                                    <Option value="Bank">Bank Transfer</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                        <Select placeholder="Select Expense Category" size="large">
                            <Option value="Raw Materials">Ingredients / Raw Materials</Option>
                            <Option value="Utilities">Bills (Electricity/Water)</Option>
                            <Option value="Salaries">Worker Salaries</Option>
                            <Option value="Rent">Shop Rent</Option>
                            <Option value="Marketing">Marketing / Ads</Option>
                            <Option value="Repairs">Repairs & Maintenance</Option>
                            <Option value="Other">Other</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="description" label="Details / Remark" rules={[{ required: true }]}>
                        <Input.TextArea rows={3} placeholder="What was this expense for?" />
                    </Form.Item>
                    <Form.Item name="date" label="Date & Time" initialValue={null}>
                        <Input type="datetime-local" size="large" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large" className="btn-save-expense">
                        Save Expense
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default Cashbook;
