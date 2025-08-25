import { useEffect, useState } from 'react'
import { SimpleWebRTC } from '../lib/webrtc'

export const WebRTCTest = () => {
  const [isInstructor, setIsInstructor] = useState(false)
  const [webrtc, setWebrtc] = useState<SimpleWebRTC | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    const rtc = new SimpleWebRTC(isInstructor)
    
    if (!isInstructor) {
      rtc.onRemoteStream = (stream) => {
        console.log('Student received stream!')
        setRemoteStream(stream)
      }
      rtc.joinStream()
    }
    
    setWebrtc(rtc)
    
    return () => {
      rtc.stopStreaming()
    }
  }, [isInstructor])

  const startStreaming = async () => {
    if (!webrtc || !isInstructor) return
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      setLocalStream(stream)
      await webrtc.startStreaming(stream)
      console.log('Instructor started streaming!')
    } catch (error) {
      console.error('Error starting stream:', error)
    }
  }

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8">WebRTC Test</h1>
      
      <div className="mb-8">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isInstructor}
            onChange={(e) => setIsInstructor(e.target.checked)}
            className="w-4 h-4"
          />
          <span>I am an Instructor</span>
        </label>
      </div>

      {isInstructor && (
        <div className="mb-8">
          <button
            onClick={startStreaming}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold"
          >
            Start Streaming
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Local Video (Instructor) */}
        {isInstructor && localStream && (
          <div>
            <h2 className="text-xl font-semibold mb-4">My Camera (Instructor)</h2>
            <video
              ref={(video) => {
                if (video && localStream) {
                  video.srcObject = localStream
                  video.play()
                }
              }}
              autoPlay
              muted
              className="w-full aspect-video bg-black rounded-lg"
            />
          </div>
        )}

        {/* Remote Video (Student) */}
        {!isInstructor && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Instructor's Stream (Student View)</h2>
            {remoteStream ? (
              <video
                ref={(video) => {
                  if (video && remoteStream) {
                    video.srcObject = remoteStream
                    video.play()
                  }
                }}
                autoPlay
                className="w-full aspect-video bg-black rounded-lg"
              />
            ) : (
              <div className="w-full aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                <p>Waiting for instructor to start streaming...</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-800 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Open this page in TWO different browser tabs</li>
          <li>In tab 1: Check "I am an Instructor" and click "Start Streaming"</li>
          <li>In tab 2: Leave unchecked (you're a student)</li>
          <li>You should see the instructor's video in the student tab!</li>
        </ol>
      </div>
    </div>
  )
}
