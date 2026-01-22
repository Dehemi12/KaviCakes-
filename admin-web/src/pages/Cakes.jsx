import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Button, Input, Tag, message, Select, Space } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import axios from 'axios';
import AddCakeModal from '../components/AddCakeModal';

const { Title, Text } = Typography;
const { Meta } = Card;
const { Option } = Select;

const Cakes = () => {
    const [cakes, setCakes] = useState([]);
    const [category, setCategory] = useState({ id: 'All', name: 'All' });
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ sizeId: null, shapeId: null, flavorId: null });
    const [masterData, setMasterData] = useState({ sizes: [], shapes: [], flavors: [], categories: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchMasterData = async () => {
        try {
            const token = localStorage.getItem('token');
            // Assuming base URL is localhost:5000, ideally use env var
            const res = await axios.get('http://localhost:5000/api/cakes/master-data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMasterData(res.data);
        } catch (error) {
            console.error('Failed to load filters');
            message.error('Failed to load master data');
        }
    };

    const fetchCakes = async () => {
        try {
            const token = localStorage.getItem('token');

            const params = {
                search: searchTerm,
                ...filters
            };

            if (category.id !== 'All') {
                params.categoryId = category.id;
            }

            const res = await axios.get('http://localhost:5000/api/cakes', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setCakes(res.data);
        } catch (error) {
            console.error(error);
            message.error('Failed to load cakes');
        }
    };

    useEffect(() => {
        fetchMasterData();
    }, []);

    useEffect(() => {
        fetchCakes();
    }, [category, searchTerm, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Combine 'All' with fetched categories
    const displayCategories = [{ id: 'All', name: 'All' }, ...(masterData.categories || [])];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <Title level={2}>Cake Management</Title>
                    <Text type="secondary">Manage your bakery catalog</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} style={{ background: '#E91E63', borderColor: '#E91E63' }}>
                    Add Cake
                </Button>
            </div>

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
                        placeholder="Search cakes..."
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
                                <span key="edit" style={{ color: '#888' }}>Edit</span>,
                                <Button type="primary" size="small" style={{ background: '#E91E63', borderColor: '#E91E63' }}>View Details</Button>
                            ]}
                        >
                            <Meta
                                title={<div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ maxWidth: '60%' }} title={cake.name}>{cake.name}</span>
                                    {/* Display base price from Category or Range? 
                                        The API returns category.basePrice as top level 'basePrice' now. 
                                    */}
                                    <span style={{ color: '#E91E63' }}>Rs.{cake.basePrice ? cake.basePrice.toLocaleString() : 'N/A'}</span>
                                </div>}
                                description={<div style={{ height: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>{cake.description}</div>}
                            />
                            <div style={{ marginTop: 10 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>{cake.categoryName}</Text>
                            </div>
                        </Card>
                    </Col>
                )) : (
                    <Col span={24}>
                        <div style={{ textAlign: 'center', padding: 50 }}>
                            <Text type="secondary">No cakes found.</Text>
                        </div>
                    </Col>
                )}
            </Row>

            <AddCakeModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchCakes}
            />
        </div >
    );
};

export default Cakes;
