'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Download,
  Mail,
  User,
  Phone,
  Calendar,
  Ticket
} from 'lucide-react';

export default function TicketConfirmationPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/discover-events/tickets-booked');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <div className="mb-6 px-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Tickets
          </button>
        </div>

        {/* Email Container */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header with Brand */}
          <div className="bg-black px-8 py-6">
            <div className="flex items-center justify-center">
              {/* Centered Logo */}
              <Image
                src="/images/logo/fotter_logo.webp"
                alt="Company Logo"
                width={120}
                height={40}
                className="object-contain"
              />
            </div>
          </div>

          {/* Orange Header */}
          <div className="bg-[#FF5733] px-8 py-6">
            <h1 className="text-white text-xl font-semibold">
              Osun Osogbo Festival Fashion - Tickets
            </h1>
          </div>

          {/* Email Content */}
          <div className="px-8 py-6 space-y-6">
            {/* Email Headers */}
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="font-medium text-gray-700 w-12">To :</span>
                <span className="text-gray-600">ayofamuyiwa@gmail.com</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-12">Re :</span>
                <span className="text-gray-600">Osun Osogbo Festival Fashion - Tickets</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-12">Ref :</span>
                <span className="text-gray-900 font-medium">SP2023-CCC-NNNNN</span>
              </div>
            </div>

  <hr className="my-4 border border-gray-400" />
            {/* Greeting */}
            <div>
              <p className="text-gray-900 font-medium">Hi, Ayo Famuyiwa</p>
            </div>

            {/* Download Link */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <p className="text-gray-700 text-sm mb-2">
                Your ticket awaits — simply click the link to download and join the celebration.
              </p>
              <button 
                onClick={() => router.push('/discover-events/download-ticket')}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm underline flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Download Ticket
              </button>
            </div>

            {/* Tickets Section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Tickets</h3>
              
              <div className="space-y-3">
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
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-[#FF5733] text-lg">₦6,000.00</span>
              </div>
                <hr className="my-4 border-dashed border-gray-400" />
            </div>

            {/* Ticket Holders */}
            <div className="space-y-4">
              {/* Ticket 1 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Ticket 1</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Name</span>
                    </div>
                    <p className="font-medium text-gray-900">Oremuno Okiemute Grace</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Email Address</span>
                    </div>
                    <p className="font-medium text-gray-900">loveoktemiutu@gmail.com</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Phone Number</span>
                    </div>
                    <p className="font-medium text-gray-900">2347013462391</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Purchased on</span>
                    </div>
                    <p className="font-medium text-gray-900">Sep 23,2025</p>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-400">2*</span>
                      <span className="text-gray-600">Ticket Name</span>
                    </div>
                    <p className="font-medium text-gray-900">General Admission</p>
                  </div>
                </div>
              </div>

              {/* Ticket 2 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Ticket 2</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Name</span>
                    </div>
                    <p className="font-medium text-gray-900">Oremuno Okiemute Grace</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Email Address</span>
                    </div>
                    <p className="font-medium text-gray-900">loveoktemiutu@gmail.com</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Phone Number</span>
                    </div>
                    <p className="font-medium text-gray-900">2347013462391</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Purchased on</span>
                    </div>
                    <p className="font-medium text-gray-900">Sep 23,2025</p>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-400">2*</span>
                      <span className="text-gray-600">Ticket Name</span>
                    </div>
                    <p className="font-medium text-gray-900">General Admission</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-xs text-gray-500 italic">
              This Is An Auto Generated Email, Please Do Not Reply.
            </div>
          </div>

          {/* Orange Footer */}
          <div className="bg-[#FF5733] h-4"></div>
        </div>
      </div>
    </div>
  );
}
