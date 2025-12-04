import UsersForm from '@/components/users/UsersForm';

export default function UsersPage() {
    return (
        <div className="p-4 h-full flex flex-col bg-white">
            {/* Title and Breadcrumb */}
            <div className="mb-4">
                <h1 className="text-xl font-bold text-gray-900 mb-1">Users</h1>
                <nav className="text-sm text-gray-500">
                    <span>Dashboard</span> / <span className="text-gray-900 font-medium">Users</span>
                </nav>
            </div>

            {/* Users Form Component */}
            <UsersForm />
        </div>
    );
}
