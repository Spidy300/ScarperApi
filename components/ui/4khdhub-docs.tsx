"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Play, Code2, Home, Search, Film, Video, Download } from "lucide-react";
import { toast } from "sonner";

interface ApiEndpoint {
  method: string;
  endpoint: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
}

interface ApiCategory {
  name: string;
  icon: React.ReactNode;
  endpoints: ApiEndpoint[];
}

const apiCategories: ApiCategory[] = [
  {
    name: "Search Movies",
    icon: <Search className="h-4 w-4" />,
    endpoints: [
      {
        method: "GET",
        endpoint: "/api/4khdhub",
        description: "Search movies and series on 4KHDHub",
        params: [
          { name: "search", type: "string", required: true, description: "Search query (movie/series title)" },
          { name: "page", type: "number", required: false, description: "Page number (default: 1)" }
        ]
      }
    ]
  },
  {
    name: "Get Latest",
    icon: <Home className="h-4 w-4" />,
    endpoints: [
      {
        method: "GET",
        endpoint: "/api/4khdhub",
        description: "Get latest movies and series from homepage",
        params: [
          { name: "page", type: "number", required: false, description: "Page number (default: 1)" }
        ]
      }
    ]
  },
  {
    name: "Get Details",
    icon: <Film className="h-4 w-4" />,
    endpoints: [
      {
        method: "GET",
        endpoint: "/api/4khdhub/details",
        description: "Get download links and details for a movie/series",
        params: [
          { name: "url", type: "string", required: true, description: "4KHDHub movie/series URL from search results" }
        ]
      }
    ]
  },
  {
    name: "Get Stream Links",
    icon: <Video className="h-4 w-4" />,
    endpoints: [
      {
        method: "GET",
        endpoint: "/api/4khdhub/stream",
        description: "Get streaming links from techyboy4u.com URLs",
        params: [
          { name: "url", type: "string", required: true, description: "techyboy4u.com URL from details response" }
        ]
      }
    ]
  }
];

interface FourKHDHubDocsProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export default function FourKHDHubDocs({ apiKey, onApiKeyChange }: FourKHDHubDocsProps) {
  const [selectedCategory, setSelectedCategory] = useState(apiCategories[0]);
  const [selectedEndpoint, setSelectedEndpoint] = useState(apiCategories[0].endpoints[0]);
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleCategoryChange = (categoryName: string) => {
    const category = apiCategories.find(cat => cat.name === categoryName);
    if (category) {
      setSelectedCategory(category);
      setSelectedEndpoint(category.endpoints[0]);
      setTestParams({});
    }
  };

