import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, ConfigProvider } from 'antd';
import { LockFilled, MailFilled } from '@ant-design/icons'; // Using Filled icons to match image weight
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const Login = () => {
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await login(values);
            message.success('Login successful!');
            navigate('/');
        } catch (error) {
            message.error(error.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    // Custom styles to match the reference image exactly
    const styles = {
        inputContainer: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: 24,
        },
        icon: {
            fontSize: 24,
            marginRight: 15,
            color: '#000', // Black icons as per image
        },
        input: {
            height: 45,
            borderRadius: 10, // Rounded corners
            border: '2px solid #E0E0E0', // Default border
            backgroundColor: '#FAFAFA',
            fontSize: 16,
        },
        activeBorder: {
            borderColor: '#2196F3', // Bright blue for active/focus state (matching "Email" field in image)
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>

            <div style={{ width: '100%', maxWidth: 350, padding: 20 }}>

                {/* Header Section */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 32, color: '#be185d', marginRight: 10 }}>🧁</span>
                        {/* Using emoji for now, user can replace with SVg */}
                        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#424242' }}>KaviCakes</Title>
                    </div>
                    <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#000' }}>Welcome back!</Title>
                </div>

                <ConfigProvider
                    theme={{
                        token: {
                            colorPrimary: '#be185d',
                        },
                    }}
                >
                    <Form
                        name="login"
                        onFinish={onFinish}
                        layout="vertical"
                        size="large"
                    >
                        {/* Email Field - Custom Layout for Icon + Input */}
                        <div style={styles.inputContainer}>
                            <MailFilled style={styles.icon} />
                            <Form.Item
                                name="email"
                                rules={[
                                    { required: true, message: 'Please input your Email!' },
                                    { type: 'email', message: 'Please enter a valid email!' },
                                    { pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, message: 'Invalid email format!' }
                                ]}
                                style={{ marginBottom: 0, flex: 1 }}
                            >
                                <Input
                                    placeholder="Email"
                                    style={{ ...styles.input, borderColor: '#2196F3', borderWidth: 2 }} // Hardcoded blue border to mimic screenshot "focus" state
                                />
                            </Form.Item>
                        </div>

                        {/* Password Field */}
                        <div style={styles.inputContainer}>
                            <LockFilled style={styles.icon} />
                            <Form.Item
                                name="password"
                                rules={[{ required: true, message: 'Please input your Password!' }]}
                                style={{ marginBottom: 0, flex: 1 }}
                            >
                                <Input.Password
                                    placeholder="Password"
                                    style={{ ...styles.input }}
                                />
                            </Form.Item>
                        </div>

                        <div style={{ textAlign: 'right', marginBottom: 20 }}>
                            <a href="/forgot-password" style={{ color: '#be185d' }}>Forgot Password?</a>
                        </div>

                        <Form.Item style={{ marginTop: 20 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                block
                                style={{
                                    height: 50,
                                    background: '#F06292', // Specific pink shade
                                    borderColor: '#F06292',
                                    borderRadius: 12,
                                    fontSize: 16,
                                    fontWeight: 500,
                                    boxShadow: 'none'
                                }}
                            >
                                Login
                            </Button>
                        </Form.Item>
                    </Form>
                </ConfigProvider>
            </div>
        </div>
    );
};

export default Login;
