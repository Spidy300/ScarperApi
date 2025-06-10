"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Copy, Check } from 'lucide-react'

interface StreamLink {
  link: string
  server: string
  type: string
}

interface ApiResponseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  streamLinks: StreamLink[]
  rawResponse?: any
}

export function ApiResponseDialog({ 
  open, 
  onOpenChange, 
  streamLinks, 
  rawResponse 
}: ApiResponseDialogProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(id)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Stream Sources & API Response</DialogTitle>
          <DialogDescription>
            Available stream sources and raw API response data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto">
          {/* Stream Links Section */}
          {streamLinks && streamLinks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Available Stream Sources</h3>
              <div className="space-y-3">
                {streamLinks.map((link, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{link.server}</span>
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {link.type}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(link.link, `link-${index}`)}
                        className="flex items-center gap-1"
                      >
                        {copiedItem === `link-${index}` ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Copy URL
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground font-mono bg-background p-2 rounded border">
                      {link.link}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Response Section */}
          {rawResponse && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Raw API Response</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(formatJson(rawResponse), 'raw-response')}
                  className="flex items-center gap-1"
                >
                  {copiedItem === 'raw-response' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  Copy All
                </Button>
              </div>
              <div className="bg-background border rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {formatJson(rawResponse)}
                </pre>
              </div>
            </div>
          )}

          {/* Formatted Links for Copy */}
          {streamLinks && streamLinks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">All Links (Text Format)</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const allLinks = streamLinks
                      .map((link, index) => `${index + 1}. ${link.server} (${link.type})\n   ${link.link}`)
                      .join('\n\n')
                    copyToClipboard(allLinks, 'all-links')
                  }}
                  className="flex items-center gap-1"
                >
                  {copiedItem === 'all-links' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  Copy All Links
                </Button>
              </div>
              <div className="bg-background border rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {streamLinks
                    .map((link, index) => `${index + 1}. ${link.server} (${link.type})\n   ${link.link}`)
                    .join('\n\n')}
                </pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
