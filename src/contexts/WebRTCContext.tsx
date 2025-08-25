import { createContext, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface WebRTCContextType {
  createPeerConnection: () => RTCPeerConnection
  broadcastStream: (stream: MediaStream) => Promise<void>
  connectAsViewer: (streamId: string) => Promise<MediaStream | null>
  viewers: string[]
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined)

export const useWebRTC = () => {
  const context = useContext(WebRTCContext)
  if (!context) {
    throw new Error('useWebRTC must be used within WebRTCProvider')
  }
  return context
}

interface WebRTCProviderProps {
  children: ReactNode
}

export const WebRTCProvider = ({ children }: WebRTCProviderProps) => {
  const [viewers] = useState<string[]>([])
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map())
  const localStream = useRef<MediaStream | null>(null)

  // Simple WebRTC configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }

  const createPeerConnection = (): RTCPeerConnection => {
    const pc = new RTCPeerConnection(rtcConfig)
    
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState)
    }
    
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState)
    }
    
    return pc
  }

  const broadcastStream = async (stream: MediaStream): Promise<void> => {
    localStream.current = stream
    console.log('Broadcasting stream to viewers:', viewers.length)
    
    // In a real implementation, this would:
    // 1. Create offers for all connected viewers
    // 2. Send offers through signaling server
    // 3. Handle answers and ICE candidates
    
    // For now, store the stream for local use
    peerConnections.current.forEach((pc) => {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })
    })
  }

  const connectAsViewer = async (streamId: string): Promise<MediaStream | null> => {
    console.log('Connecting as viewer to stream:', streamId)
    
    // In a real implementation, this would:
    // 1. Connect to signaling server
    // 2. Request to join stream
    // 3. Handle WebRTC negotiation
    // 4. Receive remote stream
    
    // For now, return a placeholder
    return null
  }

  const value: WebRTCContextType = {
    createPeerConnection,
    broadcastStream,
    connectAsViewer,
    viewers
  }

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  )
}
