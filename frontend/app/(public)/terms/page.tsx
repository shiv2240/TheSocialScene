import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FileText } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | The Social Scene',
  description: 'Terms and conditions governing the use of The Social Scene platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#ede4d0] text-[#1e1a14] flex flex-col pb-24 md:pb-0">
      <Navbar />

      {/* Header */}
      <section className="bg-[#1e1a14] border-b-2 border-[#1e1a14]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#f7f0e3]/50 flex items-center gap-1.5">
            <FileText className="w-3 h-3" /> Legal Document
          </span>
          <h1
            style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 'clamp(48px, 10vw, 96px)', lineHeight: 0.88, color: '#f7f0e3' }}
            className="mt-1"
          >
            TERMS OF<br /><span style={{ color: '#c93a2a' }}>SERVICE</span>
          </h1>
          <p className="font-mono text-[10px] text-[#f7f0e3]/40 mt-4 uppercase tracking-widest">
            Last updated: September 2026 · Effective immediately
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1 bg-[#f7f0e3]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">

          <div className="bg-[#d4963a]/15 border-2 border-[#d4963a] rounded-2xl p-5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#d4963a]">⚠ Please Read</p>
            <p className="font-body text-sm text-[#1e1a14] mt-2 leading-relaxed">
              By accessing or using The Social Scene platform — including browsing events, registering for gatherings, or applying to become a host — you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.
            </p>
          </div>

          <Section title="1. About the Platform">
            <p>The Social Scene is a curated social experiences platform that connects individuals through shared real-world experiences including outdoor treks, fitness events, acoustic gigs, and social gatherings across India.</p>
            <p className="mt-3">We act as a marketplace between <strong>Attendees</strong> (people who join events) and <strong>Hosts</strong> (people or organisations who create events). We are not the organiser of any event unless explicitly stated.</p>
          </Section>

          <Section title="2. Eligibility">
            <ul className="space-y-1 ml-4 list-disc text-sm text-[#1e1a14]/80">
              <li>You must be at least <strong>18 years of age</strong> to use this platform.</li>
              <li>You must provide accurate, truthful information when creating an account.</li>
              <li>One account per person — you may not share or transfer your account.</li>
              <li>We reserve the right to refuse service to anyone at our discretion.</li>
            </ul>
          </Section>

          <Section title="3. Accounts & Authentication">
            <p>We use OTP-based authentication via email or phone. You are responsible for:</p>
            <ul className="mt-3 space-y-1 ml-4 list-disc text-sm text-[#1e1a14]/80">
              <li>Keeping your account secure and not sharing your OTP with anyone</li>
              <li>All activity that occurs under your account</li>
              <li>Notifying us immediately of any unauthorised access at <a href="mailto:support@thesocialscene.club" className="text-[#c93a2a] border-b border-[#c93a2a]">support@thesocialscene.club</a></li>
            </ul>
          </Section>

          <Section title="4. Event Registration & Tickets">
            <ul className="space-y-2 list-none">
              <Li label="Booking">Registrations are confirmed only upon successful payment. A QR pass will be issued to your registered email.</Li>
              <Li label="Attendance">Your QR pass is personal and non-transferable. It may be scanned only once at the event.</Li>
              <Li label="Cancellations">Cancellation and refund policies are set by individual hosts and displayed on the event page before checkout. Please review them before registering.</Li>
              <Li label="Event Changes">Hosts may modify or cancel events. In the event of a cancellation by the host, we will facilitate a full refund.</Li>
              <Li label="Conduct">You agree to behave respectfully at all events. Hosts reserve the right to remove attendees for misconduct without refund.</Li>
            </ul>
          </Section>

          <Section title="5. Payments">
            <p>All payments are processed securely via <strong>Razorpay</strong>. By completing a payment you agree to Razorpay's terms of service.</p>
            <ul className="mt-3 space-y-1 ml-4 list-disc text-sm text-[#1e1a14]/80">
              <li>Prices are displayed in Indian Rupees (INR) inclusive of applicable taxes unless stated otherwise.</li>
              <li>We do not store your card or banking details.</li>
              <li>Payment disputes must first be raised with us at <a href="mailto:support@thesocialscene.club" className="text-[#c93a2a] border-b border-[#c93a2a]">support@thesocialscene.club</a> before initiating a chargeback.</li>
            </ul>
          </Section>

          <Section title="6. Hosts & Host Applications">
            <ul className="space-y-2 list-none">
              <Li label="Application">Hosts must apply and be approved by The Social Scene before creating events.</Li>
              <Li label="Responsibility">Hosts are solely responsible for the planning, safety, and execution of their events.</Li>
              <Li label="Content">Hosts must ensure their event descriptions, pricing, and photos are accurate and not misleading.</Li>
              <Li label="Payouts">Host payouts are governed by a separate Host Agreement shared upon approval.</Li>
              <Li label="Suspension">We may suspend or remove host access for violations of these terms or our community guidelines.</Li>
            </ul>
          </Section>

          <Section title="7. Prohibited Conduct">
            <p>You agree not to:</p>
            <ul className="mt-3 space-y-1 ml-4 list-disc text-sm text-[#1e1a14]/80">
              <li>Use the platform for any unlawful purpose</li>
              <li>Resell, duplicate, or transfer tickets</li>
              <li>Create fake accounts or impersonate others</li>
              <li>Scrape, crawl, or extract platform data without written permission</li>
              <li>Post harmful, offensive, or misleading content</li>
              <li>Attempt to disrupt or compromise platform security</li>
            </ul>
          </Section>

          <Section title="8. Intellectual Property">
            <p>All content on The Social Scene — including the brand name, logo, design, and text — is owned by or licensed to us. You may not reproduce, distribute, or create derivative works without our prior written consent.</p>
            <p className="mt-3">Content you submit (event photos, descriptions) remains yours, but you grant us a non-exclusive licence to display it on the platform.</p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>To the maximum extent permitted by law:</p>
            <ul className="mt-3 space-y-1 ml-4 list-disc text-sm text-[#1e1a14]/80">
              <li>We are not liable for any injury, loss, or damage sustained at an event</li>
              <li>We are not responsible for host cancellations or event changes beyond our reasonable control</li>
              <li>Our total liability in any dispute shall not exceed the amount you paid for the relevant event</li>
            </ul>
          </Section>

          <Section title="10. Governing Law">
            <p>These Terms are governed by the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of the courts in <strong>Bengaluru, Karnataka, India</strong>.</p>
          </Section>

          <Section title="11. Changes to Terms">
            <p>We may update these Terms from time to time. Significant changes will be communicated via email. Continued use of the platform constitutes acceptance of the revised Terms.</p>
          </Section>

          <Section title="12. Contact">
            <p>Questions about these Terms? Reach us at:</p>
            <div className="mt-3 bg-[#ede4d0] border-2 border-[#1e1a14] rounded-2xl p-5 inline-block">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#c93a2a] font-bold">The Social Scene</p>
              <p className="font-body text-sm text-[#1e1a14] mt-1">support@thesocialscene.club</p>
            </div>
          </Section>

          {/* Bottom nav */}
          <div className="border-t-2 border-[#1e1a14]/12 pt-8 flex flex-wrap gap-3">
            <Link href="/privacy" className="pill pill-rust">Privacy Policy ↗</Link>
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
    <div className="border-l-4 border-[#1e1a14] pl-6 space-y-2">
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
      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#1e1a14] shrink-0 mt-0.5 w-28">{label}</span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
