import React, { useEffect, useState } from 'react';
import { Tabs, List, Button, Card, Typography, Space, message, Row, Col, Input, Modal, Tag, Select, Table, Form, DatePicker, Skeleton, Spin, Divider, Badge, Radio } from 'antd';
import { MailOutlined, SendOutlined, SettingOutlined, CheckCircleOutlined, CloseCircleOutlined, AppstoreAddOutlined, OrderedListOutlined, HistoryOutlined, NotificationOutlined, ScheduleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { Search, TextArea } = Input;
const { TabPane } = Tabs;

const Notifications = () => {
    const [templates, setTemplates] = useState([]);
    const [logs, setLogs] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Refresh flags
    const [refreshTemplates, setRefreshTemplates] = useState(0);
    const [refreshLogs, setRefreshLogs] = useState(0);

    const loadCoreData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const [templRes, logsRes, custRes] = await Promise.all([
                axios.get('http://localhost:5000/api/notifications/templates', config),
                axios.get('http://localhost:5000/api/notifications/logs', config),
                axios.get('http://localhost:5000/api/customers', config)
            ]);
            
            setTemplates(templRes.data);
            setLogs(logsRes.data);
            setCustomers(custRes.data);
        } catch (error) {
            console.error('Failed to load core notification data', error);
            message.error('Failed to load core notification data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCoreData();
    }, [refreshTemplates, refreshLogs]);

    return (
        <div style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 32, marginTop: 16 }}>
                <Title level={2} style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <MailOutlined style={{ color: '#096dd9' }} /> Notification Dashboard
                </Title>
                <Text type="secondary" style={{ fontSize: 16 }}>
                    Manage automated emails, bulk reminders, and template designs.
                </Text>
            </div>

            <Tabs 
                defaultActiveKey="marketing" 
                size="large"
                type="card"
                items={[
                    {
                        key: 'marketing',
                        label: <span><NotificationOutlined /> Marketing & Campaigns</span>,
                        children: <MarketingTab templates={templates} customers={customers} />
                    },
                    {
                        key: 'templates',
                        label: <span><SettingOutlined /> Template Manager</span>,
                        children: <TemplatesTab templates={templates} onUpdated={() => setRefreshTemplates(prev => prev + 1)} loading={loading} />
                    }
                ]}
            />
        </div>
    );
};

