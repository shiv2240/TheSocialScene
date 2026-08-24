'use client';

import { useState } from 'react';
import { MailCheck, Save } from 'lucide-react';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { updateEmail, sendEmailVerification } from 'firebase/auth';

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
      const currentAuthUser = getFirebaseAuth().currentUser;
      if (!currentAuthUser) throw new Error('Your sign-in session has expired. Please sign in again.');

      const emailChanged = nextEmail !== (currentAuthUser.email || '').toLowerCase();

      if (emailChanged && nextEmail) {
        try {
          await updateEmail(currentAuthUser, nextEmail);
        } catch (firebaseError) {
          const code = firebaseError && typeof firebaseError === 'object' && 'code' in firebaseError
            ? String((firebaseError as { code?: unknown }).code)
            : '';
          if (code === 'auth/requires-recent-login') {
            throw new Error('For security, please sign in again before changing your email address.');
          }
          if (code === 'auth/email-already-in-use') {
            throw new Error('That email address is already associated with another account.');
          }
          throw firebaseError;
        }

        setEmailVerified(false);
        setVerificationSent(false);
      }

      await refreshServerSession();

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          full_name: name.trim(),
          email: nextEmail,
          marketing_opt_in: marketingOptIn,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to update profile.');

      setName(body.profile?.full_name ?? name.trim());
      setEmail(body.profile?.email ?? nextEmail);
      setEmailVerified(Boolean(body.profile?.email_verified));
      setMarketingOptIn(Boolean(body.profile?.marketing_opt_in));
      setMessage(
        emailChanged && nextEmail
          ? 'Email saved. Click “Verify Email” to receive the verification link.'
          : 'Profile updated successfully.',
      );
      window.dispatchEvent(new Event('tss:profile-updated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const sendVerification = async () => {
    setSendingVerification(true);
    setMessage('');
    setError('');

    try {
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;
      if (!currentUser?.email) throw new Error('Add an email address first.');

      await sendEmailVerification(currentUser, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      });

      setVerificationSent(true);
      setMessage(`Verification email sent to ${currentUser.email}. Check your inbox and click the verification link.`);
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code?: unknown }).code) : '';
      setError(
        code === 'auth/too-many-requests'
          ? 'Too many verification requests. Please try again later.'
          : err instanceof Error
            ? err.message
            : 'Unable to send verification email.',
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
        <input id="profile-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setVerificationSent(false); }} placeholder="you@example.com" autoComplete="email" className="mt-2 w-full px-4 py-3 rounded-xl bg-[#1d1a24] border border-white/10 text-sm text-white focus:outline-none focus:border-[#ff573d]" />
        <p className="mt-1 text-[11px] text-gray-500">Your phone remains your sign-in method. Email is used for tickets, important updates and promotions when you opt in.</p>
        {email && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1d1a24] px-4 py-3">
            {emailVerified ? (
              <span className="text-xs font-semibold text-emerald-400">✓ Email verified</span>
            ) : (
              <>
                <span className={`text-xs font-semibold ${verificationSent ? 'text-amber-300' : 'text-gray-300'}`}>
                  {verificationSent ? 'Verification email sent' : 'Email not verified'}
                </span>
                <button type="button" onClick={sendVerification} disabled={sendingVerification || saving} className="text-xs font-bold text-purple-300 hover:text-white disabled:opacity-50">
                  {sendingVerification ? 'Sending...' : verificationSent ? 'Resend verification' : 'Verify Email'}
                </button>
              </>
            )}
          </div>
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
