import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, Button, Tabs, Tag, Switch, Space, Typography, Modal, Form,
    Input, Select, InputNumber, message, Popconfirm, Divider, Badge,
    Tooltip, Empty, Row, Col, List
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, DragOutlined,
    DownOutlined, UpOutlined, EyeOutlined, SettingOutlined,
    AppstoreOutlined, PlusCircleOutlined, MinusCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

const API = 'http://localhost:5000/api';

// Field type display helpers
const FIELD_TYPES = [
    { value: 'dropdown', label: 'Dropdown', color: 'blue' },
    { value: 'text', label: 'Text Input', color: 'green' },
    { value: 'textarea', label: 'Text Area', color: 'cyan' },
    { value: 'file', label: 'File Upload', color: 'orange' },
    { value: 'number', label: 'Number', color: 'purple' },
];

const SECTIONS = [
    { value: 'basic_details', label: 'Basic Details' },
    { value: 'design_details', label: 'Design Details' },
    { value: 'delivery_recipient', label: 'Delivery / Recipient' },
    { value: 'bulk_specific', label: 'Bulk Specific' },
];

const sectionColor = { basic_details: '#1890ff', design_details: '#eb2f96', delivery_recipient: '#52c41a', bulk_specific: '#fa8c16' };

const getTypeColor = (type) => FIELD_TYPES.find(t => t.value === type)?.color || 'default';

// ─────────────────────────────────────────────
// Dropdown Option Editor (for dropdown fields)
// ─────────────────────────────────────────────
const OptionEditor = ({ options = [], onChange }) => {
    const [uploading, setUploading] = useState(null);

    const addOption = () => onChange([...options, { name: '', price: 0, imageUrl: '' }]);
    const removeOption = (i) => onChange(options.filter((_, idx) => idx !== i));
    const update = (i, key, val) => {
        const copy = [...options];
        copy[i] = { ...copy[i], [key]: val };
        onChange(copy);
    };

    const handleUpload = async (i, file) => {
        if (!file) return;
        setUploading(i);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API}/upload/site`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}` 
                }
            });
            update(i, 'imageUrl', res.data.url);
            message.success('Image uploaded');
        } catch (err) {
            message.error('Upload failed');
        } finally {
            setUploading(null);
        }
    };

    return (
        <div>
            {options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, padding: '12px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Input
                            placeholder="Option name (e.g. Cupcake)"
                            value={opt.name}
                            onChange={e => update(i, 'name', e.target.value)}
                            style={{ flex: 2 }}
                        />
                        <InputNumber
                            prefix="+"
                            placeholder="Extra Price"
                            value={opt.price}
                            onChange={v => update(i, 'price', v || 0)}
                            style={{ flex: 1 }}
                            min={0}
                        />
                        <Tooltip title="Remove Option">
                            <Button
                                size="small"
                                danger
                                icon={<MinusCircleOutlined />}
                                onClick={() => removeOption(i)}
                            />
                        </Tooltip>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Input 
                            placeholder="Image URL" 
                            value={opt.imageUrl} 
                            onChange={e => update(i, 'imageUrl', e.target.value)} 
                            prefix={<EyeOutlined style={{ color: 'rgba(0,0,0,0.25)' }}/>}
                            style={{ flex: 1 }}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            id={`opt-img-${i}`}
                            hidden
                            onChange={e => handleUpload(i, e.target.files[0])}
                        />
                        <Button 
                            icon={<PlusOutlined />} 
                            loading={uploading === i}
                            onClick={() => document.getElementById(`opt-img-${i}`).click()}
                        >
                            Upload
                        </Button>
                        {opt.imageUrl && (
                            <Tooltip title="Preview Image">
                                <Button 
                                    icon={<EyeOutlined />} 
                                    onClick={() => Modal.info({
                                        title: 'Option Image Preview',
                                        content: <img src={opt.imageUrl} alt="preview" style={{ width: '100%' }} />,
                                        maskClosable: true,
                                        width: 400
                                    })} 
                                />
                            </Tooltip>
                        )}
                    </div>
                </div>
            ))}
            <Button
                type="dashed"
                size="small"
                icon={<PlusCircleOutlined />}
                onClick={addOption}
                style={{ width: '100%' }}
            >
                Add Option
            </Button>
        </div>
    );
};

