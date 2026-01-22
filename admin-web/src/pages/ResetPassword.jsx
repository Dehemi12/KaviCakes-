import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;

const ResetPassword = () => {
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const onFinish = async (values) => {
        if (!token) {
            message.error('Invalid or missing token');
            return;
        }
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/auth/reset-password', {
                token,
                newPassword: values.newPassword
            });
            message.success('Password has been reset successfully!');
            navigate('/login');
        } catch (error) {
            message.error(error.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return <div style={{ textAlign: 'center', marginTop: 50 }}><Text type="danger">Invalid Link</Text></div>;
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
            <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <Title level={3} style={{ color: '#E91E63' }}>Reset Password</Title>
                    <Text type="secondary">Enter your new password below.</Text>
                </div>
                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item name="newPassword" rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="New Password" size="large" />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Please confirm your password!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Passwords do not match!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" size="large" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ background: '#E91E63', borderColor: '#E91E63' }}>
                            Reset Password
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default ResetPassword;
