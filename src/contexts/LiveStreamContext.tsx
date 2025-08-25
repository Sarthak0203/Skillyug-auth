import { createContext, useContext, useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { globalStreamManager } from '../lib/simpleStream'
import toast from 'react-hot-toast'

interface LiveStreamContextType {
  isStreaming: boolean
  isLiveStreamActive: boolean
  streamUrl: string | null
  currentStream: MediaStream | null
  globalStream: MediaStream | null // Shared stream for all users
  recordedStreams: RecordedStream[]
  startStream: () => Promise<void>
  stopStream: () => Promise<void>
  joinStream: () => void
  leaveStream: () => void
  loading: boolean
}

interface RecordedStream {
  id: string
  title: string
  description?: string
  cloudinary_url: string
  thumbnail_url?: string
  duration?: number
  created_at: string
  created_by: string
  creator_name: string
}

const LiveStreamContext = createContext<LiveStreamContextType | undefined>(undefined)

export const useLiveStream = () => {
  const context = useContext(LiveStreamContext)
  if (context === undefined) {
    throw new Error('useLiveStream must be used within a LiveStreamProvider')
  }
  return context
}

interface LiveStreamProviderProps {
  children: ReactNode
}

export const LiveStreamProvider = ({ children }: LiveStreamProviderProps) => {
  const { user, profile } = useAuth()
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLiveStreamActive, setIsLiveStreamActive] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null)
  const [globalStream, setGlobalStream] = useState<MediaStream | null>(null) // SHARED for all users
  const [recordedStreams, setRecordedStreams] = useState<RecordedStream[]>([])
  const [loading, setLoading] = useState(false)
  const [streamUpdateTrigger, setStreamUpdateTrigger] = useState(0) // Force re-renders
  
  const streamRef = useRef<MediaStream | null>(null)
  const recordingRef = useRef<MediaRecorder | null>(null)
  const recordedChunks = useRef<Blob[]>([])

  // Check if user can stream (admin or instructor)
  const canStream = profile?.user_type === 'admin' || profile?.user_type === 'instructor'

  // Enhanced stream sharing with cross-tab simulation
  useEffect(() => {
    if (!canStream) {
      console.log('[LiveStreamContext] 📡 Student: Listening for instructor stream...')
      
      // Check if there's already a stream available
      const existingStream = globalStreamManager.getStream()
      if (existingStream) {
        console.log('[LiveStreamContext] 🎥 Found existing stream on mount!')
        setGlobalStream(existingStream)
        setStreamUpdateTrigger(prev => prev + 1)
      }
      
      // Students listen for instructor streams
      const unsubscribe = globalStreamManager.addListener((stream) => {
        if (stream) {
          console.log('[LiveStreamContext] 🎥 Student received instructor stream!')
          setGlobalStream(stream)
          // Force a small delay to ensure video element is ready
          setTimeout(() => {
            setStreamUpdateTrigger(prev => prev + 1)
          }, 100)
        } else {
          console.log('[LiveStreamContext] 📴 Stream ended')
          setGlobalStream(null)
        }
      })

      // For demo: If student detects active stream but no video, simulate getting camera
      const checkForInstructorStream = async () => {
        if (isLiveStreamActive && !globalStream) {
          console.log('[LiveStreamContext] 🎬 Student: Simulating instructor stream reception...')
          try {
            // In a real app, this would be the instructor's stream via WebRTC
            // For demo, we'll create a student camera view to show the concept works
            const simulatedStream = await navigator.mediaDevices.getUserMedia({
              video: { width: 640, height: 480 },
              audio: true
            })
            
            console.log('[LiveStreamContext] 📺 Student: Received simulated instructor stream!')
            setGlobalStream(simulatedStream)
            globalStreamManager.setStream(simulatedStream)
          } catch (error) {
            console.error('[LiveStreamContext] Failed to simulate stream:', error)
          }
        }
      }

      // Check periodically for active streams
      const interval = setInterval(checkForInstructorStream, 2000)
      
      return () => {
        unsubscribe()
        clearInterval(interval)
      }
    } else {
      console.log('[LiveStreamContext] 👨‍🏫 Instructor ready to stream')
    }
  }, [canStream, isLiveStreamActive, globalStream])

  // Force component updates when stream changes
  const forceUpdate = () => setStreamUpdateTrigger(prev => prev + 1)

  // Check for active live streams on component mount
  useEffect(() => {
    checkActiveLiveStream()
    fetchRecordedStreams()
    
    // Set up real-time subscription for live stream status
    const streamSubscription = supabase
      .channel('live_streams')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_streams'
      }, (payload) => {
        console.log('Live stream update:', payload)
        checkActiveLiveStream()
      })
      .subscribe()

    const recordingsSubscription = supabase
      .channel('recorded_streams')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'recorded_streams'
      }, (payload) => {
        console.log('Recorded streams update:', payload)
        fetchRecordedStreams()
      })
      .subscribe()

    return () => {
      streamSubscription.unsubscribe()
      recordingsSubscription.unsubscribe()
    }
  }, [])

  const checkActiveLiveStream = async () => {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() // Use maybeSingle to handle 0 or 1 results gracefully

      if (error) {
        console.error('Error checking active live stream:', error)
        // If table doesn't exist, mark as no active stream
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log('Live streams table does not exist or no active streams found')
          setIsLiveStreamActive(false)
          setStreamUrl(null)
          return
        }
        throw error
      }

      if (data) {
        console.log('Found active live stream:', data)
        setIsLiveStreamActive(true)
        setStreamUrl(data.stream_url)
      } else {
        console.log('No active live streams found')
        setIsLiveStreamActive(false)
        setStreamUrl(null)
      }
    } catch (error) {
      console.error('Error checking active live stream:', error)
      // Don't show error toast for table existence issues
      if (error instanceof Error && !error.message?.includes('does not exist')) {
        toast.error('Failed to check active streams')
      }
      setIsLiveStreamActive(false)
      setStreamUrl(null)
    }
  }

  const fetchRecordedStreams = async () => {
    try {
      console.log('Fetching recorded streams...')
      
      // Try query with correct foreign key relationship
      const { data, error } = await supabase
        .from('recorded_streams')
        .select(`
          *,
          user_profiles:created_by (
            full_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Join query failed:', error)
        
        // Fallback to simple query without join
        const { data: simpleData, error: simpleError } = await supabase
          .from('recorded_streams')
          .select('*')
          .order('created_at', { ascending: false })

        if (simpleError) {
          console.error('Simple query also failed:', simpleError)
          throw simpleError
        }

        console.log('Using simple query result:', simpleData)
        // Fallback to simple data without creator names
        const streamsWithoutCreatorName = simpleData?.map(stream => ({
          ...stream,
          creator_name: 'Unknown'
        })) || []
        setRecordedStreams(streamsWithoutCreatorName)
        return
      }

      const streamsWithCreatorName = data?.map(stream => ({
        ...stream,
        creator_name: stream.user_profiles?.full_name || 'Unknown'
      })) || []

      console.log('Processed recorded streams with creator names:', streamsWithCreatorName)
      setRecordedStreams(streamsWithCreatorName)
    } catch (error) {
      console.error('Error fetching recorded streams:', error)
      if (error instanceof Error && !error.message?.includes('does not exist')) {
        toast.error(`Failed to load recorded streams: ${error.message}`)
      }
      // Set empty array as fallback
      setRecordedStreams([])
    }
  }

  const startStream = async () => {
    if (!user || !profile) {
      toast.error('Please log in to start streaming')
      return
    }

    if (profile.user_type !== 'admin' && profile.user_type !== 'instructor') {
      toast.error('Only admins and instructors can start live streams')
      return
    }

    try {
      setLoading(true)
      console.log('Starting stream for user:', user.id, 'type:', profile.user_type)
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      streamRef.current = stream
      setCurrentStream(stream) // Update state so components re-render
      
      // 🚀 SHARE STREAM GLOBALLY FIRST - BEFORE DATABASE!
      console.log('[LiveStreamContext] 🌐 Sharing stream globally to all students...')
      globalStreamManager.setStream(stream)
      setGlobalStream(stream) // Also set local state
      console.log('[LiveStreamContext] ✅ Stream shared successfully!')

      // Force update to ensure components re-render
      setStreamUpdateTrigger(prev => prev + 1)

      // Create a unique stream URL (in a real implementation, this would be from your streaming service)
      const streamUrl = `stream_${Date.now()}_${user.id}`

      // Start recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      })

      recordingRef.current = mediaRecorder
      recordedChunks.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data)
        }
      }

      mediaRecorder.start(1000) // Collect data every second

      // Create live stream record in database
      const { error: dbError } = await supabase
        .from('live_streams')
        .insert({
          created_by: user.id,
          stream_url: streamUrl,
          is_active: true,
          title: `Live Stream - ${new Date().toLocaleString()}`,
          description: `Live stream by ${profile.full_name || user.email?.split('@')[0] || 'Instructor'}`
        })

      if (dbError) {
        console.error('Database error:', dbError)
        // Don't fail the stream if database save fails - stream can work without DB
        console.warn('Stream started but not saved to database - continuing anyway')
        toast('⚠️ Stream started (database save failed)', { 
          icon: '⚠️',
          duration: 3000 
        })
      } else {
        console.log('Stream saved to database successfully')
      }

      setIsStreaming(true)
      setIsLiveStreamActive(true)
      setStreamUrl(streamUrl)
      forceUpdate() // Force components to re-render with new stream
      toast.success('Live stream started successfully!')

    } catch (error) {
      console.error('Error starting stream:', error)
      toast.error('Failed to start live stream')
      
      // Clean up on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
        setCurrentStream(null) // Clear state on error too
        setGlobalStream(null) // CLEAR SHARED STREAM
      }
    } finally {
      setLoading(false)
    }
  }

  const stopStream = async () => {
    if (!user || !profile || (profile?.user_type !== 'admin' && profile?.user_type !== 'instructor')) {
      toast.error('Only admins and instructors can stop live streams')
      return
    }

    try {
      setLoading(true)

      // Stop recording first
      if (recordingRef.current && recordingRef.current.state !== 'inactive') {
        recordingRef.current.stop()
        
        recordingRef.current.onstop = async () => {
          const recordedBlob = new Blob(recordedChunks.current, {
            type: 'video/webm'
          })

          // Upload to Cloudinary
          await uploadRecordingToCloudinary(recordedBlob)
        }
      }

      // Stop camera and microphone - ensure all tracks are stopped
      if (streamRef.current) {
        console.log('Stopping camera tracks...')
        streamRef.current.getTracks().forEach(track => {
          console.log('Stopping track:', track.kind, track.label)
          track.stop()
        })
        streamRef.current = null
        setCurrentStream(null) // Clear state so components re-render
        setGlobalStream(null) // CLEAR SHARED STREAM
        console.log('Camera stopped and stream cleared')
      }

      // 🛑 CLEAR GLOBAL STREAM - SIMPLE!
      console.log('[LiveStreamContext] 🌐 Clearing global stream...')
      globalStreamManager.clearStream()
      console.log('[LiveStreamContext] ✅ Global stream cleared!')

      // Update database to mark ALL active streams as inactive for this user
      const { data: existingStreams, error: queryError } = await supabase
        .from('live_streams')
        .select('id, title')
        .eq('is_active', true)
        .eq('created_by', user.id)

      if (queryError) {
        console.error('Error querying live streams:', queryError)
        toast.error('Stream stopped locally, but database update may have failed')
      } else if (existingStreams && existingStreams.length > 0) {
        console.log(`Stopping ${existingStreams.length} active stream(s) for user ${user.id}`)
        
        // Update existing streams
        const { error: updateError } = await supabase
          .from('live_streams')
          .update({ 
            is_active: false,
            ended_at: new Date().toISOString()
          })
          .eq('is_active', true)
          .eq('created_by', user.id)

        if (updateError) {
          console.error('Error updating live streams:', updateError)
          toast.error('Stream stopped locally, but database update failed')
        } else {
          console.log('Successfully updated database - streams marked as inactive')
        }
      } else {
        console.log('No active streams found in database for this user')
      }

      setIsStreaming(false)
      setIsLiveStreamActive(false)
      setStreamUrl(null)
      forceUpdate() // Force components to re-render and cleanup
      toast.success('Live stream stopped successfully!')

    } catch (error) {
      console.error('Error stopping stream:', error)
      toast.error('Failed to stop live stream')
    } finally {
      setLoading(false)
    }
  }

  const uploadRecordingToCloudinary = async (recordedBlob: Blob) => {
    try {
      console.log('Starting recording upload to Cloudinary...')
      console.log('Blob size:', recordedBlob.size, 'bytes')
      console.log('Cloudinary cloud name:', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME)
      
      const formData = new FormData()
      formData.append('file', recordedBlob, `recording_${Date.now()}.webm`)
      formData.append('upload_preset', 'skillyug_videos') // You'll need to create this preset in Cloudinary
      formData.append('resource_type', 'video')

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload`,
        {
          method: 'POST',
          body: formData
        }
      )

      const result = await response.json()
      console.log('Cloudinary response:', result)

      if (result.secure_url) {
        console.log('Upload successful, saving to database...')
        // Save recording info to database
        const { error } = await supabase
          .from('recorded_streams')
          .insert({
            created_by: user!.id,
            title: `Recorded Stream - ${new Date().toLocaleString()}`,
            cloudinary_url: result.secure_url,
            thumbnail_url: result.secure_url.replace('/video/upload/', '/video/upload/so_0/'),
            duration: result.duration,
            description: `Recorded by ${profile?.full_name || 'Unknown'}`
          })

        if (error) {
          console.error('Database insert error:', error)
          throw error
        }
        
        console.log('Recording saved to database successfully!')
        toast.success('Recording uploaded and saved successfully!')
        
        // Refresh recorded streams list
        fetchRecordedStreams()
      } else {
        console.error('Cloudinary upload failed:', result)
        throw new Error(result.error?.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading recording:', error)
      toast.error('Failed to upload recording')
    }
  }

  const joinStream = () => {
    // For students to join the live stream
    if (isLiveStreamActive && streamUrl) {
      console.log('Student joining stream:', streamUrl)
      toast.success('Joined live stream!')
      // In a real implementation, this would connect to the streaming server
      // and receive the instructor's video stream
    } else {
      toast.error('No active live stream available')
    }
  }

  const leaveStream = () => {
    // For students to leave the live stream  
    console.log('Student leaving stream')
    toast.success('Left live stream')
    // In a real implementation, this would disconnect from the streaming server
  }

  const value: LiveStreamContextType = {
    isStreaming,
    isLiveStreamActive,
    streamUrl,
    currentStream,
    globalStream,
    recordedStreams,
    startStream,
    stopStream,
    joinStream,
    leaveStream,
    loading
  }

  // Use streamUpdateTrigger to force re-renders when stream changes
  useEffect(() => {
    // This effect runs when streamUpdateTrigger changes, forcing updates
  }, [streamUpdateTrigger])

  return (
    <LiveStreamContext.Provider value={value}>
      {children}
    </LiveStreamContext.Provider>
  )
}
