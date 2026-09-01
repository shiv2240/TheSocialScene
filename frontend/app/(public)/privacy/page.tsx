import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | The Social Scene',
  description: 'How The Social Scene collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#ede4d0] text-[#1e1a14] flex flex-col pb-24 md:pb-0">
      <Navbar />

      {/* Header */}
      <section className="bg-[#c93a2a] border-b-2 border-[#1e1a14]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#f7f0e3]/70 flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> Legal Document
          </span>
          <h1
            style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 'clamp(48px, 10vw, 96px)', lineHeight: 0.88, color: '#f7f0e3' }}
            className="mt-1"
          >
            PRIVACY<br />POLICY
          </h1>
          <p className="font-mono text-[10px] text-[#f7f0e3]/60 mt-4 uppercase tracking-widest">
            Last updated: September 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1 bg-[#f7f0e3]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">

          <Section title="1. Who We Are">
            <p>The Social Scene ("<strong>we</strong>", "<strong>us</strong>", "<strong>our</strong>") is a curated social experiences platform operated from India. We connect people through shared outdoor treks, sunset run clubs, rooftop acoustic gigs, and other social gatherings.</p>
            <p className="mt-3">Our registered email: <a href="mailto:support@thesocialscene.club" className="text-[#c93a2a] border-b border-[#c93a2a]">support@thesocialscene.club</a></p>
          </Section>

          <Section title="2. Information We Collect">
            <ul className="space-y-2 list-none">
              <Li label="Account Information">Your full name, email address, and phone number when you register or update your profile.</Li>
              <Li label="Event Registrations">Which events you register for, payment amounts, and ticket details.</Li>
              <Li label="Host Applications">If you apply to host events, we collect your name, contact details, social profiles, and event proposals.</Li>
              <Li label="Payment Data">We use Razorpay to process payments. We do not store your card details — only the order ID, payment status, and amount.</Li>
              <Li label="Usage Data">Browser type, IP address, pages visited, and session duration collected via server logs.</Li>
              <Li label="Communications">Any emails or messages you send us.</Li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="space-y-2 list-none">
              <Li label="Event Access">To register you for events, send QR pass confirmations, and manage check-in.</Li>
              <Li label="Payments">To process your registration fees securely via Razorpay.</Li>
              <Li label="Communications">To send booking confirmations, event reminders, and updates about your account.</Li>
              <Li label="Platform Improvement">To understand how people use the platform and improve our experience.</Li>
              <Li label="Host Onboarding">To review and respond to host applications.</Li>
              <Li label="Legal Compliance">To comply with applicable Indian laws and regulations.</Li>
            </ul>
          </Section>

          <Section title="4. Data Sharing">
            <p>We do not sell your personal data. We share information only with:</p>
            <ul className="mt-3 space-y-2 list-none">
              <Li label="Razorpay">For payment processing. Governed by Razorpay's privacy policy.</Li>
              <Li label="Supabase">Our database provider (hosted on AWS). Data is stored securely with row-level security.</Li>
              <Li label="Resend">For transactional emails (booking confirmations, OTPs).</Li>
              <Li label="Firebase">For authentication services.</Li>
              <Li label="Event Hosts">Your name and contact details are shared with the host of an event you register for, solely for check-in and coordination purposes.</Li>
              <Li label="Legal Requirements">If required by law, court order, or government authority.</Li>
            </ul>
          </Section>

          <Section title="5. Data Storage & Security">
            <p>Your data is stored on servers located in India and/or the United States (AWS). We implement industry-standard security measures including:</p>
            <ul className="mt-3 space-y-1 ml-4 list-disc text-sm text-[#1e1a14]/80">
              <li>Row-level security on all database tables</li>
              <li>Encrypted connections (HTTPS/TLS) for all data in transit</li>
              <li>Secure OTP-based authentication — no passwords stored</li>
              <li>API keys stored as server-side environment variables only</li>
            </ul>
          </Section>

          <Section title="6. Your Rights">
            <p>Under applicable law, you have the right to:</p>
            <ul className="mt-3 space-y-1 ml-4 list-disc text-sm text-[#1e1a14]/80">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Withdraw consent for marketing communications at any time</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, email us at <a href="mailto:support@thesocialscene.club" className="text-[#c93a2a] border-b border-[#c93a2a]">support@thesocialscene.club</a>. We will respond within 30 days.</p>
          </Section>

          <Section title="7. Cookies">
            <p>We use session cookies and local storage for authentication only. We do not use third-party tracking cookies or advertising cookies.</p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>Our platform is not intended for users under the age of 18. We do not knowingly collect data from minors. If you believe a minor has provided us with personal data, please contact us immediately.</p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify registered users of significant changes via email. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>
          </Section>

          <Section title="10. Contact Us">
            <p>For any privacy-related questions or concerns:</p>
            <div className="mt-3 bg-[#ede4d0] border-2 border-[#1e1a14] rounded-2xl p-5 inline-block">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#c93a2a] font-bold">The Social Scene</p>
              <p className="font-body text-sm text-[#1e1a14] mt-1">support@thesocialscene.club</p>
            </div>
          </Section>

          {/* Bottom nav */}
          <div className="border-t-2 border-[#1e1a14]/12 pt-8 flex flex-wrap gap-3">
            <Link href="/terms" className="pill pill-rust">Terms of Service ↗</Link>
            <Link href="/" className="pill">← Back to Home</Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-[#c93a2a] pl-6 space-y-2">
      <h2 style={{ fontFamily: 'Oswald, sans-serif' }} className="text-xl sm:text-2xl font-bold text-[#1e1a14] uppercase tracking-wide">
        {title}
      </h2>
      <div className="font-body text-sm text-[#1e1a14]/80 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function Li({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-sm text-[#1e1a14]/80">
      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#c93a2a] shrink-0 mt-0.5 w-28">{label}</span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
