import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-[#0b0f19] text-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full dashboard-card rounded-3xl border border-gray-800 p-8 text-center shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-500/30 mx-auto flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-red-300" /></div>
        <h1 className="text-2xl font-extrabold text-white mt-5">Access restricted</h1>
        <p className="mt-3 text-sm text-gray-400 leading-relaxed">Your dashboard role does not have permission to access this area.</p>
        <Link href="/" className="inline-flex mt-6 px-5 py-3 rounded-xl gradient-bg text-sm font-bold text-white">Return to dashboard</Link>
      </div>
    </main>
  );
}
