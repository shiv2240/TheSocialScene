'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Globe2, Users, CalendarDays, ShieldCheck, Loader2, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const EVENT_TYPES = [
  'Sunset Runs & Fitness',
  'Outdoor Treks & Hikes',
  'Music & Acoustic Gigs',
  'Supper & Culinary',
  'Tech & Mixers',
  'Art & Workshops',
  'Other'
];

export default function BecomeAHostPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    organization_name: '',
    city: '',
    event_types: [] as string[],
    experience: '',
    proposed_event: '',
    expected_frequency: '',
    instagram: '',
    website: '',
    why_host: '',
    website_check: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleEventType = (type: string) =>
    setForm((current) => ({
      ...current,
      event_types: current.event_types.includes(type)
        ? current.event_types.filter((item) => item !== type)
        : [...current.event_types, type]
    }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.event_types.length) return setError('Select at least one event type.');
    if (form.why_host.trim().length < 20)
      return setError('Tell us a little more about why you want to host.');

    setSubmitting(true);
    try {
      const response = await fetch('/api/host-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to submit application.');
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0d12] text-[#f4ebd9] flex flex-col selection:bg-[#cb4b31] selection:text-white pb-24 md:pb-0">
      <Navbar />

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white font-sans-clean font-extrabold text-xs uppercase tracking-wider shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#cb4b31]" /> ● HOST ONBOARDING
            </span>
            <h1 className="mt-4 font-puffy text-4xl sm:text-7xl text-white uppercase leading-[0.9]">
              TURN YOUR COMMUNITY INTO AN <span className="text-[#cb4b31]">EXPERIENCE</span>.
            </h1>
            <p className="mt-3 font-sans-clean text-sm sm:text-lg text-[#f4ebd9]/80 leading-relaxed max-w-2xl font-semibold">
              Apply to host gatherings on The Social Scene. Create sunset run clubs, rooftop gigs, outdoor mountain treks, and secret pop-ups.
            </p>
          </div>

          <div className="grid lg:grid-cols-[0.75fr_1.25fr] gap-8 mt-12 items-start">
            <div className="space-y-4 lg:sticky lg:top-28">
              {[
                [Users, 'Build your own club', 'Create events around the people and experiences you genuinely care about.'],
                [CalendarDays, 'Dashboard & Pass Sales', 'Manage registrations, tickets and track event attendance.'],
                [CheckCircle2, 'Verified community', 'Protected check-in with verified attendee QR passes.']
              ].map(([Icon, title, text]) => {
                const FeatureIcon = Icon as typeof Users;
                return (
                  <div key={title as string} className="bg-[#16151c] p-6 rounded-3xl border border-white/15 shadow-xl space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#cb4b31] text-white flex items-center justify-center border border-white/20">
                      <FeatureIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-puffy text-xl text-white">{title as string}</h3>
                    <p className="font-sans-clean text-xs text-[#f4ebd9]/70 leading-relaxed font-semibold">{text as string}</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#16151c] rounded-3xl border border-white/20 p-6 sm:p-10 shadow-2xl">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-950/50 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="font-puffy text-3xl text-white uppercase">Application Received</h2>
                  <p className="font-sans-clean text-xs sm:text-sm text-[#f4ebd9]/80 leading-relaxed max-w-md mx-auto font-semibold">
                    Our team will review your application. If approved, we will send an invitation to your email address.
                  </p>
                  <Link
                    href="/events"
                    className="inline-flex items-center gap-2 mt-4 px-8 py-3.5 rounded-full bg-[#cb4b31] text-xs font-bold uppercase tracking-wider text-white font-sans-clean shadow-sm border border-white/20"
                  >
                    [ Explore Gatherings ↗ ]
                  </Link>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-6">
                  <div>
                    <span className="font-sans-clean text-[10px] text-[#e5a83b] font-extrabold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/15 inline-block">
                      ● APPLICATION FORM
                    </span>
                    <h2 className="font-puffy text-3xl text-white uppercase mt-2">
                      HOST ONBOARDING
                    </h2>
                    <p className="font-sans-clean text-xs text-[#f4ebd9]/70 mt-1 font-semibold">
                      Tell us enough to understand what experience you want to build.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Full name" value={form.full_name} onChange={(value) => update('full_name', value)} required />
                    <Field label="Email address" type="email" value={form.email} onChange={(value) => update('email', value)} required />
                    <Field label="Phone number" value={form.phone} onChange={(value) => update('phone', value)} />
                    <Field label="City" value={form.city} onChange={(value) => update('city', value)} required />
                    <Field label="Organization / community" value={form.organization_name} onChange={(value) => update('organization_name', value)} />
                    <Field label="Expected frequency" placeholder="e.g. 2 events / month" value={form.expected_frequency} onChange={(value) => update('expected_frequency', value)} />
                  </div>

                  <div>
                    <label className="font-sans-clean text-xs font-extrabold text-white block mb-2 uppercase tracking-wider">
                      What do you want to host?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {EVENT_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleEventType(type)}
                          className={`px-4 py-2 rounded-full font-sans-clean text-xs font-extrabold uppercase tracking-wider border transition-colors ${
                            form.event_types.includes(type)
                              ? 'bg-[#cb4b31] text-white border-[#cb4b31] shadow-xs'
                              : 'bg-white/5 text-[#f4ebd9] border-white/15 hover:border-white'
                          }`}
                        >
                          [ {type} ]
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <TextArea label="Previous hosting experience" value={form.experience} onChange={(value) => update('experience', value)} placeholder="Tell us about communities, events or experiences you have organized." />
                    <TextArea label="Proposed event" value={form.proposed_event} onChange={(value) => update('proposed_event', value)} placeholder="What is the first event you would like to run on The Social Scene?" />
                    <TextArea label="Why do you want to become a host?" value={form.why_host} onChange={(value) => update('why_host', value)} placeholder="What makes your event or community valuable to our audience?" required />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Instagram" value={form.instagram} onChange={(value) => update('instagram', value)} icon={<InstagramIcon className="w-4 h-4" />} />
                    <Field label="Website / community link" value={form.website} onChange={(value) => update('website', value)} icon={<Globe2 className="w-4 h-4" />} />
                  </div>

                  <div className="hidden" aria-hidden="true">
                    <input tabIndex={-1} autoComplete="off" value={form.website_check} onChange={(event) => update('website_check', event.target.value)} />
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-red-500 bg-red-950/40 px-4 py-3 text-xs text-red-400 font-sans-clean font-bold">
                      {error}
                    </div>
                  )}

                  <button
                    disabled={submitting}
                    className="w-full py-4 rounded-full bg-[#cb4b31] hover:bg-[#e05338] font-sans-clean text-xs font-extrabold tracking-wider text-white uppercase shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 border border-white/20"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting Application...
                      </>
                    ) : (
                      <>
                        [ Submit Host Application ↗ ]
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  icon
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <label className="space-y-1 block">
      <span className="font-sans-clean text-[11px] font-extrabold text-[#f4ebd9] block uppercase tracking-wider">
        {label}
        {required && ' *'}
      </span>
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          className={`w-full ${icon ? 'pl-10' : 'px-4'} py-3 rounded-2xl bg-white/5 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#cb4b31] focus:bg-[#16151c] font-sans-clean font-semibold transition-colors`}
        />
      </div>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-1 block">
      <span className="font-sans-clean text-[11px] font-extrabold text-[#f4ebd9] block uppercase tracking-wider">
        {label}
        {required && ' *'}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        rows={3}
        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#cb4b31] focus:bg-[#16151c] font-sans-clean font-semibold transition-colors resize-y"
      />
    </label>
  );
}
