import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;

const ForgotPassword = () => {
    const [loading, setLoading] = useState(false);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/auth/forgot-password', values);
            message.success('Password reset link sent to your email!');
        } catch (error) {
            message.error(error.response?.data?.error || 'Failed to send email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
            <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <Title level={3} style={{ color: '#E91E63' }}>Forgot Password?</Title>
                    <Text type="secondary">Enter your email to receive a reset link.</Text>
                </div>
                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email!' }]}>
                        <Input prefix={<MailOutlined />} placeholder="Enter your email" size="large" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ background: '#E91E63', borderColor: '#E91E63' }}>
                            Send Reset Link
                        </Button>
                    </Form.Item>
                    <div style={{ textAlign: 'center' }}>
                        <Link to="/login"><ArrowLeftOutlined /> Back to Login</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default ForgotPassword;
