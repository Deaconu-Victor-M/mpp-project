import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

export function MFAEnrollment({ onEnrolled, onCancelled }: { onEnrolled: () => void; onCancelled: () => void }) {
  const [factorId, setFactorId] = useState('');
  const [qr, setQR] = useState(''); // holds the QR code image SVG
  const [verifyCode, setVerifyCode] = useState(''); // contains the code entered by the user
  const [error, setError] = useState(''); // holds an error message
  const supabase = createClient();

  const onEnableClicked = () => {
    setError('');
    (async () => {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) {
        setError(challenge.error.message);
        throw challenge.error;
      }
      const challengeId = challenge.data.id;
      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verifyCode,
      });
      if (verify.error) {
        setError(verify.error.message);
        throw verify.error;
      }
      onEnrolled();
    })();
  };

  // Start enrollment when component mounts
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });
      if (error) {
        throw error;
      }
      setFactorId(data.id);
      // Supabase Auth returns an SVG QR code which you can convert into a data
      // URL that you can place in an <img> tag.
      setQR(data.totp.qr_code);
    })();
  }, []);

  return (
    <div className="fixed inset-0 bg-[#F7F7F7]/40 flex items-center justify-center z-50">
      <div className="bg-white border border-[#EBEBEB] rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-semibold text-[#4F4F4F] mb-4">
          Set Up Two-Factor Authentication
        </h3>
        <p className="mb-4 text-[#4F4F4F]">
          Scan this QR code with your authenticator app (like Google Authenticator or Authy)
        </p>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="flex justify-center mb-4">
          <img src={qr} alt="QR Code" className="w-48 h-48" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#4F4F4F] mb-2">
            Enter the 6-digit code from your authenticator app
          </label>
          <input
            type="text"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.trim())}
            placeholder="000000"
            className="w-full px-3 py-2 border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancelled}
            className="px-4 py-2 border border-gray-300 rounded-lg text-[#4F4F4F] hover:bg-gray-50 cursor-pointer"
          >
            Skip for now
          </button>
          <button
            onClick={onEnableClicked}
            className="px-4 py-2 bg-[#252525] text-white rounded-lg hover:bg-[#1a1a1a] cursor-pointer"
          >
            Enable 2FA
          </button>
        </div>
      </div>
    </div>
  );
} 