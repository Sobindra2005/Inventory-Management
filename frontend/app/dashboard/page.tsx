'use client';
import { useState } from 'react';




export default function DashboardPage() {
    const [loading, setLoading] = useState(false);

    return (
        <div className="min-h-screen ">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold ">Dashboard</h1>
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Cards will go here */}
                </div>

                <div className="mt-8">
                    {/* Main content area */}
                </div>
            </div>
        </div>
    );
}