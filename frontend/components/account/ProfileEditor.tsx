'use client';

import { useState } from 'react';
import { MailCheck, Save, ShieldCheck } from 'lucide-react';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { verifyBeforeUpdateEmail } from 'firebase/auth';

interface ProfileEditorProps {
  initialName: string;
  initialEmail: string;
  initialEmailVerified?: boolean;
  initialMarketingOptIn: boolean;
}

export function ProfileEditor({
  initialName,
  initialEmail,
  initialEmailVerified = false,
  initialMarketingOptIn,
}: ProfileEditorProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [emailVerified, setEmailVerified] = useState(initialEmailVerified);
  const [verificationSent, setVerificationSent] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(initialMarketingOptIn);
  const [saving, setSaving] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const refreshServerSession = async () => {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Your sign-in session has expired. Please sign in again.');

    const idToken = await currentUser.getIdToken(true);
    const sessionResponse = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ idToken }),
    });
    const sessionBody = await sessionResponse.json().catch(() => ({}));
    if (!sessionResponse.ok) throw new Error(sessionBody.error || 'Unable to refresh your session.');
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const nextEmail = email.trim().toLowerCase();
      if (nextEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
        throw new Error('Enter a valid email address.');
      }

      await refreshServerSession();

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          full_name: name.trim(),
          marketing_opt_in: marketingOptIn,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to update profile.');

      setName(body.profile?.full_name ?? name.trim());
      setMarketingOptIn(Boolean(body.profile?.marketing_opt_in));
      if (body.profile?.email) setEmail(body.profile.email);
      setEmailVerified(Boolean(body.profile?.email_verified));
      setMessage('Profile updated successfully.');
      window.dispatchEvent(new Event('tss:profile-updated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Email verification is intentionally initiated only from the email field.
  const verifyEmail = async () => {
    setSendingVerification(true);
    setMessage('');
    setError('');

    try {
      const nextEmail = email.trim().toLowerCase();
      if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
        throw new Error('Enter a valid email address first.');
      }

      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Your sign-in session has expired. Please sign in again.');

      if (currentUser.email?.toLowerCase() === nextEmail && currentUser.emailVerified) {
        setEmailVerified(true);
        setMessage('This email address is already verified.');
        return;
      }

      await verifyBeforeUpdateEmail(currentUser, nextEmail, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      });

      setVerificationSent(true);
      setMessage(`Verification link sent to ${nextEmail}. Your Firebase email and Social Scene profile will update after you verify it.`);
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code?: unknown }).code) : '';
      setError(
        code === 'auth/requires-recent-login'
          ? 'For security, please sign in again before changing your email address.'
          : code === 'auth/email-already-in-use'
            ? 'That email address is already associated with another account.'
            : code === 'auth/too-many-requests'
              ? 'Too many verification requests. Please try again later.'
              : err instanceof Error
                ? err.message
                : 'Unable to send email verification.',
      );
    } finally {
      setSendingVerification(false);
    }
  };

  return (
    <div className="space-y-5 pt-2">
      <div>
        <label htmlFor="profile-name" className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Full name</label>
        <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full px-4 py-3 rounded-xl bg-[#1d1a24] border border-white/10 text-sm text-white focus:outline-none focus:border-[#ff573d]" />
      </div>

      <div>
        <label htmlFor="profile-email" className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Email for tickets & updates</label>
        <div className="relative mt-2">
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setVerificationSent(false);
              setMessage('');
              setError('');
            }}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={emailVerified}
            className="w-full px-4 py-3 pr-28 rounded-xl bg-[#1d1a24] border border-white/10 text-sm text-white focus:outline-none focus:border-[#ff573d] disabled:opacity-80"
          />
          {!emailVerified && (
            <button
              type="button"
              onClick={verifyEmail}
              disabled={sendingVerification || saving || !email.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg bg-[#ff573d] text-white text-xs font-extrabold hover:opacity-90 disabled:opacity-50"
            >
              {sendingVerification ? 'Sending...' : 'Verify'}
            </button>
          )}
          {emailVerified && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Verified
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-gray-500">Your phone remains your sign-in method. Email is used for tickets, important updates and promotions when you opt in.</p>
        {verificationSent && !emailVerified && (
          <p className="mt-2 text-xs text-amber-300">Verification email sent. Click the link in your inbox to complete the setup.</p>
        )}
      </div>

      <label className="flex items-start gap-3 p-4 rounded-xl bg-[#1d1a24] border border-white/10 cursor-pointer">
        <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className="mt-1 accent-[#ff573d]" />
        <span><span className="text-sm font-bold text-white block">Receive promotions and recommendations</span><span className="text-xs text-gray-500">We'll only use your email for marketing when you opt in.</span></span>
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {message && <p className="text-xs text-emerald-400 flex items-center gap-1"><MailCheck className="w-3.5 h-3.5" />{message}</p>}

      <button type="button" onClick={save} disabled={saving || name.trim().length < 2} className="px-5 py-3 rounded-xl gradient-terracotta text-white text-xs font-extrabold flex items-center gap-2 disabled:opacity-50">
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
}
