import { useRef, useEffect, useState } from 'react'
import { useLiveStream } from '../contexts/LiveStreamContext'
import { useAuth } from '../contexts/AuthContext'
import { productionStreamManager } from '../lib/productionStream'
import type { IAgoraRTCRemoteUser } from '../lib/productionStream'
import { Play, Square, Users, VideoOff } from 'lucide-react'

interface ProductionLiveStreamPlayerProps {
  streamUrl?: string
  canStream?: boolean
}

export const ProductionLiveStreamPlayer = ({ streamUrl, canStream = false }: ProductionLiveStreamPlayerProps) => {
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  
  const { 
    isStreaming, 
    isLiveStreamActive, 
    startStream, 
    stopStream, 
    loading
  } = useLiveStream()
  
  const { user } = useAuth()

  // Handle local video for instructor
  useEffect(() => {
    if (canStream && isStreaming && localVideoRef.current) {
      const localTrack = productionStreamManager.getLocalVideoTrack()
      if (localTrack) {
        console.log('[ProductionPlayer] Setting up local video')
        localTrack.play(localVideoRef.current)
      }
    }
  }, [canStream, isStreaming])

  // Handle remote users for students
  useEffect(() => {
    if (!canStream) {
      console.log('[ProductionPlayer] Setting up remote user listener')
      const unsubscribe = productionStreamManager.addRemoteUserListener((users) => {
        console.log('[ProductionPlayer] Remote users updated:', users.length)
        setRemoteUsers(users)
        
        // Display the first remote user's video
        if (users.length > 0 && remoteVideoRef.current) {
          const remoteUser = users[0]
          if (remoteUser.videoTrack) {
            console.log('[ProductionPlayer] Playing remote video')
            remoteUser.videoTrack.play(remoteVideoRef.current)
          }
        }
      })

      return unsubscribe
    }
  }, [canStream])

  // Auto-join as viewer when stream is detected
  useEffect(() => {
    if (!canStream && isLiveStreamActive && streamUrl && user) {
      const channelName = streamUrl.replace('stream_', '').split('_')[1] || 'default'
      console.log('[ProductionPlayer] Auto-joining as viewer:', channelName)
      
      productionStreamManager.joinAsViewer(channelName, user.id)
        .catch(error => {
          console.error('[ProductionPlayer] Failed to join as viewer:', error)
        })
    }
  }, [canStream, isLiveStreamActive, streamUrl, user])

  const handleStartStream = async () => {
    if (!user) return
    
    try {
      // Start production streaming with Agora
      const channelName = user.id
      await productionStreamManager.startStreaming(channelName, user.id)
      
      // Also start the local stream context
      await startStream()
      
    } catch (error) {
      console.error('[ProductionPlayer] Failed to start production stream:', error)
    }
  }

  const handleStopStream = async () => {
    try {
      await productionStreamManager.stopStreaming()
      await stopStream()
    } catch (error) {
      console.error('[ProductionPlayer] Failed to stop production stream:', error)
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-xl">
      <div className="relative aspect-video bg-black">
        {canStream && isStreaming ? (
          // INSTRUCTOR: Show their camera via Agora
          <>
            <div 
              ref={localVideoRef}
              className="w-full h-full object-cover"
              style={{ background: 'black' }}
            />
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              LIVE
            </div>
          </>
        ) : !canStream && (isLiveStreamActive || remoteUsers.length > 0) ? (
          // STUDENT: Show instructor's video via Agora
          <>
            <div 
              ref={remoteVideoRef}
              className="w-full h-full object-cover"
              style={{ background: 'black' }}
            />
            {remoteUsers.length === 0 && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-purple-900/90 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-pulse rounded-full h-16 w-16 bg-red-500 mx-auto mb-4 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white rounded-full"></div>
                  </div>
                  <p className="text-white text-xl font-semibold mb-2">🔄 Connecting to live stream...</p>
                  <p className="text-blue-200 text-sm">Establishing connection with instructor</p>
                </div>
              </div>
            )}
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              LIVE
            </div>
          </>
        ) : (
          // NO STREAM: Show placeholder
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-center">
              <VideoOff className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg font-medium mb-2">
                {canStream ? 'Ready to Stream' : 'No Active Stream'}
              </p>
              <p className="text-gray-500 text-sm">
                {canStream 
                  ? 'Click "Start Stream" to begin broadcasting' 
                  : 'Waiting for instructor to start streaming'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {canStream && (
              <div className="flex space-x-2">
                {!isStreaming ? (
                  <button
                    onClick={handleStartStream}
                    disabled={loading}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    <span>{loading ? 'Starting...' : 'Start Stream'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopStream}
                    disabled={loading}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Square className="h-4 w-4" />
                    <span>{loading ? 'Stopping...' : 'Stop Stream'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Stream Status */}
            <div className="flex items-center space-x-2 text-sm">
              {isLiveStreamActive && (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-400 font-medium">Live</span>
                </>
              )}
              {remoteUsers.length > 0 && (
                <>
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-400">{remoteUsers.length + (canStream ? 1 : 0)} connected</span>
                </>
              )}
            </div>
          </div>

          {/* Stream Info */}
          <div className="text-right">
            <p className="text-white text-sm font-medium">
              {canStream ? 'Instructor View' : 'Student View'}
            </p>
            <p className="text-gray-400 text-xs">
              Production Streaming with Agora
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
