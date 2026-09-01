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
    <div className="min-h-screen bg-[#0e0d12] text-[#f4ebd9] flex flex-col selection:bg-[#cb4b31] selection:text-white pb-24 md:pb-0">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <div className="mb-8">
          <span className="font-sans-clean text-[10px] text-[#e5a83b] font-extrabold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/15 inline-block">
            ● ACCOUNT & IDENTITY
          </span>
          <h1 className="font-puffy text-4xl sm:text-6xl text-white uppercase mt-2">
            EXPLORER <span className="text-[#cb4b31]">PROFILE</span>
          </h1>
        </div>

        <div className="bg-[#16151c] p-6 sm:p-10 rounded-3xl border border-white/20 shadow-2xl space-y-6">
          <div className="flex items-center gap-5 sm:gap-6 pb-6 border-b border-white/10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#cb4b31] border border-white/20 flex items-center justify-center text-white font-puffy text-2xl sm:text-3xl font-black shadow-md flex-shrink-0">
              {initials}
            </div>
            <div className="space-y-1">
              <h2 className="font-puffy text-2xl sm:text-3xl text-white">{fullName}</h2>
              <span className="px-3 py-0.5 rounded-full font-sans-clean text-[10px] font-extrabold tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 inline-block uppercase">
                {profile.status === 'ACTIVE' ? '● VERIFIED EXPLORER' : profile.status || 'MEMBER'}
              </span>
              <p className="font-sans-clean text-xs text-[#f4ebd9]/70 font-semibold">Member since {joinedDate}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] font-extrabold text-[#f4ebd9]/60 block uppercase tracking-wider font-sans-clean flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-[#cb4b31]" /> Social ID
              </span>
              <span className="font-sans-clean text-sm font-extrabold text-white block">@{profile.username}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] font-extrabold text-[#f4ebd9]/60 block uppercase tracking-wider font-sans-clean flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-[#e5a83b]" /> Age
              </span>
              <span className="font-sans-clean text-sm font-extrabold text-white block">{profile.age}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] font-extrabold text-[#f4ebd9]/60 block uppercase tracking-wider font-sans-clean flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#cb4b31]" /> Phone Number
              </span>
              <span className="font-sans-clean text-sm font-extrabold text-white block">
                {profile.phone || user.phone_number || 'Not available'} {profile.phone_verified ? '✓' : ''}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] font-extrabold text-[#f4ebd9]/60 block uppercase tracking-wider font-sans-clean flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#e5a83b]" /> Email Address
              </span>
              <span className="font-sans-clean text-sm font-extrabold text-white block truncate">
                {firebaseEmail || 'Not provided'} {firebaseEmailVerified ? '✓' : ''}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-sans-clean text-xs font-extrabold text-white">IDENTITY FIELDS ARE LOCKED</p>
            <p className="mt-0.5 font-sans-clean text-[11px] text-[#f4ebd9]/70 font-semibold">
              Your full name, age, and Social ID are locked to your member profile.
            </p>
          </div>

          <ProfileEditor
            initialEmail={firebaseEmail}
            initialEmailVerified={firebaseEmailVerified}
            initialMarketingOptIn={Boolean(profile.marketing_opt_in)}
          />

          <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/tickets"
              className="px-7 py-3.5 rounded-full bg-[#cb4b31] hover:bg-[#e05338] font-sans-clean font-extrabold text-xs tracking-wider text-white uppercase shadow-md flex items-center gap-2 transition-colors border border-white/20"
            >
              <Ticket className="w-4 h-4" /> [ View My Digital Passes ↗ ]
            </Link>
            <LogoutButton />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
