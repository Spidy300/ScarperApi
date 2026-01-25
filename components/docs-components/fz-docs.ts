export const FZ_ENDPOINTS = [
  {
    name: "FZ Home",
    method: "GET",
    endpoint: "/api/adult/fz",
    provider: "Adult (Fuckmaza)",
    description: "Get latest adult videos from fuckmaza.com (18+ Only)",
    requiresAuth: false,
    parameters: [
      { name: "page", type: "string", required: false, description: "Page number (default: 1)" },
      { name: "filter", type: "string", required: false, description: "Filter type: 'latest', 'popular', 'most-viewed', 'longest', 'random' (default: 'latest')" },
    ],
    tsExample: `const response = await fetch(\`\${baseUrl}/api/adult/fz?page=1&filter=latest\`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});

interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  trailer?: string;
  duration: string;
  views: string;
  rating?: string;
}

interface FZResponse {
  success: boolean;
  videos: Video[];
  totalVideos: number;
  filter?: string;
}

const data: FZResponse = await response.json();
console.log(data);`,
    jsExample: `fetch(\`\${baseUrl}/api/adult/fz?page=1&filter=latest\`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
    curlExample: `curl -X GET "https://screenscapeapi.dev/api/adult/fz?page=1&filter=latest" \\
  -H "Content-Type: application/json"`,
    responseExample: `{
  "success": true,
  "videos": [
    {
      "id": "791",
      "title": "Mallu wife wearing a gajra (flower garland) gives her first blowjob on her wedding night",
      "url": "https://fuckmaza.com/mallu-wife-wearing-a-gajra-flower-garland-gives-her-first-blowjob-on-her-wedding-night/",
      "thumbnail": "https://fuckmaza.com/wp-content/uploads/2025/12/gajra-pehni-mallu-wife-ki-first-blowjob-sex-clip-suhagrat-ke-din.jpg",
      "trailer": "https://cdn2.hindixxx2.club/2025/12/gajra-pehni-mallu-wife-ki-first-blowjob-sex-clip-suhagrat-ke-din.mp4",
      "duration": "00:35",
      "views": "2K",
      "rating": "75%"
    },
    {
      "id": "640",
      "title": "Famous TikTok girl Minahil Malik's nude MMS goes viral",
      "url": "https://fuckmaza.com/famous-tiktok-girl-minahil-maliks-nude-mms-goes-viral/",
      "thumbnail": "https://fuckmaza.com/wp-content/uploads/2025/12/famous-muslim-tiktok-girl-minahil-malik-ki-nangi-mms-viral.jpg",
      "trailer": "https://cdn2.hindixxx2.club/2025/12/famous-muslim-tiktok-girl-minahil-malik-ki-nangi-mms-viral.mp4",
      "duration": "06:11",
      "views": "6K",
      "rating": "75%"
    }
  ],
  "totalVideos": 2,
  "filter": "latest"
}`
  },
  {
    name: "FZ Search",
    method: "GET",
    endpoint: "/api/adult/fz/search",
    provider: "Adult (Fuckmaza)",
    description: "Search adult videos on fuckmaza.com (18+ Only)",
    requiresAuth: false,
    parameters: [
      { name: "query", type: "string", required: true, description: "Search query term" },
      { name: "q", type: "string", required: true, description: "Alternative to 'query' parameter" },
      { name: "page", type: "string", required: false, description: "Page number (default: 1)" },
      { name: "filter", type: "string", required: false, description: "Filter type: 'latest', 'popular', 'most-viewed', 'longest', 'random' (default: 'latest')" },
    ],
    tsExample: `const response = await fetch(\`\${baseUrl}/api/adult/fz/search?query=\${encodeURIComponent(searchQuery)}&page=1\`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});

interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  trailer?: string;
  duration: string;
  views: string;
  rating?: string;
}

interface SearchData {
  success: boolean;
  query: string;
  totalResults: string;
  videos: Video[];
  filter?: string;
}

const data: SearchData = await response.json();
console.log(data);`,
    jsExample: `fetch(\`\${baseUrl}/api/adult/fz/search?query=\${encodeURIComponent(searchQuery)}&page=1\`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
    curlExample: `curl -X GET "https://screenscapeapi.dev/api/adult/fz/search?query=indian&page=1" \\
  -H "Content-Type: application/json"`,
    responseExample: `{
  "success": true,
  "query": "indian",
  "totalResults": "4 videos found",
  "videos": [
    {
      "id": "2479",
      "title": "Indian college girls ki lesbian sex video XXX MMS",
      "url": "https://fuckmaza.com/indian-college-girls-ki-lesbian-sex-video-xxx-mms/",
      "thumbnail": "https://fuckmaza.com/wp-content/uploads/2026/01/Indian-college-girls-ki-lesbian-sex-video.jpg",
      "trailer": "https://cdn.sexyvideoindian.com/2026/01/Indian-college-girls-ki-lesbian-sex-video.mp4",
      "duration": "01:18",
      "views": "9K",
      "rating": "100%"
    },
    {
      "id": "1636",
      "title": "Horny Tiktoker Lesbian Desi XXX Video Video",
      "url": "https://fuckmaza.com/horny-tiktoker-lesbian-desi-xxx-video-video/",
      "thumbnail": "https://fuckmaza.com/wp-content/uploads/2026/01/Horny-Tiktoker-Lesbian-Desi-XXX-Video.jpg",
      "trailer": "https://cdn.xxxmms.com/2026/01/Horny-Tiktoker-Lesbian-Desi-XXX-Video.mp4",
      "duration": "04:08",
      "views": "5K",
      "rating": "91%"
    }
  ],
  "filter": "latest"
}`
  },
  {
    name: "FZ Stream",
    method: "GET",
    endpoint: "/api/adult/fz/stream",
    provider: "Adult (Fuckmaza)",
    description: "Get video stream URL, poster, and recommended videos from fuckmaza.com (18+ Only)",
    requiresAuth: false,
    parameters: [
      { name: "url", type: "string", required: true, description: "Full URL of the video page on fuckmaza.com" },
    ],
    tsExample: `const response = await fetch(\`\${baseUrl}/api/adult/fz/stream?url=\${encodeURIComponent(videoUrl)}\`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});

interface RecommendedVideo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  trailer?: string;
  duration: string;
  views: string;
  rating?: string;
}

interface VideoData {
  success: boolean;
  videoUrl: string | null;
  poster: string | null;
  title: string | null;
  iframeUrl: string | null;
  recommendedVideos: RecommendedVideo[];
}

const data: VideoData = await response.json();
console.log(data);`,
    jsExample: `fetch(\`\${baseUrl}/api/adult/fz/stream?url=\${encodeURIComponent(videoUrl)}\`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
    curlExample: `curl -X GET "https://screenscapeapi.dev/api/adult/fz/stream?url=https%3A%2F%2Ffuckmaza.com%2Ftamil-aunty-hot-sex-videos-romances-with-35-year-old-aunty%2F" \\
  -H "Content-Type: application/json"`,
    responseExample: `{
  "success": true,
  "videoUrl": "https://data.fuckmaza.com/tamil-aunty-hot-sex-videos-romances-with-35-year-old-aunty.mp4",
  "poster": "https://fuckmaza.com/wp-content/uploads/2025/12/tamil-sister-sex-video-.jpg",
  "title": "Tamil aunty hot sex videos romances with 35 year old aunty",
  "iframeUrl": "https://fuckmaza.com/wp-content/plugins/clean-tube-player/public/player-x.php?q=cG9zdF9pZD0xNTkzJnR5cGU9dmlkZW8...",
  "recommendedVideos": [
    {
      "id": "3002",
      "title": "Tamil girl giving blowjob and enjoying sex time clip video",
      "url": "https://fuckmaza.com/tamil-girl-giving-blowjob-and-enjoying-sex-time-clip-video/",
      "thumbnail": "https://fuckmaza.com/wp-content/uploads/2026/01/tamil-wife-ne-lover-ka-lund-boobs-par-ghiskar-blowjob-diya.jpg",
      "trailer": "https://cdn2.hindixxx2.club/2026/01/tamil-wife-ne-lover-ka-lund-boobs-par-ghiskar-blowjob-diya.mp4",
      "duration": "11:50",
      "views": "1K",
      "rating": "0%"
    },
    {
      "id": "3010",
      "title": "Tamil husband wife ki homemade sex video clip",
      "url": "https://fuckmaza.com/tamil-husband-wife-ki-homemade-sex-video-clip/",
      "thumbnail": "https://fuckmaza.com/wp-content/uploads/2026/01/Tamil-husband-wife-ki-homemade-sex-video.jpg",
      "trailer": "https://cdn.sexyvideoindian.com/2026/01/Tamil-husband-wife-ki-homemade-sex-video.mp4",
      "duration": "02:50",
      "views": "1K"
    }
  ]
}`
  }
];
