import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Modal, Button, List, Typography, Card, Tag, Row, Col, Select, Form, Input, DatePicker, message, Segmented, Space } from 'antd';
import { PlusOutlined, ClockCircleOutlined, CalendarOutlined, PushpinOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

const Schedule = () => {
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [viewMode, setViewMode] = useState('List'); // Month, List
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const fetchEvents = async (start, end) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/schedule', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    startDate: start.format('YYYY-MM-DD'),
                    endDate: end.format('YYYY-MM-DD')
                }
            });
            setEvents(res.data);
        } catch (error) {
            console.error(error);
            message.error('Failed to load schedule');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Load current month by default
        const start = dayjs().startOf('month');
        const end = dayjs().endOf('month');
        fetchEvents(start, end);
    }, []);

    const handleAddEvent = async (values) => {
        try {
            const token = localStorage.getItem('token');
            // Combine date and time if needed, or just use date
            // For simplicity, assuming start date includes time or we default to all day/specific time
            await axios.post('http://localhost:5000/api/schedule', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Event added successfully');
            setIsModalOpen(false);
            form.resetFields();
            // Refresh
            fetchEvents(dayjs().startOf('month'), dayjs().endOf('month'));
        } catch (error) {
            message.error('Failed to add event');
        }
    };

    // Calendar Cell Render
    const dateCellRender = (value) => {
        const listData = events.filter(event => dayjs(event.startTime).isSame(value, 'day'));
        return (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {listData.map((item) => (
                    <li key={item.id}>
                        <Badge status={item.type === 'ORDER_DELIVERY' ? 'processing' : 'warning'} text={item.title} />
                    </li>
                ))}
            </ul>
        );
    };

    // List View Render
    const renderListView = () => {
        // Group by Date
        const groupedEvents = events.reduce((acc, event) => {
            const dateStr = dayjs(event.startTime).format('YYYY-MM-DD');
            if (!acc[dateStr]) acc[dateStr] = [];
            acc[dateStr].push(event);
            return acc;
        }, {});

        const sortedDates = Object.keys(groupedEvents).sort();

        return (
            <div style={{ padding: 20 }}>
                {sortedDates.length === 0 && <div style={{ textAlign: 'center', padding: 50, color: '#999' }}>No events for this period</div>}

                {sortedDates.map(date => (
                    <div key={date} style={{ marginBottom: 30 }}>
                        <Text strong style={{ fontSize: 16, color: '#E91E63' }}>
                            {dayjs(date).format('dddd, MMM D')}
                        </Text>
                        <List
                            itemLayout="horizontal"
                            dataSource={groupedEvents[date]}
                            renderItem={(item) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={
                                            <div style={{
                                                width: 40, height: 40,
                                                background: item.type === 'ORDER_DELIVERY' ? '#e6f7ff' : '#fff7e6',
                                                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: item.type === 'ORDER_DELIVERY' ? '#1890ff' : '#fa8c16'
                                            }}>
                                                {item.type === 'ORDER_DELIVERY' ? <CalendarOutlined /> : <PushpinOutlined />}
                                            </div>
                                        }
                                        title={<Text strong>{item.title}</Text>}
                                        description={
                                            <div style={{ fontSize: 12 }}>
                                                {item.description && <div style={{ whiteSpace: 'pre-wrap', marginBottom: 4 }}>{item.description}</div>}
                                                <Space>
                                                    <Tag>{item.category || 'General'}</Tag>
                                                    <Text type="secondary"><ClockCircleOutlined /> {dayjs(item.startTime).format('HH:mm')}</Text>
                                                </Space>
                                            </div>
                                        }
                                    />
                                    <div>
                                        {item.type === 'ORDER_DELIVERY' && <Tag color="blue">{item.status}</Tag>}
                                    </div>
                                </List.Item>
                            )}
                        />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div style={{ padding: 0 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <Title level={2} style={{ marginBottom: 0 }}>Plan Schedule</Title>
                    <Text type="secondary">Manage your bakery's production schedule and events</Text>
                </div>
                <Button type="primary" size="large" icon={<PlusOutlined />}
                    onClick={() => setIsModalOpen(true)}
                    style={{ background: '#E91E63', borderColor: '#E91E63' }}
                >
                    Add Event
                </Button>
            </div>

            <Card bodyStyle={{ padding: 0 }}>
                {/* Toolbar */}
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        <Button onClick={() => {
                            const newDate = selectedDate.clone().subtract(1, 'month');
                            setSelectedDate(newDate);
                            fetchEvents(newDate.startOf('month'), newDate.endOf('month'));
                        }}>{'<'}</Button>
                        <Title level={4} style={{ margin: 0 }}>{selectedDate.format('MMMM YYYY')}</Title>
                        <Button onClick={() => {
                            const newDate = selectedDate.clone().add(1, 'month');
                            setSelectedDate(newDate);
                            fetchEvents(newDate.startOf('month'), newDate.endOf('month'));
                        }}>{'>'}</Button>
                    </div>

                    <Segmented
                        options={['Month', 'List']}
                        value={viewMode}
                        onChange={setViewMode}
                    />
                </div>

                {/* Content */}
                {viewMode === 'Month' ? (
                    <div style={{ padding: 20 }}>
                        <Calendar
                            value={selectedDate}
                            onSelect={(date) => {
                                setSelectedDate(date);
                                // Optional: switch to list view for that day or fetch details
                            }}
                            dateCellRender={dateCellRender}
                            mode="month"
                        />
                    </div>
                ) : (
                    renderListView()
                )}
            </Card>

            {/* Add Event Modal */}
            <Modal
                title="Add New Event"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleAddEvent}>
                    <Form.Item name="title" label="Event Title" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Wedding Cake Production" />
                    </Form.Item>
                    <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                        <Select>
                            <Option value="Production">Production</Option>
                            <Option value="Restocking">Restocking</Option>
                            <Option value="Maintenance">Maintenance</Option>
                            <Option value="Meeting">Meeting</Option>
                            <Option value="Other">Other</Option>
                        </Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="startTime" label="Start Date & Time" rules={[{ required: true }]}>
                                <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="endTime" label="End Date & Time">
                                <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block style={{ background: '#E91E63', borderColor: '#E91E63' }}>
                        Create Event
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default Schedule;
