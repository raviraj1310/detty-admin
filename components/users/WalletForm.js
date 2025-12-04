'use client';

import { useState } from 'react';
import { TbCaretUpDownFilled } from "react-icons/tb";
import { Wallet } from 'lucide-react';

const transactionData = [
    {
        id: 1,
        transactionDate: 'Sat, 12 June 2025, 10:00 AM',
        transactionName: 'Sapphire Bundle',
        type: 'Bundle',
        amount: '-₦15,000',
        paymentStatus: 'Completed'
    },
    {
        id: 2,
        transactionDate: 'Sat, 12 June 2025, 10:00 AM',
        transactionName: 'Fela & The Kalakuta',
        type: 'Adventure',
        amount: '+₦15,000',
        paymentStatus: 'Completed'
    },
    {
        id: 3,
        transactionDate: 'Sat, 12 June 2025, 10:00 AM',
        transactionName: 'DettyFusion Bucket',
        type: 'Adventure',
        amount: '+₦15,000',
        paymentStatus: 'Completed'
    },
    {
        id: 4,
        transactionDate: 'Sat, 12 June 2025, 10:00 AM',
        transactionName: 'Fela & The Kalakuta',
        type: 'Adventure',
        amount: '+₦15,000',
        paymentStatus: 'Incomplete'
    }
];

function ActionDropdown({ transactionId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });

    const actions = [
        {
            label: 'View Detail',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            )
        },
        {
            label: 'Download Receipt',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            label: 'Dispute Transaction',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            )
        }
    ];

    const handleButtonClick = (e) => {
        if (!isOpen) {
            const rect = e.currentTarget.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const dropdownHeight = 150;
            
            let top = rect.bottom + 8;
            let right = window.innerWidth - rect.right;
            
            if (top + dropdownHeight > windowHeight) {
                top = rect.top - dropdownHeight - 8;
            }
            
            setButtonPosition({ top, right });
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative">
            <button
                onClick={handleButtonClick}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div 
                        className="fixed w-52 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 py-2"
                        style={{
                            top: `${buttonPosition.top}px`,
                            right: `${buttonPosition.right}px`
                        }}
                    >
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                onClick={() => {
                                    console.log(`${action.label} for transaction ${transactionId}`);
                                    setIsOpen(false);
                                }}
                            >
                                <span className="mr-3 text-gray-500">{action.icon}</span>
                                <span className="text-gray-800">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default function WalletForm() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTransactions = transactionData.filter(transaction => {
        const matchesSearch = transaction.transactionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            transaction.type.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
    });

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-100 text-green-800';
            case 'Incomplete':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getAmountColor = (amount) => {
        if (amount.startsWith('-')) {
            return 'text-red-600 font-semibold';
        } else if (amount.startsWith('+')) {
            return 'text-green-600 font-semibold';
        }
        return 'text-gray-900 font-semibold';
    };

    return (
        <div className="p-4 h-screen bg-white overflow-hidden">
            {/* Balance Card */}
            <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                    <div className="flex items-center">
                        <div className="bg-white bg-opacity-20 rounded-lg p-3 mr-4">
                            <Wallet className="w-8 h-8 text-gray-900" />
                        </div>
                        <div>
                            <p className="text-sm text-blue-100 mb-1">Balance</p>
                            <p className="text-3xl font-bold">₦8,00,000</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className='bg-gray-200 p-5 rounded-xl'>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Header with Search and Filters */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-semibold text-gray-900">Transition List</h2>
                        <div className="flex items-center space-x-4">
                            {/* Search */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                                />
                                <svg className="w-5 h-5 text-gray-600 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {/* Filters */}
                            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white">
                                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                                </svg>
                                <span className="text-gray-700 font-medium">Filters</span>
                            </button>

                            {/* Download */}
                            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white">
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center">
                                        <span>Transaction Date</span>
                                        <TbCaretUpDownFilled className="w-3 h-3 text-gray-400 ml-1" />
                                    </div>
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center">
                                        <span>Transaction Name</span>
                                        <TbCaretUpDownFilled className="w-3 h-3 text-gray-400 ml-1" />
                                    </div>
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center">
                                        <span>Type</span>
                                        <TbCaretUpDownFilled className="w-3 h-3 text-gray-400 ml-1" />
                                    </div>
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center">
                                        <span>Amount</span>
                                        <TbCaretUpDownFilled className="w-3 h-3 text-gray-400 ml-1" />
                                    </div>
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center">
                                        <span>Payment Status</span>
                                        <TbCaretUpDownFilled className="w-3 h-3 text-gray-400 ml-1" />
                                    </div>
                                </th>
                                <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                   
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTransactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50 border-b border-gray-100">
                                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                                        {transaction.transactionDate}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 leading-tight">{transaction.transactionName}</div>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-900">{transaction.type}</span>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className={`text-sm ${getAmountColor(transaction.amount)}`}>{transaction.amount}</span>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(transaction.paymentStatus)}`}>
                                            {transaction.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-right relative">
                                        <ActionDropdown transactionId={transaction.id} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>
        </div>
    );
}
