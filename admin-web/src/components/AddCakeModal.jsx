import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Steps, Space, Upload, Row, Col, Typography, message } from 'antd';
import { PlusOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const AddCakeModal = ({ open, onClose, onSuccess }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const [masterData, setMasterData] = useState({ sizes: [], shapes: [], flavors: [], categories: [] });
    const [variants, setVariants] = useState([]);

    // Track selected category base price for display?
    const [selectedCategoryPrice, setSelectedCategoryPrice] = useState(null);

    useEffect(() => {
        if (open) {
            fetchMasterData();
            form.resetFields();
            setVariants([]);
            setCurrentStep(0);
            setSelectedCategoryPrice(null);
        }
    }, [open]);

    const fetchMasterData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/cakes/master-data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMasterData(res.data);
        } catch (error) {
            message.error('Failed to load filters');
        }
    };

    const handleNext = async () => {
        try {
            await form.validateFields();
            setCurrentStep(currentStep + 1);
        } catch (error) {
            // Form error
        }
    };

    const handleAddVariant = () => {
        // Default price 0 (modifier)
        setVariants([...variants, { sizeId: null, shapeId: null, flavorId: null, price: 0 }]);
    };

    const handleRemoveVariant = (index) => {
        const newVariants = [...variants];
        newVariants.splice(index, 1);
        setVariants(newVariants);
    };

    const handleVariantChange = (index, field, value) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };

    const handleCategoryChange = (categoryId) => {
        const cat = masterData.categories.find(c => c.id === categoryId);
        if (cat) {
            setSelectedCategoryPrice(cat.basePrice);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = form.getFieldsValue();

            // Transform for API
            const payload = {
                name: values.name,
                categoryId: values.categoryId,
                description: values.description,
                ingredients: values.ingredients,
                imageUrl: values.imageUrl,
                variants: variants
            };

            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/cakes', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            message.success('Cake created successfully!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            message.error('Failed to create cake');
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            width={700}
            title="Add New Cake"
            footer={null}
        >
            <Steps current={currentStep} style={{ marginBottom: 20 }}>
                <Step title="Basic Details" />
                <Step title="Variants" />
            </Steps>

            <Form form={form} layout="vertical">
                <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="name" label="Cake Name" rules={[{ required: true }]}>
                                <Input placeholder="e.g. Chocolate Cake" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="categoryId" label="Category" rules={[{ required: true }]}>
                                <Select placeholder="Select category" onChange={handleCategoryChange}>
                                    {(masterData.categories || []).map(cat => (
                                        <Option key={cat.id} value={cat.id}>{cat.name} (Base: Rs.{cat.basePrice})</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="imageUrl" label="Image URL" rules={[{ required: true }]}>
                                <Input placeholder="https://..." />
                            </Form.Item>
                        </Col>
                        {/* Base Price is now displayed as info if category selected */}
                        {selectedCategoryPrice !== null && (
                            <Col span={24}>
                                <div style={{ marginBottom: 15, padding: '10px 15px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 6 }}>
                                    <Text strong>Selected Category Base Price: </Text> <Text type="success">Rs. {selectedCategoryPrice}</Text>
                                    <div style={{ fontSize: '12px', color: '#666' }}>All variants will start from this base price.</div>
                                </div>
                            </Col>
                        )}
                    </Row>

                    <Form.Item name="description" label="Description">
                        <TextArea rows={2} />
                    </Form.Item>

                    <Form.Item name="ingredients" label="Ingredients">
                        <TextArea rows={2} placeholder="Flour, Sugar, etc." />
                    </Form.Item>

                    <div style={{ textAlign: 'right', marginTop: 20 }}>
                        <Button type="primary" onClick={handleNext}>Next</Button>
                    </div>
                </div>

                <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                    <div style={{ marginBottom: 15 }}>
                        <Title level={5}>Cake Variants</Title>
                        <p>Add specific price modifiers (or absolute override prices) for different sizes/shapes.</p>
                        {selectedCategoryPrice !== null && <Text type="secondary">Adding to Base: Rs. {selectedCategoryPrice}</Text>}
                    </div>

                    {variants.map((variant, index) => (
                        <div key={index} style={{ background: '#f9f9f9', padding: 15, borderRadius: 8, marginBottom: 10, border: '1px solid #eee' }}>
                            <Row gutter={10} align="middle">
                                <Col span={5}>
                                    <Select placeholder="Size" style={{ width: '100%' }} onChange={(v) => handleVariantChange(index, 'sizeId', v)} value={variant.sizeId}>
                                        {masterData.sizes.map(s => <Option key={s.id} value={s.id}>{s.label}</Option>)}
                                    </Select>
                                </Col>
                                <Col span={5}>
                                    <Select placeholder="Shape" style={{ width: '100%' }} onChange={(v) => handleVariantChange(index, 'shapeId', v)} value={variant.shapeId}>
                                        {masterData.shapes.map(s => <Option key={s.id} value={s.id}>{s.label}</Option>)}
                                    </Select>
                                </Col>
                                <Col span={6}>
                                    <Select placeholder="Flavor" style={{ width: '100%' }} onChange={(v) => handleVariantChange(index, 'flavorId', v)} value={variant.flavorId}>
                                        {masterData.flavors.map(s => <Option key={s.id} value={s.id}>{s.label}</Option>)}
                                    </Select>
                                </Col>
                                <Col span={6}>
                                    <InputNumber
                                        placeholder="Extra Price"
                                        style={{ width: '100%' }}
                                        formatter={value => `Rs. ${value}`}
                                        parser={value => value.replace(/Rs\.\s?|(,*)/g, '')}
                                        value={variant.price}
                                        onChange={(v) => handleVariantChange(index, 'price', v)}
                                    />
                                </Col>
                                <Col span={2}>
                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveVariant(index)} />
                                </Col>
                            </Row>
                        </div>
                    ))}

                    <Button type="dashed" onClick={handleAddVariant} block icon={<PlusOutlined />} style={{ marginTop: 10 }}>
                        Add Variant
                    </Button>

                    <Row justify="space-between" style={{ marginTop: 20 }}>
                        <Button onClick={() => setCurrentStep(0)}>Back</Button>
                        <Button type="primary" onClick={handleSubmit}>Create Cake</Button>
                    </Row>
                </div>
            </Form>
        </Modal>
    );
};

export default AddCakeModal;
