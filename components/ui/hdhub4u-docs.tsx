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
import { Copy, Play, Key, Code2, ExternalLink, Home, Search, Film, Video, FileVideo, Clapperboard, ArrowRight, Database, Link } from "lucide-react";
import { toast } from "sonner";

interface HDHub4uDocsProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

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
    name: "Search & Homepage",
    icon: <Search className="h-4 w-4" />,
    endpoints: [
      {
        method: "GET",
        endpoint: "/api/hdhub4u",
        description: "Get homepage content or search HDHub4u",
        params: [
          { name: "search", type: "string", required: false, description: "Search query for movies/series" },
          { name: "page", type: "number", required: false, description: "Page number for pagination (default: 1)" }
        ]
      }
    ]
  },
  {
    name: "Content Details",
    icon: <Film className="h-4 w-4" />,
    endpoints: [
      {
        method: "GET",
        endpoint: "/api/hdhub4u/details",
        description: "Get detailed information about a movie/series including download links",
        params: [
          { name: "url", type: "string", required: true, description: "HDHub4u post URL from search results" }
        ]
      }
    ]
  },
  {
    name: "Episode Streaming",
    icon: <Video className="h-4 w-4" />,
    endpoints: [
      {
        method: "GET",
        endpoint: "/api/hdhub4u/stream",
        description: "Get streaming links from episode URLs",
        params: [
          { name: "url", type: "string", required: true, description: "Episode URL (techyboy4u.com link)" }
        ]
      }
    ]
  },
  {
    name: "HubDrive Extraction",
    icon: <Link className="h-4 w-4" />,
    endpoints: [
      {
        method: "GET",
        endpoint: "/api/hdhub4u/hubdrive",
        description: "Extract HubCloud links from HubDrive Wales URLs",
        params: [
          { name: "url", type: "string", required: true, description: "HubDrive Wales URL (hubdrive.wales)" }
        ]
      }
    ]
  },
  {
    name: "HubCloud Processing",
    icon: <Database className="h-4 w-4" />,
    endpoints: [
      {
        method: "GET",
        endpoint: "/api/hubcloud",
        description: "Get direct download links from HubCloud URLs",
        params: [
          { name: "url", type: "string", required: true, description: "HubCloud URL from HubDrive extraction" }
        ]
      }
    ]
  }
];

