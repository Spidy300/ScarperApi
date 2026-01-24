export const XV_ENDPOINTS = [
  {
    name: "XV Home",
    method: "GET",
    endpoint: "/api/adult/xv",
    provider: "Adult (XVideos)",
    description: "Get latest adult videos from xvideos.place (18+ Only)",
    requiresAuth: true,
    parameters: [
      { name: "page", type: "string", required: false, description: "Page number (default: 0)" },
      { name: "category", type: "string", required: false, description: "Category slug (e.g., 'amateur', 'milf')" },
    ],
    tsExample: `const response = await fetch(\`\${baseUrl}/api/adult/xv?page=0\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

interface Uploader {
  name: string;
  url: string;
  verified: boolean;
}

interface VideoItem {
  id: string;
  encoded_id: string;
  title: string;
  url: string;
  thumbnail: string;
  thumbnail_sfw?: string;
  duration: string;
  views: string;
  uploader: Uploader;
  quality?: string;
}

interface XVResponse {
  success: boolean;
  page: number;
  totalItems: number;
  items: VideoItem[];
}

const data: XVResponse = await response.json();
console.log(data);`,
    jsExample: `fetch(\`\${baseUrl}/api/adult/xv?page=0\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
    curlExample: `curl -X GET "https://screenscapeapi.dev/api/adult/xv?page=0" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: `{
  "success": true,
  "page": 0,
  "totalItems": 27,
  "items": [
    {
      "id": "84891641",
      "encoded_id": "otfomfv692c",
      "title": "Horny Asian Passionate in Bathroom then she said ''Cum in my Pussy Please''",
      "url": "https://xvideos.place/video.otfomfv692c/horny_asian_passionate_in_bathroom_then_she_said_cum_in_my_pussy_please_",
      "thumbnail": "https://thumb-cdn77.xvideos-cdn.com/8a111fa6-495c-438f-ba57-ba2f8530c71b/0/xv_7_t.jpg",
      "thumbnail_sfw": "https://thumb-cdn77.xvideos-cdn.com/8a111fa6-495c-438f-ba57-ba2f8530c71b/0/xv_1_t.jpg",
      "duration": "22 min",
      "views": "2.6M",
      "uploader": {
        "name": "bellamissU",
        "url": "https://xvideos.place/bellamissu",
        "verified": true
      },
      "quality": "1080p"
    }
  ]
}`
  },
  {
    name: "XV Search",
    method: "GET",
    endpoint: "/api/adult/xv/search",
    provider: "Adult (XVideos)",
    description: "Search adult videos on xvideos.place (18+ Only)",
    requiresAuth: true,
    parameters: [
      { name: "q", type: "string", required: true, description: "Search query" },
      { name: "page", type: "string", required: false, description: "Page number (default: 0)" },
    ],
    tsExample: `const response = await fetch(\`\${baseUrl}/api/adult/xv/search?q=\${encodeURIComponent(query)}&page=0\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

interface Uploader {
  name: string;
  url: string;
  verified: boolean;
}

interface SearchResult {
  id: string;
  encoded_id: string;
  title: string;
  url: string;
  thumbnail: string;
  thumbnail_sfw?: string;
  duration: string;
  views: string;
  uploader: Uploader;
  quality?: string;
}

interface SearchResponse {
  success: boolean;
  query: string;
  page: number;
  totalResults: number;
  results: SearchResult[];
}

const data: SearchResponse = await response.json();
console.log(data);`,
    jsExample: `fetch(\`\${baseUrl}/api/adult/xv/search?q=\${encodeURIComponent(query)}&page=0\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
    curlExample: `curl -X GET "https://screenscapeapi.dev/api/adult/xv/search?q=asian&page=0" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: `{
  "success": true,
  "query": "asian",
  "page": 0,
  "totalResults": 24,
  "results": [
    {
      "id": "88220307",
      "encoded_id": "ouiiivkee15",
      "title": "ModelMedia Asia - Young married woman Bai Jie - Newlyweds with a lot of love",
      "url": "https://xvideos.place/video.ouiiivkee15/modelmedia_asia_-_young_married_woman_bai_jie_-_newlyweds_with_a_lot_of_love",
      "thumbnail": "https://thumb-cdn77.xvideos-cdn.com/98c5594e-2edf-4d97-ac0f-65dfb7c7a7b7/3/xv_23_t.jpg",
      "thumbnail_sfw": "https://thumb-cdn77.xvideos-cdn.com/98c5594e-2edf-4d97-ac0f-65dfb7c7a7b7/3/xv_5_t.jpg",
      "duration": "68 min",
      "views": "61.4k",
      "uploader": {
        "name": "ModelMedia",
        "url": "https://xvideos.place/asiam",
        "verified": true
      },
      "quality": "1080p"
    }
  ]
}`
  },
  {
    name: "XV Stream",
    method: "GET",
    endpoint: "/api/adult/xv/stream",
    provider: "Adult (XVideos)",
    description: "Get video stream URL and related videos from xvideos.place (18+ Only)",
    requiresAuth: true,
    parameters: [
      { name: "url", type: "string", required: true, description: "Full URL of the video page" },
    ],
    tsExample: `const response = await fetch(\`\${baseUrl}/api/adult/xv/stream?url=\${encodeURIComponent(videoUrl)}\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

interface RelatedVideo {
  id: number;
  eid: string;
  u: string;
  i: string;
  tf: string;
  t: string;
  d: string;
  r: string;
  n: string;
  p: string;
  pn: string;
  pu: string;
}

interface StreamResponse {
  success: boolean;
  videoUrl: string | null;
  videoType: string | null;
  imageUrl: string | null;
  title: string | null;
  relatedVideos: RelatedVideo[];
}

const data: StreamResponse = await response.json();
console.log(data);`,
    jsExample: `fetch(\`\${baseUrl}/api/adult/xv/stream?url=\${encodeURIComponent(videoUrl)}\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
    curlExample: `curl -X GET "https://screenscapeapi.dev/api/adult/xv/stream?url=https%3A%2F%2Fxvideos.place%2Fvideo.otfomfv692c%2Fhorny_asian_passionate_in_bathroom" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: `{
  "success": true,
  "videoUrl": "https://hls-delivery.xvideos-cdn.com/videos/mp4/path/to/video.mp4",
  "videoType": "video/mp4",
  "imageUrl": "https://thumb-cdn77.xvideos-cdn.com/8a111fa6-495c-438f-ba57-ba2f8530c71b/0/xv_7_t.jpg",
  "title": "Horny Asian Passionate in Bathroom then she said ''Cum in my Pussy Please''",
  "relatedVideos": [
    {
      "id": 67086327,
      "eid": "kffamfm136c",
      "u": "https://xvideos.place/video.mlclbu1971/get_fucked_-_lesbian_sex",
      "i": "https://thumb-cdn77.xvideos-cdn.com/6c2aac99-77a1-47ae-9e7b-adda580cb3f9/0/xv_11_t.jpg",
      "tf": "https://thumb-cdn77.xvideos-cdn.com/6c2aac99-77a1-47ae-9e7b-adda580cb3f9/0/xv_1_t.jpg",
      "t": "Get Fucked - Lesbian Sex",
      "d": "11min",
      "r": "H",
      "n": "7.3M",
      "p": "https://cdn77-pic.xvideos-cdn.com/videos/thumbsl/...",
      "pn": "Teamskeet",
      "pu": "/teamskeet"
    }
  ]
}`
  }
];
