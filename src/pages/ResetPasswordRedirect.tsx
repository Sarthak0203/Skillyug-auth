import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      const code = searchParams.get('code');
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const hashType = hashParams.get('type');
      const hashToken = hashParams.get('token');
      
      console.log('ResetPasswordRedirect - Search params:', { token, type, code });
      console.log('ResetPasswordRedirect - Hash params:', { 
        accessToken: !!accessToken,
        refreshToken: !!refreshToken,
        hashType, 
        hashToken,
        allHashParams: Object.fromEntries(hashParams.entries())
      });
      console.log('Full URL:', window.location.href);
      
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Current session:', !!session, error);
      
      if (accessToken && refreshToken) {
        console.log('Found auth tokens in hash, redirecting to reset form...');
        navigate(`/reset-password-form?access_token=${accessToken}&refresh_token=${refreshToken}&type=recovery`, { replace: true });
      } 
      else if (code) {
        console.log('Found authorization code, redirecting to reset form...');
        navigate(`/reset-password-form?code=${code}&type=recovery`, { replace: true });
      }
      else if (session) {
        console.log('User is already authenticated, redirecting to reset form...');
        navigate(`/reset-password-form?authenticated=true&type=recovery`, { replace: true });
      }
      else if ((token || hashToken) && (type === 'recovery' || hashType === 'recovery')) {
        console.log('Found recovery token, redirecting to reset form...');
        const finalToken = token || hashToken;
        navigate(`/reset-password-form?token=${finalToken}&type=recovery`, { replace: true });
      } 
      else if (searchParams.get('error') || hashParams.get('error')) {
        const error = searchParams.get('error') || hashParams.get('error');
        const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');
        console.log('Found error in URL:', error, errorDescription);
        navigate(`/forgot-password?error=${error}`, { replace: true });
      }
      else {
        console.log('No valid token and no session, redirecting to forgot password');
        console.log('Available params:', { 
          searchParams: Object.fromEntries(searchParams.entries()),
          hashParams: Object.fromEntries(hashParams.entries()),
          session: !!session
        });
        navigate('/forgot-password', { replace: true });
      }
      
      setAuthChecked(true);
    };

    if (!authChecked) {
      checkAuthAndRedirect();
    }
  }, [navigate, searchParams, authChecked]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-900 to-blue-800">
      <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-8 backdrop-blur-sm max-w-md">
        <div className="flex items-center space-x-3 mb-4">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <span className="text-white">Redirecting...</span>
        </div>
        
        <div className="text-xs text-gray-400 space-y-1">
          <div>URL: {window.location.href}</div>
          <div>Search Params: {JSON.stringify(Object.fromEntries(searchParams.entries()))}</div>
          <div>Hash: {window.location.hash}</div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