export default function HDHub4uDocs({ apiKey, onApiKeyChange }: HDHub4uDocsProps) {
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
    
    switch (language) {
      case "javascript":
        return `// HDHub4u API Workflow Example
// Step 1: Search for content
const searchResponse = await fetch("${baseUrl}/api/hdhub4u?search=avengers", {
  headers: {
    "x-api-key": "YOUR_API_KEY",
    "Content-Type": "application/json"
  }
});
const searchData = await searchResponse.json();
console.log(searchData.data.items); // Search results

// Step 2: Get content details
const detailsResponse = await fetch("${baseUrl}/api/hdhub4u/details?url=" + encodeURIComponent(searchData.data.items[0].postUrl), {
  headers: {
    "x-api-key": "YOUR_API_KEY",
    "Content-Type": "application/json"
  }
});
const detailsData = await detailsResponse.json();

if (detailsData.data.type === "series") {
  // For TV Series - get streaming links
  const episodeUrl = detailsData.data.episodes[0].episodeUrl;
  const streamResponse = await fetch("${baseUrl}/api/hdhub4u/stream?url=" + encodeURIComponent(episodeUrl), {
    headers: {
      "x-api-key": "YOUR_API_KEY",
      "Content-Type": "application/json"
    }
  });
  const streamData = await streamResponse.json();
  console.log(streamData.data.streamLinks); // Direct streaming URLs
} else if (detailsData.data.type === "movie_direct") {
  // For Movies with direct downloads
  const hubdriveUrl = detailsData.data.directDownloads[0].downloadUrl;
  
  // Step 3: Extract HubCloud links from HubDrive
  const hubdriveResponse = await fetch("${baseUrl}/api/hdhub4u/hubdrive?url=" + encodeURIComponent(hubdriveUrl), {
    headers: {
      "x-api-key": "YOUR_API_KEY",
      "Content-Type": "application/json"
    }
  });
  const hubdriveData = await hubdriveResponse.json();
  
  // Step 4: Get direct download links from HubCloud
  const hubcloudUrl = hubdriveData.data.hubcloudLinks[0].url;
  const hubcloudResponse = await fetch("${baseUrl}/api/hubcloud?url=" + encodeURIComponent(hubcloudUrl), {
    headers: {
      "x-api-key": "YOUR_API_KEY",
      "Content-Type": "application/json"
    }
  });
  const hubcloudData = await hubcloudResponse.json();
  console.log(hubcloudData.links); // Direct download URLs
}`;

      case "python":
        return `# HDHub4u API Workflow Example
import requests

headers = {
    "x-api-key": "YOUR_API_KEY",
    "Content-Type": "application/json"
}

# Step 1: Search for content
search_response = requests.get("${baseUrl}/api/hdhub4u?search=avengers", headers=headers)
search_data = search_response.json()
print(search_data["data"]["items"])  # Search results

# Step 2: Get content details
post_url = search_data["data"]["items"][0]["postUrl"]
details_response = requests.get(f"${baseUrl}/api/hdhub4u/details?url={post_url}", headers=headers)
details_data = details_response.json()

if details_data["data"]["type"] == "series":
    # For TV Series - get streaming links
    episode_url = details_data["data"]["episodes"][0]["episodeUrl"]
    stream_response = requests.get(f"${baseUrl}/api/hdhub4u/stream?url={episode_url}", headers=headers)
    stream_data = stream_response.json()
    print(stream_data["data"]["streamLinks"])  # Direct streaming URLs
elif details_data["data"]["type"] == "movie_direct":
    # For Movies with direct downloads
    hubdrive_url = details_data["data"]["directDownloads"][0]["downloadUrl"]
    
    # Step 3: Extract HubCloud links from HubDrive
    hubdrive_response = requests.get(f"${baseUrl}/api/hdhub4u/hubdrive?url={hubdrive_url}", headers=headers)
    hubdrive_data = hubdrive_response.json()
    
    # Step 4: Get direct download links from HubCloud
    hubcloud_url = hubdrive_data["data"]["hubcloudLinks"][0]["url"]
    hubcloud_response = requests.get(f"${baseUrl}/api/hubcloud?url={hubcloud_url}", headers=headers)
    hubcloud_data = hubcloud_response.json()
    print(hubcloud_data["links"])  # Direct download URLs`;

      case "curl":
        return `# HDHub4u API Workflow Example

# Step 1: Search for content
curl -X GET \\
  "${baseUrl}/api/hdhub4u?search=avengers" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Step 2: Get content details (use postUrl from search results)
curl -X GET \\
  "${baseUrl}/api/hdhub4u/details?url=POST_URL_HERE" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# For TV Series - Step 3: Get streaming links
curl -X GET \\
  "${baseUrl}/api/hdhub4u/stream?url=EPISODE_URL_HERE" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# For Movies - Step 3: Extract HubCloud links
curl -X GET \\
  "${baseUrl}/api/hdhub4u/hubdrive?url=HUBDRIVE_URL_HERE" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# For Movies - Step 4: Get direct download links
curl -X GET \\
  "${baseUrl}/api/hubcloud?url=HUBCLOUD_URL_HERE" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`;

      default:
        return "";
    }
  };

  return (
    <Tabs defaultValue="workflow" className="space-y-4 sm:space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="workflow" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Data Flow</span>
          <span className="xs:hidden">Flow</span>
        </TabsTrigger>
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

      <TabsContent value="workflow" className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">HDHub4u API Data Flow</CardTitle>
            <CardDescription>
              Complete workflow for extracting streaming and download links from HDHub4u
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Workflow Diagram */}
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="relative">
                  <Card className="border-2 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Step 1</Badge>
                        <Search className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm">Search Content</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs">
                      <code className="text-xs bg-muted p-2 rounded block mb-2">/api/hdhub4u</code>
                      <p>Search for movies/series or get homepage content</p>
                    </CardContent>
                  </Card>
                  <ArrowRight className="hidden lg:block absolute -right-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <Card className="border-2 border-green-200 dark:border-green-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Step 2</Badge>
                        <Film className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm">Get Details</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs">
                      <code className="text-xs bg-muted p-2 rounded block mb-2">/api/hdhub4u/details</code>
                      <p>Extract episodes or download links from content page</p>
                    </CardContent>
                  </Card>
                  <ArrowRight className="hidden lg:block absolute -right-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <Card className="border-2 border-purple-200 dark:border-purple-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Step 3</Badge>
                        <Video className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm">Process Links</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs">
                      <p className="mb-2"><strong>For Series:</strong></p>
                      <code className="text-xs bg-muted p-2 rounded block mb-2">/api/hdhub4u/stream</code>
                      <p className="mb-2"><strong>For Movies:</strong></p>
                      <code className="text-xs bg-muted p-2 rounded block">/api/hdhub4u/hubdrive</code>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Step 4 for Movies */}
              <div className="mt-4 flex justify-center">
                <Card className="border-2 border-orange-200 dark:border-orange-800 max-w-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Step 4</Badge>
                      <Database className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm">Final Download (Movies Only)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs">
                    <code className="text-xs bg-muted p-2 rounded block mb-2">/api/hubcloud</code>
                    <p>Extract direct download URLs from HubCloud</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Content Type Branching */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Content Type Handling</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* TV Series Flow */}
                <Card className="border-2 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      TV Series Workflow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">1</Badge>
                      <span>Search content: <code>/api/hdhub4u</code></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">2</Badge>
                      <span>Get episodes: <code>/api/hdhub4u/details</code></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">3</Badge>
                      <span>Extract streams: <code>/api/hdhub4u/stream</code></span>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        <strong>Result:</strong> Direct streaming URLs (.mp4, .m3u8)
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Movies Flow */}
                <Card className="border-2 border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Film className="h-4 w-4" />
                      Movies Workflow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">1</Badge>
                      <span>Search content: <code>/api/hdhub4u</code></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">2</Badge>
                      <span>Get downloads: <code>/api/hdhub4u/details</code></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">3</Badge>
                      <span>Extract HubCloud: <code>/api/hdhub4u/hubdrive</code></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">4</Badge>
                      <span>Get direct links: <code>/api/hubcloud</code></span>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <p className="text-xs text-green-800 dark:text-green-200">
                        <strong>Result:</strong> Direct download URLs (Google Drive, etc.)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* URL Structure */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">URL Structure & Data Flow</h3>
              
              <div className="space-y-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">HDHub4u Post URL</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <code className="text-xs bg-muted p-2 rounded block">
                      https://hdhub4u.gratis/loki-season-1-episode-links/
                    </code>
                    <p className="text-xs text-muted-foreground mt-2">
                      Contains episode links (for series) or direct download links (for movies)
                    </p>
                  </CardContent>
                </Card>

                <ArrowRight className="mx-auto h-4 w-4" />

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Episode URL (Series Only)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <code className="text-xs bg-muted p-2 rounded block">
                      https://techyboy4u.com/?id=bUlrRTVoTUNjRGtnd2VQMzY1...
                    </code>
                    <p className="text-xs text-muted-foreground mt-2">
                      Encrypted URL that resolves to streaming links
                    </p>
                  </CardContent>
                </Card>

                <ArrowRight className="mx-auto h-4 w-4" />

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">HubDrive URL (Movies Only)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <code className="text-xs bg-muted p-2 rounded block">
                      https://hubdrive.wales/file/1805033758
                    </code>
                    <p className="text-xs text-muted-foreground mt-2">
                      Contains HubCloud server links
                    </p>
                  </CardContent>
                </Card>

                <ArrowRight className="mx-auto h-4 w-4" />

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">HubCloud URL (Movies Only)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <code className="text-xs bg-muted p-2 rounded block">
                      https://hubcloud.one/drive/1zwux1q8779vv7w
                    </code>
                    <p className="text-xs text-muted-foreground mt-2">
                      Resolves to direct download URLs
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="test" className="space-y-4 sm:space-y-6">
        {/* API Key Setup */}
        <Card>
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">API Key Setup</CardTitle>
            <CardDescription className="text-sm">
              Enter your API key to test the HDHub4u endpoints
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

        {/* API Testing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Endpoint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={selectedCategory.name} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {apiCategories.map((category) => (
                      <SelectItem key={category.name} value={category.name}>
                        <div className="flex items-center gap-2">
                          {category.icon}
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge>{selectedEndpoint.method}</Badge>
                  <code className="text-xs">{selectedEndpoint.endpoint}</code>
                </div>
                <p className="text-xs text-muted-foreground">{selectedEndpoint.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedEndpoint.params && selectedEndpoint.params.length > 0 ? (
                selectedEndpoint.params.map((param) => (
                  <div key={param.name} className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      {param.name}
                      <Badge variant={param.required ? "destructive" : "secondary"} className="text-xs">
                        {param.required ? "Required" : "Optional"}
                      </Badge>
                    </Label>
                    <Input
                      placeholder={param.description}
                      value={testParams[param.name] || ""}
                      onChange={(e) => setTestParams({ ...testParams, [param.name]: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No parameters required</p>
              )}

              <Button onClick={testApi} disabled={loading} className="w-full">
                {loading ? "Testing..." : "Test API"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Response</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="API response will appear here..."
              value={response}
              readOnly
              className="min-h-[300px] font-mono text-xs resize-none"
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="docs" className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Code Examples</CardTitle>
            <CardDescription>
              Complete workflow implementation in different programming languages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="javascript" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>

              {["javascript", "python", "curl"].map((lang) => (
                <TabsContent key={lang} value={lang}>
                  <div className="relative">
                    <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-800">
                      <div className="flex items-center justify-between bg-[#2d2d30] px-4 py-2 border-b border-gray-700">
                        <span className="text-gray-300 text-sm">
                          {lang === "javascript" ? "workflow.js" : lang === "python" ? "workflow.py" : "workflow.sh"}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-white hover:bg-gray-700 h-6 px-2"
                          onClick={() => copyToClipboard(generateCodeExample(lang))}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="overflow-x-auto">
                        <pre className="p-4">
                          <code className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                            {generateCodeExample(lang)}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