  const testApi = async () => {
    if (!apiKey) {
      toast.error("Please enter your API key");
      return;
    }

    const missingParams = selectedEndpoint.params?.filter(param => 
      param.required && !testParams[param.name]
    ) || [];

    if (missingParams.length > 0) {
      toast.error(`Missing required parameters: ${missingParams.map(p => p.name).join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      let url = selectedEndpoint.endpoint;
      const queryParams = new URLSearchParams();
      
      Object.entries(testParams).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      if (queryParams.toString()) {
        url += "?" + queryParams.toString();
      }

      const res = await fetch(url, {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json"
        }
      });

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
      
      if (!res.ok) {
        toast.error(`Error: ${res.status}`);
      } else {
        toast.success("API call successful!");
      }
    } catch (error) {
      toast.error("Failed to call API");
      setResponse(JSON.stringify({ error: "Failed to call API" }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const generateCodeExample = (language: string) => {
    const baseUrl = "https://totu.me";
    const params = Object.entries(testParams).filter(([_, value]) => value);
    const queryParams = params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");
    const fullUrl = `${baseUrl}${selectedEndpoint.endpoint}${queryParams ? '?' + queryParams : ''}`;

    switch (language) {
      case "javascript":
        if (selectedCategory.name === "Search Movies") {
          return `// Search for movies/series on 4KHDHub
const searchQuery = "luca";
const response = await fetch("${baseUrl}/api/4khdhub?search=" + encodeURIComponent(searchQuery), {
  headers: {
    "x-api-key": "YOUR_API_KEY",
    "Content-Type": "application/json"
  }
});

const data = await response.json();
console.log(data.data.items); // Array of movies/series
// Each item contains: id, title, imageUrl, postUrl, year, formats, type`;
        } else if (selectedCategory.name === "Get Latest") {
          return `// Get latest movies from 4KHDHub homepage
const page = 1;
const response = await fetch("${baseUrl}/api/4khdhub?page=" + page, {
  headers: {
    "x-api-key": "YOUR_API_KEY",
    "Content-Type": "application/json"
  }
});

const data = await response.json();
console.log(data.data.items); // Latest movies/series`;
        } else if (selectedCategory.name === "Get Details") {
          return `// Get download links for a movie/series (Step 2)
const movieUrl = "https://4khdhub.fans/luca-2021/"; // From search results
const response = await fetch("${baseUrl}/api/4khdhub/details?url=" + encodeURIComponent(movieUrl), {
  headers: {
    "x-api-key": "YOUR_API_KEY",
    "Content-Type": "application/json"
  }
});

const data = await response.json();
console.log(data.data.completePacks); // Download packs with different qualities
// Each pack contains: title, size, quality, format, languages, links[]`;
        } else {
          return `// Get streaming links (Step 3)
const techyboyUrl = "https://techyboy4u.com/?id=..."; // From details response
const response = await fetch("${baseUrl}/api/4khdhub/stream?url=" + encodeURIComponent(techyboyUrl), {
  headers: {
    "x-api-key": "YOUR_API_KEY",
    "Content-Type": "application/json"
  }
});

const data = await response.json();
console.log(data.data.streamLinks); // Direct streaming links`;
        }

      case "python":
        if (selectedCategory.name === "Search Movies") {
          return `# Search for movies/series on 4KHDHub
import requests

search_query = "luca"
url = "${baseUrl}/api/4khdhub"
params = {"search": search_query}
headers = {
    "x-api-key": "YOUR_API_KEY",
    "Content-Type": "application/json"
}

response = requests.get(url, params=params, headers=headers)
data = response.json()
print(data["data"]["items"])  # Array of movies/series`;
        } else if (selectedCategory.name === "Get Latest") {
          return `# Get latest movies from 4KHDHub homepage
import requests

url = "${baseUrl}/api/4khdhub"
params = {"page": 1}
headers = {
    "x-api-key": "YOUR_API_KEY",
    "Content-Type": "application/json"
}

response = requests.get(url, params=params, headers=headers)
data = response.json()
print(data["data"]["items"])  # Latest movies/series`;
        } else if (selectedCategory.name === "Get Details") {
          return `# Get download links for a movie/series (Step 2)
import requests
from urllib.parse import quote

movie_url = "https://4khdhub.fans/luca-2021/"  # From search results
url = f"${baseUrl}/api/4khdhub/details?url={quote(movie_url)}"
headers = {
    "x-api-key": "YOUR_API_KEY",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers)
data = response.json()
print(data["data"]["completePacks"])  # Download packs`;
        } else {
          return `# Get streaming links (Step 3)
import requests
from urllib.parse import quote

techyboy_url = "https://techyboy4u.com/?id=..."  # From details response
url = f"${baseUrl}/api/4khdhub/stream?url={quote(techyboy_url)}"
headers = {
    "x-api-key": "YOUR_API_KEY",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers)
data = response.json()
print(data["data"]["streamLinks"])  # Direct streaming links`;
        }

      case "curl":
        if (selectedCategory.name === "Search Movies") {
          return `# Search for movies/series on 4KHDHub
curl -X GET \\
  "${baseUrl}/api/4khdhub?search=luca" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`;
        } else if (selectedCategory.name === "Get Latest") {
          return `# Get latest movies from 4KHDHub homepage
curl -X GET \\
  "${baseUrl}/api/4khdhub?page=1" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`;
        } else if (selectedCategory.name === "Get Details") {
          return `# Get download links for a movie/series (Step 2)
curl -X GET \\
  "${baseUrl}/api/4khdhub/details?url=https%3A//4khdhub.fans/luca-2021/" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`;
        } else {
          return `# Get streaming links (Step 3)
curl -X GET \\
  "${baseUrl}/api/4khdhub/stream?url=https%3A//techyboy4u.com/%3Fid%3D..." \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`;
        }

      default:
        return "";
    }
  };