// =========================================================
// MARKETING & CAMPAIGNS TAB
// =========================================================
const MarketingTab = ({ templates, customers }) => {
    const [form] = Form.useForm();
    const [sending, setSending] = useState(false);
    const [targetType, setTargetType] = useState('ALL');

    const handleTemplateSelect = (templateId) => {
        const tmpl = templates.find(t => t.id === templateId);
        if (tmpl) {
            form.setFieldsValue({ subject: tmpl.subject, body: tmpl.body });
        }
    };

    const handleSend = async (values) => {
        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/notifications/marketing/send', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(res.data.message);
            form.resetFields();
            setTargetType('ALL');
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.error || 'Failed to dispatch marketing campaign.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{ marginTop: 24 }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Title level={4} style={{ margin: 0 }}>Design & Dispatch Audience Campaign</Title>
                    <Text type="secondary">Send immediate broadcast emails or selective offers to your customers.</Text>
                </Col>
            </Row>
            
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card style={{ borderRadius: 0, border: '2px solid #1f2937', boxShadow: '4px 4px 0px #1f2937' }}>
                        <Form form={form} layout="vertical" onFinish={handleSend} initialValues={{ targetType: 'ALL' }}>
                            <Form.Item label={<Text strong>Target Audience</Text>} name="targetType">
                                <Radio.Group onChange={(e) => setTargetType(e.target.value)} buttonStyle="solid">
                                    <Radio.Button value="ALL">All Customers</Radio.Button>
                                    <Radio.Button value="SELECTED">Selected Customers</Radio.Button>
                                </Radio.Group>
                            </Form.Item>

                            {targetType === 'SELECTED' && (
                                <Form.Item label="Select Customers" name="customerIds" rules={[{ required: true, message: 'Please select at least one customer' }]}>
                                    <Select mode="multiple" placeholder="Select specific customers to target..." style={{ width: '100%' }} filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                        options={customers.map(c => ({ label: `${c.name} (${c.email})`, value: c.id }))} />
                                </Form.Item>
                            )}

                            <Form.Item label="Load Content from Existing Template (Optional)">
                                <Select placeholder="Choose an existing template" onChange={handleTemplateSelect} allowClear>
                                    {templates.map(t => (
                                        <Select.Option key={t.id} value={t.id}>{t.templateName || t.type} — {t.subject}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item label={<Text strong>Email Subject</Text>} name="subject" rules={[{ required: true }]}>
                                <Input size="large" style={{ borderRadius: 0, border: '1px solid #111' }} placeholder="e.g. 🔥 Exclusive Buy 1 Get 1 Offer for You!" />
                            </Form.Item>

                            <Form.Item label={<Text strong>Email Body (HTML Supported)</Text>} name="body" rules={[{ required: true }]}>
                                <TextArea rows={12} style={{ borderRadius: 0, border: '1px solid #111', fontFamily: 'monospace' }} placeholder="<p>Hi {customer_name},</p><p>We are offering...</p>" />
                            </Form.Item>

                            <Button type="primary" htmlType="submit" size="large" style={{ background: '#e11d48', borderColor: '#e11d48', borderRadius: 0, width: '100%', height: '50px', fontWeight: 'bold', fontSize: '16px' }} loading={sending}>
                                {targetType === 'ALL' ? '🚨 BROADCAST TO ALL CUSTOMERS' : 'SEND TO SELECTED'}
                            </Button>
                        </Form>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card style={{ background: '#f8fafc', borderRadius: 0, border: '1px dashed #94a3b8' }}>
                        <Title level={5}>Dynamic Variables</Title>
                        <Paragraph type="secondary" style={{ fontSize: 13 }}>
                            You can personalize your campaign by including variables wrapped in brackets. They will be auto-replaced before sending.
                        </Paragraph>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <Tag color="magenta" style={{ marginRight: 8 }}>{'{customer_name}'}</Tag>
                                <Text type="secondary" style={{ fontSize: 12 }}>Outputs full name (e.g. John Doe)</Text>
                            </div>
                            <div>
                                <Tag color="magenta" style={{ marginRight: 8 }}>{'{name}'}</Tag>
                                <Text type="secondary" style={{ fontSize: 12 }}>Outputs first name only (e.g. John)</Text>
                            </div>
                        </div>

                        <Divider style={{ margin: '16px 0' }} />
                        <Title level={5}>Tips for Campaigns</Title>
                        <ul style={{ paddingLeft: '20px', color: '#64748b', fontSize: '13px' }}>
                            <li style={{ marginBottom: '8px' }}>Use HTML tags like &lt;strong&gt;, &lt;br/&gt;, and &lt;a href=""&gt; to format your text.</li>
                            <li style={{ marginBottom: '8px' }}>Double check your layout before sending to All!</li>
                            <li>These emails are processed in the background to avoid blocking your dashboard.</li>
                        </ul>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};


// =========================================================
// BULK REMINDERS & AUTOMATION TAB
// =========================================================
// REMOVED BulkTab as requested


// =========================================================
// TEMPLATES MANAGER TAB
// =========================================================
const TemplatesTab = ({ templates, onUpdated, loading }) => {
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    const openEdit = (tmpl) => {
        setEditingTemplate(tmpl);
        setEditModalOpen(true);
    };

    return (
        <div style={{ marginTop: 24 }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col><Title level={4}>Email Templates</Title></Col>
                <Col><Button type="primary" onClick={() => setCreateModalOpen(true)}>Create Template</Button></Col>
            </Row>

            <Spin spinning={loading}>
                <Row gutter={[16, 16]}>
                    {templates
                        .filter(t => t.type !== 'READY')
                        .filter(t => !t.subject?.includes('Your Cake is Ready!') && !t.body?.includes('Your Cake is Ready!'))
                        .map(t => (
                        <Col span={12} key={t.id}>
                            <Card 
                                title={<Text strong>{t.templateName || t.type}</Text>}
                                extra={<Button type="link" onClick={() => openEdit(t)}>Edit</Button>}
                                style={{ height: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }}
                            >
                                <div style={{ marginBottom: 12 }}>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Subject Line:</Text>
                                    <Text strong>{t.subject}</Text>
                                </div>
                                <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, maxHeight: 150, overflowY: 'auto' }}>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>HTML Body Preview:</Text>
                                    <div dangerouslySetInnerHTML={{ __html: t.body }} style={{ fontSize: 14 }} />
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Spin>

            <EditTemplateModal 
                open={editModalOpen}
                template={editingTemplate}
                onClose={() => { setEditModalOpen(false); setEditingTemplate(null); }}
                onSuccess={onUpdated}
            />

            <CreateTemplateModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={onUpdated}
            />
        </div>
    );
};

const EditTemplateModal = ({ open, template, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && template) {
            form.setFieldsValue({ subject: template.subject, body: template.body });
        }
    }, [open, template, form]);

    const handleSave = async (values) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/notifications/templates/${template.id}`, values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Template saved');
            onSuccess();
            onClose();
        } catch (error) {
            message.error('Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title={`Edit Template: ${template?.templateName || template?.type}`} open={open} onCancel={onClose} onOk={() => form.submit()} confirmLoading={saving} width={700}>
            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Form.Item label="Subject Line" name="subject" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Email Body (HTML Supported)" name="body" rules={[{ required: true }]}>
                    <TextArea rows={10} style={{ fontFamily: 'monospace' }} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

const CreateTemplateModal = ({ open, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);

    const handleSave = async (values) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/notifications/templates`, values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Template created');
            form.resetFields();
            onSuccess();
            onClose();
        } catch (error) {
            message.error('Failed to create template');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal 
            title="Create New Template" 
            open={open} 
            onCancel={onClose} 
            onOk={() => form.submit()} 
            confirmLoading={saving} 
            width={850}
            okText="Save Template"
        >
            <Row gutter={24}>
                <Col span={15}>
                    <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ type: 'CUSTOM_CAMPAIGN' }}>
                        <Form.Item 
                            label={<Text strong>Template Display Name</Text>} 
                            name="templateName" 
                            rules={[{ required: true }]} 
                            tooltip="Internal name to help you identify this in the list."
                        >
                            <Input placeholder="e.g. Festival Season B1G1 Promo" />
                        </Form.Item>

                        <Form.Item 
                            label={<Text strong>System Trigger Type</Text>} 
                            name="type" 
                            rules={[{ required: true }]} 
                            tooltip="Which action in the system should send this email?"
                        >
                            <Select 
                                placeholder="Select when this email should be sent"
                                options={[
                                    { label: '🔔 Automatic: Advance Payment Required (COD/Bulk)', value: 'ADVANCE_REQUIRED' },
                                    { label: '💳 Automatic: Full Payment Required (Online Orders)', value: 'FULL_PAYMENT_REQUIRED' },
                                    { label: '⚠️ Automatic: Generic Payment Reminder', value: 'PAYMENT_REMINDER' },
                                    { label: '✏️ Automatic: Quick Last chance to edit (2 days before)', value: 'QUICK_REMINDER' },
                                    { label: '✅ Action: When Order is Confirmed (Admin/Automated)', value: 'ORDER_CONFIRMED' },
                                    { label: '🚚 Action: When Order is Delivered', value: 'DELIVERED' },
                                    { label: '❌ Action: When Order is Rejected/Cancelled', value: 'ORDER_REJECTED' },
                                    { label: '🚫 Action: When Payment Slip is Rejected', value: 'PAYMENT_SLIP_REJECTED' },
                                    { label: '💰 Action: Payment Slip Received', value: 'BANK_SLIP_RECEIVED' },
                                    { label: '💳 Action: Payment Approved by Admin', value: 'PAYMENT_CONFIRMED' },
                                    { divider: true },
                                    { label: '📣 Marketing: Custom/One-off Campaign', value: 'CUSTOM_CAMPAIGN' }
                                ]}
                            />
                        </Form.Item>

                        <Form.Item label={<Text strong>Email Subject Line</Text>} name="subject" rules={[{ required: true }]}>
                            <Input placeholder="e.g. 🍰 Your KaviCakes Order is now READY!" />
                        </Form.Item>

                        <Form.Item label={<Text strong>Email Body (HTML)</Text>} name="body" rules={[{ required: true }]}>
                            <TextArea 
                                rows={10} 
                                style={{ fontFamily: 'monospace', fontSize: '13px' }} 
                                placeholder="<h1>Hi {customer_name}!</h1><p>Your order #{order_id} is ready for pick-up!</p>" 
                            />
                        </Form.Item>
                    </Form>
                </Col>
                
                <Col span={9}>
                    <div style={{ background: '#f8f9fa', padding: 20, borderRadius: 12, height: '100%', border: '1px solid #e9ecef' }}>
                        <Title level={5}>💡 How to customize</Title>
                        <Paragraph style={{ fontSize: 13 }}>
                            You can use special <b>{'{words}'}</b> that the system will automatically replace with real data:
                        </Paragraph>

                        <ul style={{ paddingLeft: 20, fontSize: 12 }}>
                            <li><Text code>{'{customer_name}'}</Text> - Name of the customer</li>
                            <li><Text code>{'{order_id}'}</Text> - The Order ID number</li>
                            <li><Text code>{'{delivery_date}'}</Text> - Date of delivery</li>
                            <li><Text code>{'{total_amount}'}</Text> - The total price (Rs.)</li>
                            <li><Text code>{'{advance_amount}'}</Text> - Amount paid so far</li>
                            <li><Text code>{'{balance_amount}'}</Text> - Remaining payment</li>
                        </ul>

                        <Divider />
                        
                        <Title level={5}>🎨 Pro Tip</Title>
                        <Paragraph style={{ fontSize: 12 }}>
                            We support HTML! Use tags like <code>&lt;b&gt;</code> for bold, <code>&lt;h1&gt;</code> for headings, and <code>&lt;p&gt;</code> for paragraphs.
                        </Paragraph>
                    </div>
                </Col>
            </Row>
        </Modal>
    );
};

export default Notifications;
