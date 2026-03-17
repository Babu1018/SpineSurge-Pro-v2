import React from 'react';
import Logo from '@/assets/Logo.png';


interface AuthLayoutProps {
    children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
            <div className="w-full max-w-md p-6 space-y-6">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <img src={Logo} alt="SpineSurge" className="h-24 w-auto" />
                    <p className="text-sm text-muted-foreground">
                        Enter your credentials to access the workspace
                    </p>
                </div>
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
