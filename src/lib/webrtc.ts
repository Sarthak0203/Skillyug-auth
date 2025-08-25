// Simple WebRTC implementation for localhost video sharing
export class SimpleWebRTC {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private isInstructor: boolean = false
  private processedSignals: Set<string> = new Set() // Track processed signals
  private broadcastChannel: BroadcastChannel | null = null
  
  // Simple signaling using BroadcastChannel for same-origin communication
  private signalingKey = 'webrtc-signal'
  
  constructor(isInstructor: boolean = false) {
    this.isInstructor = isInstructor
    this.setupPeerConnection()
    
    // Initialize BroadcastChannel for cross-tab communication
    this.broadcastChannel = new BroadcastChannel('webrtc-signaling')
    this.broadcastChannel.onmessage = (event) => {
      this.handleSignalMessage(event.data)
    }
    
    if (!isInstructor) {
      // Students listen for instructor's offers
      console.log('[WebRTC] Student: Listening for instructor signals via BroadcastChannel')
    } else {
      console.log('[WebRTC] Instructor: Ready to send signals via BroadcastChannel')
    }
  }
  
  private setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    })
    
    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Received remote stream')
      this.remoteStream = event.streams[0]
      this.onRemoteStream?.(this.remoteStream)
    }
    
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ice-candidate',
          candidate: event.candidate,
          from: this.isInstructor ? 'instructor' : 'student'
        })
      }
    }
  }
  
  async startStreaming(stream: MediaStream) {
    console.log('[WebRTC] startStreaming called:', {
      hasPeerConnection: !!this.peerConnection,
      isInstructor: this.isInstructor,
      streamTracks: stream.getTracks().length
    })
    
    if (!this.peerConnection || !this.isInstructor) {
      console.log('[WebRTC] ❌ Cannot start streaming - missing peer connection or not instructor')
      return
    }
    
    this.localStream = stream
    
    // Add stream to peer connection
    console.log('[WebRTC] Adding tracks to peer connection...')
    stream.getTracks().forEach(track => {
      console.log('[WebRTC] Adding track:', track.kind, track.label)
      this.peerConnection!.addTrack(track, stream)
    })
    
    // Create and send offer to students
    console.log('[WebRTC] Creating offer...')
    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)
    
    console.log('[WebRTC] Sending offer to students via localStorage...')
    this.sendSignal({
      type: 'offer',
      offer: offer,
      from: 'instructor'
    })
    
    console.log('[WebRTC] ✅ Instructor: Sent offer to students')
  }
  
  private handleSignalMessage(signal: any) {
    if (!signal.id || this.processedSignals.has(signal.id)) {
      return // Already processed
    }
    
    this.processedSignals.add(signal.id)
    console.log('[WebRTC] Received signal:', signal.type, 'from:', signal.from)
    
    if (signal.type === 'offer' && signal.from === 'instructor' && !this.isInstructor) {
      console.log('[WebRTC] Student: Processing offer from instructor')
      this.handleOffer(signal.offer)
    } else if (signal.type === 'answer' && signal.from === 'student' && this.isInstructor) {
      console.log('[WebRTC] Instructor: Processing answer from student')
      this.handleAnswer(signal.answer)
    } else if (signal.type === 'ice-candidate') {
      console.log('[WebRTC] Processing ICE candidate')
      // Reconstruct RTCIceCandidate from serialized data
      const candidate = new RTCIceCandidate(signal.candidate)
      this.handleIceCandidate(candidate)
    }
  }
  
  private handleOffer(offer: RTCSessionDescriptionInit) {
    if (!this.peerConnection || this.isInstructor) return
    
    console.log('[WebRTC] Student: Received offer, setting up connection')
    
    this.peerConnection.setRemoteDescription(offer)
      .then(() => this.peerConnection!.createAnswer())
      .then((answer) => {
        console.log('[WebRTC] Student: Created answer, setting local description')
        return this.peerConnection!.setLocalDescription(answer)
      })
      .then(() => {
        console.log('[WebRTC] Student: Sending answer back to instructor')
        this.sendSignal({
          type: 'answer',
          answer: this.peerConnection!.localDescription,
          from: 'student'
        })
      })
      .catch((error) => {
        console.error('[WebRTC] Student: Error handling offer:', error)
      })
  }
  
  private handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection || !this.isInstructor) return
    
    console.log('[WebRTC] Instructor: Received answer, setting remote description')
    this.peerConnection.setRemoteDescription(answer)
      .then(() => {
        console.log('[WebRTC] Instructor: Connection should be established')
      })
      .catch((error) => {
        console.error('[WebRTC] Instructor: Error setting remote description:', error)
      })
  }
  
  private handleIceCandidate(candidate: RTCIceCandidate) {
    if (!this.peerConnection) return
    
    console.log('[WebRTC] Adding ICE candidate')
    this.peerConnection.addIceCandidate(candidate)
      .catch((error) => {
        console.error('[WebRTC] Error adding ICE candidate:', error)
      })
  }
  
  private sendSignal(signal: any) {
    // Serialize objects that can't be cloned by BroadcastChannel
    let serializableSignal = { ...signal }
    
    if (signal.candidate && signal.candidate.toJSON) {
      // Convert RTCIceCandidate to plain object
      serializableSignal.candidate = signal.candidate.toJSON()
    }
    
    const signalWithId = {
      ...serializableSignal,
      id: `${signal.type}-${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    }
    
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(signalWithId)
        console.log('[WebRTC] Sent signal via BroadcastChannel:', signal.type, 'from:', signal.from)
      } catch (error) {
        console.error('[WebRTC] BroadcastChannel failed:', error)
        // Fall back to localStorage only
      }
    }
    
    // Also store in localStorage as backup
    const existingSignals = JSON.parse(localStorage.getItem(this.signalingKey) || '[]')
    existingSignals.push(signalWithId)
    localStorage.setItem(this.signalingKey, JSON.stringify(existingSignals))
  }

  async joinStream() {
    if (!this.peerConnection || this.isInstructor) return
    
    console.log('[WebRTC] Student: Ready to receive instructor stream via BroadcastChannel')
    // Students automatically receive offers via BroadcastChannel onmessage
  }
  
  stopStreaming() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }
    
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
    
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
      this.broadcastChannel = null
    }
    
    // Clear signals
    if (this.isInstructor) {
      localStorage.removeItem(this.signalingKey)
    }
    
    console.log('[WebRTC] Stopped streaming and cleaned up')
  }
  
  // Callback for when remote stream is received
  onRemoteStream?: (stream: MediaStream) => void
}
