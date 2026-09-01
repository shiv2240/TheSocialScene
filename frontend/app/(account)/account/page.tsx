import Link from 'next/link';
import { CreditCard, HelpCircle, Mail, User, LogOut, Ticket, ChevronRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { getCurrentFirebaseUser } from '@/lib/firebase/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

const ACCOUNT_LINKS = [
  { href: '/profile', label: 'Profile', description: 'Manage your explorer profile and preferences.', Icon: User },
  { href: '/payments', label: 'Payments', description: 'View registrations, orders and payment receipts.', Icon: CreditCard },
  { href: '/tickets', label: 'My Passes', description: 'Access your confirmed event tickets and QR passes.', Icon: Ticket },
];

const FAQS = [
  ['How do I book an experience?', 'Open Explore, choose an experience, and follow the registration or payment flow on the event page.'],
  ['Where can I find my payment history?', 'Open Payments from this Account section. Your successful, pending, failed and refunded transactions are listed there.'],
  ['Where is my event ticket?', 'Open My Passes. Confirmed registrations are shown with the ticket details and QR code.'],
  ['How do I contact The Social Scene?', 'Use Contact Us below to email support@thesocialscene.club.'],
];

export default async function AccountPage() {
  const user = await getCurrentFirebaseUser();
  if (!user) redirect('/login?next=/account');

  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, onboarding_completed')
    .eq('firebase_uid', user.uid)
    .maybeSingle();

  if (!profile?.onboarding_completed) redirect('/onboarding?next=/account');

  const name = profile.full_name || user.name || 'Explorer';
  const email = user.email || profile.email || '';

  return (
    <div className="min-h-screen bg-[#0e0d12] text-[#f4ebd9] flex flex-col selection:bg-[#cb4b31] selection:text-white pb-24 md:pb-0">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <span className="font-sans-clean text-[10px] text-[#e5a83b] font-extrabold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/15 inline-block">
            ● EXPLORER ACCOUNT
          </span>
          <h1 className="font-puffy text-5xl sm:text-7xl text-white uppercase mt-2 leading-none">
            YOUR <span className="text-[#cb4b31]">ACCOUNT</span>
          </h1>
          <p className="font-sans-clean text-xs sm:text-sm text-[#f4ebd9]/70 mt-3 font-semibold">
            Hi {name.split(/\s+/)[0]}. Everything you need to manage your Social Scene account is here.
          </p>
          {email && <p className="font-mono text-[10px] text-[#f4ebd9]/45 mt-1">{email}</p>}
        </div>

        <section className="space-y-3">
          {ACCOUNT_LINKS.map(({ href, label, description, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-3xl border border-white/15 bg-[#16151c] p-5 sm:p-6 shadow-xl transition-all hover:border-[#cb4b31] hover:-translate-y-0.5"
            >
              <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#cb4b31]/10 border border-[#cb4b31]/30 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#cb4b31]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-puffy text-xl sm:text-2xl text-white uppercase">{label}</span>
                <span className="block font-sans-clean text-[11px] sm:text-xs text-[#f4ebd9]/60 mt-1 font-semibold">{description}</span>
              </span>
              <ChevronRight className="w-5 h-5 text-[#f4ebd9]/35 group-hover:text-[#cb4b31] shrink-0 transition-colors" />
            </Link>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-white/15 bg-[#16151c] p-5 sm:p-7">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><Mail className="w-5 h-5 text-[#e5a83b]" /></span>
            <div>
              <h2 className="font-puffy text-2xl text-white uppercase">Contact Us</h2>
              <p className="font-sans-clean text-[11px] text-[#f4ebd9]/55 font-semibold">Need help with a booking, payment or account?</p>
            </div>
          </div>
          <a href="mailto:support@thesocialscene.club" className="inline-flex items-center gap-2 rounded-full bg-[#cb4b31] px-5 py-3 font-sans-clean text-xs font-extrabold uppercase tracking-wider text-white hover:bg-[#e05338] transition-colors">
            Email Support ↗
          </a>
          <p className="font-mono text-[10px] text-[#f4ebd9]/45 mt-3">support@thesocialscene.club</p>
        </section>

        <section className="mt-8 rounded-3xl border border-white/15 bg-[#16151c] p-5 sm:p-7" id="faq">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><HelpCircle className="w-5 h-5 text-[#e5a83b]" /></span>
            <div>
              <h2 className="font-puffy text-2xl text-white uppercase">FAQ</h2>
              <p className="font-sans-clean text-[11px] text-[#f4ebd9]/55 font-semibold">Quick answers for common questions.</p>
            </div>
          </div>
          <div className="divide-y divide-white/10">
            {FAQS.map(([question, answer]) => (
              <details key={question} className="group py-4 first:pt-0 last:pb-0">
                <summary className="cursor-pointer list-none font-sans-clean text-xs sm:text-sm font-extrabold text-white flex items-center justify-between gap-4">
                  {question}
                  <ChevronRight className="w-4 h-4 text-[#cb4b31] transition-transform group-open:rotate-90 shrink-0" />
                </summary>
                <p className="font-sans-clean text-[11px] sm:text-xs text-[#f4ebd9]/60 leading-relaxed mt-2 pr-6">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-red-500/20 bg-red-950/10 p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <h2 className="font-puffy text-2xl text-white uppercase">Log Out</h2>
            <p className="font-sans-clean text-[11px] text-[#f4ebd9]/55 mt-1 font-semibold">End your current Social Scene session on this device.</p>
          </div>
          <LogoutButton />
        </section>
      </main>

      <Footer />
    </div>
  );
}
