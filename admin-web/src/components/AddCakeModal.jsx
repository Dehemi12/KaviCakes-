import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Steps, Space, Row, Col, Typography, message, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import { Upload } from 'antd';
import { supabase } from '../api/supabase';
import axios from 'axios';


const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const AddCakeModal = ({ open, onClose, onSuccess, cakeToEdit = null }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const [masterData, setMasterData] = useState({ sizes: [], shapes: [], flavors: [], categories: [] });
    const [variants, setVariants] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Inline Master Data Creation State
    const [isMiniModalOpen, setIsMiniModalOpen] = useState(false);
    const [miniModalType, setMiniModalType] = useState(''); // 'category', 'size', 'shape', 'flavor'
    const [newItemLabel, setNewItemLabel] = useState('');
    const [newItemPrice, setNewItemPrice] = useState(0); // Base price for category, extra for others

    const [selectedCategoryPrice, setSelectedCategoryPrice] = useState(null);

    const isEditMode = !!cakeToEdit;

    useEffect(() => {
        if (open) {
            fetchMasterData();
            if (isEditMode && cakeToEdit) {
                // Pre-fill for Edit
                form.setFieldsValue({
                    name: cakeToEdit.name,
                    categoryId: cakeToEdit.categoryId,
                    description: cakeToEdit.description,
                    ingredients: cakeToEdit.ingredients,
                    imageUrl: cakeToEdit.imageUrl,
                    availability: cakeToEdit.availability
                });

                // Map variants
                if (cakeToEdit.variants) {
                    const mappedVariants = cakeToEdit.variants.map(v => ({
                        id: v.id, // Keep ID for tracking (though backend replaces list currently)
                        sizeId: v.size?.id || v.sizeId, // Handle both expanded object or ID
                        shapeId: v.shape?.id || v.shapeId,
                        flavorId: v.flavor?.id || v.flavorId,
                        price: v.price
                    }));
                    setVariants(mappedVariants);
                }

                // Set initial category price
                if (cakeToEdit.categoryName || cakeToEdit.category) { // try to infer or wait for master data
                    // Logic handled in fetchMasterData or category selection
                }
            } else {
                // Reset for Create
                form.resetFields();
                setVariants([]);
                setSelectedCategoryPrice(null);
            }
            setCurrentStep(0);
        }
    }, [open, cakeToEdit]);

    // Re-calculate category price when master data loads or category changes
    useEffect(() => {
        if (masterData.categories.length > 0) {
            const catId = form.getFieldValue('categoryId');
            if (catId) {
                const cat = masterData.categories.find(c => c.id === catId);
                if (cat) setSelectedCategoryPrice(cat.basePrice);
            }
        }
    }, [masterData, form]);

    const fetchMasterData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/cakes/master-data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMasterData(res.data);

            // If editing, find category price now that we have data
            if (cakeToEdit) {
                const cat = res.data.categories.find(c => c.id === cakeToEdit.categoryId);
                if (cat) setSelectedCategoryPrice(cat.basePrice);
            }
        } catch (error) {
            console.error('Fetch Master Data Error:', error);
            message.error("Failed to load options");
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
            const payload = {
                name: values.name,
                categoryId: values.categoryId,
                description: values.description,
                ingredients: values.ingredients,
                imageUrl: values.imageUrl,
                availability: values.availability !== undefined ? values.availability : true,
                variants: variants
            };

            const token = localStorage.getItem('token');

            if (isEditMode) {
                await axios.put(`http://localhost:5000/api/cakes/${cakeToEdit.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success('Product updated successfully!');
            } else {
                await axios.post('http://localhost:5000/api/cakes', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success('Product created successfully!');
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Submit Error:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Unknown error occurred';
            message.error(isEditMode ? `Failed to update: ${errorMsg}` : `Failed to create: ${errorMsg}`);
        }
    };


    // --- Image Upload Logic ---
    const handleImageUpload = async (file) => {
        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error } = await supabase.storage
                .from('cakes')
                .upload(filePath, file);

            if (error) {
                console.error('Supabase upload error:', error);
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('cakes')
                .getPublicUrl(filePath);

            form.setFieldsValue({ imageUrl: publicUrl });
            message.success('Image uploaded successfully');
        } catch (error) {
            message.error('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
        return false; // Prevent default upload behavior
    };

    // --- Master Data Creation Logic ---
    const openMiniModal = (type) => {
        setMiniModalType(type);
        setNewItemLabel('');
        setNewItemPrice(0);
        setIsMiniModalOpen(true);
    };

    const handleCreateMasterData = async () => {
        if (!newItemLabel.trim()) return message.error('Name/Label is required');

        try {
            const token = localStorage.getItem('token');
            const endpointMap = {
                'category': 'categories',
                'size': 'sizes',
                'shape': 'shapes',
                'flavor': 'flavors'
            };
            const endpoint = endpointMap[miniModalType];

            // Payload differs slightly (Category uses 'name', others 'label')
            const payload = miniModalType === 'category'
                ? { name: newItemLabel, basePrice: newItemPrice }
                : { label: newItemLabel, price: newItemPrice };

            await axios.post(`http://localhost:5000/api/cakes/${endpoint}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            message.success(`${miniModalType} created!`);
            fetchMasterData(); // Refresh lists
            setIsMiniModalOpen(false);
        } catch (error) {
            message.error('Failed to create item');
        }
    };

    // Helper render for Select with "Add New" button
    const renderSelectWithAdd = (placeholder, options, fieldName, type, value, onChange) => (
        <div style={{ display: 'flex', gap: 5 }}>
            <Select
                placeholder={placeholder}
                style={{ flex: 1 }}
                value={value}
                onChange={onChange}
                dropdownRender={(menu) => (
                    <>
                        {menu}
                        <Divider style={{ margin: '8px 0' }} />
                        <Button type="text" block icon={<PlusOutlined />} onClick={() => openMiniModal(type)}>
                            Add New {type}
                        </Button>
                    </>
                )}
            >
                {options.map(opt => (
                    <Option key={opt.id} value={opt.id}>
                        {opt.name || opt.label}
                        {opt.basePrice !== undefined ? ` (Base: Rs.${opt.basePrice})` : ''}
                    </Option>
                ))}
            </Select>
        </div>
    );

    return (
        <>
            <Modal
                open={open}
                onCancel={onClose}
                width={700}
                title={isEditMode ? `Edit Product: ${cakeToEdit.name}` : "Add New Product"}
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
                                <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
                                    <Input placeholder="e.g. Chocolate Cake" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="categoryId" label="Category" rules={[{ required: true }]}>
                                    <Select
                                        placeholder="Select Category"
                                        onChange={handleCategoryChange}
                                        dropdownRender={menu => (
                                            <>
                                                {menu}
                                                <Divider style={{ margin: '8px 0' }} />
                                                <Button type="text" block icon={<PlusOutlined />} onClick={() => openMiniModal('category')}>
                                                    Add New Category
                                                </Button>
                                            </>
                                        )}
                                    >
                                        {(masterData.categories || []).map(cat => (
                                            <Option key={cat.id} value={cat.id}>{cat.name} (Base: Rs.{cat.basePrice})</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item name="imageUrl" label="Product Image" rules={[{ required: true, message: 'Please upload an image' }]}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <Input placeholder="Image URL will appear here" readOnly style={{ flex: 1 }} />
                                        <Upload
                                            beforeUpload={handleImageUpload}
                                            showUploadList={false}
                                            accept="image/*"
                                        >
                                            <Button icon={uploading ? <LoadingOutlined /> : <UploadOutlined />} loading={uploading}>
                                                {uploading ? 'Uploading' : 'Upload'}
                                            </Button>
                                        </Upload>
                                    </div>
                                </Form.Item>
                                {/* Preview */}
                                <Form.Item noStyle shouldUpdate={(prev, current) => prev.imageUrl !== current.imageUrl}>
                                    {({ getFieldValue }) => {
                                        const img = getFieldValue('imageUrl');
                                        return img ? (
                                            <div style={{ marginTop: 10, marginBottom: 20, textAlign: 'center' }}>
                                                <img src={img} alt="Preview" style={{ maxHeight: 150, borderRadius: 8, border: '1px solid #ddd' }} />
                                            </div>
                                        ) : null;
                                    }}
                                </Form.Item>
                            </Col>
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

                        {isEditMode && (
                            <Form.Item name="availability" label="Availability" valuePropName="checked">
                                <Select>
                                    <Option value={true}>Available</Option>
                                    <Option value={false}>Unavailable</Option>
                                </Select>
                            </Form.Item>
                        )}

                        <div style={{ textAlign: 'right', marginTop: 20 }}>
                            <Button type="primary" onClick={handleNext}>Next</Button>
                        </div>
                    </div>

                    <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                        <div style={{ marginBottom: 15 }}>
                            <Title level={5}>Product Variants</Title>
                            <p>Manage sizes, shapes, and flavors. You can add new options directly from the dropdowns.</p>
                        </div>

                        {variants.map((variant, index) => (
                            <div key={index} style={{ background: '#f9f9f9', padding: 15, borderRadius: 8, marginBottom: 10, border: '1px solid #eee' }}>
                                <Row gutter={10} align="middle">
                                    <Col span={5}>
                                        {/* Size Select with Add Button */}
                                        <Select
                                            placeholder="Size"
                                            style={{ width: '100%' }}
                                            value={variant.sizeId}
                                            onChange={(v) => handleVariantChange(index, 'sizeId', v)}
                                            dropdownRender={menu => (
                                                <>
                                                    {menu}
                                                    <Divider style={{ margin: '5px 0' }} />
                                                    <Button type="text" size="small" block icon={<PlusOutlined />} onClick={() => openMiniModal('size')}>Add Size</Button>
                                                </>
                                            )}
                                        >
                                            {masterData.sizes.map(s => <Option key={s.id} value={s.id}>{s.label}</Option>)}
                                        </Select>
                                    </Col>
                                    <Col span={5}>
                                        <Select
                                            placeholder="Shape"
                                            style={{ width: '100%' }}
                                            value={variant.shapeId}
                                            onChange={(v) => handleVariantChange(index, 'shapeId', v)}
                                            dropdownRender={menu => (
                                                <>
                                                    {menu}
                                                    <Divider style={{ margin: '5px 0' }} />
                                                    <Button type="text" size="small" block icon={<PlusOutlined />} onClick={() => openMiniModal('shape')}>Add Shape</Button>
                                                </>
                                            )}
                                        >
                                            {masterData.shapes.map(s => <Option key={s.id} value={s.id}>{s.label}</Option>)}
                                        </Select>
                                    </Col>
                                    <Col span={6}>
                                        <Select
                                            placeholder="Flavor"
                                            style={{ width: '100%' }}
                                            value={variant.flavorId}
                                            onChange={(v) => handleVariantChange(index, 'flavorId', v)}
                                            dropdownRender={menu => (
                                                <>
                                                    {menu}
                                                    <Divider style={{ margin: '5px 0' }} />
                                                    <Button type="text" size="small" block icon={<PlusOutlined />} onClick={() => openMiniModal('flavor')}>Add Flavor</Button>
                                                </>
                                            )}
                                        >
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

                        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
                            <Button onClick={() => setCurrentStep(0)}>Back</Button>
                            <Button type="primary" onClick={handleSubmit}>{isEditMode ? 'Update Product' : 'Create Product'}</Button>
                        </div>
                    </div>
                </Form>
            </Modal>

            {/* Mini Modal for Master Data Creation */}
            <Modal
                title={`Add New ${miniModalType.charAt(0).toUpperCase() + miniModalType.slice(1)}`}
                open={isMiniModalOpen}
                onCancel={() => setIsMiniModalOpen(false)}
                onOk={handleCreateMasterData}
                width={400}
            >
                <div style={{ marginBottom: 15 }}>
                    <Text>Name/Label</Text>
                    <Input
                        placeholder={`e.g. ${miniModalType === 'size' ? '2kg' : miniModalType === 'shape' ? 'Star' : 'Strawberry'}`}
                        value={newItemLabel}
                        onChange={(e) => setNewItemLabel(e.target.value)}
                    />
                </div>
                <div>
                    <Text>{miniModalType === 'category' ? 'Base Price (Default)' : 'Extra Price (Default)'}</Text>
                    <InputNumber
                        style={{ width: '100%' }}
                        value={newItemPrice}
                        onChange={setNewItemPrice}
                    />
                </div>
            </Modal>
        </>
    );
};

export default AddCakeModal;