  return (
    <Tabs defaultValue="test" className="space-y-4 sm:space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="test" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <Play className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">API Testing</span>
          <span className="xs:hidden">Testing</span>
        </TabsTrigger>
        <TabsTrigger value="docs" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <Code2 className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Code Examples</span>
          <span className="xs:hidden">Examples</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="test" className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">API Key Setup</CardTitle>
            <CardDescription className="text-sm">
              Enter your API key to test the 4KHDHub endpoints.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                className="flex-1 text-sm min-w-0"
              />
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(apiKey)} className="shrink-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">API Endpoints</CardTitle>
              <CardDescription className="text-sm">Select an endpoint to test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Category</Label>
                <Select value={selectedCategory.name} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="text-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {apiCategories.map((category) => (
                      <SelectItem key={category.name} value={category.name} className="text-sm">
                        <div className="flex items-center gap-2">
                          {category.icon}
                          <span className="truncate">{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default" className="text-xs">
                    {selectedEndpoint.method}
                  </Badge>
                  <code className="text-xs">{selectedEndpoint.endpoint}</code>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">{selectedEndpoint.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Parameters</CardTitle>
              <CardDescription className="text-sm">Configure endpoint parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {selectedEndpoint.params && selectedEndpoint.params.length > 0 ? (
                selectedEndpoint.params.map((param) => (
                  <div key={param.name} className="space-y-2">
                    <Label htmlFor={param.name} className="flex flex-wrap items-center gap-2 text-sm">
                      <span>{param.name}</span>
                      <Badge variant={param.required ? "destructive" : "secondary"} className="text-xs">
                        {param.required ? "Required" : "Optional"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">({param.type})</span>
                    </Label>
                    <Input
                      id={param.name}
                      placeholder={param.description}
                      value={testParams[param.name] || ""}
                      onChange={(e) => setTestParams({ ...testParams, [param.name]: e.target.value })}
                      className="text-sm w-full"
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No parameters required</p>
              )}

              <Button onClick={testApi} disabled={loading} className="w-full text-sm">
                {loading ? "Testing..." : "Test API"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Response</CardTitle>
            <CardDescription className="text-sm">API response will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="API response will appear here..."
              value={response}
              readOnly
              className="min-h-[200px] sm:min-h-[300px] font-mono text-xs sm:text-sm w-full resize-none"
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="docs" className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">4KHDHub API Usage</CardTitle>
            <CardDescription className="text-sm">
              Learn how to integrate with the 4KHDHub API for high-quality movie downloads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Category</Label>
                <Select value={selectedCategory.name} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="text-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {apiCategories.map((category) => (
                      <SelectItem key={category.name} value={category.name} className="text-sm">
                        <div className="flex items-center gap-2">
                          {category.icon}
                          <span className="truncate">{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs defaultValue="javascript" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="javascript" className="text-xs sm:text-sm">JavaScript</TabsTrigger>
                <TabsTrigger value="python" className="text-xs sm:text-sm">Python</TabsTrigger>
                <TabsTrigger value="curl" className="text-xs sm:text-sm">cURL</TabsTrigger>
              </TabsList>

              <TabsContent value="javascript">
                <div className="relative w-full overflow-hidden">
                  <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-800">
                    <div className="flex items-center justify-between bg-[#2d2d30] px-4 py-2 border-b border-gray-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex gap-1.5 shrink-0">
                          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                          <div className="w-3 h-3 rounded-full bg-[#27ca3f]"></div>
                        </div>
                        <span className="text-gray-300 text-sm ml-2 truncate">4khdhub-example.js</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-white hover:bg-gray-700 h-6 px-2 shrink-0"
                        onClick={() => copyToClipboard(generateCodeExample("javascript"))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <pre className="p-4">
                        <code className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words">
                          {generateCodeExample("javascript")}
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="python">
                <div className="relative w-full overflow-hidden">
                  <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-800">
                    <div className="flex items-center justify-between bg-[#2d2d30] px-4 py-2 border-b border-gray-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex gap-1.5 shrink-0">
                          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                          <div className="w-3 h-3 rounded-full bg-[#27ca3f]"></div>
                        </div>
                        <span className="text-gray-300 text-sm ml-2 truncate">4khdhub-example.py</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-white hover:bg-gray-700 h-6 px-2 shrink-0"
                        onClick={() => copyToClipboard(generateCodeExample("python"))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <pre className="p-4">
                        <code className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words">
                          {generateCodeExample("python")}
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="curl">
                <div className="relative w-full overflow-hidden">
                  <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-800">
                    <div className="flex items-center justify-between bg-[#2d2d30] px-4 py-2 border-b border-gray-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex gap-1.5 shrink-0">
                          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                          <div className="w-3 h-3 rounded-full bg-[#27ca3f]"></div>
                        </div>
                        <span className="text-gray-300 text-sm ml-2 truncate">terminal</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-white hover:bg-gray-700 h-6 px-2 shrink-0"
                        onClick={() => copyToClipboard(generateCodeExample("curl"))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <pre className="p-4">
                        <code className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words">
                          {generateCodeExample("curl")}
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Response Examples</CardTitle>
            <CardDescription className="text-sm">Expected response structures for each endpoint</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="search" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="search" className="text-xs sm:text-sm">Search</TabsTrigger>
                <TabsTrigger value="latest" className="text-xs sm:text-sm">Latest</TabsTrigger>
                <TabsTrigger value="details" className="text-xs sm:text-sm">Details</TabsTrigger>
                <TabsTrigger value="stream" className="text-xs sm:text-sm">Stream</TabsTrigger>
              </TabsList>

              <TabsContent value="search">
                <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-800">
                  <div className="flex items-center justify-between bg-[#2d2d30] px-4 py-2 border-b border-gray-700">
                    <span className="text-gray-300 text-sm">search-response.json</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-gray-700 h-6 px-2"
                      onClick={() => copyToClipboard(`{
  "success": true,
  "data": {
    "items": [...],
    "query": "luca",
    "totalResults": 5
  }
}`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <pre className="p-4 text-xs sm:text-sm overflow-x-auto">
                    <code className="text-gray-300 font-mono">{`{
  "success": true,
  "data": {
    "items": [
      {
        "id": "luca-2021",
        "title": "Luca (2021) Multi Audio [Hindi-English] 1080p 720p 480p [BluRay]",
        "imageUrl": "https://4khdhub.fans/wp-content/uploads/2021/06/Luca.jpg",
        "postUrl": "https://4khdhub.fans/luca-2021/",
        "year": "2021",
        "altText": "Luca Movie Download",
        "formats": ["BluRay", "1080p", "720p", "480p"],
        "type": "Movie"
      }
    ],
    "query": "luca",
    "totalResults": 5,
    "page": 1
  },
  "remainingRequests": 99
}`}</code>
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="details">
                <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-800">
                  <div className="flex items-center justify-between bg-[#2d2d30] px-4 py-2 border-b border-gray-700">
                    <span className="text-gray-300 text-sm">details-response.json</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-gray-700 h-6 px-2"
                      onClick={() => copyToClipboard(`{
  "success": true,
  "data": {
    "completePacks": [...],
    "totalPacks": 7
  }
}`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <pre className="p-4 text-xs sm:text-sm overflow-x-auto">
                    <code className="text-gray-300 font-mono">{`{
  "success": true,
  "data": {
    "title": "Luca (2021) Download",
    "url": "https://4khdhub.fans/luca-2021/",
    "completePacks": [
      {
        "id": "file6383",
        "title": "Luca (2021) 1080p BluRay REMUX AVC x264 [Hindi HS DDP 5.1 + English TrueHD Atmos 7.1] ESub",
        "season": "Luca (1080p BluRay REMUX x264)",
        "size": "22.51 GB",
        "languages": ["Hindi", "English"],
        "quality": "1080p",
        "format": "REMUX x264",
        "source": "4kHDHub.Com",
        "badges": ["22.51 GB", "Hindi, English", "BluRay"],
        "links": [
          {
            "name": "Download HubCloud",
            "url": "https://techyboy4u.com/?id=Q1dxTzFnbjhrQm5kMG5lL01tQzcv...",
            "type": "HubCloud"
          },
          {
            "name": "Download HubDrive", 
            "url": "https://techyboy4u.com/?id=Q1dxTzFnbjhrQm5kMG5lL01tQzcv...",
            "type": "HubDrive"
          }
        ]
      }
    ],
    "episodeSeasons": [],
    "totalPacks": 7,
    "totalEpisodeSeasons": 0
  },
  "remainingRequests": 98
}`}</code>
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="stream">
                <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-800">
                  <div className="flex items-center justify-between bg-[#2d2d30] px-4 py-2 border-b border-gray-700">
                    <span className="text-gray-300 text-sm">stream-response.json</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-gray-700 h-6 px-2"
                      onClick={() => copyToClipboard(`{
  "success": true,
  "data": {
    "streamLinks": [...]
  }
}`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <pre className="p-4 text-xs sm:text-sm overflow-x-auto">
                    <code className="text-gray-300 font-mono">{`{
  "success": true,
  "data": {
    "episodeUrl": "https://techyboy4u.com/?id=Q1dxTzFnbjhrQm5kMG5lL01tQzcv...",
    "streamLinks": [
      {
        "server": "HDHub4u Stream",
        "link": "https://hubcloud.one/drive/cgt6ss6msnrtxfk",
        "type": "mp4",
        "copyable": true
      }
    ]
  },
  "remainingRequests": 97
}`}</code>
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="latest">
                <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-800">
                  <div className="flex items-center justify-between bg-[#2d2d30] px-4 py-2 border-b border-gray-700">
                    <span className="text-gray-300 text-sm">latest-response.json</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-gray-700 h-6 px-2"
                      onClick={() => copyToClipboard(`{
  "success": true,
  "data": {
    "items": [...],
    "totalResults": 20
  }
}`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <pre className="p-4 text-xs sm:text-sm overflow-x-auto">
                    <code className="text-gray-300 font-mono">{`{
  "success": true,
  "data": {
    "items": [
      {
        "id": "spider-man-across-spider-verse-2023",
        "title": "Spider-Man: Across the Spider-Verse (2023)",
        "imageUrl": "https://4khdhub.fans/wp-content/uploads/2023/06/spider-verse.jpg",
        "postUrl": "https://4khdhub.fans/spider-man-across-spider-verse-2023/",
        "year": "2023",
        "formats": ["BluRay", "4K", "1080p"],
        "type": "Movie"
      }
    ],
    "totalResults": 20,
    "page": 1
  },
  "remainingRequests": 99
}`}</code>
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">API Workflow</CardTitle>
            <CardDescription className="text-sm">Complete workflow for downloading movies from 4KHDHub</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 sm:p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2 text-sm sm:text-base">Step-by-Step Process</h4>
              <ol className="text-xs sm:text-sm space-y-2">
                <li><strong>1. Search:</strong> Use <code>/api/4khdhub?search=movie_name</code> to find movies/series</li>
                <li><strong>2. Get Details:</strong> Use <code>/api/4khdhub/details?url=movie_url</code> to get download links</li>
                <li><strong>3. Get Stream:</strong> Use <code>/api/4khdhub/stream?url=techyboy_url</code> to get direct links</li>
              </ol>
              <div className="mt-3 p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-md">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Quality Options:</strong> 4KHDHub offers multiple quality options including 4K, 2160p, 1080p, 720p with various formats like BluRay REMUX, HEVC x265, x264, and HDR content.
                </p>
              </div>
              <div className="mt-3 p-2 sm:p-3 bg-green-100 dark:bg-green-900/20 rounded-md">
                <p className="text-xs text-green-800 dark:text-green-200">
                  <strong>Languages:</strong> Most content includes multiple audio tracks (Hindi, English, Tamil, Telugu) with subtitles.
                </p>
              </div>
              <div className="mt-3 p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-md">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>Download Options:</strong> Each movie/series provides both HubDrive and HubCloud download links for redundancy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
