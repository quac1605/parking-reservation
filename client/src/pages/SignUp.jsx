import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import signUpImage from '../assets/fhdortmundSON.png';

export default function SignUp() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                console.log('Registration successful:', data);
                // Auto login or redirect to login
                navigate('/dashboard');
            } else {
                console.error('Registration failed:', data.message);
                alert(data.message || 'Registration failed');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Something went wrong. Please try again.');
        }
    };

    return (
        <AuthLayout imageSrc={signUpImage}>
            <h2 className="text-2xl font-bold text-primary mb-8 text-center text-pretty">
                <span className="border-b-2 border-dashed border-red-400">Sign Up to</span> FH Dortmund <span className="border-b-2 border-dashed border-red-400">Parking</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-medium text-gray-500">E-mail</label>
                    <div className="relative">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-3 border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-900 placeholder-gray-400"
                            placeholder="example@email.com"
                            required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                </div>

                <div className="relative mt-6">
                    <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-medium text-gray-500">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                                <Eye className="h-5 w-5 text-gray-400" />
                            )}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                    Sign Up
                </button>
            </form>

            <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or sign up with</span>
                </div>
            </div>

            <div className="mt-6 flex justify-center">
                <a
                    href="/api/auth/google"
                    className="w-20 flex justify-center items-center py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50"
                >
                    <img className="h-6 w-6" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                </a>
            </div>

            <p className="mt-8 text-center text-sm text-gray-500">
                Have an account?{' '}
                <Link to="/login" className="font-medium text-primary hover:text-orange-600 underline decoration-dashed underline-offset-4">
                    Sign in here
                </Link>
            </p>
        </AuthLayout>
    );
}
