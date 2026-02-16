'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 3000,
                style: {
                    background: 'rgba(20, 20, 20, 0.95)',
                    color: '#EDEDED',
                    border: '1px solid rgba(38, 38, 38, 0.8)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)',
                    fontSize: '13px',
                    padding: '12px 16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                },
                success: {
                    iconTheme: {
                        primary: '#10B981',
                        secondary: '#141414',
                    },
                    style: {
                        borderColor: 'rgba(16, 185, 129, 0.3)',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#EF4444',
                        secondary: '#141414',
                    },
                    style: {
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                    },
                    duration: 4000,
                },
            }}
        />
    );
}
