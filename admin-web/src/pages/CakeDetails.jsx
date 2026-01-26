import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, Button, Table, Tag, Space, message, Descriptions, Row, Col, Spin, Image } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import AddCakeModal from '../components/AddCakeModal'; // Check path if simpler
import { docData } from '../data/dummyData';

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
            // Hardcoded fetch
            const found = docData.cakes.find(c => c.id === parseInt(id));
            if (found) {
                setCake(found);
            } else {
                message.error('Cake not found (Static Data)');
                navigate('/cakes');
            }
        } catch (error) {
            console.error(error);
            message.error('Failed to load cake details');
            navigate('/cakes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchCakeDetails();
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this cake?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/cakes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Cake deleted');
            navigate('/cakes');
        } catch (error) {
            message.error('Failed to delete cake');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
    if (!cake) return null;

    const variantColumns = [
        { title: 'Size', dataIndex: ['size', 'label'], key: 'size', render: t => t || 'N/A' },
        { title: 'Shape', dataIndex: ['shape', 'label'], key: 'shape', render: t => t || 'N/A' },
        { title: 'Flavor', dataIndex: ['flavor', 'label'], key: 'flavor', render: t => t || 'N/A' },
        { title: 'Price', dataIndex: 'price', key: 'price', render: p => `Rs. ${p.toLocaleString()}` },
    ];

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cakes')} style={{ marginBottom: 15 }}>
                    Back to Cakes
                </Button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={2} style={{ margin: 0 }}>{cake.name}</Title>
                    <Space>
                        <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditModalOpen(true)}>
                            Edit Cake
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
                            <Descriptions.Item label="Category">{cake.categoryName}</Descriptions.Item>
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

            {/* Reusing existing AddCakeModal for editing */}
            {/* Note: Ensure AddCakeModal is exported and supports editing mode correctly */}
            {/* We might need to import it from pages/Cakes.jsx if it's not a separate component, 
                Request check of file structure. 
                Assuming it is in ../components based on common react structure, 
                BUT previous view of Cakes.jsx showed it might be inline or imported. 
                Let's check Cakes.jsx imports first in next step if this fails, 
                but I'll assume for now or check quickly.
                Actually, looking at Cakes.jsx in step 131:
                It uses <AddCakeModal /> but imports? 
                Let's check imports in Cakes.jsx:
                I don't have the top of Cakes.jsx visible in step 131, but I can assume or check.
                Wait, I'll search for AddCakeModal file location.
            */}
        </div>
    );
};

export default CakeDetails;
