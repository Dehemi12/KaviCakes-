import React, { useState, useEffect } from 'react';
import { 
    Tabs, Card, DatePicker, Select, Button, Table, 
    Typography, Row, Col, Statistic, Space, Tag, 
    Divider, message, Empty, Spin
} from 'antd';
import { 
    BarChartOutlined, LineChartOutlined, PieChartOutlined, 
    DollarOutlined, HistoryOutlined, FallOutlined, 
    RiseOutlined, DownloadOutlined, FilterOutlined,
    CalendarOutlined, ShoppingCartOutlined, UserOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import './Reports.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;

const Reports = () => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('1');
    const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs()]);
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState(null);

    const fetchData = async (reportType) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [start, end] = dateRange;
            const params = {
                startDate: start?.format('YYYY-MM-DD'),
                endDate: end?.format('YYYY-MM-DD')
            };

            let endpoint = '';
            switch (reportType) {
                case '1': endpoint = 'sales-revenue'; break;
                case '3': endpoint = 'transaction-history'; break;
                case '4': endpoint = 'monthly-summary'; break;
                case '5': endpoint = 'order-type-revenue'; break;
                case '6': endpoint = 'top-selling'; break;
                case '7': endpoint = 'outstanding-payments'; break;
                default: endpoint = 'sales-revenue';
            }

            const res = await axios.get(`http://localhost:5000/api/reports/${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });

            setReportData(res.data);
            setSummary(null);
        } catch (error) {
            console.error(error);
            message.error('Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab, dateRange]);

    const renderSalesRevenueReport = () => {
        const columns = [
            { title: 'Date / Period', dataIndex: 'date', key: 'date' },
            { title: 'Orders', dataIndex: 'orders', key: 'orders', align: 'center' },
            { 
                title: 'Revenue', 
                dataIndex: 'revenue', 
                key: 'revenue', 
                align: 'right',
                render: val => `Rs. ${Number(val).toLocaleString()}`
            }
        ];
        return <Table dataSource={reportData} columns={columns} pagination={false} loading={loading} rowKey="date" />;
    };



    const renderTransactionHistoryReport = () => {
        const columns = [
            { title: 'TRX ID', dataIndex: 'transactionId', key: 'id' },
            { title: 'Order ID', dataIndex: 'orderId', key: 'orderId', render: id => id ? `#${id}` : '-' },
            { title: 'Type', dataIndex: 'type', key: 'type' },
            { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', render: v => `Rs. ${Number(v).toLocaleString()}` },
            { title: 'Method', dataIndex: 'method', key: 'method', render: m => <Tag color="blue">{m}</Tag> },
            { title: 'Date', dataIndex: 'date', key: 'date', render: d => dayjs(d).format('MMM DD, YYYY HH:mm') }
        ];
        return <Table dataSource={reportData} columns={columns} loading={loading} rowKey="transactionId" />;
    };

    const renderMonthlySummaryReport = () => {
        const columns = [
            { title: 'Month', dataIndex: 'month', key: 'month' },
            { title: 'Orders', dataIndex: 'orders', key: 'orders', align: 'center' },
            { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', align: 'right', render: v => `Rs. ${Number(v).toLocaleString()}` },
            { title: 'Payments Received', dataIndex: 'paymentsReceived', key: 'payments', align: 'right', render: v => `Rs. ${Number(v).toLocaleString()}` },
            { title: 'Outstanding', dataIndex: 'outstanding', key: 'outstanding', align: 'right', render: v => <Text type="danger">Rs. ${Number(v).toLocaleString()}</Text> }
        ];
        return <Table dataSource={reportData} columns={columns} pagination={false} loading={loading} rowKey="month" />;
    };

    const renderOrderTypeReport = () => {
        const columns = [
            { title: 'Segment', dataIndex: 'type', key: 'type', render: t => <Text strong>{t}</Text> },
            { title: 'Total Orders', dataIndex: 'orders', key: 'orders', align: 'center' },
            { 
                title: 'Total Revenue', 
                dataIndex: 'revenue', 
                key: 'revenue', 
                align: 'right', 
                render: v => <Text strong style={{ color: '#E91E63' }}>Rs. {Number(v).toLocaleString()}</Text>
            }
        ];

        return (
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Row gutter={[16, 16]}>
                    {reportData.map(item => (
                        <Col span={8} key={item.type}>
                            <Card 
                                size="small" 
                                className="segment-card" 
                                style={{ borderTop: `4px solid ${item.color || '#E91E63'}` }}
                            >
                                <div className="segment-content">
                                    <div className="segment-info">
                                        <Text type="secondary">{item.type}</Text>
                                        <Title level={4} style={{ margin: '4px 0' }}>
                                            Rs. {Number(item.revenue || 0).toLocaleString()}
                                        </Title>
                                        <Tag color="blue">{item.orders || 0} Orders</Tag>
                                    </div>
                                    <div className="segment-icon" style={{ background: `${item.color}15`, color: item.color }}>
                                        <ShoppingCartOutlined style={{ fontSize: '24px' }} />
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
                <Table 
                    dataSource={reportData} 
                    columns={columns} 
                    pagination={false} 
                    loading={loading} 
                    rowKey="type"
                    className="report-table"
                />
            </Space>
        );
    };

    const renderTopSellingReport = () => {
        const columns = [
            { title: 'Cake Flavor / Name', dataIndex: 'cake', key: 'cake' },
            { title: 'Units Sold', dataIndex: 'orders', key: 'orders', align: 'center' },
            { title: 'Revenue Contribution', dataIndex: 'revenue', key: 'revenue', align: 'right', render: v => `Rs. ${Number(v).toLocaleString()}` }
        ];
        return <Table dataSource={reportData} columns={columns} loading={loading} rowKey="cake" />;
    };

    const renderOutstandingReport = () => {
        const columns = [
            { title: 'Order ID', dataIndex: 'orderId', key: 'id', render: id => `#${id}` },
            { title: 'Customer', dataIndex: 'customer', key: 'customer' },
            { title: 'Pending Balance', dataIndex: 'balance', key: 'balance', align: 'right', render: v => <Text strong type="danger">Rs. ${Number(v).toLocaleString()}</Text> },
            { title: 'Delivery Date', dataIndex: 'deliveryDate', key: 'delivery', render: d => dayjs(d).format('MMM DD, YYYY') }
        ];
        return <Table dataSource={reportData} columns={columns} loading={loading} rowKey="orderId" />;
    };



    return (
        <div className="reports-container">
            <div className="reports-header">
                <Title level={2}>Financial Reports</Title>
                <Space>
                    <RangePicker 
                        value={dateRange} 
                        onChange={setDateRange} 
                        size="large"
                        style={{ width: 300 }}
                    />
                    <Button type="primary" size="large" icon={<DownloadOutlined />}>Export PDF</Button>
                </Space>
            </div>

            <Card className="reports-tabs-card">
                <Tabs 
                    activeKey={activeTab} 
                    onChange={setActiveTab}
                    tabPosition="left"
                    className="report-tabs"
                >
                    <TabPane tab={<span><BarChartOutlined /> Sales Revenue</span>} key="1">
                        {renderSalesRevenueReport()}
                    </TabPane>

                    <TabPane tab={<span><HistoryOutlined /> Transaction History</span>} key="3">
                        {renderTransactionHistoryReport()}
                    </TabPane>
                    <TabPane tab={<span><LineChartOutlined /> Monthly Trends</span>} key="4">
                        {renderMonthlySummaryReport()}
                    </TabPane>
                    <TabPane tab={<span><ShoppingCartOutlined /> Sales by Type</span>} key="5">
                        {renderOrderTypeReport()}
                    </TabPane>
                    <TabPane tab={<span><PieChartOutlined /> Top Selling Cakes</span>} key="6">
                        {renderTopSellingReport()}
                    </TabPane>
                    <TabPane tab={<span><FallOutlined /> Outstanding Payments</span>} key="7">
                        {renderOutstandingReport()}
                    </TabPane>

                </Tabs>
            </Card>
        </div>
    );
};

export default Reports;
