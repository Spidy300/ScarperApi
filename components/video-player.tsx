"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { 
  AlertCircle, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings,
  SkipBack,
  SkipForward,
  Minimize
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface VideoPlayerProps {
  src: string
  poster?: string
  autoplay?: boolean
  controls?: boolean
  className?: string
}

interface AudioTrack {
  id: string
  label: string
  language: string
}

export function VideoPlayer({ 
  src, 
  poster, 
  autoplay = false, 
  controls = true, 
  className 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([])
  const [currentAudioTrack, setCurrentAudioTrack] = useState<string>('')
  const [lastTap, setLastTap] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)

  const hideControlsTimeout = useRef<NodeJS.Timeout>()

  // Format time helper
  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Show/hide controls with timeout
  const showControlsWithTimeout = useCallback(() => {
    setShowControls(true)
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current)
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }, [isPlaying])

  // Double tap to seek
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const video = videoRef.current
    if (!video) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const clickX = e.clientX - rect.left
    const isRightSide = clickX > rect.width / 2

    if (isRightSide) {
      video.currentTime = Math.min(video.currentTime + 10, video.duration)
    } else {
      video.currentTime = Math.max(video.currentTime - 10, 0)
    }
  }, [])

  // Handle mobile double tap
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const now = Date.now()
    const timeDiff = now - lastTap

    if (timeDiff < 300 && timeDiff > 0) {
      const touch = e.changedTouches[0]
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const touchX = touch.clientX - rect.left
      const isRightSide = touchX > rect.width / 2
      const video = videoRef.current
      if (!video) return

      if (isRightSide) {
        video.currentTime = Math.min(video.currentTime + 10, video.duration)
      } else {
        video.currentTime = Math.max(video.currentTime - 10, 0)
      }
    }
    setLastTap(now)
  }, [lastTap])

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      const currentTime = video.currentTime
      video.play().then(() => {
        video.currentTime = currentTime
      }).catch(console.error)
    } else {
      video.pause()
    }
  }, [])

  // Handle volume change
  const handleVolumeChange = useCallback((values: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = values[0]
    setVolume(newVolume)
    video.volume = newVolume / 100
    setIsMuted(newVolume === 0)
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume / 100
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }, [isMuted, volume])

  // Handle progress click
  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    const video = videoRef.current
    const progressBar = progressRef.current
    if (!video || !progressBar) return

    const rect = progressBar.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    video.currentTime = percentage * video.duration
  }, [])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(console.error)
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch(console.error)
    }
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current
      if (!video) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          video.currentTime = Math.max(video.currentTime - 10, 0)
          break
        case 'ArrowRight':
          e.preventDefault()
          video.currentTime = Math.min(video.currentTime + 10, video.duration)
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(prev => Math.min(prev + 10, 100))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(prev => Math.max(prev - 10, 0))
          break
        case 'KeyF':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'KeyM':
          e.preventDefault()
          toggleMute()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [togglePlayPause, toggleFullscreen, toggleMute])

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setIsLoading(true)
    setError(null)
    let hls: any = null

    const detectAudioTracks = () => {
      // Check for audio tracks using HTML5 video API
      if (video.audioTracks && video.audioTracks.length > 0) {
        const tracks = Array.from(video.audioTracks).map((track, index) => ({
          id: index.toString(),
          label: track.label || `Audio Track ${index + 1}`,
          language: track.language || 'unknown'
        }))
        setAudioTracks(tracks)
        setCurrentAudioTrack('0')
      }
    }

    const loadVideo = async () => {
      try {
        if (src.includes('.m3u8')) {
          const Hls = (await import('hls.js')).default
          
          if (Hls.isSupported()) {
            hls = new Hls({
              enableWorker: false,
              lowLatencyMode: true,
            })
            
            hls.loadSource(src)
            hls.attachMedia(video)
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setIsLoading(false)
              
              // Extract audio tracks from HLS
              if (hls.audioTracks.length > 0) {
                const tracks = hls.audioTracks.map((track: any, index: number) => ({
                  id: index.toString(),
                  label: track.name || `Audio Track ${index + 1}`,
                  language: track.lang || 'unknown'
                }))
                setAudioTracks(tracks)
                setCurrentAudioTrack('0')
              } else {
                detectAudioTracks()
              }
              
              if (autoplay) {
                video.play().catch(console.error)
              }
            })
            
            hls.on(Hls.Events.ERROR, (event: string, data: any) => {
              console.error('HLS error:', data)
              setError(`Playback error: ${data.details}`)
              setIsLoading(false)
            })
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src
            video.addEventListener('loadedmetadata', detectAudioTracks)
            setIsLoading(false)
          } else {
            setError('HLS not supported in this browser')
            setIsLoading(false)
          }
        } else {
          video.src = src
          video.addEventListener('loadedmetadata', detectAudioTracks)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Error loading video:', err)
        setError('Failed to load video')
        setIsLoading(false)
      }
    }

    // Video event listeners
    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      showControlsWithTimeout()
    }

    const handlePause = () => {
      setIsPlaying(false)
      setShowControls(true)
    }

    const handleVolumeChangeEvent = () => {
      setVolume(video.volume * 100)
      setIsMuted(video.muted)
    }

    const handleRateChange = () => {
      setPlaybackRate(video.playbackRate)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('volumechange', handleVolumeChangeEvent)
    video.addEventListener('ratechange', handleRateChange)

    loadVideo()

    return () => {
      if (hls) hls.destroy()
      video.removeEventListener('loadedmetadata', detectAudioTracks)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('volumechange', handleVolumeChangeEvent)
      video.removeEventListener('ratechange', handleRateChange)
    }
  }, [src, autoplay, showControlsWithTimeout])

  // Handle audio track change
  const handleAudioTrackChange = useCallback((trackId: string) => {
    const video = videoRef.current
    if (!video) return

    setCurrentAudioTrack(trackId)
    
    // Try to change audio track if supported
    if (video.audioTracks && video.audioTracks.length > 0) {
      // Disable all tracks first
      for (let i = 0; i < video.audioTracks.length; i++) {
        video.audioTracks[i].enabled = false
      }
      // Enable selected track
      const trackIndex = parseInt(trackId)
      if (video.audioTracks[trackIndex]) {
        video.audioTracks[trackIndex].enabled = true
      }
    } else {
      // Show a notification that audio track switching is not supported
      console.log(`Selected audio track: ${trackId}`)
      // You could also show a toast notification here
    }
  }, [])

  // Handle playback rate change
  const handlePlaybackRateChange = useCallback((rate: number) => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = rate
    setPlaybackRate(rate)
  }, [])

  return (
    <div 
      ref={containerRef}
      className={`relative group bg-black ${className || 'w-full h-full'}`}
      onMouseMove={showControlsWithTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onDoubleClick={handleDoubleClick}
      onTouchEnd={handleTouchEnd}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full"
        playsInline
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => {
          setError('Video playback failed')
          setIsLoading(false)
        }}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-red-900/80 text-white p-4 rounded-md max-w-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <h3 className="font-medium">Video Error</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Controls */}
      {controls && (
        <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {/* Center play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="w-16 h-16 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
            {/* Progress bar */}
            <div 
              ref={progressRef}
              className="w-full h-2 bg-white/20 rounded-full cursor-pointer mb-4"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-red-500 rounded-full relative"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full"></div>
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const video = videoRef.current
                    if (video) video.currentTime = Math.max(video.currentTime - 10, 0)
                  }}
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const video = videoRef.current
                    if (video) video.currentTime = Math.min(video.currentTime + 10, video.duration)
                  }}
                  className="text-white hover:bg-white/20"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  <div className="w-20">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                <span className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {/* Settings dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Playback Speed</DropdownMenuLabel>
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                      <DropdownMenuItem
                        key={rate}
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={playbackRate === rate ? "bg-accent" : ""}
                      >
                        {rate}x {rate === 1 && "(Normal)"}
                      </DropdownMenuItem>
                    ))}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Audio Track</DropdownMenuLabel>
                    {audioTracks.length > 0 ? (
                      audioTracks.map(track => (
                        <DropdownMenuItem
                          key={track.id}
                          onClick={() => handleAudioTrackChange(track.id)}
                          className={currentAudioTrack === track.id ? "bg-accent" : ""}
                        >
                          {track.label} {track.language !== 'unknown' && `(${track.language})`}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        No audio tracks available
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
    
      )}
      
    </div>
    
  )
}

export default VideoPlayer
