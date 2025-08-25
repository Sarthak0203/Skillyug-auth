// Production Live Streaming with Agora.io
import AgoraRTC from 'agora-rtc-sdk-ng'
import type { 
  IAgoraRTCRemoteUser, 
  ILocalVideoTrack,
  ILocalAudioTrack
} from 'agora-rtc-sdk-ng'

// Agora Configuration
const AGORA_CONFIG = {
  // Get these from https://console.agora.io/
  appId: process.env.VITE_AGORA_APP_ID || 'your-agora-app-id',
  // You can generate tokens server-side for production security
  token: null, // For development, can be null for testing
}

class ProductionStreamManager {
  private static instance: ProductionStreamManager
  private client: any = null
  private localVideoTrack: ILocalVideoTrack | null = null
  private localAudioTrack: ILocalAudioTrack | null = null
  private isJoined = false
  private listeners: ((users: IAgoraRTCRemoteUser[]) => void)[] = []
  private remoteUsers: IAgoraRTCRemoteUser[] = []

  static getInstance(): ProductionStreamManager {
    if (!ProductionStreamManager.instance) {
      ProductionStreamManager.instance = new ProductionStreamManager()
    }
    return ProductionStreamManager.instance
  }

  async initializeClient() {
    if (this.client) return

    try {
      this.client = AgoraRTC.createClient({ 
        mode: 'live', 
        codec: 'vp8',
        role: 'host' // Can be 'host' or 'audience'
      })

      // Set up event listeners
      this.client.on('user-published', this.handleUserPublished.bind(this))
      this.client.on('user-unpublished', this.handleUserUnpublished.bind(this))
      this.client.on('user-joined', this.handleUserJoined.bind(this))
      this.client.on('user-left', this.handleUserLeft.bind(this))

      console.log('[ProductionStream] Agora client initialized')
    } catch (error) {
      console.error('[ProductionStream] Failed to initialize client:', error)
      throw error
    }
  }

  async startStreaming(channelName: string, userId: string): Promise<MediaStream | null> {
    try {
      await this.initializeClient()

      // Set client role to host for instructor
      await this.client.setClientRole('host')

      // Join the channel
      await this.client.join(
        AGORA_CONFIG.appId,
        channelName,
        AGORA_CONFIG.token,
        userId
      )

      this.isJoined = true
      console.log('[ProductionStream] Joined channel:', channelName)

      // Create local tracks
      this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
        optimizationMode: 'detail',
        encoderConfig: {
          width: 1280,
          height: 720,
          frameRate: 30,
          bitrateMin: 1000,
          bitrateMax: 3000,
        }
      })

      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        AEC: true,
        ANS: true,
      })

      // Publish tracks
      await this.client.publish([this.localVideoTrack, this.localAudioTrack])
      console.log('[ProductionStream] Local tracks published')

      // Return a dummy MediaStream for compatibility
      // In production, you'd handle video display differently
      return new MediaStream()

    } catch (error) {
      console.error('[ProductionStream] Failed to start streaming:', error)
      throw error
    }
  }

  async joinAsViewer(channelName: string, userId: string): Promise<void> {
    try {
      await this.initializeClient()

      // Set client role to audience for students
      await this.client.setClientRole('audience')

      // Join the channel
      await this.client.join(
        AGORA_CONFIG.appId,
        channelName,
        AGORA_CONFIG.token,
        userId
      )

      this.isJoined = true
      console.log('[ProductionStream] Joined as viewer:', channelName)

    } catch (error) {
      console.error('[ProductionStream] Failed to join as viewer:', error)
      throw error
    }
  }

  async stopStreaming(): Promise<void> {
    try {
      // Stop and close local tracks
      if (this.localVideoTrack) {
        this.localVideoTrack.stop()
        this.localVideoTrack.close()
        this.localVideoTrack = null
      }

      if (this.localAudioTrack) {
        this.localAudioTrack.stop()
        this.localAudioTrack.close()
        this.localAudioTrack = null
      }

      // Leave the channel
      if (this.client && this.isJoined) {
        await this.client.leave()
        this.isJoined = false
      }

      console.log('[ProductionStream] Streaming stopped')

    } catch (error) {
      console.error('[ProductionStream] Error stopping stream:', error)
    }
  }

  addRemoteUserListener(callback: (users: IAgoraRTCRemoteUser[]) => void) {
    this.listeners.push(callback)
    
    // Immediately notify if there are existing users
    if (this.remoteUsers.length > 0) {
      callback(this.remoteUsers)
    }

    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'video' | 'audio') => {
    console.log('[ProductionStream] User published:', user.uid, mediaType)
    
    // Subscribe to the remote user
    await this.client.subscribe(user, mediaType)
    
    // Update remote users list
    const existingUserIndex = this.remoteUsers.findIndex(u => u.uid === user.uid)
    if (existingUserIndex >= 0) {
      this.remoteUsers[existingUserIndex] = user
    } else {
      this.remoteUsers.push(user)
    }

    // Notify listeners
    this.listeners.forEach(callback => callback(this.remoteUsers))
  }

  private handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: 'video' | 'audio') => {
    console.log('[ProductionStream] User unpublished:', user.uid, mediaType)
    // User is still in the list but stopped publishing this media type
    this.listeners.forEach(callback => callback(this.remoteUsers))
  }

  private handleUserJoined = (user: IAgoraRTCRemoteUser) => {
    console.log('[ProductionStream] User joined:', user.uid)
  }

  private handleUserLeft = (user: IAgoraRTCRemoteUser) => {
    console.log('[ProductionStream] User left:', user.uid)
    
    // Remove user from list
    this.remoteUsers = this.remoteUsers.filter(u => u.uid !== user.uid)
    
    // Notify listeners
    this.listeners.forEach(callback => callback(this.remoteUsers))
  }

  getLocalVideoTrack(): ILocalVideoTrack | null {
    return this.localVideoTrack
  }

  getRemoteUsers(): IAgoraRTCRemoteUser[] {
    return this.remoteUsers
  }

  isStreamActive(): boolean {
    return this.isJoined && (this.localVideoTrack !== null || this.remoteUsers.length > 0)
  }
}

export const productionStreamManager = ProductionStreamManager.getInstance()
export type { IAgoraRTCRemoteUser }
