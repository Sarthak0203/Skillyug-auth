import { useRef, useEffect } from 'react'
import { useLiveStream } from '../contexts/LiveStreamContext'
import { Play, Square, Users, VideoOff } from 'lucide-react'

interface LiveStreamPlayerProps {
  streamUrl?: string
  canStream?: boolean
}

export const LiveStreamPlayer = ({ streamUrl, canStream = false }: LiveStreamPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { isStreaming, isLiveStreamActive, currentStream, globalStream, startStream, stopStream, loading } = useLiveStream()

  useEffect(() => {
    if (videoRef.current) {
      console.log('[LiveStreamPlayer] Video setup:', {
        canStream,
        isStreaming,
        isLiveStreamActive,
        hasCurrentStream: !!currentStream,
        hasGlobalStream: !!globalStream
      });

      if (canStream && isStreaming && currentStream) {
        // INSTRUCTOR: Show their own camera
        console.log('[LiveStreamPlayer] INSTRUCTOR: Setting up camera feed')
        videoRef.current.srcObject = currentStream
        videoRef.current.play().catch(console.error)
      } else if (!canStream && (globalStream || isLiveStreamActive)) {
        // STUDENT: Stream is active or global stream available
        console.log('[LiveStreamPlayer] STUDENT: Live stream detected')
        if (globalStream) {
          console.log('[LiveStreamPlayer] STUDENT: Showing instructor stream')
          videoRef.current.srcObject = globalStream
          videoRef.current.play().catch(console.error)
        } else {
          console.log('[LiveStreamPlayer] STUDENT: No globalStream yet, waiting...')
          videoRef.current.srcObject = null
        }
      } else {
        // No stream
        console.log('[LiveStreamPlayer] Clearing video source')
        videoRef.current.srcObject = null
      }
    }
  }, [isStreaming, isLiveStreamActive, currentStream, globalStream, canStream])

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        if (stream && stream.getTracks) {
          stream.getTracks().forEach(track => track.stop())
        }
      }
    }
  }, [])

  const handleStartStream = async () => {
    await startStream()
  }

  const handleStopStream = async () => {
    await stopStream()
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-xl">
      <div className="relative aspect-video bg-black">
        {(canStream && isStreaming) || (!canStream && (isLiveStreamActive || globalStream)) ? (
          // Show video element for both instructor and students
          <>
            <video
              ref={videoRef}
              autoPlay
              muted={canStream} // Mute instructor's own feed, not students
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Show connecting overlay for students when no stream yet */}
            {!canStream && isLiveStreamActive && !globalStream && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-purple-900/90 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-pulse rounded-full h-16 w-16 bg-red-500 mx-auto mb-4 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white rounded-full"></div>
                  </div>
                  <p className="text-white text-xl font-semibold mb-2">🔄 Connecting to video stream...</p>
                  <p className="text-blue-200 text-sm">Please wait while we establish the connection</p>
                </div>
              </div>
            )}
          </>
        ) : !canStream && isLiveStreamActive ? (
          // STUDENT: Show connecting message when no video yet
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
            <div className="text-center">
              <div className="animate-pulse rounded-full h-16 w-16 bg-red-500 mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full"></div>
              </div>
              <p className="text-white text-xl font-semibold mb-2">🔴 LIVE</p>
              <p className="text-blue-200 text-sm mb-4">Instructor is streaming live</p>
              <div className="bg-black/30 rounded-lg p-4 max-w-md">
                <p className="text-blue-100 text-xs">
                  📺 <strong>Live Class in Progress</strong><br/>
                  Video streaming from instructor's camera
                </p>
                <p className="text-yellow-200 text-xs mt-2">🔄 Connecting to video stream...</p>
              </div>
            </div>
          </div>
        ) : (
          // No active stream
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <VideoOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No Active Stream</p>
            </div>
          </div>
        )}
        
        {/* Live indicator */}
        {(isStreaming || streamUrl) && (
          <div className="absolute top-4 left-4">
            <div className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
          </div>
        )}
        
        {/* Viewer count (placeholder) */}
        {streamUrl && (
          <div className="absolute top-4 right-4">
            <div className="flex items-center space-x-1 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              <Users className="h-4 w-4" />
              <span>12 viewers</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Controls */}
      {canStream && (
        <div className="p-4 bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!isStreaming ? (
                <button
                  onClick={handleStartStream}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Play className="h-4 w-4" />
                  <span>{loading ? 'Starting...' : 'Start Stream'}</span>
                </button>
              ) : (
                <button
                  onClick={handleStopStream}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Square className="h-4 w-4" />
                  <span>{loading ? 'Stopping...' : 'Stop Stream'}</span>
                </button>
              )}
            </div>
            
            <div className="text-sm text-gray-400">
              {isStreaming ? 'Recording in progress...' : 'Ready to stream'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
