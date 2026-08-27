import Link from 'next/link';
import { Mail, Phone, Ticket, CalendarDays, AtSign } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { ProfileEditor } from '@/components/account/ProfileEditor';
import { getCurrentFirebaseUser } from '@/lib/firebase/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export default async function UserProfilePage() {
  const user = await getCurrentFirebaseUser();
  if (!user) redirect('/login');

  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, age, onboarding_completed, phone, phone_verified, email, email_verified, marketing_opt_in, status, created_at')
    .eq('firebase_uid', user.uid)
    .maybeSingle();

  if (!profile?.onboarding_completed) redirect('/onboarding?next=/profile');

  const fullName = profile.full_name || user.name || 'The Social Scene Member';
  const initials = fullName.split(' ').filter(Boolean).slice(0, 2).map((part: string) => part[0]?.toUpperCase()).join('') || 'TS';
  const joinedDate = profile.created_at ? new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(profile.created_at)) : 'Recently';
  const firebaseEmail = user.email || profile.email || '';
  const firebaseEmailVerified = Boolean(user.email_verified);

  return (
    <div className="min-h-screen bg-[#141217] text-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-8"><span className="text-xs uppercase tracking-widest font-bold text-[#e59838]">Account Settings</span><h1 className="text-3xl font-black text-white mt-1">Explorer Profile</h1></div>
        <div className="glass-card p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center gap-6 pb-6 border-b border-white/10"><div className="w-20 h-20 rounded-full gradient-terracotta flex items-center justify-center text-white font-black text-2xl shadow-xl">{initials}</div><div className="space-y-1"><h2 className="text-xl font-extrabold text-white">{fullName}</h2><span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 inline-block">{profile.status === 'ACTIVE' ? 'VERIFIED EXPLORER' : profile.status || 'MEMBER'}</span><p className="text-xs text-gray-400">Member since {joinedDate}</p></div></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#1d1a24] border border-white/10 space-y-1"><span className="text-xs text-gray-400 font-semibold uppercase block flex items-center gap-1.5"><AtSign className="w-3.5 h-3.5 text-[#c85a3c]" />Social ID</span><span className="text-sm font-bold text-white block">@{profile.username}</span><span className="text-[11px] text-gray-500 block">Permanent account identifier</span></div>
            <div className="p-4 rounded-2xl bg-[#1d1a24] border border-white/10 space-y-1"><span className="text-xs text-gray-400 font-semibold uppercase block flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-[#e59838]" />Age</span><span className="text-sm font-bold text-white block">{profile.age}</span><span className="text-[11px] text-gray-500 block">Set during onboarding</span></div>
            <div className="p-4 rounded-2xl bg-[#1d1a24] border border-white/10 space-y-1"><span className="text-xs text-gray-400 font-semibold uppercase block flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#c85a3c]" />Phone Number</span><span className="text-sm font-bold text-white block">{profile.phone || user.phone_number || 'Not available'} {profile.phone_verified ? '✓' : ''}</span></div>
            <div className="p-4 rounded-2xl bg-[#1d1a24] border border-white/10 space-y-1"><span className="text-xs text-gray-400 font-semibold uppercase block flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#e59838]" />Email Address</span><span className="text-sm font-bold text-white block">{firebaseEmail || 'Not provided'} {firebaseEmailVerified ? '✓' : ''}</span></div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#1d1a24] p-4"><p className="text-xs font-bold text-white">Identity fields are locked</p><p className="mt-1 text-[11px] text-gray-500">Your full name, age and Social ID are permanent account identity fields. They cannot be edited from Profile.</p></div>
          <ProfileEditor initialEmail={firebaseEmail} initialEmailVerified={firebaseEmailVerified} initialMarketingOptIn={Boolean(profile.marketing_opt_in)} />
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3"><Link href="/tickets" className="px-6 py-3 rounded-2xl gradient-terracotta text-xs font-extrabold text-white shadow-lg flex items-center gap-2"><Ticket className="w-4 h-4" />View My Digital Passes</Link><LogoutButton /></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
