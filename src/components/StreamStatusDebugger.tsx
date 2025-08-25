import { useAuth } from '../contexts/AuthContext'
import { useLiveStream } from '../contexts/LiveStreamContext'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

export const StreamStatusDebugger = () => {
  const { user, profile } = useAuth()
  const { isLiveStreamActive, streamUrl, isStreaming, loading } = useLiveStream()
  const [dbTestResult, setDbTestResult] = useState<string | null>(null)

  const handleRefreshCheck = async () => {
    // Force a manual check by reloading the page
    window.location.reload()
  }

  const testDatabaseConnection = async () => {
    try {
      setDbTestResult('Testing...')
      
      // Test 1: Basic query
      const { data: streams, error } = await supabase
        .from('live_streams')
        .select('*')
        .eq('is_active', true)
        .limit(5)
      
      if (error) {
        setDbTestResult(`❌ Database Error: ${error.message}`)
        return
      }
      
      setDbTestResult(`✅ Database OK. Found ${streams?.length || 0} active streams`)
      
      // Log detailed info
      console.log('🔍 Database test results:', {
        activeStreams: streams,
        user: user?.id,
        profile: profile?.user_type
      })
      
    } catch (error: any) {
      setDbTestResult(`❌ Connection Error: ${error.message}`)
    }
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4 border border-gray-600">
      <h3 className="text-white font-semibold mb-3">🔍 Stream Status Debug</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h4 className="text-blue-400 font-medium mb-2">User Info:</h4>
          <div className="space-y-1 text-gray-300">
            <div>User Type: <span className="text-white">{profile?.user_type || 'Unknown'}</span></div>
            <div>User ID: <span className="text-white">{user?.id?.slice(0, 8) || 'None'}...</span></div>
            <div>Environment: <span className="text-white">
              {import.meta.env.MODE === 'production' ? '🌐 Production' : '🧪 Development'}
            </span></div>
            <div>Agora App ID: <span className="text-white">
              {import.meta.env.VITE_AGORA_APP_ID ? 
                `${import.meta.env.VITE_AGORA_APP_ID.slice(0, 8)}...` : 
                '❌ Missing'
              }
            </span></div>
          </div>
        </div>
        
        <div>
          <h4 className="text-green-400 font-medium mb-2">Stream Status:</h4>
          <div className="space-y-1 text-gray-300">
            <div>Live Stream Active: <span className={isLiveStreamActive ? 'text-green-400' : 'text-red-400'}>
              {isLiveStreamActive ? '✅ YES' : '❌ NO'}
            </span></div>
            <div>Stream URL: <span className="text-white">
              {streamUrl ? `${streamUrl.slice(0, 20)}...` : 'None'}
            </span></div>
            <div>Is Streaming: <span className={isStreaming ? 'text-green-400' : 'text-gray-400'}>
              {isStreaming ? '✅ YES' : '❌ NO'}
            </span></div>
            <div>Loading: <span className={loading ? 'text-yellow-400' : 'text-gray-400'}>
              {loading ? '⏳ YES' : '❌ NO'}
            </span></div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={handleRefreshCheck}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
        >
          🔄 Refresh Check
        </button>
        
        <button
          onClick={testDatabaseConnection}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
        >
          🔍 Test Database
        </button>
        
        <div className="text-xs text-gray-400 flex items-center">
          Last checked: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {dbTestResult && (
        <div className="mt-2 p-2 bg-gray-700 rounded text-sm text-white">
          {dbTestResult}
        </div>
      )}
      
      {!isLiveStreamActive && profile?.user_type === 'student' && (
        <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-600 rounded text-yellow-200 text-sm">
          💡 <strong>Student:</strong> If instructor started streaming but you don't see it, try refreshing the page or check network connection.
        </div>
      )}
    </div>
  )
}