// ─────────────────────────────────────────────
// Field Edit Modal
// ─────────────────────────────────────────────
const FieldModal = ({ open, field, formType, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fieldType, setFieldType] = useState('text');
    const [options, setOptions] = useState([]);
    const isEdit = !!field;

    useEffect(() => {
        if (open) {
            if (field) {
                form.setFieldsValue({ ...field, options: undefined, config: undefined });
                setFieldType(field.fieldType);
                setOptions(field.options || []);
            } else {
                form.resetFields();
                form.setFieldsValue({ active: true, required: false, displayOrder: 99, section: 'basic_details' });
                setFieldType('text');
                setOptions([]);
            }
        }
    }, [open, field, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            const token = localStorage.getItem('token');
            const payload = { ...values, formType, options, config: values.config || {} };

            if (isEdit) {
                await axios.put(`${API}/form-fields/${field.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success('Field updated');
            } else {
                await axios.post(`${API}/form-fields`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success('Field created');
            }
            onSuccess();
            onClose();
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err.response?.data?.error || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={isEdit ? `Edit Field — ${field?.label}` : 'Add New Field'}
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText={isEdit ? 'Save Changes' : 'Create Field'}
            width={640}
            destroyOnClose
        >
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item name="label" label="Field Label" rules={[{ required: true }]}>
                            <Input 
                                placeholder="e.g. Cake Flavor" 
                                onChange={(e) => {
                                    if (!isEdit && !form.isFieldTouched('fieldId') && e.target.value) {
                                        const formatted = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
                                        form.setFieldsValue({ fieldId: formatted });
                                    }
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="fieldId" label={<><Text style={{ marginRight: 8 }}>Field ID</Text><Tag color="orange" style={{ fontSize: 10 }}>Auto-generated</Tag></>} rules={[{ required: true, pattern: /^[a-z0-9_]+$/, message: 'Lowercase letters, numbers, underscores only' }]}>
                            <Input placeholder="e.g. cake_flavor" disabled={true} style={{ background: '#f5f5f5' }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={12}>
                    <Col span={10}>
                        <Form.Item name="fieldType" label="Field Type" rules={[{ required: true }]}>
                            <Select onChange={v => { setFieldType(v); setOptions([]); }}>
                                {FIELD_TYPES.map(t => (
                                    <Option key={t.value} value={t.value}>
                                        <Tag color={t.color} style={{ marginRight: 4 }}>{t.label}</Tag>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={10}>
                        <Form.Item name="section" label="Section">
                            <Select>
                                {SECTIONS.map(s => <Option key={s.value} value={s.value}>{s.label}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={4}>
                        <Form.Item name="required" label="Required" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        {/* Hidden input for displayOrder so it saves default correctly */}
                        <Form.Item name="displayOrder" hidden>
                            <InputNumber min={1} />
                        </Form.Item>
                    </Col>
                </Row>

                {/* Dropdown-specific options */}
                {fieldType === 'dropdown' && (
                    <Form.Item label="Dropdown Options">
                        <OptionEditor options={options} onChange={setOptions} />
                    </Form.Item>
                )}

                {/* Text/Textarea config */}
                {(fieldType === 'text' || fieldType === 'textarea') && (
                    <Row gutter={12}>
                        <Col span={16}>
                            <Form.Item name={['config', 'placeholder']} label="Placeholder Text">
                                <Input placeholder="e.g. Enter your cake message..." />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name={['config', 'maxLength']} label="Max Characters">
                                <InputNumber style={{ width: '100%' }} min={1} placeholder="e.g. 200" />
                            </Form.Item>
                        </Col>
                    </Row>
                )}

                {/* Number config */}
                {fieldType === 'number' && (
                    <Row gutter={12}>
                        <Col span={8}>
                            <Form.Item name={['config', 'min']} label="Min Value">
                                <InputNumber style={{ width: '100%' }} placeholder="e.g. 50" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name={['config', 'max']} label="Max Value">
                                <InputNumber style={{ width: '100%' }} placeholder="e.g. 1000" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name={['config', 'bulkThreshold']} label="Bulk Threshold">
                                <InputNumber style={{ width: '100%' }} placeholder="e.g. 100" />
                            </Form.Item>
                        </Col>
                    </Row>
                )}

                {/* File config */}
                {fieldType === 'file' && (
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name={['config', 'maxSizeMB']} label="Max File Size (MB)">
                                <InputNumber style={{ width: '100%' }} min={1} max={20} placeholder="e.g. 5" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name={['config', 'accept']} label="Accepted Types">
                                <Input placeholder="e.g. image/*" />
                            </Form.Item>
                        </Col>
                    </Row>
                )}

                <Form.Item name="active" label="Active" valuePropName="checked">
                    <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

// ─────────────────────────────────────────────
// Single Field Card
// ─────────────────────────────────────────────
const FieldCard = ({ field, onEdit, onDelete, onToggle, onMoveUp, onMoveDown, isFirst, isLast }) => {
    const typeInfo = FIELD_TYPES.find(t => t.value === field.fieldType);
    const section = SECTIONS.find(s => s.value === field.section);

    return (
        <Card
            size="small"
            style={{
                marginBottom: 8,
                border: `1px solid ${field.active ? '#f0f0f0' : '#ffd8d8'}`,
                background: field.active ? '#fff' : '#fff8f8',
                opacity: field.active ? 1 : 0.8,
                transition: 'all 0.2s'
            }}
            bodyStyle={{ padding: '10px 16px' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                {/* Left: reorder + info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    {/* Order buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button size="small" icon={<UpOutlined />} disabled={isFirst} onClick={() => onMoveUp(field)} style={{ height: 18, width: 18, padding: 0, fontSize: 10 }} />
                        <Button size="small" icon={<DownOutlined />} disabled={isLast} onClick={() => onMoveDown(field)} style={{ height: 18, width: 18, padding: 0, fontSize: 10 }} />
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <Text strong style={{ fontSize: 13 }}>{field.label}</Text>
                            <Tag color={getTypeColor(field.fieldType)} style={{ fontSize: 10, borderRadius: 8 }}>
                                {typeInfo?.label || field.fieldType}
                            </Tag>
                            {field.required && <Tag color="red" style={{ fontSize: 10, borderRadius: 8 }}>Required</Tag>}
                            {section && (
                                <Tag style={{ fontSize: 10, borderRadius: 8, color: sectionColor[field.section], borderColor: sectionColor[field.section], background: `${sectionColor[field.section]}11` }}>
                                    {section.label}
                                </Tag>
                            )}
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>ID: {field.fieldId}</Text>
                        {field.fieldType === 'dropdown' && field.options?.length > 0 && (
                            <div style={{ marginTop: 4 }}>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    Options: {field.options.map(o => `${o.name}${o.price > 0 ? ` +Rs.${o.price}` : ''}`).join(' · ')}
                                </Text>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: actions */}
                <Space size="small">
                    <Tooltip title={field.active ? 'Disable field' : 'Enable field'}>
                        <Switch
                            size="small"
                            checked={field.active}
                            onChange={(v) => onToggle(field, v)}
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(field)} />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this field?"
                        description="This cannot be undone."
                        onConfirm={() => onDelete(field)}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Delete">
                            <Button size="small" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            </div>
        </Card>
    );
};

// ─────────────────────────────────────────────
// Section Group
// ─────────────────────────────────────────────
const SectionGroup = ({ sectionKey, label, fields, ...cardProps }) => {
    if (fields.length === 0) return null;
    return (
        <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 4, height: 16, background: sectionColor[sectionKey], borderRadius: 2 }} />
                <Text strong style={{ fontSize: 13, color: sectionColor[sectionKey] }}>{label}</Text>
                <Badge count={fields.length} style={{ backgroundColor: sectionColor[sectionKey] }} />
            </div>
            {fields.map((f, i) => (
                <FieldCard
                    key={f.id}
                    field={f}
                    isFirst={i === 0}
                    isLast={i === fields.length - 1}
                    {...cardProps}
                />
            ))}
        </div>
    );
};

// ─────────────────────────────────────────────
// Form Preview Modal
// ─────────────────────────────────────────────
const PreviewModal = ({ open, fields, formType, onClose }) => {
    const activeFields = fields.filter(f => f.active);
    return (
        <Modal
            title={`Preview — ${formType === 'CUSTOM' ? 'Custom Cake' : 'Bulk'} Order Form`}
            open={open}
            onCancel={onClose}
            footer={[<Button key="close" onClick={onClose}>Close</Button>]}
            width={540}
        >
            <div style={{ padding: '8px 0' }}>
                {activeFields.length === 0 ? (
                    <Empty description="No active fields" />
                ) : (
                    activeFields.map(f => (
                        <div key={f.id} style={{ marginBottom: 16 }}>
                            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>
                                {f.label}
                                {f.required && <span style={{ color: '#f5222d', marginLeft: 4 }}>*</span>}
                            </label>
                            {f.fieldType === 'dropdown' && (
                                <Select style={{ width: '100%' }} placeholder={`Select ${f.label}`} disabled>
                                    {(f.options || []).map((o, i) => (
                                        <Option key={i} value={o.name}>{o.name}{o.price > 0 ? ` (+Rs.${o.price})` : ''}</Option>
                                    ))}
                                </Select>
                            )}
                            {f.fieldType === 'text' && (
                                <Input placeholder={f.config?.placeholder || `Enter ${f.label}...`} disabled maxLength={f.config?.maxLength} />
                            )}
                            {f.fieldType === 'textarea' && (
                                <Input.TextArea rows={3} placeholder={f.config?.placeholder || `Enter ${f.label}...`} disabled maxLength={f.config?.maxLength} />
                            )}
                            {f.fieldType === 'number' && (
                                <InputNumber style={{ width: '100%' }} min={f.config?.min} max={f.config?.max} placeholder={`Min: ${f.config?.min || 1}`} disabled />
                            )}
                            {f.fieldType === 'file' && (
                                <Button disabled icon={<PlusOutlined />} style={{ width: '100%' }}>
                                    Upload {f.label} {f.config?.accept ? `(${f.config.accept})` : ''}
                                </Button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
};

// ─────────────────────────────────────────────
// Tab content for ONE form type
// ─────────────────────────────────────────────
const FormTypeTab = ({ formType }) => {
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState({ open: false, field: null });
    const [previewOpen, setPreviewOpen] = useState(false);

    const fetchFields = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/form-fields/${formType}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFields(res.data);
        } catch {
            message.error('Failed to load fields');
        } finally {
            setLoading(false);
        }
    }, [formType]);

    useEffect(() => { fetchFields(); }, [fetchFields]);

    const handleToggle = async (field, value) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API}/form-fields/${field.id}`, { ...field, active: value }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFields(prev => prev.map(f => f.id === field.id ? { ...f, active: value } : f));
        } catch {
            message.error('Failed to update field');
        }
    };

    const handleDelete = async (field) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API}/form-fields/${field.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Field deleted');
            fetchFields();
        } catch {
            message.error('Failed to delete field');
        }
    };

    const handleMoveUp = async (field) => {
        const idx = fields.findIndex(f => f.id === field.id);
        if (idx <= 0) return;
        const newFields = [...fields];
        [newFields[idx - 1], newFields[idx]] = [newFields[idx], newFields[idx - 1]];
        setFields(newFields);
        await axiosBulkReorder(newFields);
    };

    const handleMoveDown = async (field) => {
        const idx = fields.findIndex(f => f.id === field.id);
        if (idx >= fields.length - 1) return;
        const newFields = [...fields];
        [newFields[idx], newFields[idx + 1]] = [newFields[idx + 1], newFields[idx]];
        setFields(newFields);
        await axiosBulkReorder(newFields);
    };

    const axiosBulkReorder = async (orderedFields) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API}/form-fields/reorder`, { orderedIds: orderedFields.map(f => f.id) }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch {
            message.warning('Reorder save failed');
        }
    };

    // Group by section
    const grouped = SECTIONS.reduce((acc, s) => {
        acc[s.value] = fields.filter(f => f.section === s.value);
        return acc;
    }, {});

    const totalActive = fields.filter(f => f.active).length;

    const handleReset = async () => {
        try {
            const token = localStorage.getItem('token');
            setLoading(true);
            const defaultFields = formType === 'CUSTOM' ? [
                { fieldId: 'flavor', label: 'Cake Flavor', fieldType: 'dropdown', required: true, options: [{ name: 'Chocolate', price: 0 }, { name: 'Vanilla', price: 0 }, { name: 'Red Velvet', price: 500 }] },
                { fieldId: 'message', label: 'Cake Message', fieldType: 'text', required: false, config: { placeholder: 'Happy Birthday...', maxLength: 50 } },
                { fieldId: 'reference_image', label: 'Reference Image', fieldType: 'file', required: false, config: { accept: 'image/*', maxSizeMB: 5 } }
            ] : [
                { fieldId: 'event_name', label: 'Event Name', fieldType: 'text', required: true, config: { placeholder: 'e.g. Annual Gathering' } },
                { fieldId: 'organization', label: 'Organization/Company Name', fieldType: 'text', required: true },
                { fieldId: 'qty_estimate', label: 'Quantity', fieldType: 'number', required: true, config: { min: 50 } },
                { fieldId: 'product_unit', label: 'Select Product Unit', fieldType: 'dropdown', required: true, options: [
                    { name: 'Cupcakes', price: 250, imageUrl: 'https://images.unsplash.com/photo-1599785209707-33b6a22f7907?auto=format&fit=crop&q=80&w=300' },
                    { name: 'Jar Cakes', price: 350, imageUrl: 'https://images.unsplash.com/photo-1563729768601-d6fa4805e9a1?auto=format&fit=crop&q=80&w=300' },
                    { name: 'Brownies', price: 200, imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=300' },
                    { name: 'Mini Wedding Cakes', price: 800, imageUrl: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&q=80&w=300' }
                ]},
                { fieldId: 'reference_image', label: 'Custom Reference Image (Optional)', fieldType: 'file', required: false, config: { accept: 'image/*' } },
                { fieldId: 'packaging_type', label: 'Packaging Design', fieldType: 'dropdown', required: true, options: [
                    { name: 'Standard Box', price: 0, imageUrl: 'https://placehold.co/300x200/f8fafc/64748b?text=Standard+Box' },
                    { name: 'Premium Ribbon Box', price: 50, imageUrl: 'https://placehold.co/300x200/fce7f3/be185d?text=Premium+Ribbon' },
                    { name: 'Custom Printed Box', price: 150, imageUrl: 'https://placehold.co/300x200/e0e7ff/4338ca?text=Custom+Print' }
                ]},
                { fieldId: 'packaging_design_file', label: 'Upload Package Design Details (Optional)', fieldType: 'file', required: false, config: { accept: 'image/*' } },
                { fieldId: 'special_instructions', label: 'Special Instructions', fieldType: 'textarea', required: false, config: { placeholder: 'Any specific allergy requirements or themes?' } }
            ];

            // In a real app, you might have a dedicated reset endpoint. 
            // Here we'll just delete all and recreate for simplicity in this demo.
            for (const f of fields) {
                await axios.delete(`${API}/form-fields/${f.id}`, { headers: { Authorization: `Bearer ${token}` } });
            }
            for (const def of defaultFields) {
                await axios.post(`${API}/form-fields`, { ...def, formType }, { headers: { Authorization: `Bearer ${token}` } });
            }
            message.success('Reset to defaults');
            fetchFields();
        } catch {
            message.error('Reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ padding: '40px', textAlign: 'center', background: '#fafafa', borderRadius: '16px', border: '1px dashed #d9d9d9', marginBottom: 24, display: fields.length === 0 ? 'block' : 'none' }}>
                <SettingOutlined style={{ fontSize: 40, color: '#bfbfbf', marginBottom: 16 }} />
                <Title level={4}>Start with Pre-configured Default Fields</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                    Your beautiful new product page is empty. Let's auto-generate the perfect curated setup for you so you can just edit it later!
                </Text>
                <Button type="primary" size="large" onClick={handleReset} style={{ background: '#be185d', borderColor: '#be185d', borderRadius: 8 }}>
                    Generate Default {formType} Fields
                </Button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Space>
                    <Text type="secondary">{fields.length} fields total · </Text>
                    <Text style={{ color: '#52c41a' }}>{totalActive} active</Text>
                </Space>
                <Space>
                    {fields.length > 0 && (
                        <Popconfirm
                            title="Reset to defaults?"
                            description="This will delete all current fields and restore standard ones."
                            onConfirm={handleReset}
                            okText="Yes, Reset"
                            okButtonProps={{ danger: true }}
                        >
                            <Button danger size="small">Reset to Defaults</Button>
                        </Popconfirm>
                    )}
                    <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>
                        Preview Form
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setEditModal({ open: true, field: null })}
                        style={{ background: '#be185d', borderColor: '#be185d' }}
                    >
                        Add Field
                    </Button>
                </Space>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>Loading fields...</div>
            ) : fields.length === 0 ? (
                <Empty
                    description={`No fields configured for ${formType === 'CUSTOM' ? 'Custom' : 'Bulk'} Order Form`}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setEditModal({ open: true, field: null })}
                    >
                        Add First Field
                    </Button>
                </Empty>
            ) : (
                SECTIONS.map(s => (
                    <SectionGroup
                        key={s.value}
                        sectionKey={s.value}
                        label={s.label}
                        fields={grouped[s.value] || []}
                        onEdit={(f) => setEditModal({ open: true, field: f })}
                        onDelete={handleDelete}
                        onToggle={handleToggle}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                    />
                ))
            )}

            <FieldModal
                open={editModal.open}
                field={editModal.field}
                formType={formType}
                onClose={() => setEditModal({ open: false, field: null })}
                onSuccess={fetchFields}
            />

            <PreviewModal
                open={previewOpen}
                fields={fields}
                formType={formType}
                onClose={() => setPreviewOpen(false)}
            />
        </div>
    );
};

// ─────────────────────────────────────────────
// Main FieldManager component
// ─────────────────────────────────────────────
const FieldManager = ({ restrictedType, hideTabs }) => {
    const tabItems = [
        {
            key: 'CUSTOM',
            label: (
                <Space>
                    <AppstoreOutlined />
                    Custom Order Fields
                </Space>
            ),
            children: <FormTypeTab formType="CUSTOM" />
        },
        {
            key: 'BULK',
            label: (
                <Space>
                    <SettingOutlined />
                    Bulk Order Fields
                </Space>
            ),
            children: <FormTypeTab formType="BULK" />
        }
    ];

    if (hideTabs && restrictedType) {
        return <FormTypeTab formType={restrictedType} />;
    }

    return (
        <Card
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 4, height: 20, background: '#be185d', borderRadius: 2 }} />
                    <div>
                        <Title level={4} style={{ margin: 0 }}>Order Form Field Manager</Title>
                        <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                            Manage fields that appear in customer-facing Custom & Bulk order forms
                        </Text>
                    </div>
                </div>
            }
            style={{ marginTop: 24 }}
            bodyStyle={{ paddingTop: 0 }}
        >
            <Tabs
                defaultActiveKey="CUSTOM"
                items={tabItems}
                size="large"
                style={{ marginTop: 4 }}
            />
        </Card>
    );
};

export default FieldManager;
