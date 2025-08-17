import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, XCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleResetPassword = async () => {
      if (hasProcessed.current) {
        return;
      }
      hasProcessed.current = true;

      try {
        const errorParam = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');

        if (errorParam) {
          let errorMessage = 'Password reset failed';
          
          switch (errorCode) {
            case 'otp_expired':
              errorMessage = 'The password reset link has expired. Please request a new one.';
              break;
            case 'access_denied':
              errorMessage = 'Access denied. The reset link may be invalid.';
              break;
            default:
              errorMessage = errorDescription ? decodeURIComponent(errorDescription) : 'Password reset failed';
          }
          
          setError(errorMessage);
          toast.error(errorMessage);
          setLoading(false);
          return;
        }

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        const token = searchParams.get('token');
        const tokenType = searchParams.get('type');

        
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session error:', error);
            setError(`Failed to set session: ${error.message}`);
            toast.error('Failed to authenticate reset link');
          } else {
            console.log('Session set successfully:', data);
            setSuccess(true);
            toast.success('Password reset link verified! You can now change your password.');
            
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 2000);
          }
        } else if (token && tokenType === 'recovery') {
          console.log('Processing Supabase recovery token...');
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          });

          if (error) {
            console.error('Token verification error:', error);
            setError(`Password reset failed: ${error.message}`);
            toast.error('Invalid or expired reset link');
          } else {
            console.log('Recovery token verified successfully:', data);
            setSuccess(true);
            toast.success('Password reset link verified! You can now change your password.');
            
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 2000);
          }
        } else {
          const code = searchParams.get('code');
          
          if (token || code) {
            console.log('Found alternative tokens:', { token: !!token, code: !!code });
            setError('Reset link format not supported. Please try requesting a new reset link.');
          } else {
            setError('Invalid or missing reset parameters. The link may be malformed.');
          }
          
          toast.error('Invalid reset link');
        }
      } catch (err) {
        console.error('Reset password error:', err);
        setError('Something went wrong during password reset');
        toast.error('Password reset error');
      } finally {
        setLoading(false);
      }
    };

    handleResetPassword();
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-900 to-blue-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Processing Reset Link...</h2>
          <p className="text-gray-300">Please wait while we verify your password reset request.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-900 to-blue-800">
        <div className="text-center max-w-md px-6">
          {error.includes('expired') ? (
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          ) : (
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          )}
          <h2 className="text-xl font-semibold text-white mb-4">Password Reset Issue</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/forgot-password', { replace: true })}
              className="w-full px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Request New Reset Link
            </button>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-900 to-blue-800">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Reset Link Verified!</h2>
          <p className="text-gray-300 mb-4">You can now change your password in the dashboard.</p>
          <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-900 to-blue-800">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Redirecting...</h2>
        <p className="text-gray-300">Taking you to set your new password.</p>
      </div>
    </div>
  );
};

export default ResetPassword;
