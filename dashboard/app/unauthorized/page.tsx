import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-[#0b0f19] text-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-gray-800 bg-gray-900/70 p-8 text-center shadow-2xl">
        <h1 className="text-2xl font-extrabold text-white">Access denied</h1>
        <p className="mt-3 text-sm text-gray-400">
          Your account is authenticated, but it is not assigned a dashboard role.
        </p>
        <Link href="/login" className="inline-flex mt-6 px-5 py-3 rounded-xl gradient-bg text-sm font-bold text-white">
          Return to login
        </Link>
      </div>
    </main>
  );
}
