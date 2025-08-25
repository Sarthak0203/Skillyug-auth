import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, XCircle, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const ResetPasswordForm = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const code = searchParams.get('code');
    const authenticated = searchParams.get('authenticated');
    
    const initializePasswordReset = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setResetToken('authenticated');
          setLoading(false);
          toast.success('Please enter your new password below.');
          return;
        }
        
        if (authenticated === 'true' && type === 'recovery') {
          setResetToken('authenticated');
          setLoading(false);
          toast.success('Please enter your new password below.');
        }
        else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            setError('Failed to authenticate. Please try again.');
            setLoading(false);
          } else {
            setResetToken('authenticated');
            setLoading(false);
            toast.success('Please enter your new password below.');
          }
        }
        else if (code && type === 'recovery') {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            if (error.message.includes('expired') || error.message.includes('invalid_grant')) {
              setError('This password reset link has expired. Please request a new one.');
            } else {
              setError(`Failed to authenticate: ${error.message}`);
            }
            setLoading(false);
          } else {
            setResetToken('authenticated');
            setLoading(false);
            toast.success('Please enter your new password below.');
          }
        }
        else if (token && type === 'recovery') {
          setResetToken(token);
          setLoading(false);
          toast.success('Please enter your new password below.');
        } 
        else {
          setError('Invalid or missing reset token');
          setLoading(false);
        }
      } catch (error) {
        setError('Failed to initialize password reset');
        setLoading(false);
      }
    };
    
    initializePasswordReset();
  }, [searchParams]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (!resetToken) {
      toast.error('No reset token available');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (resetToken === 'authenticated') {
        const { error: updateError } = await supabase.auth.updateUser({
          password: passwordForm.newPassword
        });

        if (updateError) {
          toast.error('Failed to update password');
          return;
        }
      } 
      else if (resetToken) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: resetToken,
          type: 'recovery'
        });

        if (verifyError) {
          toast.error('Password reset link is invalid or expired');
          return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: passwordForm.newPassword
        });

        if (updateError) {
          toast.error('Failed to update password');
          return;
        }
      } else {
        toast.error('No reset token available');
        return;
      }

      toast.success('Password reset successfully! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
      
    } catch (error) {
      toast.error('Failed to reset password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-900 to-blue-800">
        <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-8 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            <span className="text-white">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-900 to-blue-800">
        <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-8 backdrop-blur-sm text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Invalid Reset Link</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => navigate('/forgot-password', { replace: true })}
              className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Request New Reset Link
            </button>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-900 to-blue-800">
      <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-8 backdrop-blur-sm w-full max-w-md">
        <div className="text-center mb-6">
          <Key className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Reset Your Password</h2>
          <p className="text-gray-300">Enter your new password below</p>
        </div>

        <div className="mb-6 p-3 bg-green-900/30 border border-green-800/50 rounded-lg">
          <p className="text-green-300 text-sm">
            Your password reset link has been verified. Please enter your new password.
          </p>
        </div>

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-4 py-3 bg-blue-800/30 border border-blue-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter new password"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-4 py-3 bg-blue-800/30 border border-blue-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Confirm new password"
              required
              minLength={6}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingPassword ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
