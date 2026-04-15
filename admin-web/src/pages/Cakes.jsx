import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Typography, Button, Input, Tag, message, Select, Space, Modal, Form, InputNumber, Tabs } from 'antd';
import { 
    PlusOutlined, EditOutlined, SearchOutlined, FilterOutlined, 
    AppstoreAddOutlined, DatabaseOutlined, SettingOutlined, FullscreenOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import AddCakeModal from '../components/AddCakeModal';
import FieldManager from '../components/FieldManager';
import MasterDataManager from '../components/MasterDataManager';


const { Title, Text } = Typography;
const { Meta } = Card;
const { Option } = Select;

const Cakes = () => {
    const [cakes, setCakes] = useState([]);
    const [category, setCategory] = useState({ id: 'All', name: 'All' });
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ sizeId: null, shapeId: null, flavorId: null });
    const [masterData, setMasterData] = useState({ sizes: [], shapes: [], flavors: [], categories: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCake, setEditingCake] = useState(null);

    // Category Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categoryForm] = Form.useForm();

    const fetchMasterData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/cakes/master-data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMasterData(res.data);
        } catch (error) {
            console.error(error);
            message.error("Failed to load Master Data");
        }
    };

    const fetchCakes = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = {
                search: searchTerm,
                categoryId: category.id !== 'All' ? category.id : undefined,
                sizeId: filters.sizeId,
                shapeId: filters.shapeId,
                flavorId: filters.flavorId
            };
            const res = await axios.get('http://localhost:5000/api/cakes', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setCakes(res.data);
        } catch (error) {
            console.error(error);
            message.error("Failed to load cakes");
        }
    };

    useEffect(() => {
        fetchMasterData();
    }, []);

    useEffect(() => {
        fetchCakes();
    }, [category, searchTerm, filters]); // Re-fetch when filters change

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleEditClick = (cake) => {
        setEditingCake(cake);
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        setEditingCake(null);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingCake(null);
    };

    // Category Handlers
    const handleAddCategoryClick = () => {
        setIsCategoryModalOpen(true);
    };

    const handleCreateCategory = async (values) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/cakes/categories', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Category created successfully');
            setIsCategoryModalOpen(false);
            categoryForm.resetFields();
            fetchMasterData(); // Refresh list
        } catch (error) {
            console.error(error);
            message.error('Failed to create category');
        }
    };

    // Combine 'All' with fetched categories
    const displayCategories = [{ id: 'All', name: 'All' }, ...(masterData.categories || [])];

    const tabItems = [
        {
            key: '1',
            label: <Space><DatabaseOutlined />Standard Product Inventory</Space>,
            children: (
                <>
                    {/* Filters & Search */}
                    <div style={{ background: '#fff', padding: 20, borderRadius: 8, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 15, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {displayCategories.map(cat => (
                                    <Tag.CheckableTag
                                        key={cat.id}
                                        checked={category.id === cat.id}
                                        onChange={() => setCategory(cat)}
                                        style={{ borderRadius: 20, padding: '5px 15px', border: '1px solid #eee', cursor: 'pointer' }}
                                    >
                                        {cat.name}
                                    </Tag.CheckableTag>
                                ))}
                            </div>
                            <Input
                                prefix={<SearchOutlined />}
                                placeholder="Search products..."
                                style={{ width: 250, borderRadius: 20 }}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                            <FilterOutlined style={{ color: '#888' }} />
                            <Select
                                placeholder="Filter by Size"
                                style={{ width: 150 }}
                                allowClear
                                onChange={(v) => handleFilterChange('sizeId', v)}
                            >
                                {masterData.sizes.map(s => <Option key={s.id} value={s.id}>{s.label}</Option>)}
                            </Select>
                            <Select
                                placeholder="Filter by Shape"
                                style={{ width: 150 }}
                                allowClear
                                onChange={(v) => handleFilterChange('shapeId', v)}
                            >
                                {masterData.shapes.map(s => <Option key={s.id} value={s.id}>{s.label}</Option>)}
                            </Select>
                            <Select
                                placeholder="Filter by Flavor"
                                style={{ width: 150 }}
                                allowClear
                                onChange={(v) => handleFilterChange('flavorId', v)}
                            >
                                {masterData.flavors.map(s => <Option key={s.id} value={s.id}>{s.label}</Option>)}
                            </Select>
                        </div>
                    </div>

                    <Row gutter={[24, 24]}>
                        {cakes.length > 0 ? cakes.map(cake => (
                            <Col xs={24} sm={12} lg={6} key={cake.id}>
                                <Card
                                    hoverable
                                    cover={<img alt={cake.name} src={cake.imageUrl || 'https://via.placeholder.com/300'} style={{ height: 200, objectFit: 'cover' }} />}
                                    actions={[
                                        <Button type="text" icon={<EditOutlined />} onClick={() => handleEditClick(cake)}>Edit</Button>,
                                        <Button
                                            type="primary"
                                            size="small"
                                            style={{ background: '#be185d', borderColor: '#be185d' }}
                                            onClick={() => navigate(`/cakes/${cake.id}`)}
                                        >
                                            View Details
                                        </Button>
                                    ]}
                                >
                                    <Meta
                                        title={<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span 
                                                style={{ 
                                                    fontWeight: 600, 
                                                    fontSize: '15px', 
                                                    lineHeight: '1.3',
                                                    height: '40px', 
                                                    overflow: 'hidden', 
                                                    display: '-webkit-box', 
                                                    WebkitLineClamp: 2, 
                                                    WebkitBoxOrient: 'vertical',
                                                    color: '#1f2937'
                                                }} 
                                                title={cake.name}
                                            >
                                                {cake.name}
                                            </span>
                                            <span style={{ color: '#be185d', fontWeight: 700, fontSize: '16px' }}>
                                                Rs.{(() => {
                                                    const v1kg = cake.variants?.find(v => v.size?.label === '1kg');
                                                    const price = v1kg ? v1kg.price : (cake.variants?.[0]?.price || cake.basePrice);
                                                    return price ? price.toLocaleString() : 'N/A';
                                                })()}
                                            </span>
                                        </div>}
                                        description={<div style={{ height: 40, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px', color: '#6b7280' }}>{cake.description}</div>}
                                    />
                                    <div style={{ marginTop: 10 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {cake.categoryName} • {cake.variants?.length || 0} Variant{cake.variants?.length !== 1 ? 's' : ''}
                                        </Text>
                                    </div>
                                </Card>
                            </Col>
                        )) : (
                            <Col span={24}>
                                <div style={{ textAlign: 'center', padding: 50 }}>
                                    <Text type="secondary">No products found.</Text>
                                </div>
                            </Col>
                        )}
                    </Row>
                </>
            )
        },
        {
            key: '2',
            label: <Space><SettingOutlined />Custom Order Configuration</Space>,
            children: (
                <Tabs 
                    type="card"
                    items={[
                        {
                            key: 'custom-fields',
                            label: 'Form Field Settings',
                            children: <FieldManager restrictedType="CUSTOM" hideTabs />
                        },
                        {
                            key: 'custom-master',
                            label: 'Custom Specs (Categories/Sizes/Flavors)',
                            children: (
                                <div style={{ marginTop: 20 }}>
                                    <MasterDataManager />
                                </div>
                            )
                        }
                    ]} 
                />
            )
        },
        {
            key: '3',
            label: <Space><FullscreenOutlined />Bulk Order Configurator</Space>,
            children: <FieldManager restrictedType="BULK" hideTabs />
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <Title level={2}>Product Management</Title>
                    <Text type="secondary">Manage your bakery catalog and custom forms</Text>
                </div>
                <Space>
                    <Button
                        icon={<AppstoreAddOutlined />}
                        onClick={handleAddCategoryClick}
                    >
                        Add Category
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddClick}
                        style={{ background: '#be185d', borderColor: '#be185d' }}
                    >
                        Add Product
                    </Button>
                </Space>
            </div>

            <Tabs defaultActiveKey="1" items={tabItems} size="large" />

            {/* Modal for Add or Edit Product */}
            <AddCakeModal
                open={isModalOpen}
                onClose={handleModalClose}
                onSuccess={() => {
                    fetchCakes();
                    fetchMasterData(); // Refresh master data in case new cats were added
                }}
                cakeToEdit={editingCake}
            />

            {/* Modal for Add Category */}
            <Modal
                title="Add New Category"
                open={isCategoryModalOpen}
                onCancel={() => setIsCategoryModalOpen(false)}
                footer={null}
            >
                <Form
                    form={categoryForm}
                    layout="vertical"
                    onFinish={handleCreateCategory}
                >
                    <Form.Item
                        name="name"
                        label="Category Name"
                        rules={[{ required: true, message: 'Please enter category name' }]}
                    >
                        <Input placeholder="e.g. Birthday Cakes" />
                    </Form.Item>
                    <Form.Item
                        name="basePrice"
                        label="Base Price (Starting Price)"
                        rules={[{ required: true, message: 'Please enter base price' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            placeholder="e.g. 1500"
                            prefix="Rs."
                        />
                    </Form.Item>
                    <div style={{ textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setIsCategoryModalOpen(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" style={{ background: '#be185d', borderColor: '#be185d' }}>
                                Create Category
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default Cakes;
