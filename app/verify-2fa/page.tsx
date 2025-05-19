"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function Verify2FAPage() {
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [factorId, setFactorId] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/sign-in');
        return;
      }

      // Check if 2FA is required
      const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (mfaData?.currentLevel === 'aal2') {
        // User is already authenticated with 2FA
        router.push('/protected');
        return;
      }

      if (mfaData?.currentLevel !== 'aal1' || mfaData?.nextLevel !== 'aal2') {
        // 2FA is not required
        router.push('/protected');
        return;
      }

      // Get the user's factors
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];
      
      if (!totpFactor) {
        // No TOTP factor found, redirect to protected
        router.push('/protected');
        return;
      }

      setFactorId(totpFactor.id);
    };

    checkSession();
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      // Success! Redirect to protected page
      toast.success('2FA verification successful!');
      router.push('/protected');
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
      toast.error('Invalid verification code');
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-12 items-center justify-center min-h-screen bg-[#F7F7F7]">
      <div className="bg-white border border-[#EBEBEB] rounded-xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-semibold text-[#4F4F4F] mb-6 text-center">
          Two-Factor Authentication
        </h1>
        
        <p className="text-[#4F4F4F] mb-6 text-center">
          Please enter the 6-digit code from your authenticator app
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-[#4F4F4F] mb-2">
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.trim())}
              placeholder="000000"
              className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={6}
              pattern="[0-9]*"
              inputMode="numeric"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-[#252525] text-white rounded-lg hover:bg-[#1a1a1a] cursor-pointer transition-colors"
          >
            Verify
          </button>
        </form>
      </div>
    </div>
  );
} 