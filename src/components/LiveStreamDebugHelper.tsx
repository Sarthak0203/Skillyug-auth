import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLiveStream } from '../contexts/LiveStreamContext'
import { supabase } from '../lib/supabase'
import { RefreshCw, Database, Users, Video } from 'lucide-react'

export const LiveStreamDebugHelper = () => {
  const { user, profile } = useAuth()
  const { isStreaming, isLiveStreamActive, streamUrl, currentStream, recordedStreams } = useLiveStream()
  const [debugData, setDebugData] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runDebugChecks = async () => {
    setLoading(true)
    const debug: any = {
      timestamp: new Date().toISOString(),
      user: {
        exists: !!user,
        id: user?.id,
        email: user?.email
      },
      profile: {
        exists: !!profile,
        userType: profile?.user_type,
        fullName: profile?.full_name
      },
      context: {
        isStreaming,
        isLiveStreamActive,
        streamUrl,
        hasCurrentStream: !!currentStream,
        recordedStreamsCount: recordedStreams.length
      },
      database: {
        liveStreamsTable: { exists: false, count: 0, activeCount: 0 },
        recordedStreamsTable: { exists: false, count: 0 },
        errors: []
      }
    }

    try {
      // Check live_streams table
      const { data: liveStreams, error: liveError } = await supabase
        .from('live_streams')
        .select('*')

      if (liveError) {
        debug.database.errors.push(`live_streams: ${liveError.message}`)
      } else {
        debug.database.liveStreamsTable.exists = true
        debug.database.liveStreamsTable.count = liveStreams?.length || 0
        debug.database.liveStreamsTable.activeCount = liveStreams?.filter(s => s.is_active).length || 0
        debug.database.liveStreamsTable.data = liveStreams
      }

      // Check recorded_streams table
      const { data: recordedStreams, error: recordedError } = await supabase
        .from('recorded_streams')
        .select('*')

      if (recordedError) {
        debug.database.errors.push(`recorded_streams: ${recordedError.message}`)
      } else {
        debug.database.recordedStreamsTable.exists = true
        debug.database.recordedStreamsTable.count = recordedStreams?.length || 0
        debug.database.recordedStreamsTable.data = recordedStreams
      }

    } catch (error: any) {
      debug.database.errors.push(`Unexpected error: ${error.message}`)
    }

    setDebugData(debug)
    setLoading(false)
  }

  useEffect(() => {
    runDebugChecks()
  }, [user, profile, isStreaming, isLiveStreamActive])

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Live Stream Debug Panel
        </h3>
        <button
          onClick={runDebugChecks}
          disabled={loading}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* User Info */}
        <div className="bg-gray-800 p-3 rounded">
          <h4 className="text-blue-400 font-medium mb-2 flex items-center">
            <Users className="h-4 w-4 mr-1" />
            User Status
          </h4>
          <div className="space-y-1 text-gray-300">
            <div>Logged in: {debugData.user?.exists ? '✅' : '❌'}</div>
            <div>User Type: {debugData.profile?.userType || 'Unknown'}</div>
            <div>Can Stream: {debugData.profile?.userType === 'admin' || debugData.profile?.userType === 'instructor' ? '✅' : '❌'}</div>
          </div>
        </div>

        {/* Stream Context */}
        <div className="bg-gray-800 p-3 rounded">
          <h4 className="text-green-400 font-medium mb-2 flex items-center">
            <Video className="h-4 w-4 mr-1" />
            Stream Context
          </h4>
          <div className="space-y-1 text-gray-300">
            <div>Is Streaming: {debugData.context?.isStreaming ? '✅' : '❌'}</div>
            <div>Live Stream Active: {debugData.context?.isLiveStreamActive ? '✅' : '❌'}</div>
            <div>Has Camera Stream: {debugData.context?.hasCurrentStream ? '✅' : '❌'}</div>
            <div>Stream URL: {debugData.context?.streamUrl || 'None'}</div>
            <div>Recorded Streams: {debugData.context?.recordedStreamsCount || 0}</div>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-gray-800 p-3 rounded md:col-span-2">
          <h4 className="text-yellow-400 font-medium mb-2">Database Status</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-300">
                Live Streams Table: {debugData.database?.liveStreamsTable.exists ? '✅' : '❌'}
              </div>
              {debugData.database?.liveStreamsTable.exists && (
                <div className="text-gray-400 text-xs">
                  Total: {debugData.database.liveStreamsTable.count} | Active: {debugData.database.liveStreamsTable.activeCount}
                </div>
              )}
            </div>
            <div>
              <div className="text-gray-300">
                Recorded Streams Table: {debugData.database?.recordedStreamsTable.exists ? '✅' : '❌'}
              </div>
              {debugData.database?.recordedStreamsTable.exists && (
                <div className="text-gray-400 text-xs">
                  Total: {debugData.database.recordedStreamsTable.count}
                </div>
              )}
            </div>
          </div>
          
          {debugData.database?.errors.length > 0 && (
            <div className="mt-2 p-2 bg-red-900/30 border border-red-800/50 rounded">
              <div className="text-red-400 font-medium mb-1">Errors:</div>
              {debugData.database.errors.map((error: string, index: number) => (
                <div key={index} className="text-red-300 text-xs">{error}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Raw Data (Collapsible) */}
      <details className="mt-4">
        <summary className="text-gray-400 cursor-pointer hover:text-white">
          Raw Debug Data
        </summary>
        <pre className="mt-2 bg-black p-2 rounded text-xs text-green-400 overflow-auto max-h-60">
          {JSON.stringify(debugData, null, 2)}
        </pre>
      </details>
    </div>
  )
}
