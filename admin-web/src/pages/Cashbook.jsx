import React, { useEffect, useState } from 'react';
import { Tabs, Table, Button, Card, Typography, Space, Row, Col, Statistic, Tag, Modal, Form, Input, Select, DatePicker, message } from 'antd';
import { DollarCircleOutlined, SwapOutlined, RiseOutlined, FallOutlined, PlusOutlined, DownloadOutlined, BarChartOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

const Cashbook = () => {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [trxRes, sumRes] = await Promise.all([
                axios.get('http://localhost:5000/api/transactions', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/transactions/summary', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setTransactions(trxRes.data);
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

    const handleAddTransaction = async (values) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/transactions', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Transaction added successfully');
            setIsModalOpen(false);
            form.resetFields();
            fetchData();
        } catch (error) {
            message.error('Failed to add transaction');
        }
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            render: d => new Date(d).toLocaleDateString(),
            sorter: (a, b) => new Date(a.date) - new Date(b.date)
        },
        {
            title: 'Description',
            dataIndex: 'description',
            render: (text, r) => (
                <div>
                    <Text strong>{text}</Text>
                    {r.isOrder && <Tag color="blue" style={{ marginLeft: 8 }}>Order</Tag>}
                </div>
            )
        },
        {
            title: 'Category',
            dataIndex: 'category',
            render: c => <Tag>{c}</Tag>
        },
        {
            title: 'Type',
            dataIndex: 'type',
            render: t => <Tag color={t === 'INCOME' ? 'success' : 'error'}>{t}</Tag>,
            filters: [{ text: 'Income', value: 'INCOME' }, { text: 'Expense', value: 'EXPENSE' }],
            onFilter: (value, record) => record.type === value
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            render: (amt, r) => <Text style={{ color: r.type === 'INCOME' ? '#3f8600' : '#cf1322' }}>{r.type === 'INCOME' ? '+' : '-'} Rs.{Number(amt).toLocaleString()}</Text>,
            align: 'right'
        }
    ];

    const OverviewTab = () => {
        const data = [
            { name: 'Income', value: summary?.totalIncome || 0 },
            { name: 'Expense', value: summary?.totalExpenses || 0 },
        ];
        const COLORS = ['#00C49F', '#FF8042'];

        return (
            <div>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Total Income"
                                value={summary?.totalIncome}
                                precision={2}
                                valueStyle={{ color: '#3f8600' }}
                                prefix={<RiseOutlined />}
                                suffix="Rs"
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Total Expenses"
                                value={summary?.totalExpenses}
                                precision={2}
                                valueStyle={{ color: '#cf1322' }}
                                prefix={<FallOutlined />}
                                suffix="Rs"
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Net Profit"
                                value={summary?.netProfit}
                                precision={2}
                                valueStyle={{ color: summary?.netProfit >= 0 ? '#3f8600' : '#cf1322' }}
                                prefix={<DollarCircleOutlined />}
                                suffix="Rs"
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Card title="Income vs Expense">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#8884d8">
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title="Transaction Volume">
                            <div style={{ textAlign: 'center', marginTop: 50 }}>
                                <Statistic title="Total Orders" value={summary?.totalOrders} prefix={<SwapOutlined />} />
                                <Text type="secondary">Processed in this period</Text>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    };

    const ReportsTab = () => {
        const [reportPeriod, setReportPeriod] = useState([null, null]);
        const [reportData, setReportData] = useState(null);

        const fetchReport = async (start, end) => {
            if (!start || !end) return;
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/transactions/summary', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        startDate: start.format('YYYY-MM-DD'),
                        endDate: end.format('YYYY-MM-DD')
                    }
                });
                setReportData(res.data);
            } catch (error) {
                console.error(error);
                message.error('Failed to update report');
            }
        };

        useEffect(() => {
            // Initial load (default to current month logic from backend if params empty, 
            // but we can also set default date range in picker)
            // Or just use the global summary if no range selected? 
            // Let's force a fetch for current month to start.
            const now = new Date();
            // Just triggering load with backend default behaviors
            const loadDefault = async () => {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/transactions/summary', { headers: { Authorization: `Bearer ${token}` } });
                setReportData(res.data);
            };
            loadDefault();
        }, []);

        if (!reportData) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Report...</div>;

        const breakdownColumns = [
            { title: 'Category', dataIndex: 'category', key: 'category' },
            { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', render: val => `Rs.${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }
        ];

        return (
            <div style={{ padding: '20px 40px', background: '#fff' }}>
                {/* Controls */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, alignItems: 'center', gap: 10 }}>
                    <Text type="secondary">Select Period:</Text>
                    <DatePicker.RangePicker
                        onChange={(dates) => {
                            if (dates) {
                                fetchReport(dates[0], dates[1]);
                            } else {
                                // Reload default (current month)
                                const now = new Date();
                                const loadDefault = async () => {
                                    const token = localStorage.getItem('token');
                                    const res = await axios.get('http://localhost:5000/api/transactions/summary', { headers: { Authorization: `Bearer ${token}` } });
                                    setReportData(res.data);
                                };
                                loadDefault();
                            }
                        }}
                        style={{ width: 300 }}
                    />
                </div>

                {/* Report Header */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Title level={2} style={{ marginBottom: 0 }}>Monthly Financial Summary</Title>
                    <Title level={3} style={{ marginTop: 5, color: '#E91E63' }}>Kavicakes</Title>

                    <Text style={{ fontSize: 13, color: '#666', display: 'block', marginTop: 15 }}>
                        Report for Period: <span style={{ fontWeight: 600 }}>{reportData.period}</span>
                    </Text>
                    <div style={{ maxWidth: 600, margin: '15px auto', fontSize: 13, color: '#888', fontStyle: 'italic' }}>
                        This report provides a clear overview of the income, expenses, and profitability of Kavicakes for the selected period.
                    </div>
                </div>

                {/* Highlights */}
                <div style={{ marginBottom: 30 }}>
                    <Title level={4}><BarChartOutlined /> Financial Highlights</Title>
                    <Row gutter={40} style={{ marginTop: 15 }}>
                        <Col span={8}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: 5 }}>
                                <Text>Total Income:</Text>
                                <Text strong>Rs. {reportData.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                            </div>
                        </Col>
                        <Col span={8}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: 5 }}>
                                <Text>Total Expenses:</Text>
                                <Text strong>Rs. {reportData.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                            </div>
                        </Col>
                        <Col span={8}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: 5 }}>
                                <Text>Net Profit:</Text>
                                <Text strong style={{ color: reportData.netProfit >= 0 ? '#3f8600' : '#cf1322' }}>
                                    Rs. {reportData.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </Text>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* Breakdown Sections */}
                <Row gutter={60}>
                    <Col span={12}>
                        <Title level={5} style={{ marginBottom: 15 }}><DollarCircleOutlined /> Income Breakdown</Title>
                        <Table
                            dataSource={reportData.incomeBreakdown}
                            columns={breakdownColumns}
                            pagination={false}
                            size="small"
                            rowKey="category"
                            bordered={false}
                            style={{ border: 'none' }}
                        />
                    </Col>
                    <Col span={12}>
                        <Title level={5} style={{ marginBottom: 15 }}><FallOutlined /> Expense Breakdown</Title>
                        <Table
                            dataSource={reportData.expenseBreakdown}
                            columns={breakdownColumns}
                            pagination={false}
                            size="small"
                            rowKey="category"
                            bordered={false}
                        />
                    </Col>
                </Row>

                {/* Footer Download */}
                <div style={{ marginTop: 50, textAlign: 'right' }}>
                    <Button type="primary" icon={<DownloadOutlined />} size="large" style={{ background: '#E91E63', borderColor: '#E91E63', padding: '0 40px' }}>
                        Download
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <Title level={2}>Cashbook</Title>
                <Text type="secondary">Manage your bakery's finances and track income & expenses</Text>
            </div>

            <Tabs defaultActiveKey="1" items={[
                { key: '1', label: 'Financial Overview', children: <OverviewTab /> },
                {
                    key: '2',
                    label: 'Transactions',
                    children: (
                        <div>
                            <div style={{ textAlign: 'right', marginBottom: 16 }}>
                                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} style={{ background: '#E91E63', borderColor: '#E91E63' }}>
                                    Add Transaction
                                </Button>
                            </div>
                            <Table dataSource={transactions} columns={columns} loading={loading} rowKey="id" />
                        </div>
                    )
                },
                { key: '3', label: 'Reports', children: <ReportsTab /> }
            ]} />

            <Modal
                title="Add New Transaction"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleAddTransaction}>
                    <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                        <Select placeholder="Select Type">
                            <Option value="INCOME">Income</Option>
                            <Option value="EXPENSE">Expense</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                        <Select placeholder="Select Category">
                            <Option value="Rent">Rent</Option>
                            <Option value="Utilities">Utilities</Option>
                            <Option value="Salaries">Salaries</Option>
                            <Option value="Ingredients">Ingredients</Option>
                            <Option value="Manual_Income">Manual Income</Option>
                            <Option value="Other">Other</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="amount" label="Amount (Rs)" rules={[{ required: true }]}>
                        <Input type="number" prefix="Rs." />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item name="date" label="Date" initialValue={null}>
                        <Input type="date" />
                        {/* Simple date input for now, AntD DatePicker needs moment/dayjs setup sometimes */}
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block style={{ background: '#E91E63', borderColor: '#E91E63' }}>
                        Add Transaction
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default Cashbook;
