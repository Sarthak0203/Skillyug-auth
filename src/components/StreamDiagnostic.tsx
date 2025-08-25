import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLiveStream } from '../contexts/LiveStreamContext'
import { supabase } from '../lib/supabase'

interface DiagnosticResults {
  timestamp: string
  userAgent: string
  isMobile: boolean
  userId?: string
  userRole?: string
  canStream: boolean
  isLiveStreamActive: boolean
  streamUrl?: string | null
  environment: {
    supabaseUrl?: string
    agoraAppId?: string
    nodeEnv?: string
    mode?: string
  }
  supabaseConnection?: {
    success: boolean
    error?: string
    sessionExists?: boolean
  }
  databaseQuery?: {
    success: boolean
    error?: string
    dataCount: number
    data?: any[] | null
  }
  realtimeStatus?: string
}

export const StreamDiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResults | null>(null)
  const { user } = useAuth()
  const { isLiveStreamActive, streamUrl } = useLiveStream()
  
  // Determine if user can stream based on role
  const canStream = user?.user_metadata?.role === 'instructor' || user?.user_metadata?.role === 'admin'

  useEffect(() => {
    const runDiagnostics = async () => {
      console.log('🔍 Running Stream Diagnostics...')
      
      const results: DiagnosticResults = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        userId: user?.id,
        userRole: user?.user_metadata?.role,
        canStream,
        isLiveStreamActive,
        streamUrl,
        environment: {
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
          agoraAppId: import.meta.env.VITE_AGORA_APP_ID,
          nodeEnv: import.meta.env.NODE_ENV,
          mode: import.meta.env.MODE
        }
      }

      // Test Supabase connection
      try {
        const { data, error } = await supabase.auth.getSession()
        results.supabaseConnection = {
          success: !error,
          error: error?.message,
          sessionExists: !!data.session
        }
      } catch (error) {
        results.supabaseConnection = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }

      // Test database query
      try {
        const { data, error } = await supabase
          .from('live_streams')
          .select('*')
          .eq('is_active', true)
        
        results.databaseQuery = {
          success: !error,
          error: error?.message,
          dataCount: data?.length || 0,
          data: data
        }
      } catch (error) {
        results.databaseQuery = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          dataCount: 0
        }
      }

      // Test real-time subscription
      const testChannel = supabase
        .channel('diagnostic-test')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'live_streams'
        }, (payload) => {
          console.log('🔔 Diagnostic: Real-time test received:', payload)
        })
        .subscribe((status) => {
          console.log('📡 Diagnostic: Real-time subscription status:', status)
          results.realtimeStatus = status
          setDiagnostics({ ...results })
        })

      // Cleanup after 5 seconds
      setTimeout(() => {
        testChannel.unsubscribe()
      }, 5000)

      setDiagnostics(results)
      console.log('🔍 Diagnostic Results:', results)
    }

    runDiagnostics()
  }, [user, canStream, isLiveStreamActive, streamUrl])

  if (!diagnostics) {
    return (
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs z-50">
        🔍 Running diagnostics...
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-h-96 overflow-y-auto z-50">
      <h3 className="font-bold text-green-400 mb-2">🔍 Stream Diagnostics</h3>
      
      <div className="space-y-2">
        <div>
          <span className="text-blue-400">Device:</span> {diagnostics.isMobile ? '📱 Mobile' : '💻 Desktop'}
        </div>
        
        <div>
          <span className="text-blue-400">User:</span> {diagnostics.userId?.substring(0, 8)}... 
          {diagnostics.canStream ? ' (👩‍🏫 Instructor)' : ' (👨‍🎓 Student)'}
        </div>
        
        <div>
          <span className="text-blue-400">Stream Status:</span> {diagnostics.isLiveStreamActive ? '🟢 Active' : '🔴 Inactive'}
        </div>

        {diagnostics.streamUrl && (
          <div>
            <span className="text-blue-400">Stream URL:</span> {diagnostics.streamUrl}
          </div>
        )}
        
        <div>
          <span className="text-blue-400">Supabase:</span> {
            diagnostics.supabaseConnection?.success ? '🟢 Connected' : '🔴 Failed'
          }
        </div>
        
        <div>
          <span className="text-blue-400">Database:</span> {
            diagnostics.databaseQuery?.success ? 
              `🟢 OK (${diagnostics.databaseQuery.dataCount} streams)` : 
              '🔴 Failed'
          }
        </div>
        
        <div>
          <span className="text-blue-400">Real-time:</span> {
            diagnostics.realtimeStatus === 'SUBSCRIBED' ? '🟢 Connected' : 
            diagnostics.realtimeStatus ? `🟡 ${diagnostics.realtimeStatus}` : '⏳ Testing...'
          }
        </div>

        <div>
          <span className="text-blue-400">Agora ID:</span> {
            diagnostics.environment?.agoraAppId ? 
              `🟢 ${diagnostics.environment.agoraAppId.substring(0, 8)}...` : 
              '🔴 Missing'
          }
        </div>

        {diagnostics.databaseQuery?.error && (
          <div className="text-red-400 text-xs mt-2">
            DB Error: {diagnostics.databaseQuery.error}
          </div>
        )}
      </div>
      
      <div className="text-gray-400 text-xs mt-2">
        Updated: {new Date(diagnostics.timestamp).toLocaleTimeString()}
      </div>
    </div>
  )
}
