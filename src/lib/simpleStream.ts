// SIMPLE GLOBAL STREAM SHARING - Same tab only for demo
// Note: In production, use WebRTC signaling server or streaming service
class SimpleStreamSharing {
  private static instance: SimpleStreamSharing
  private currentStream: MediaStream | null = null
  private listeners: ((stream: MediaStream | null) => void)[] = []

  static getInstance(): SimpleStreamSharing {
    if (!SimpleStreamSharing.instance) {
      SimpleStreamSharing.instance = new SimpleStreamSharing()
    }
    return SimpleStreamSharing.instance
  }

  setStream(stream: MediaStream | null) {
    console.log('[SimpleStreamSharing] Setting global stream:', !!stream)
    this.currentStream = stream
    
    // Notify all listeners in same tab
    this.listeners.forEach(listener => {
      try {
        listener(stream)
      } catch (error) {
        console.error('[SimpleStreamSharing] Listener error:', error)
      }
    })
  }

  getStream(): MediaStream | null {
    return this.currentStream
  }

  addListener(callback: (stream: MediaStream | null) => void) {
    console.log('[SimpleStreamSharing] Adding listener')
    this.listeners.push(callback)
    
    // Immediately call with current stream if available
    if (this.currentStream) {
      console.log('[SimpleStreamSharing] Notifying new listener of existing stream')
      callback(this.currentStream)
    }

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
        console.log('[SimpleStreamSharing] Removed listener')
      }
    }
  }

  clearStream() {
    console.log('[SimpleStreamSharing] Clearing global stream')
    this.setStream(null)
  }
}

export const globalStreamManager = SimpleStreamSharing.getInstance()
