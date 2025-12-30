import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/templates/AuthLayout';
import LoginForm from '../../components/organisms/LoginForm';

export default function LoginPage() {
    const navigate = useNavigate();

    // This function will be passed to the LoginForm
    const handleSwitchToRegister = () => {
        navigate('/register'); 
    };

    return (
        <AuthLayout>
            <LoginForm onSwitchToRegister={handleSwitchToRegister} />
        </AuthLayout>
    );
}