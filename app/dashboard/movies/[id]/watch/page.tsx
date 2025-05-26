"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { VideoPlayer } from "@/components/video-player"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StreamLink {
  server: string;
  link: string;
  type: string;
}

interface StreamResponse {
  links: StreamLink[];
  success: boolean;
  count: number;
}

export default function WatchMoviePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Get parameters from URL
  const episodeUrl = searchParams.get("episodeUrl")
  const movieTitle = searchParams.get("movieTitle")

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Fetch stream links when component mounts
  useEffect(() => {
    const fetchStreamLinks = async () => {
      if (!episodeUrl) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        const response = await fetch(`/api/hubcloud?url=${encodeURIComponent(episodeUrl)}`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const streamData: StreamResponse = await response.json()
        
        if (streamData.success && streamData.links && streamData.links.length > 0) {
          // Use first available stream link
          setCurrentVideoUrl(streamData.links[0].link)
        }
      } catch (err) {
        console.error("Failed to fetch stream links:", err)
      } finally {
        setLoading(false)
      }
    }

    if (user && episodeUrl) {
      fetchStreamLinks()
    }
  }, [user, episodeUrl])

  const goBack = () => {
    router.back()
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-2 text-white">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading video...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-svh bg-black">
      {/* Minimal Header */}
      <div className="absolute top-4 left-4 z-50">
        <Button variant="ghost" size="icon" onClick={goBack} className="bg-black/50 text-white hover:bg-black/70">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Full Screen Video Player */}
      <div className="flex-1 flex items-center justify-center">
        {currentVideoUrl ? (
          <VideoPlayer
            src={currentVideoUrl}
            className="w-full h-full"
            autoplay={true}
          />
        ) : (
          <div className="text-white text-center">
            <p>No video available</p>
          </div>
        )}
      </div>
    </div>
  )
}
