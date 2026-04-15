import React, { useState, useEffect } from 'react';
import { Tabs, Form, Input, Button, Card, Typography, message, Descriptions, Badge } from 'antd';
import { UserOutlined, LockOutlined, InfoCircleOutlined, SaveOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const Settings = () => {
    const { user, login } = useAuth(); // Assuming login updates the user context state
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();

    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                name: user.name,
                email: user.email
            });
        }
    }, [user, form]);

    const handleUpdateProfile = async (values) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('http://localhost:5000/api/auth/profile', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Profile updated successfully');
            // Optimistically update local user info if context allows, or reload
            // Ideally useContext should expose a setUser, but for now we might need to reload or re-fetch me
            if (res.data) {
                // Trigger re-fetch or manual update if possible. 
                // For now, let's just show success.
            }
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (values) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/auth/change-password', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Password changed successfully');
            passwordForm.resetFields();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.error || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const items = [
        {
            key: '1',
            label: <span><UserOutlined /> General</span>,
            children: (
                <div style={{ maxWidth: 500, padding: 20 }}>
                    <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
                        <Form.Item name="name" label="Admin Name" rules={[{ required: true }]}>
                            <Input prefix={<UserOutlined />} />
                        </Form.Item>
                        <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                            <Input disabled help="Email cannot be changed easily for security reasons (optional restriction)" />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} style={{ background: '#be185d', borderColor: '#be185d' }}>
                            Save Changes
                        </Button>
                    </Form>
                </div>
            )
        },
        {
            key: '2',
            label: <span><LockOutlined /> Security</span>,
            children: (
                <div style={{ maxWidth: 500, padding: 20 }}>
                    <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
                        <Form.Item name="currentPassword" label="Current Password" rules={[{ required: true }]}>
                            <Input.Password prefix={<LockOutlined />} />
                        </Form.Item>
                        <Form.Item name="newPassword" label="New Password" rules={[{ required: true, min: 6 }]}>
                            <Input.Password prefix={<LockOutlined />} />
                        </Form.Item>
                        <Form.Item
                            name="confirmPassword"
                            label="Confirm New Password"
                            dependencies={['newPassword']}
                            rules={[
                                { required: true },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('The two passwords that you entered do not match!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#be185d', borderColor: '#be185d' }}>
                            Change Password
                        </Button>
                    </Form>
                </div>
            )
        },
    ];

    return (
        <div>
            <Title level={2}>Settings</Title>
            <Text type="secondary">Manage your account settings and preferences</Text>

            <Card style={{ marginTop: 20 }}>
                <Tabs defaultActiveKey="1" items={items} />
            </Card>
        </div>
    );
};

export default Settings;
