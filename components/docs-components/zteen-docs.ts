export const ZTEEN_ENDPOINTS = [
  {
    name: "Zteen Home",
    method: "GET",
    endpoint: "/api/adult/zteen",
    provider: "Adult (Zteen)",
    description: "Get latest adult videos from Zteen homepage (18+ Only)",
    requiresAuth: true,
    parameters: [
      { name: "page", type: "string", required: false, description: "Page number (default: 1)" },
    ],
    tsExample: `const response = await fetch(\`\${baseUrl}/api/adult/zteen?page=1\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

interface VideoItem {
  title: string;
  url: string;
  image: string;
}

interface ZteenResponse {
  success: boolean;
  page: number;
  totalVideos: number;
  videos: VideoItem[];
}

const data: ZteenResponse = await response.json();
console.log(data);`,
    jsExample: `fetch(\`\${baseUrl}/api/adult/zteen?page=1\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
    curlExample: `curl -X GET "https://screenscapeapi.dev/api/adult/zteen?page=1" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: `{
  "success": true,
  "page": 1,
  "totalVideos": 20,
  "videos": [
    {
      "title": "Popular Teen Video Title",
      "url": "https://www.zteenporn.com/play-video/...",
      "image": "https://www.zteenporn.com/contents/videos_screenshots/..."
    }
  ]
}`
  },
  {
    name: "Zteen Search",
    method: "GET",
    endpoint: "/api/adult/zteen/search",
    provider: "Adult (Zteen)",
    description: "Search adult videos on Zteen (18+ Only)",
    requiresAuth: true,
    parameters: [
      { name: "q", type: "string", required: true, description: "Search query" },
    ],
    tsExample: `const response = await fetch(\`\${baseUrl}/api/adult/zteen/search?q=\${query}\`, {
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
    jsExample: `fetch(\`\${baseUrl}/api/adult/zteen/search?q=\${query}\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
    curlExample: `curl -X GET "https://screenscapeapi.dev/api/adult/zteen/search?q=teen" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: `{
  "success": true,
  "query": "teen",
  "searchUrl": "https://www.zteenporn.com/search/teen/",
  "totalResults": 15,
  "videos": [
    {
      "title": "Search Result Video Title",
      "url": "https://www.zteenporn.com/play-video/...",
      "image": "https://www.zteenporn.com/contents/videos_screenshots/..."
    }
  ]
}`
  },
  {
    name: "Zteen Stream",
    method: "GET",
    endpoint: "/api/adult/zteen/stream",
    provider: "Adult (Zteen)",
    description: "Get video stream URL and related videos from Zteen video page (18+ Only)",
    requiresAuth: true,
    parameters: [
      { name: "url", type: "string", required: true, description: "Full video page URL" },
    ],
    tsExample: `const response = await fetch(\`\${baseUrl}/api/adult/zteen/stream?url=\${encodeURIComponent(videoUrl)}\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

interface RelatedVideo {
  title: string;
  url: string;
  image: string;
}

interface StreamResponse {
  success: boolean;
  videoId: string;
  videoSource: string;
  videoPoster: string;
  relatedVideos: RelatedVideo[];
}

const data: StreamResponse = await response.json();
console.log(data);`,
    jsExample: `fetch(\`\${baseUrl}/api/adult/zteen/stream?url=\${encodeURIComponent(videoUrl)}\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
    curlExample: `curl -X GET "https://screenscapeapi.dev/api/adult/zteen/stream?url=https%3A%2F%2Fwww.zteenporn.com%2Fplay-video%2F..." \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: `{
  "success": true,
  "videoId": "551",
  "videoSource": "https://www.zteenporn.com/get_file/1/.../.mp4/",
  "videoPoster": "/contents/videos_screenshots/0/551/preview.mp4.jpg",
  "relatedVideos": [
    {
      "title": "Related Video Title",
      "url": "https://www.zteenporn.com/play-video/...",
      "image": "https://www.zteenporn.com/contents/videos_screenshots/..."
    }
  ]
}`
  }
];
