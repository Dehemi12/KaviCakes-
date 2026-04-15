import React, { useState, useEffect } from 'react';
import { Typography, Card, Form, Input, Button, Upload, Row, Col, message, Divider, List, Avatar, Spin } from 'antd';
import { UploadOutlined, SaveOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const SiteContent = () => {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({});
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    const [heroForm] = Form.useForm();
    const [uploadingHero, setUploadingHero] = useState(false);
    const [uploadingCategory, setUploadingCategory] = useState(null); // ID of category being uploaded

    useEffect(() => {
        fetchSettings();
        fetchCategories();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/content/settings');
            setSettings(res.data);
            heroForm.setFieldsValue({
                HOME_HERO_TITLE: res.data.HOME_HERO_TITLE,
                HOME_HERO_SUBTITLE: res.data.HOME_HERO_SUBTITLE,
                HOME_HERO_IMAGE: res.data.HOME_HERO_IMAGE
            });
        } catch (error) {
            console.error('Failed to load settings:', error);
            // message.error('Failed to load site settings');
        }
    };

    const fetchCategories = async () => {
        setCategoriesLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/cakes/master-data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(res.data.categories || []);
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setCategoriesLoading(false);
        }
    };

    const handleHeroSubmit = async (values) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/content/settings', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Home page settings updated successfully!');
            fetchSettings();
        } catch (error) {
            message.error('Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file, updateType, categoryId = null) => {
        // updateType: 'HERO' or 'CATEGORY'
        try {
            if (updateType === 'HERO') setUploadingHero(true);
            else setUploadingCategory(categoryId);

            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', file);

            const { data } = await axios.post('http://localhost:5000/api/upload/site', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            const publicUrl = data.url;

            if (updateType === 'HERO') {
                heroForm.setFieldsValue({ HOME_HERO_IMAGE: publicUrl });
                message.success('Image uploaded. Click Save to apply.');
            } else if (updateType === 'CATEGORY' && categoryId) {
                await updateCategoryImage(categoryId, publicUrl);
            }

        } catch (error) {
            console.error('Upload error:', error);
            message.error('Upload failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setUploadingHero(false);
            setUploadingCategory(null);
        }
        return false;
    };

    const updateCategoryImage = async (id, imageUrl) => {
        try {
            const token = localStorage.getItem('token');
            // We need to fetch the category name/basePrice to invoke PUT properly if backend expects full object?
            // Our backend updateCategory accepts partial updates? 
            // Let's check updateCategory implementation in cakeController.js
            // "const category = await prisma.cakeCategory.update({ data: { name, basePrice, imageUrl } })"
            // If I send ONLY imageUrl, name/basePrice will be undefined -> Prisma might complain or set to null/default?
            // Prisma update allows partial data usually, but we destructured it. 
            // "const { name, basePrice, imageUrl } = req.body;"
            // If name is undefined, "name: name" -> "name: undefined". Prisma treats this as "do not update".
            // So partial update should work if I send undefined/null for others.

            // Wait, "basePrice: parseFloat(basePrice || 0)". If basePrice is undefined, it becomes 0. That's bad.
            // I should modify backend to be smarter or send current values.
            // Option A: Modify backend to check "if (name !== undefined)".
            // Option B: Frontend fetching current values (we have them in 'categories' state) and sending them back.
            // Option B is safer without backend redeploy. Use current 'categories' state.

            const currentCat = categories.find(c => c.id === id);
            if (!currentCat) return;

            await axios.put(`http://localhost:5000/api/cakes/categories/${id}`, {
                name: currentCat.name,
                basePrice: currentCat.basePrice,
                imageUrl: imageUrl
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            message.success('Category image updated!');
            fetchCategories(); // Refresh list
        } catch (error) {
            console.error(error);
            message.error('Failed to save category image');
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <Title level={2}>Site Content Management</Title>
            <Text type="secondary">Manage generic site images and text.</Text>

            <Divider orientation="left">Home Page Banner (Hero Section)</Divider>
            <Card>
                <Form form={heroForm} layout="vertical" onFinish={handleHeroSubmit}>
                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item name="HOME_HERO_TITLE" label="Hero Title">
                                <Input placeholder="e.g. Delicious Cakes for Every Occasion" />
                            </Form.Item>
                            <Form.Item name="HOME_HERO_SUBTITLE" label="Hero Subtitle">
                                <Input.TextArea rows={2} placeholder="e.g. Handcrafted with love..." />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="HOME_HERO_IMAGE" label="Hero Image">
                                <div style={{ marginBottom: 10 }}>
                                    <Input placeholder="Image URL" readOnly style={{ marginBottom: 10 }} />
                                    <Upload
                                        beforeUpload={(file) => handleUpload(file, 'HERO')}
                                        showUploadList={false}
                                        accept="image/*"
                                    >
                                        <Button icon={uploadingHero ? <LoadingOutlined /> : <UploadOutlined />} loading={uploadingHero}>
                                            {uploadingHero ? 'Uploading...' : 'Click to Upload'}
                                        </Button>
                                    </Upload>
                                </div>
                                <Form.Item shouldUpdate>
                                    {() => {
                                        const img = heroForm.getFieldValue('HOME_HERO_IMAGE');
                                        return img ? <img src={img} alt="Hero" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} /> : null;
                                    }}
                                </Form.Item>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} style={{ background: '#be185d', borderColor: '#be185d' }}>
                        Save Banner Settings
                    </Button>
                </Form>
            </Card>

            <Divider orientation="left" style={{ marginTop: 40 }}>Category Images</Divider>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
                {categories.map(category => (
                    <Card key={category.id} hoverable title={category.name} size="small">
                        <div style={{ textAlign: 'center', marginBottom: 15, height: 150, background: '#f5f5f5', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {category.imageUrl ? (
                                <img src={category.imageUrl} alt={category.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Text type="secondary">No Image</Text>
                            )}
                        </div>
                        <Upload
                            beforeUpload={(file) => handleUpload(file, 'CATEGORY', category.id)}
                            showUploadList={false}
                            accept="image/*"
                        >
                            <Button block icon={<UploadOutlined />} loading={uploadingCategory === category.id}>
                                {uploadingCategory === category.id ? 'Uploading...' : 'Change Image'}
                            </Button>
                        </Upload>
                    </Card>
                ))}
            </div>
            {categories.length === 0 && !categoriesLoading && <Text>No categories found.</Text>}
        </div>
    );
};

export default SiteContent;
