import React, { useState, useEffect, useRef } from 'react';
import { 
    Typography, Card, Row, Col, DatePicker, Button, 
    Table, Space, Spin, Empty, Divider, List, Avatar, Tag
} from 'antd';
import { 
    DownloadOutlined, 
    ShoppingOutlined,
    UserOutlined,
    TrophyOutlined
} from '@ant-design/icons';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const Reports = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const reportRef = useRef();

    // Theme Colors
    const colors = {
        primary: '#be185d', // Primary Theme Pink
        standard: '#fce7f3', // Very Soft Pink
        custom: '#f472b6',   // Medium Pink
        bulk: '#be185d',     // Primary Theme Pink
        online: '#1e3a8a',   // Dark Blue
        cod: '#7e22ce',      // Purple
        cancelled: '#db2777'  // Pink/Magenta


    };

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async (dateObj) => {
        const date = dateObj || selectedDate;
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const res = await axios.get(`http://localhost:5000/api/reports/sales-revenue`, {
                params: {
                    startDate: date.format('YYYY-MM-DD'),
                    endDate: date.format('YYYY-MM-DD')
                },
                ...config
            });
            setReportData(res.data);
        } catch (error) {
            console.error('Error fetching report:', error);
            setError(error.response?.data?.error || 'Failed to connect to the reporting server.');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (val) => {
        if (val) {
            setSelectedDate(val);
            fetchReport(val);
        }
    };

    const handleDownloadPDF = async () => {
        const element = reportRef.current;
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // If report is longer than one page, we split it
        let heightLeft = pdfHeight;
        let position = 0;
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`KaviCakes_Sales_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    };

    if (loading && !reportData) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;

    const pieData = reportData ? [
        { name: 'Online bank payment', value: reportData.paymentStats.ONLINE, color: colors.online },
        { name: 'Cash on delivery', value: reportData.paymentStats.COD, color: colors.cod },
        { name: 'Cancelled', value: reportData.paymentStats.CANCELLED, color: colors.cancelled },
    ] : [];

    return (
        <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '24px' }}>
            {/* Header / Controls */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Space direction="vertical" size={0}>
                    <Title level={4} style={{ margin: 0 }}>Sales Reporting System</Title>
                    <Text type="secondary">Generate and download official PDF reports</Text>
                </Space>
                <Space>
                    <DatePicker 
                        value={selectedDate} 
                        onChange={handleDateChange} 
                        picker="month" 
                        size="large"
                        style={{ borderRadius: '8px' }}
                    />
                    <Button 
                        type="primary" 
                        icon={<DownloadOutlined />} 
                        onClick={handleDownloadPDF}
                        disabled={!reportData}
                        style={{ background: colors.primary, borderColor: colors.primary }}
                    >
                        Download PDF report
                    </Button>
                </Space>
            </div>

            {error && (
                <div style={{ margin: '20px 0' }}>
                    <Card style={{ borderLeft: `5px solid ${colors.primary}` }}>
                        <Space>
                            <Text type="danger" strong>System Connection Error:</Text>
                            <Text>{error}</Text>
                            <Button size="small" onClick={() => fetchReport()}>Retry Connection</Button>
                        </Space>
                    </Card>
                </div>
            )}

            {reportData ? (
                <div ref={reportRef} style={{ 
                    background: '#fff', 
                    width: '800px', 
                    margin: '0 auto',
                    boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                    position: 'relative'
                }}>
                    {/* PAGE 1 */}
                    <div style={{ padding: '60px', minHeight: '1120px', position: 'relative' }}>
                        {/* Report Top Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: colors.primary }}></div>
                                <Text strong style={{ fontSize: '18px', color: '#333' }}>KaviCakes</Text>
                            </div>
                            <Text strong style={{ color: '#555' }}>Period: {selectedDate.format('MMMM YYYY')}</Text>
                        </div>

                        <Divider style={{ borderColor: colors.primary, borderWidth: '2px', margin: '0 0 60px 0' }} />

                        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                            <Title level={1} style={{ fontSize: '56px', fontWeight: 800, color: '#4b5563', margin: 0, letterSpacing: '2px' }}>
                                SALES REPORT
                            </Title>
                        </div>

                        <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: 1.6, marginBottom: '40px', maxWidth: '600px' }}>
                            This report outlines the sales plan and forecast for the upcoming year, focusing on revenue
                            targets, sales performance expectations, and growth drivers based on historical data and
                            market trends.
                        </p>

                        <Title level={4} style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '16px', letterSpacing: '1px', marginBottom: '20px' }}>
                            SALES SUMMARY
                        </Title>

                        {/* Summary Box */}
                        <div style={{ background: colors.primary, borderRadius: '12px', padding: '35px', display: 'flex', justifyContent: 'space-between', marginBottom: '60px' }}>
                            <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.3)', padding: '0 15px' }}>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Total revenue:</Text>
                                <div style={{ color: '#fff', fontSize: '20px', fontWeight: 800, marginTop: '5px' }}>
                                    Rs.{reportData.summary.totalRevenue.toLocaleString()}
                                </div>
                            </div>
                            <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.3)', padding: '0 15px' }}>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Finalized Sales:</Text>
                                <div style={{ color: '#fff', fontSize: '20px', fontWeight: 800, marginTop: '5px' }}>
                                    Rs.{reportData.summary.collectedRevenue ? reportData.summary.collectedRevenue.toLocaleString() : '0'}
                                </div>
                            </div>
                            <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.3)', padding: '0 15px' }}>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Orders Count:</Text>
                                <div style={{ color: '#fff', fontSize: '20px', fontWeight: 800, marginTop: '5px' }}>
                                    {reportData.summary.totalOrders}
                                </div>
                            </div>
                            <div style={{ flex: 1, padding: '0 15px' }}>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Annual Peak:</Text>
                                <div style={{ color: '#fff', fontSize: '20px', fontWeight: 800, marginTop: '5px', textTransform: 'lowercase' }}>
                                    {reportData.summary.peakMonth}
                                </div>
                            </div>
                        </div>

                        <Title level={4} style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '16px', letterSpacing: '1px', marginBottom: '40px' }}>
                            PREVIOUS REVENUE
                        </Title>

                        <div style={{ height: '350px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportData.trends} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="month" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#9ca3af', fontSize: 12 }} 
                                        interval={0}
                                        tickFormatter={(val) => val.substring(0, 3).toLowerCase()}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        tickFormatter={(val) => val > 0 ? `${val/1000}k` : '0Rs'}
                                    />
                                    <Tooltip />
                                    <Legend 
                                        verticalAlign="top" 
                                        align="right" 
                                        wrapperStyle={{ top: -20, right: 0 }}
                                        formatter={(value) => <span style={{ color: '#4b5563', fontSize: '11px' }}>{`revenue by ${value.toLowerCase()} orders`}</span>}
                                    />
                                    <Bar dataKey="STANDARD" name="standard" fill={colors.standard} radius={[2, 2, 0, 0]} barSize={12} />
                                    <Bar dataKey="CUSTOM" name="customised" fill={colors.custom} radius={[2, 2, 0, 0]} barSize={12} />
                                    <Bar dataKey="BULK" name="bulk" fill={colors.bulk} radius={[2, 2, 0, 0]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Footer Page 1 */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: colors.primary, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 60px' }}>
                            <Text style={{ color: '#fff', fontSize: '11px' }}>www.reallygreatsite.com</Text>
                            <Text style={{ color: '#fff', fontSize: '11px' }}>hello@reallygreatsite.com</Text>
                        </div>
                    </div>

                    {/* PAGE 2 */}
                    <div style={{ padding: '60px', minHeight: '1120px', position: 'relative', borderTop: '2px dashed #f0f0f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: colors.primary }}></div>
                                <Text strong style={{ fontSize: '18px', color: '#333' }}>Kavicakes</Text>
                            </div>
                            <Text strong style={{ color: '#555' }}>Period 2026</Text>
                        </div>
                        <Divider style={{ borderColor: colors.primary, borderWidth: '2px', margin: '0 0 60px 0' }} />

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Legend 
                                        layout="vertical" 
                                        verticalAlign="middle" 
                                        align="left"
                                        formatter={(value, entry) => (
                                            <span style={{ color: '#374151', fontWeight: 600, fontSize: '14px' }}>
                                                {value}
                                            </span>
                                        )}
                                    />
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ marginTop: '60px' }}>
                            <Title level={4} style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '16px', letterSpacing: '1px', marginBottom: '30px' }}>
                                BEST SELLING PRODUCT :
                            </Title>
                            <List
                                dataSource={reportData.bestSellers}
                                renderItem={(item) => (
                                    <List.Item style={{ border: 'none', padding: '8px 0' }}>
                                        <List.Item.Meta
                                            avatar={<Avatar src={item.image} shape="square" size={48} />}
                                            title={<Text strong style={{ fontSize: '15px' }}>{item.name}</Text>}
                                            description={<Text type="secondary">{item.count} units sold recently</Text>}
                                        />
                                    </List.Item>
                                )}
                            />
                        </div>

                        <div style={{ marginTop: '60px' }}>
                            <Title level={4} style={{ color: '#6b7280', textTransform: 'uppercase', fontSize: '16px', letterSpacing: '1px', marginBottom: '30px' }}>
                                LOYALTY CUSTOMERS:
                            </Title>
                            <Row gutter={[24, 24]}>
                                {reportData.loyaltyCustomers.map((cust, idx) => (
                                    <Col span={12} key={idx}>
                                        <Card size="small" style={{ borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                                            <Space align="start">
                                                <TrophyOutlined style={{ color: '#fbbf24', fontSize: '20px' }} />
                                                <div>
                                                    <Text strong style={{ display: 'block' }}>{cust.name}</Text>
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>{cust.email}</Text>
                                                    <div style={{ marginTop: '4px' }}>
                                                        <Tag color="gold" style={{ fontWeight: 700 }}>{cust.loyaltyPoints} PTS</Tag>
                                                    </div>
                                                </div>
                                            </Space>
                                        </Card>
                                    </Col>
                                ))}
                                {reportData.loyaltyCustomers.length === 0 && (
                                    <Col span={24}><Text type="secondary">No customers with over 2000 loyalty points found.</Text></Col>
                                )}
                            </Row>
                        </div>

                        {/* Footer Page 2 */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: colors.primary, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 60px' }}>
                            <Text style={{ color: '#fff', fontSize: '11px' }}>www.reallygreatsite.com</Text>
                            <Text style={{ color: '#fff', fontSize: '11px' }}>hello@reallygreatsite.com</Text>
                        </div>
                    </div>
                </div>
            ) : (
                <Card style={{ borderRadius: '16px', textAlign: 'center', padding: '50px' }}>
                    <Empty description={loading ? "Generating detailed sales analysis..." : "Collecting real-time sales data..."} />
                </Card>
            )}

            <style>{`
                .ant-btn-primary:hover { background: #6b0606 !important; border-color: #6b0606 !important; }
                @media print {
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default Reports;
