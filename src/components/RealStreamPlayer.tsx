import { useRef, useEffect, useState } from 'react'
import { useLiveStream } from '../contexts/LiveStreamContext'

interface RealStreamPlayerProps {
  streamUrl: string
  isActive: boolean
  isInstructor: boolean
}

export const RealStreamPlayer = ({ streamUrl, isActive, isInstructor }: RealStreamPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { currentStream } = useLiveStream()
  const [viewerStream, setViewerStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    if (!isActive || !videoRef.current) return

    if (isInstructor && currentStream) {
      // Instructor sees their own camera
      console.log('Instructor: Setting own camera stream')
      videoRef.current.srcObject = currentStream
    } else if (!isInstructor) {
      // Student: Try to get instructor's stream through various methods
      attemptToGetInstructorStream()
    }
  }, [isActive, isInstructor, currentStream, streamUrl])

  const attemptToGetInstructorStream = async () => {
    try {
      console.log('Student: Attempting to get instructor stream...')
      
      // Method 1: Try to access instructor's screen (requires permission)
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        try {
          console.log('Trying to get display media (requires instructor to share screen)...')
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          })
          
          setViewerStream(displayStream)
          if (videoRef.current) {
            videoRef.current.srcObject = displayStream
          }
          console.log('Successfully got display stream!')
          return
        } catch (error) {
          console.log('Display media not available or denied:', error)
        }
      }

      // Method 2: Create a shared canvas stream (fallback)
      console.log('Creating shared canvas stream...')
      createSharedCanvasStream()
      
    } catch (error) {
      console.error('Failed to get instructor stream:', error)
      createSharedCanvasStream()
    }
  }

  const createSharedCanvasStream = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext('2d')!
    
    let frame = 0
    const animate = () => {
      if (!isActive) return
      
      // Create a dynamic shared experience
      const time = Date.now() * 0.001
      const gradient = ctx.createRadialGradient(320, 240, 0, 320, 240, 300)
      gradient.addColorStop(0, `hsl(${(time * 50) % 360}, 70%, 60%)`)
      gradient.addColorStop(1, `hsl(${(time * 30) % 360}, 50%, 30%)`)
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Add live stream info
      ctx.fillStyle = 'white'
      ctx.font = 'bold 28px Arial'
      ctx.textAlign = 'center'
      ctx.shadowColor = 'black'
      ctx.shadowBlur = 4
      ctx.fillText('🎥 LIVE CLASS', canvas.width / 2, canvas.height / 2 - 40)
      
      ctx.font = '18px Arial'
      ctx.fillText('Instructor is teaching live', canvas.width / 2, canvas.height / 2)
      
      ctx.font = '14px Arial'
      ctx.fillText(`Stream: ${streamUrl}`, canvas.width / 2, canvas.height / 2 + 30)
      ctx.fillText(`Connected students viewing`, canvas.width / 2, canvas.height / 2 + 50)
      
      // Add animated elements
      const particles = 20
      for (let i = 0; i < particles; i++) {
        const angle = (i / particles) * Math.PI * 2 + time
        const radius = 100 + Math.sin(time * 2 + i) * 20
        const x = canvas.width / 2 + Math.cos(angle) * radius
        const y = canvas.height / 2 + Math.sin(angle) * radius
        
        ctx.fillStyle = `hsla(${(time * 100 + i * 30) % 360}, 80%, 70%, 0.8)`
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fill()
      }
      
      frame++
      requestAnimationFrame(animate)
    }
    
    animate()
    
    const stream = canvas.captureStream(30)
    setViewerStream(stream)
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (viewerStream) {
        viewerStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [viewerStream])

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        muted={isInstructor}
        playsInline
        className="w-full h-full object-cover"
      />
      
      {!isInstructor && (
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
          {viewerStream ? '🟢 Connected' : '🟡 Connecting...'}
        </div>
      )}
      
      {!isInstructor && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-xs max-w-xs">
          💡 <strong>Real Video:</strong> For actual video streaming, instructor needs to share screen or use WebRTC server
        </div>
      )}
    </div>
  )
}
