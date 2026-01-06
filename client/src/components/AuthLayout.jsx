import React from 'react';

const AuthLayout = ({ children, imageSrc }) => {
    return (
        <div className="flex min-h-screen w-full">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-primary mb-2">Fachhochschule<br />Dortmund</h1>
                        <p className="text-gray-500 text-sm">University of Applied Sciences and Arts</p>
                    </div>
                    {children}
                </div>
            </div>

            {/* Right Side - Image */}
            <div className="hidden lg:block w-1/2 relative bg-gray-100">
                <img
                    src={imageSrc}
                    alt="Campus"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>
        </div>
    );
};

export default AuthLayout;
