"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CollectionBrowser } from "@/components/collection-browser"
import { useFirebase } from "@/components/firebase-provider"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function CollectionsPage() {
  const { isInitialized, error, isLoading, retryConnection } = useFirebase()

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-3xl font-bold">Database Collections</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Initializing Firebase connection...</p>
            <p className="text-sm text-muted-foreground mt-2">Project: reme-57c1b</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-3xl font-bold">Database Collections</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Firebase Connection Error</AlertTitle>
          <AlertDescription>
            <div className="space-y-3">
              <p>{error}</p>
              <Button onClick={retryConnection} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-3xl font-bold">Database Collections</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Firestore Database Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <CollectionBrowser />
        </CardContent>
      </Card>
    </div>
  )
}