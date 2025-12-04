'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    ArrowLeft,
    Download,
    Printer
} from 'lucide-react';

export default function DownloadTicket() {
    const router = useRouter();

    const handleBack = () => {
        router.push('/discover-events/ticket-confirmation');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        // Logic for downloading ticket as PDF
        console.log('Downloading ticket...');
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Back Button */}
                

                {/* Ticket Container - Matching Figma Design */}
                <div className="bg-white  rounded-lg overflow-hidden print:shadow-none">
                    {/* Header with Logo and Order Info */}
                    <div className="bg-black px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center">
                            <Image
                                src="/images/logo/fotter_logo.webp"
                                alt="Company Logo"
                                width={120}
                                height={40}
                                className="object-contain"
                            />
                        </div>
                        <div className="text-white text-right text-sm">
                            <div>Order ID: 7833500287824152</div>
                            <div>Booked on: Sep 23, 2025</div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="p-6">
                        {/* Top Section - Event Info and QR Code */}
                        <div className="flex gap-6 mb-6">
                            {/* Left - Event Image and Details */}
                            <div className="flex gap-4 flex-1">
                                {/* Event Image */}
                                <div className="w-20 h-20  rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
                                    <Image
                                        src="/images/logo/ticket.png"
                                        alt="Osun Osogbo Festival"
                                        width={120}
                                        height={120}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                   
                                </div>

                                {/* Event Details */}
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                                        Osun Osogbo Festival Fashion
                                    </h2>
                                    <p className="text-gray-600 text-sm mb-1">Tuesday</p>
                                    <p className="text-gray-600 text-sm mb-1">Dec 14 • 5 pm</p>
                                    <p className="text-gray-600 text-sm">
                                        @ Landmark Event Centre, Lagos
                                    </p>
                                </div>
                            </div>

                            {/* Right - QR Code */}
                            <div className="flex-shrink-0">
                                <div className="w-24 h-24 bg-white border border-gray-300 rounded flex items-center justify-center">
                                    <div className="w-20 h-20 bg-black relative">
                                        {/* QR Code Pattern */}
                                        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
                                            {Array.from({ length: 64 }, (_, i) => (
                                                <div
                                                    key={i}
                                                    className={`${[0, 1, 2, 3, 4, 5, 6, 8, 14, 16, 22, 24, 30, 32, 38, 40, 46, 48, 49, 50, 51, 52, 53, 54, 56, 62].includes(i)
                                                        ? 'bg-black'
                                                        : 'bg-white'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 text-center mt-1">
                                    Scan to enter
                                </p>
                            </div>
                        </div>

                        {/* Tickets Section */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Tickets</h3>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">2*</span>
                                        <span className="text-sm text-gray-700">General Admission</span>
                                    </div>
                                    <span className="font-semibold text-gray-900">₦3,000.00</span>
                                </div>

                                <div className="flex justify-between items-center py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">2*</span>
                                        <span className="text-sm text-gray-700">General Admission</span>
                                    </div>
                                    <span className="font-semibold text-gray-900">₦3,000.00</span>
                                </div>
                            </div>

                            <hr className="my-4 border-dashed border-gray-400" />

                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900">Total</span>
                                <span className="font-bold text-[#FF5733] text-lg">₦6,000.00</span>
                            </div>
                            <hr className="my-4 border-dashed border-gray-400" />
                        </div>

                        {/* Ticket Holders Section */}
                        <div className="space-y-4">
                            {/* Ticket 1 */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Ticket 1</h4>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                                    <div>
                                        <span className="text-gray-600 block">Name</span>
                                        <p className="font-medium text-gray-900">Oremuno Okiemute Grace</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 block">Email Address</span>
                                        <p className="font-medium text-gray-900">loveoktemiutu@gmail.com</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 block">Phone Number</span>
                                        <p className="font-medium text-gray-900">2347013462391</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 block">Purchased on</span>
                                        <p className="font-medium text-gray-900">Sep 23,2025</p>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-600 block">Ticket Name</span>
                                        <p className="font-medium text-gray-900">General Admission</p>
                                    </div>
                                </div>
                            </div>

                            {/* Ticket 2 */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Ticket 2</h4>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                                    <div>
                                        <span className="text-gray-600 block">Name</span>
                                        <p className="font-medium text-gray-900">Oremuno Okiemute Grace</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 block">Email Address</span>
                                        <p className="font-medium text-gray-900">loveoktemiutu@gmail.com</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 block">Phone Number</span>
                                        <p className="font-medium text-gray-900">2347013462391</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 block">Purchased on</span>
                                        <p className="font-medium text-gray-900">Sep 23,2025</p>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-600 block">Ticket Name</span>
                                        <p className="font-medium text-gray-900">General Admission</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Orange Footer */}
                    <div className="bg-[#FF5733] h-3"></div>
                </div>

                {/* Print Instructions */}
                
            </div>
        </div>
    );
}
