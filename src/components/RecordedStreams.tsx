import { useLiveStream } from '../contexts/LiveStreamContext'
import { Play, Clock, User, Calendar } from 'lucide-react'

export const RecordedStreams = () => {
  const { recordedStreams } = useLiveStream()

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (recordedStreams.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Recorded Streams</h3>
        <p className="text-gray-400">Recorded live streams will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Recorded Streams</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recordedStreams.map((stream) => (
          <div key={stream.id} className="bg-gray-900 rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-shadow">
            {/* Video Thumbnail */}
            <div className="relative aspect-video bg-black">
              {stream.thumbnail_url ? (
                <img
                  src={stream.thumbnail_url}
                  alt={stream.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              {/* Duration overlay */}
              {stream.duration && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                  {formatDuration(stream.duration)}
                </div>
              )}
              
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50">
                <button
                  onClick={() => window.open(stream.cloudinary_url, '_blank')}
                  className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors"
                >
                  <Play className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Video Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                {stream.title}
              </h3>
              
              {stream.description && (
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {stream.description}
                </p>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-400">
                  <User className="h-4 w-4 mr-2" />
                  <span>{stream.creator_name}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-400">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{formatDate(stream.created_at)}</span>
                </div>
                
                {stream.duration && (
                  <div className="flex items-center text-sm text-gray-400">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{formatDuration(stream.duration)}</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => window.open(stream.cloudinary_url, '_blank')}
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Watch Recording</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
