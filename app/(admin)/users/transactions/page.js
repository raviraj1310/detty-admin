import TransactionsForm from '@/components/users/TransactionsForm';

export default function TransactionsPage() {
    return (
        <div className="p-4 h-full flex flex-col bg-white">
            {/* Title and Breadcrumb */}
            <div className="mb-4">
                <h1 className="text-xl font-bold text-gray-900 mb-1">Bookings - Oluwatobi Hassan</h1>
                <nav className="text-sm text-gray-500">
                    <span>Dashboard</span> / <span>Users</span>
                </nav>
            </div>

            {/* Transactions Form Component */}
            <TransactionsForm />
        </div>
    );
}
