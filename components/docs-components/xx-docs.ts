export const XX_ENDPOINTS = [
  {
    name: "XX Home",
    method: "GET",
    endpoint: "/api/adult/xx",
    provider: "Adult (XX)",
    description: "Get latest adult videos from XX homepage (18+ Only)",
    requiresAuth: true,
    parameters: [],
    tsExample: `const response = await fetch(\`\${baseUrl}/api/adult/xx\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

interface VideoInfo {
  title: string;
  url: string;
  image: string;
  views: string;
  comments: string;
  likes: string;
  isHd: boolean;
}

interface XXResponse {
  success: boolean;
  totalVideos: number;
  videos: VideoInfo[];
}

const data: XXResponse = await response.json();
console.log(data);`,
    jsExample: `fetch(\`\${baseUrl}/api/adult/xx\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
    curlExample: `curl -X GET "https://screenscapeapi.dev/api/adult/xx" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: `{
  "success": true,
  "totalVideos": 50,
  "videos": [
    {
      "title": "Sample Video Title",
      "url": "https://xx.com/videos/sample-video",
      "image": "https://cdn.xx.com/thumb/sample.jpg",
      "views": "1.2M",
      "comments": "523",
      "likes": "12.5K",
      "isHd": true
    }
  ]
}`
  },
  {
    name: "XX Search",
    method: "GET",
    endpoint: "/api/adult/xx/search",
    provider: "Adult (XX)",
    description: "Search adult videos on XX (18+ Only)",
    requiresAuth: true,
    parameters: [
      { name: "q", type: "string", required: true, description: "Search query" },
    ],
    tsExample: `const response = await fetch(\`\${baseUrl}/api/adult/xx/search?q=\${query}\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

interface SearchVideo {
  title: string;
  url: string;
  image: string;
  views: string;
  comments: string;
  likes: string;
  isHd: boolean;
}

interface SearchResponse {
  success: boolean;
  query: string;
  searchUrl: string;
  totalResults: number;
  videos: SearchVideo[];
}

const data: SearchResponse = await response.json();
console.log(data);`,
    jsExample: `fetch(\`\${baseUrl}/api/adult/xx/search?q=\${query}\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
    curlExample: `curl -X GET "https://screenscapeapi.dev/api/adult/xx/search?q=search+term" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: `{
  "success": true,
  "query": "search term",
  "searchUrl": "https://xx.com/search/search%20term",
  "totalResults": 45,
  "videos": [
    {
      "title": "Search Result Video",
      "url": "https://xx.com/videos/search-result",
      "image": "https://cdn.xx.com/thumb/result.jpg",
      "views": "850K",
      "comments": "234",
      "likes": "8.2K",
      "isHd": true
    }
  ]
}`
  },
  {
    name: "XX Stream",
    method: "GET",
    endpoint: "/api/adult/xx/stream",
    provider: "Adult (XX)",
    description: "Get video streaming details and related videos from XX (18+ Only)",
    requiresAuth: true,
    parameters: [
      { name: "url", type: "string", required: true, description: "Full video URL" },
    ],
    tsExample: `const response = await fetch(\`\${baseUrl}/api/adult/xx/stream?url=\${videoUrl}\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

interface VideoSource {
  quality: string;
  url: string;
}

interface RelatedVideo {
  title: string;
  url: string;
  image: string;
  views: string;
  comments: string;
  likes: string;
  isHd: boolean;
}

interface StreamResponse {
  success: boolean;
  videoId: string;
  title: string;
  videoLink: string;
  poster: string;
  sources: VideoSource[];
  relatedVideos: RelatedVideo[];
}

const data: StreamResponse = await response.json();
console.log(data);`,
    jsExample: `fetch(\`\${baseUrl}/api/adult/xx/stream?url=\${videoUrl}\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
    curlExample: `curl -X GET "https://screenscapeapi.dev/api/adult/xx/stream?url=https://xx.com/videos/..." \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: `{
  "success": true,
  "videoId": "12345678",
  "title": "Video Title ♥ ★",
  "videoLink": "https://xx.com/videos/sample",
  "poster": "https://cdn.xx.com/posters/sample.jpg",
  "sources": [
    {
      "quality": "1080p",
      "url": "https://cdn.xx.com/videos/1080p/sample.mp4"
    },
    {
      "quality": "720p",
      "url": "https://cdn.xx.com/videos/720p/sample.mp4"
    },
    {
      "quality": "480p",
      "url": "https://cdn.xx.com/videos/480p/sample.mp4"
    }
  ],
  "relatedVideos": [
    {
      "title": "Related Video 1",
      "url": "https://xx.com/videos/related-1",
      "image": "https://cdn.xx.com/thumb/related1.jpg",
      "views": "950K",
      "comments": "145",
      "likes": "7.8K",
      "isHd": true
    }
  ]
}`
  },
];
