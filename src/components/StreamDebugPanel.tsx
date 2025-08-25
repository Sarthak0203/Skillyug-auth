import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AlertTriangle, CheckCircle, Database } from 'lucide-react';

export const StreamDebugPanel = () => {
  const { user, profile } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runDiagnostics = async () => {
    setIsChecking(true);
    const info: any = {
      user: {
        exists: !!user,
        id: user?.id,
        email: user?.email,
        authenticated: !!user
      },
      profile: {
        exists: !!profile,
        userType: profile?.user_type,
        canStream: profile?.user_type === 'admin' || profile?.user_type === 'instructor',
        fullName: profile?.full_name
      },
      database: {
        liveStreamsExists: false,
        recordedStreamsExists: false,
        canQuery: false,
        canInsert: false,
        hasEndedAtField: false,
        lastError: null
      }
    };

    try {
      // Test live_streams table existence
      const { error: liveError } = await supabase
        .from('live_streams')
        .select('id')
        .limit(1);
      
      info.database.liveStreamsExists = !liveError;
      if (liveError) {
        info.database.lastError = `Live streams: ${liveError.message}`;
      }

      // Test if ended_at field exists
      if (info.database.liveStreamsExists) {
        const { error: endedAtError } = await supabase
          .from('live_streams')
          .select('ended_at')
          .limit(1);
        
        info.database.hasEndedAtField = !endedAtError;
      }

      // Test basic query
      const { error: queryError } = await supabase
        .from('live_streams')
        .select('*')
        .limit(1);

      if (queryError) {
        info.database.canQuery = false;
        info.database.lastError = `Query failed: ${queryError.message}`;
      } else {
        info.database.canQuery = true;
      }

      // Test recorded_streams table  
      const { error: recordedError } = await supabase
        .from('recorded_streams')
        .select('id')
        .limit(1);
      
      info.database.recordedStreamsExists = !recordedError;
      if (recordedError && !info.database.lastError) {
        info.database.lastError = `Recorded streams: ${recordedError.message}`;
      }

      // Test insert permission (only if user can stream)
      if (info.profile.canStream && info.database.liveStreamsExists) {
        const testData = {
          created_by: user?.id,
          stream_url: 'test://url',
          title: 'Test Stream',
          description: `Test by ${profile?.full_name || 'Test User'}`,
          is_active: false
        };

        const { data: insertTest, error: insertError } = await supabase
          .from('live_streams')
          .insert([testData])
          .select()
          .single();

        if (insertError) {
          info.database.canInsert = false;
          info.database.lastError = `Insert failed: ${insertError.message}`;
        } else {
          info.database.canInsert = true;
          // Clean up test data
          await supabase.from('live_streams').delete().eq('id', insertTest.id);
        }
      }

    } catch (error: any) {
      info.database.lastError = `Unexpected error: ${error.message}`;
    }

    setDebugInfo(info);
    setIsChecking(false);
  };

  useEffect(() => {
    if (user && profile) {
      runDiagnostics();
    }
  }, [user, profile]);

  if (!debugInfo) {
    return (
      <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-6">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-orange-500 animate-spin" />
          <span className="text-white">Running diagnostics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
        <Database className="h-5 w-5 text-orange-500" />
        <span>Live Stream Debug Info</span>
      </h3>

      <div className="space-y-4 text-sm">
        {/* User Info */}
        <div>
          <h4 className="text-white font-medium mb-2">User Authentication</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              {debugInfo.user.exists ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-gray-300">User: {debugInfo.user.exists ? 'Logged in' : 'Not logged in'}</span>
            </div>
            <div className="flex items-center space-x-2">
              {debugInfo.profile.exists ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-gray-300">Profile: {debugInfo.profile.exists ? 'Loaded' : 'Missing'}</span>
            </div>
          </div>
          {debugInfo.profile.exists && (
            <div className="mt-2 text-gray-400">
              Type: {debugInfo.profile.userType} | Can Stream: {debugInfo.profile.canStream ? 'Yes' : 'No'}
            </div>
          )}
        </div>

        {/* Database Info */}
        <div>
          <h4 className="text-white font-medium mb-2">Database Tables</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              {debugInfo.database.liveStreamsExists ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-gray-300">live_streams table</span>
            </div>
            <div className="flex items-center space-x-2">
              {debugInfo.database.recordedStreamsExists ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-gray-300">recorded_streams table</span>
            </div>
            <div className="flex items-center space-x-2">
              {debugInfo.database.canQuery ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-gray-300">Query Access</span>
            </div>
            <div className="flex items-center space-x-2">
              {debugInfo.database.hasEndedAtField ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-gray-300">Schema Updated</span>
            </div>
          </div>
          
          {debugInfo.profile.canStream && (
            <div className="mt-2 flex items-center space-x-2">
              {debugInfo.database.canInsert ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-gray-300">Insert Permission: {debugInfo.database.canInsert ? 'Working' : 'Failed'}</span>
            </div>
          )}
        </div>

        {/* Error Details */}
        {debugInfo.database.lastError && (
          <div className="bg-red-900/30 border border-red-800/50 rounded-lg p-3">
            <h4 className="text-red-400 font-medium mb-1">Last Error:</h4>
            <p className="text-red-300 text-xs">{debugInfo.database.lastError}</p>
          </div>
        )}

        {/* Solutions */}
        <div className="bg-orange-900/30 border border-orange-800/50 rounded-lg p-3">
          <h4 className="text-orange-400 font-medium mb-2">Quick Fixes:</h4>
          <ul className="text-orange-300 text-xs space-y-1">
            {!debugInfo.database.liveStreamsExists && (
              <li>• Run the SQL schema in Supabase SQL editor</li>
            )}
            {!debugInfo.profile.canStream && (
              <li>• Make sure you're logged in as admin or instructor</li>
            )}
            {debugInfo.database.liveStreamsExists && !debugInfo.database.canInsert && (
              <li>• Check RLS policies in Supabase</li>
            )}
          </ul>
        </div>

        <button
          onClick={runDiagnostics}
          disabled={isChecking}
          className="w-full bg-blue-800/50 hover:bg-blue-800/70 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {isChecking ? 'Checking...' : 'Refresh Diagnostics'}
        </button>
      </div>
    </div>
  );
};
