import { useLiveStream } from '../contexts/LiveStreamContext'
import { useAuth } from '../contexts/AuthContext'
import { LiveStreamPlayer } from './LiveStreamPlayer'
import { ProductionLiveStreamPlayer } from './ProductionLiveStreamPlayer'
import { RecordedStreams } from './RecordedStreams'
import { StreamDebugPanel } from './StreamDebugPanel'
import { LiveStreamDebugHelper } from './LiveStreamDebugHelper'
import { Radio, VideoOff, Users } from 'lucide-react'

const USE_PRODUCTION_STREAMING = import.meta.env.VITE_AGORA_APP_ID && import.meta.env.VITE_AGORA_APP_ID !== 'your-agora-app-id-here'

export const LiveStreamSection = () => {
  const { profile } = useAuth()
  const { isLiveStreamActive, streamUrl, joinStream, leaveStream } = useLiveStream()
  
  console.log('[LiveStreamSection] Configuration:', {
    USE_PRODUCTION_STREAMING,
    AGORA_APP_ID: import.meta.env.VITE_AGORA_APP_ID,
    isLiveStreamActive,
    streamUrl,
    userType: profile?.user_type
  })
  
  const isAdmin = profile?.user_type === 'admin'
  const isInstructor = profile?.user_type === 'instructor'
  const isStudent = profile?.user_type === 'student'

  return (
    <div className="space-y-8">
      {/* Debug Helpers - Remove these after fixing the issues */}
      <StreamDebugPanel />
      <LiveStreamDebugHelper />
      
      {/* Live Stream Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Radio className="h-8 w-8 text-orange-500" />
          <div>
            <h1 className="text-3xl font-bold text-white">Live Streaming</h1>
            <p className="text-sm text-gray-400">
              {USE_PRODUCTION_STREAMING ? (
                <span className="text-green-400">🎥 Production Mode (Agora.io)</span>
              ) : (
                <span className="text-yellow-400">🧪 Demo Mode (Same Tab Only)</span>
              )}
            </p>
          </div>
        </div>
        
        {isLiveStreamActive && (
          <div className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-full">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-semibold">LIVE NOW</span>
          </div>
        )}
      </div>

      {/* Live Stream Player Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-2">
              {(isAdmin || isInstructor) ? 'Your Live Stream' : 'Live Stream'}
            </h2>
            {(isAdmin || isInstructor) && (
              <p className="text-gray-400 text-sm">
                Start a live stream to broadcast to all students. The stream will be automatically recorded and saved.
              </p>
            )}
          </div>
          
          {USE_PRODUCTION_STREAMING ? (
            <ProductionLiveStreamPlayer 
              streamUrl={streamUrl || undefined} 
              canStream={isAdmin || isInstructor} 
            />
          ) : (
            <LiveStreamPlayer 
              streamUrl={streamUrl || undefined} 
              canStream={isAdmin || isInstructor} 
            />
          )}
          
          {/* Student Controls */}
          {isStudent && isLiveStreamActive && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-orange-500" />
                  <span className="text-white font-medium">Join Live Stream</span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={joinStream}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    Join Stream
                  </button>
                  <button
                    onClick={leaveStream}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    Leave Stream
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* No Active Stream Message for Students */}
          {isStudent && !isLiveStreamActive && (
            <div className="mt-4 p-6 bg-gray-800 rounded-lg text-center">
              <VideoOff className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">No Live Stream Active</h3>
              <p className="text-gray-400">
                Your instructor will start a live stream session. You'll be notified when it begins.
              </p>
            </div>
          )}
        </div>
        
        {/* Stream Info Panel */}
        <div className="space-y-6">
          {/* Stream Status */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Stream Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  isLiveStreamActive 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {isLiveStreamActive ? 'Live' : 'Offline'}
                </span>
              </div>
              
              {isLiveStreamActive && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Viewers:</span>
                    <span className="text-white">12 active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">15:32</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Quick Actions for Admin */}
          {isAdmin && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <div className="text-white font-medium">Stream Settings</div>
                  <div className="text-gray-400 text-sm">Configure stream quality and options</div>
                </button>
                <button className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <div className="text-white font-medium">View Analytics</div>
                  <div className="text-gray-400 text-sm">See stream performance metrics</div>
                </button>
              </div>
            </div>
          )}
          
          {/* Stream Guidelines for Students */}
          {isStudent && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Stream Guidelines</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Join the stream when it goes live</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Recordings are available after the stream ends</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Use a stable internet connection for best quality</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Recorded Streams */}
      <div className="mt-12">
        <RecordedStreams />
      </div>
    </div>
  )
}
