import UserWalletHistory from "@/components/users/UserWalletHistory";

export default async function ViewWalletHistoryPage({ params, searchParams }) {
  // Await params in Next.js 13+ App Router
  const resolvedParams = await params;
  const id = resolvedParams?.id ? decodeURIComponent(resolvedParams.id) : "";
  const userName = searchParams?.userName;

  return (
    <div className="p-4 h-full flex flex-col bg-white">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Wallet History {userName ? `- ${userName}` : ""}
        </h1>
        <nav className="text-sm text-gray-500">
          <span>Dashboard</span> /{" "}
          <span className="text-gray-900 font-medium">Users</span>
        </nav>
      </div>
      <UserWalletHistory userId={id} userName={userName} />
    </div>
  );
}
