import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, ConfigProvider } from 'antd';
import { UserOutlined, LockFilled, MailFilled, SafetyCertificateFilled } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;

const Register = () => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Register, 2: OTP
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            // Register Step
            await axios.post('http://localhost:5000/api/auth/register', {
                ...values,
                role: 'ADMIN' // Explicitly requesting admin
            });
            message.success('Registration successful. Please check your email for OTP.');
            setEmail(values.email);
            setStep(2);
        } catch (error) {
            message.error(error.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const onVerify = async (values) => {
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/auth/verify-otp', {
                email,
                otp: values.otp
            });
            message.success('Account verified! You can now login.');
            navigate('/login');
        } catch (error) {
            message.error(error.response?.data?.error || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        inputContainer: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: 24,
        },
        icon: {
            fontSize: 24,
            marginRight: 15,
            color: '#000',
        },
        input: {
            height: 45,
            borderRadius: 10,
            border: '2px solid #E0E0E0',
            backgroundColor: '#FAFAFA',
            fontSize: 16,
        },
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <div style={{ width: '100%', maxWidth: 400, padding: 20 }}>

                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 32, color: '#E91E63', marginRight: 10 }}>🔐</span>
                        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#424242' }}>KaviCakes Admin</Title>
                    </div>
                    <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#000' }}>
                        {step === 1 ? 'Admin Setup' : 'Verify Email'}
                    </Title>
                    {step === 1 && <Text type="secondary">Create the master admin account.</Text>}
                </div>

                <ConfigProvider theme={{ token: { colorPrimary: '#E91E63' } }}>
                    {step === 1 ? (
                        <Form name="register" onFinish={onFinish} layout="vertical" size="large">
                            {/* Name */}
                            <div style={styles.inputContainer}>
                                <UserOutlined style={styles.icon} />
                                <Form.Item name="name" rules={[{ required: true, message: 'Please input your Name!' }]} style={{ marginBottom: 0, flex: 1 }}>
                                    <Input placeholder="Full Name" style={styles.input} />
                                </Form.Item>
                            </div>

                            {/* Email */}
                            <div style={styles.inputContainer}>
                                <MailFilled style={styles.icon} />
                                <Form.Item
                                    name="email"
                                    rules={[
                                        { required: true, message: 'Please input your Email!' },
                                        { type: 'email', message: 'Invalid email format!' }
                                    ]}
                                    style={{ marginBottom: 0, flex: 1 }}
                                >
                                    <Input placeholder="Email" style={styles.input} />
                                </Form.Item>
                            </div>

                            {/* Password */}
                            <div style={styles.inputContainer}>
                                <LockFilled style={styles.icon} />
                                <Form.Item name="password" rules={[{ required: true, min: 6 }]} style={{ marginBottom: 0, flex: 1 }}>
                                    <Input.Password placeholder="Password" style={styles.input} />
                                </Form.Item>
                            </div>

                            <Form.Item style={{ marginTop: 20 }}>
                                <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 50, borderRadius: 12, fontSize: 16, fontWeight: 500 }}>
                                    Create Admin Account
                                </Button>
                            </Form.Item>

                            <div style={{ textAlign: 'center' }}>
                                <Link to="/login" style={{ color: '#E91E63' }}>Already have an account? Login</Link>
                            </div>
                        </Form>
                    ) : (
                        <Form name="verify" onFinish={onVerify} layout="vertical" size="large">
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <Text>We sent a 6-digit code to <strong>{email}</strong></Text>
                            </div>

                            <div style={styles.inputContainer}>
                                <SafetyCertificateFilled style={styles.icon} />
                                <Form.Item name="otp" rules={[{ required: true, len: 6, message: 'Must be 6 digits' }]} style={{ marginBottom: 0, flex: 1 }}>
                                    <Input placeholder="Enter 6-Digit OTP" style={{ ...styles.input, textAlign: 'center', letterSpacing: 5, fontSize: 20 }} maxLength={6} />
                                </Form.Item>
                            </div>

                            <Form.Item style={{ marginTop: 20 }}>
                                <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 50, borderRadius: 12, fontSize: 16, fontWeight: 500 }}>
                                    Verify & Finish
                                </Button>
                            </Form.Item>

                            <div style={{ textAlign: 'center' }}>
                                <Button type="link" onClick={() => setStep(1)} style={{ color: '#999' }}>Wrong Email?</Button>
                            </div>
                        </Form>
                    )}
                </ConfigProvider>
            </div>
        </div>
    );
};

export default Register;
