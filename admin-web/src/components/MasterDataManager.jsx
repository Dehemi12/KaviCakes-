import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, InputNumber, message, Popconfirm, Typography, Tag, Divider, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DatabaseOutlined, DollarOutlined, ExperimentOutlined, FullscreenOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const MasterDataManager = () => {
    const [data, setData] = useState({ sizes: [], shapes: [], flavors: [], categories: [] });
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('category'); // 'category' | 'size' | 'flavor'
    const [editingItem, setEditingItem] = useState(null);
    const [form] = Form.useForm();

    const fetchMasterData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/cakes/master-data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (error) {
            console.error(error);
            message.error("Failed to load Master Data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMasterData();
    }, []);

    const handleAdd = (type) => {
        setModalType(type);
        setEditingItem(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (type, item) => {
        setModalType(type);
        setEditingItem(item);
        form.setFieldsValue({
            name: item.name || item.label,
            label: item.label,
            basePrice: item.basePrice,
            price: item.price
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const endpoint = modalType === 'category' ? 'categories' : modalType === 'size' ? 'sizes' : 'flavors';
            const payload = modalType === 'category' ? { name: values.name, basePrice: values.basePrice } : { label: values.label || values.name, price: values.price };

            if (editingItem) {
                await axios.put(`http://localhost:5000/api/cakes/${endpoint}/${editingItem.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} updated`);
            } else {
                await axios.post(`http://localhost:5000/api/cakes/${endpoint}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} added`);
            }
            setIsModalOpen(false);
            fetchMasterData();
        } catch (error) {
            console.error(error);
            message.error(`Operation failed`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (type, id) => {
        try {
            const token = localStorage.getItem('token');
            const endpoint = type === 'category' ? 'categories' : type === 'size' ? 'sizes' : 'flavors';
            await axios.delete(`http://localhost:5000/api/cakes/${endpoint}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted`);
            fetchMasterData();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.error || "Failed to delete");
        }
    };

    const columns = (type) => [
        {
            title: type === 'category' ? 'Category Name' : 'Label',
            dataIndex: type === 'category' ? 'name' : 'label',
            key: 'name',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: type === 'category' ? 'Base Price' : 'Extra Price',
            dataIndex: type === 'category' ? 'basePrice' : 'price',
            key: 'price',
            render: (val) => <Text type="success">Rs.{val?.toLocaleString()}</Text>
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(type, record)}>Edit</Button>
                    <Popconfirm
                        title={`Delete this ${type}?`}
                        description="This might affect existing products."
                        onConfirm={() => handleDelete(type, record.id)}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '4px' }}>
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                    <Card
                        title={<Space><DatabaseOutlined style={{ color: '#be185d' }} />Categories Management</Space>}
                        extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleAdd('category')} style={{ background: '#be185d', borderColor: '#be185d' }}>Add Category</Button>}
                        bodyStyle={{ padding: 0 }}
                    >
                        <Table
                            dataSource={data.categories}
                            columns={columns('category')}
                            rowKey="id"
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card
                        title={<Space><FullscreenOutlined style={{ color: '#0ea5e9' }} />Sizes Management</Space>}
                        extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleAdd('size')} style={{ background: '#0ea5e9', borderColor: '#0ea5e9' }}>Add Size</Button>}
                        bodyStyle={{ padding: 0 }}
                    >
                        <Table
                            dataSource={data.sizes}
                            columns={columns('size')}
                            rowKey="id"
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card
                        title={<Space><ExperimentOutlined style={{ color: '#10b981' }} />Flavors Management</Space>}
                        extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleAdd('flavor')} style={{ background: '#10b981', borderColor: '#10b981' }}>Add Flavor</Button>}
                        bodyStyle={{ padding: 0 }}
                    >
                        <Table
                            dataSource={data.flavors}
                            columns={columns('flavor')}
                            rowKey="id"
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>
            </Row>

            <Modal
                title={`${editingItem ? 'Edit' : 'Add'} ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={loading}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    {modalType === 'category' ? (
                        <>
                            <Form.Item name="name" label="Category Name" rules={[{ required: true }]}>
                                <Input placeholder="e.g. Wedding Cakes" />
                            </Form.Item>
                            <Form.Item name="basePrice" label="Base Price (Starting Price)" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={0} prefix="Rs." />
                            </Form.Item>
                        </>
                    ) : (
                        <>
                            <Form.Item name="label" label="Label" rules={[{ required: true }]}>
                                <Input placeholder={modalType === 'size' ? 'e.g. 1.5kg' : 'e.g. Chocolate Ganache'} />
                            </Form.Item>
                            <Form.Item 
                                name="price" 
                                label={modalType === 'size' ? "Size Multiplier / Weight (e.g. 1 or 1.5 or 2)" : "Extra Price (Modifier)"} 
                                rules={[{ required: true }]}
                                help={modalType === 'size' ? "This will multiply the category's base price (e.g. Base 1500 * Size 1.5 = 2250)" : ""}
                            >
                                <InputNumber 
                                    style={{ width: '100%' }} 
                                    min={0} 
                                    step={0.1}
                                    prefix={modalType === 'size' ? "x" : "Rs."} 
                                />
                            </Form.Item>
                        </>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default MasterDataManager;
