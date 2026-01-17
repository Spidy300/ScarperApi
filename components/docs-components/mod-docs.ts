export const MOD_ENDPOINTS = [
  {
    name: "Moviesmod Home",
    method: "GET",
    endpoint: "/api/mod",
    provider: "Moviesmod",
    description: "Get recent movies and TV shows from Moviesmod homepage",
    requiresAuth: true,
    parameters: [
      { name: "page", type: "string", required: false, description: "Page number (default: 1)" },
    ],
    tsExample: `const response = await fetch(\`\${baseUrl}/api/mod?page=1\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

interface Movie {
  title: string;
  url: string;
  image: string;
}

interface ModResponse {
  success: boolean;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  totalResults: number;
  results: Movie[];
}

const data: ModResponse = await response.json();
console.log(data);`,
    jsExample: `fetch(\`\${baseUrl}/api/mod?page=1\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
    curlExample: `curl -X GET "https://screenscapeapi.dev/api/mod?page=1" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: `{
  "success": true,
  "page": 1,
  "totalPages": 1015,
  "hasNextPage": true,
  "totalResults": 20,
  "results": [
    {
      "title": "Download Can This Love Be Translated? (Season 1) Multi Audio {Hindi-English-Korean} WeB-DL 480p [240MB] || 720p [430MB] || 1080p [1.7GB]",
      "url": "https://moviesmod.build/download-can-this-love-be-translated-season-1-hindi-480p-720p-1080p/",
      "image": "https://moviesmod.build/wp-content/uploads/2026/01/Download-Can-This-Love-Be-Translated-MoviesMod.jpg"
    }
  ]
}`
  },
  {
    name: "Moviesmod Search",
    method: "GET",
    endpoint: "/api/mod/search",
    provider: "Moviesmod",
    description: "Search movies and TV shows on Moviesmod",
    requiresAuth: true,
    parameters: [
      { name: "q", type: "string", required: true, description: "Search query" },
    ],
    tsExample: `const response = await fetch(\`\${baseUrl}/api/mod/search?q=loki\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

interface Movie {
  title: string;
  url: string;
  image: string;
}

interface SearchResponse {
  success: boolean;
  query: string;
  totalResults: number;
  results: Movie[];
}

const data: SearchResponse = await response.json();
console.log(data);`,
    jsExample: `fetch(\`\${baseUrl}/api/mod/search?q=loki\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
    curlExample: `curl -X GET "https://screenscapeapi.dev/api/mod/search?q=loki" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: `{
  "success": true,
  "query": "loki",
  "totalResults": 2,
  "results": [
    {
      "title": "Download Loki (Season 1 – 2) {Hindi-English} WeB-DL 480p [160MB] || 720p [270MB] || 1080p [1.2GB]",
      "url": "https://moviesmod.build/download-loki-hindi-season-2/",
      "image": "https://moviesmod.build/wp-content/uploads/2021/06/Download-Loki-Season-1-Hindi-English-720p-WeB-DL-Esubs-200x300.jpg"
    }
  ]
}`
  },
  {
    name: "Moviesmod Details",
    method: "GET",
    endpoint: "/api/mod/details",
    provider: "Moviesmod",
    description: "Get movie/show details including screenshots and download links",
    requiresAuth: true,
    parameters: [
      { name: "url", type: "string", required: true, description: "Full URL of the movie/show page" },
    ],
    tsExample: `const response = await fetch(\`\${baseUrl}/api/mod/details?url=\${encodeURIComponent(movieUrl)}\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

interface DownloadLink {
  quality: string;
  format?: string;
  audio?: string;
  size?: string;
  episodeLink?: string;
  batchLink?: string;
}

interface MovieDetails {
  title: string;
  description?: string;
  image?: string;
  screenshots: string[];
  downloadLinks: DownloadLink[];
}

interface DetailsResponse {
  success: boolean;
  data: MovieDetails;
}

const data: DetailsResponse = await response.json();
console.log(data);`,
    jsExample: `fetch(\`\${baseUrl}/api/mod/details?url=\${encodeURIComponent(movieUrl)}\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
    curlExample: `curl -X GET "https://screenscapeapi.dev/api/mod/details?url=https%3A%2F%2Fmoviesmod.build%2Fdownload-the-rip-2026-hindi-english-480p-720p-1080p%2F" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: `{
  "success": true,
  "data": {
    "title": "Download The Rip (2026) Dual Audio (Hindi-English) Msubs Web-Dl 480p [380MB] || 720p [1GB] || 1080p [2.4GB]",
    "description": "A master interpreter faces his toughest task yet: unraveling the whimsical heart of a celebrity. Can he translate emotions into the language of love?",
    "image": "https://moviesmod.build/wp-content/uploads/2026/01/Download-The-Rip-MoviesMod.jpg",
    "screenshots": [
      "https://i0.wp.com/blogger.googleusercontent.com/img/...",
      "https://i0.wp.com/blogger.googleusercontent.com/img/..."
    ],
    "downloadLinks": [
      {
        "quality": "480p",
        "format": "x264",
        "audio": "Hindi-English",
        "size": "380MB",
        "episodeLink": "https://links.modpro.blog/archives/148034"
      },
      {
        "quality": "720p",
        "format": "10bit",
        "audio": "Hindi-English",
        "size": "670MB",
        "episodeLink": "https://links.modpro.blog/archives/148099"
      },
      {
        "quality": "1080p",
        "audio": "Hindi-English",
        "size": "2.4GB",
        "episodeLink": "https://links.modpro.blog/archives/148036"
      }
    ]
  }
}`
  },
  {
    name: "Moviesmod Episode/Download Links",
    method: "GET",
    endpoint: "/api/mod/modpro",
    provider: "Moviesmod",
    description: "Get episode links, tech links, and server download links from modpro.blog pages",
    requiresAuth: true,
    parameters: [
      { name: "url", type: "string", required: true, description: "Full URL of the episode/download links page" },
    ],
    tsExample: `const response = await fetch(\`\${baseUrl}/api/mod/modpro?url=\${encodeURIComponent(linksUrl)}\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

interface EpisodeLink {
  episode: string;
  url: string;
}

interface ServerLink {
  server: string;
  url: string;
  title?: string;
}

interface ModProResponse {
  success: boolean;
  data: {
    serverLinks: ServerLink[];
    episodeLinks: EpisodeLink[];
    techLinks: EpisodeLink[];
    downloadLinks: string[];
    totalEpisodes: number;
  };
}

const data: ModProResponse = await response.json();
console.log(data);`,
    jsExample: `fetch(\`\${baseUrl}/api/mod/modpro?url=\${encodeURIComponent(linksUrl)}\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
    curlExample: `curl -X GET "https://screenscapeapi.dev/api/mod/modpro?url=https%3A%2F%2Fepisodes.modpro.blog%2Farchives%2F122296" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: `{
  "success": true,
  "data": {
    "serverLinks": [
      {
        "server": "✅ Fast Server (G-Drive)",
        "url": "https://tech.unblockedgames.world/?sid=...",
        "title": "✔ Fast Google Drive Links (No Login Required)"
      },
      {
        "server": "🚀 Google Drive (Server 2)",
        "url": "https://tech.unblockedgames.world/?sid=...",
        "title": "✔ Fast Google Drive Links (No Need to Login)"
      }
    ],
    "episodeLinks": [],
    "techLinks": [
      {
        "episode": "Episode 1",
        "url": "https://tech.unblockedgames.world/?sid=..."
      },
      {
        "episode": "Episode 2",
        "url": "https://tech.unblockedgames.world/?sid=..."
      }
    ],
    "downloadLinks": [],
    "totalEpisodes": 2
  }
}`
  },
  {
    name: "Moviesmod Stream Extractor",
    method: "GET",
    endpoint: "/api/uhdmovies/tech",
    provider: "Moviesmod",
    description: "Extract direct download links from tech.unblockedgames.world URLs (ResumeBot, Cloud Download, CF Workers, Instant, CDN) - Uses UHDMovies tech extractor",
    requiresAuth: true,
    parameters: [
      { name: "url", type: "string", required: true, description: "Tech.unblockedgames.world URL with sid parameter" },
    ],
    tsExample: `const response = await fetch(\`\${baseUrl}/api/uhdmovies/tech?url=\${encodeURIComponent(techUrl)}\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

interface Stream {
  server: string;
  link: string;
  type: string;
}

interface StreamResponse {
  success: boolean;
  data: {
    servers: Stream[];
    totalServers: number;
  };
}

const data: StreamResponse = await response.json();
console.log(data);`,
    jsExample: `fetch(\`\${baseUrl}/api/uhdmovies/tech?url=\${encodeURIComponent(techUrl)}\`, {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
    curlExample: `curl -X GET "https://screenscapeapi.dev/api/uhdmovies/tech?url=https%3A%2F%2Ftech.unblockedgames.world%2F%3Fsid%3D..." \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: `{
  "success": true,
  "data": {
    "servers": [
      {
        "server": "ResumeBot",
        "link": "https://resumebot-download-url.com/file.mkv",
        "type": "mkv"
      },
      {
        "server": "Cf Worker 1.0",
        "link": "https://worker.example.com/file.mkv",
        "type": "mkv"
      },
      {
        "server": "Gdrive-Instant",
        "link": "https://drive.google.com/uc?id=...",
        "type": "mkv"
      }
    ],
    "totalServers": 3
  }
}`
  },
];
