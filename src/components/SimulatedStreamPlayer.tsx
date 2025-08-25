import { useEffect, useRef } from 'react'

interface SimulatedStreamPlayerProps {
  streamUrl: string
  isActive: boolean
}

export const SimulatedStreamPlayer = ({ streamUrl, isActive }: SimulatedStreamPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && isActive) {
      // Create a simple test pattern or use a sample video
      // For now, we'll just show a colored canvas animation
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 480
      const ctx = canvas.getContext('2d')!
      
      let frame = 0
      const animate = () => {
        if (!isActive) return
        
        // Create a simple animated pattern
        ctx.fillStyle = `hsl(${(frame * 2) % 360}, 70%, 50%)`
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.fillStyle = 'white'
        ctx.font = '24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('LIVE STREAM SIMULATION', canvas.width / 2, canvas.height / 2 - 20)
        ctx.fillText(`Stream: ${streamUrl}`, canvas.width / 2, canvas.height / 2 + 20)
        ctx.fillText(`Frame: ${frame}`, canvas.width / 2, canvas.height / 2 + 60)
        
        frame++
        
        if (frame % 30 === 0) { // Update at 30fps
          const stream = canvas.captureStream(30)
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        }
        
        requestAnimationFrame(animate)
      }
      
      animate()
    } else if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [isActive, streamUrl])

  return (
    <video
      ref={videoRef}
      autoPlay
      muted={false}
      playsInline
      className="w-full h-full object-cover"
    />
  )
}
