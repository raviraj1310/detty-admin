'use client';

import { useEffect, useState } from 'react';
import { getLoginUser } from '@/services/auth/login.service';

export default function ProfileForm() {
    const [formData, setFormData] = useState({
        // Personal Information
        firstName: 'Oromuno',
        lastName: 'Okiemute',
        countryOfCitizenship: 'Nigeria',
        emailAddress: 'Loveoklemiude@gmail.com',
        phoneNumber: '+234 703 1362 591',
        countryOfResidence: 'Nigeria',
        
        // Address
        homeAddress: 'No13 Adekunle Yaba',
        postalCode: '101101',
        addressCountryOfCitizenship: 'Nigeria',
        
        // Other Details
        otherFirstName: 'Oromuno',
        otherLastName: 'Okiemute',
        otherCountryOfCitizenship: 'Nigeria',
        otherEmailAddress: 'Loveoklemiude@gmail.com',
        otherPhoneNumber: '+234 703 1362 591',
        otherCountryOfResidence: 'Nigeria'
    });
    const [avatar, setAvatar] = useState('/images/user_dashboard/user_photo.webp');

    useEffect(() => {
        const load = async () => {
            try {
                const uid = typeof window !== 'undefined'
                    ? (localStorage.getItem('userId') || sessionStorage.getItem('userId') || (() => {
                        try { const u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null'); return u?._id || '' } catch { return '' }
                    })())
                    : '';
                if (!uid) return;
                const res = await getLoginUser(uid);
                const d = res?.data || res || {};
                const fullName = String(d?.name || '').trim();
                const parts = fullName.split(/\s+/);
                const firstName = parts[0] || '';
                const lastName = parts.slice(1).join(' ') || '';
                const emailAddress = String(d?.email || '').trim();
                const phoneNumber = String(d?.phoneNumber || d?.phone || '').trim();
                const profileImage = d?.profileImage || '';
                setFormData(prev => ({
                    ...prev,
                    firstName: firstName || prev.firstName,
                    lastName: lastName || prev.lastName,
                    emailAddress: emailAddress || prev.emailAddress,
                    phoneNumber: phoneNumber || prev.phoneNumber
                }));
                setAvatar(profileImage || '/images/user_dashboard/user_photo.webp');
            } catch {}
        };
        load();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="flex-1 overflow-auto">
            {/* User Profile Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                    <img 
                        src={avatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">{`${formData.firstName} ${formData.lastName}`.trim()}</h2>
                    <p className="text-sm text-gray-600">{formData.emailAddress}</p>
                </div>
            </div>

            {/* Personal Information Section */}
            <div className="mb-8">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs text-gray-600 mb-2">First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-2">Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-2">Country of Citizenship</label>
                        <input
                            type="text"
                            name="countryOfCitizenship"
                            value={formData.countryOfCitizenship}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-2">Email Address</label>
                        <input
                            type="email"
                            name="emailAddress"
                            value={formData.emailAddress}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-2">Phone Number</label>
                        <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-2">Country of Residence</label>
                        <input
                            type="text"
                            name="countryOfResidence"
                            value={formData.countryOfResidence}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Address Section */}
            <div className="mb-8">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Address</h3>
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs text-gray-600 mb-2">Home Address</label>
                        <input
                            type="text"
                            name="homeAddress"
                            value={formData.homeAddress}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-2">Postal Code</label>
                        <input
                            type="text"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-2">Country of Citizenship</label>
                        <input
                            type="text"
                            name="addressCountryOfCitizenship"
                            value={formData.addressCountryOfCitizenship}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Other Details Section */}
            <div className="mb-8">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Other Details</h3>
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs text-gray-600 mb-2">First Name</label>
                        <input
                            type="text"
                            name="otherFirstName"
                            value={formData.otherFirstName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-2">Last Name</label>
                        <input
                            type="text"
                            name="otherLastName"
                            value={formData.otherLastName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-2">Country of Citizenship</label>
                        <input
                            type="text"
                            name="otherCountryOfCitizenship"
                            value={formData.otherCountryOfCitizenship}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-2">Email Address</label>
                        <input
                            type="email"
                            name="otherEmailAddress"
                            value={formData.otherEmailAddress}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-2">Phone Number</label>
                        <input
                            type="tel"
                            name="otherPhoneNumber"
                            value={formData.otherPhoneNumber}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-2">Country of Residence</label>
                        <input
                            type="text"
                            name="otherCountryOfResidence"
                            value={formData.otherCountryOfResidence}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
