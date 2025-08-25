import { useLiveStream } from '../contexts/LiveStreamContext'
import { useAuth } from '../contexts/AuthContext'

export const LiveStreamDebugPanel = () => {
  const { 
    isStreaming, 
    isLiveStreamActive, 
    currentStream, 
    globalStream, 
    loading 
  } = useLiveStream()
  
  const { profile } = useAuth()
  
  const canStream = profile?.user_type === 'admin' || profile?.user_type === 'instructor'

  const clearSignals = () => {
    localStorage.removeItem('webrtc-signal')
    console.log('🧹 Cleared WebRTC signals')
    window.location.reload()
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🐛 Live Stream Debug</h3>
      
      <div className="space-y-1">
        <div>👤 User: {profile?.user_type || 'unknown'} ({canStream ? 'can stream' : 'student'})</div>
        <div>🎥 isStreaming: {isStreaming ? '✅' : '❌'}</div>
        <div>📡 isLiveStreamActive: {isLiveStreamActive ? '✅' : '❌'}</div>
        <div>📹 currentStream: {currentStream ? '✅' : '❌'}</div>
        <div>🌐 globalStream: {globalStream ? '✅' : '❌'}</div>
        <div>⏳ loading: {loading ? '✅' : '❌'}</div>
      </div>
      
      {globalStream && (
        <div className="mt-2 p-2 bg-green-900/50 rounded">
          <div className="text-green-200 text-xs">
            🎉 Stream Ready! 
            <br />Tracks: {globalStream.getTracks().length}
            <br />Video: {globalStream.getVideoTracks().length}
            <br />Audio: {globalStream.getAudioTracks().length}
          </div>
        </div>
      )}
      
      {!canStream && isLiveStreamActive && !globalStream && (
        <div className="mt-2 p-2 bg-yellow-900/50 rounded">
          <div className="text-yellow-200 text-xs">
            ⚠️ Stream detected but no video yet
            <br />Check console for WebRTC logs
            <br />
            <button 
              onClick={clearSignals}
              className="mt-1 px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs"
            >
              🧹 Clear & Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
