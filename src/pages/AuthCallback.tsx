import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (type === 'signup' || type === 'email') {
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Email verification error:', error);
              setError('Failed to verify email. Please try again.');
              toast.error('Email verification failed');
            } else {
              setSuccess(true);
              toast.success('Email verified successfully!');
              
              setTimeout(() => {
                navigate('/dashboard', { replace: true });
              }, 2000);
            }
          } else {
            setError('Invalid verification link');
            toast.error('Invalid verification link');
          }
        } else if (type === 'recovery') {
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Password reset error:', error);
              setError('Failed to reset password. Please try again.');
              toast.error('Password reset failed');
            } else {
              toast.success('Password reset successful! Please set a new password.');
              navigate('/dashboard', { replace: true });
            }
          }
        } else {
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Auth callback error:', error);
            setError('Authentication failed');
            toast.error('Authentication failed');
          } else if (data.session) {
            setSuccess(true);
            toast.success('Authentication successful!');
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1500);
          } else {
            setError('No active session found');
            setTimeout(() => {
              navigate('/login', { replace: true });
            }, 2000);
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Something went wrong during authentication');
        toast.error('Authentication error');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-900 to-blue-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Verifying...</h2>
          <p className="text-gray-300">Please wait while we verify your email.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-900 to-blue-800">
        <div className="text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Verification Failed</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-900 to-blue-800">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Email Verified!</h2>
          <p className="text-gray-300 mb-4">Your email has been successfully verified.</p>
          <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;
