import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, Button, Table, Tag, Space, message, Descriptions, Row, Col, Spin, Image } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import AddCakeModal from '../components/AddCakeModal';

const { Title, Text } = Typography;

const CakeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [cake, setCake] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchCakeDetails = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Fetch from API instead of dummy data
            const res = await axios.get(`http://localhost:5000/api/cakes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCake(res.data);
        } catch (error) {
            console.error(error);
            message.error('Failed to load product details');
            navigate('/cakes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchCakeDetails();
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/cakes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Product deleted');
            navigate('/cakes');
        } catch (error) {
            message.error('Failed to delete product');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
    if (!cake) return null;

    const variantColumns = [
        { title: 'Size', dataIndex: ['size', 'label'], key: 'size', render: t => t || 'N/A' },
        { title: 'Shape', dataIndex: ['shape', 'label'], key: 'shape', render: t => t || 'N/A' },
        { title: 'Flavor', dataIndex: ['flavor', 'label'], key: 'flavor', render: t => t || 'N/A' },
        { title: 'Price', dataIndex: 'price', key: 'price', render: p => `Rs. ${p ? p.toLocaleString() : '0'}` },
    ];

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cakes')} style={{ marginBottom: 15 }}>
                    Back to Products
                </Button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={2} style={{ margin: 0 }}>{cake.name}</Title>
                    <Space>
                        <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditModalOpen(true)}>
                            Edit Product
                        </Button>
                        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                            Delete
                        </Button>
                    </Space>
                </div>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Card cover={<Image src={cake.imageUrl || 'https://via.placeholder.com/400'} alt={cake.name} />}>
                        <Descriptions column={1} bordered>
                            <Descriptions.Item label="Category">{cake.categoryName || cake.category?.name || 'Uncategorized'}</Descriptions.Item>
                            <Descriptions.Item label="Base Price">Rs. {cake.basePrice?.toLocaleString()}</Descriptions.Item>
                            <Descriptions.Item label="Availability">
                                <Tag color={cake.availability ? 'green' : 'red'}>
                                    {cake.availability ? 'Available' : 'Unavailable'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ingredients">{cake.ingredients || 'N/A'}</Descriptions.Item>
                        </Descriptions>
                        <div style={{ marginTop: 20 }}>
                            <Text strong>Description:</Text>
                            <p>{cake.description || 'No description provided.'}</p>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={16}>
                    <Card title="Available Variants" style={{ height: '100%' }}>
                        <Table
                            dataSource={cake.variants}
                            columns={variantColumns}
                            rowKey="id"
                            pagination={false}
                        />
                    </Card>
                </Col>
            </Row>

            <AddCakeModal
                open={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => {
                    fetchCakeDetails(); // Refresh details after edit
                }}
                cakeToEdit={cake}
            />
        </div>
    );
};

export default CakeDetails;
