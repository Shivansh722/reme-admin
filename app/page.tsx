"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { DiagnosticChart } from "@/components/diagnostic-chart"
import { SkinTrendChart } from "@/components/skin-trend-chart"
import { PopularProducts } from "@/components/popular-products"
import { Users, TrendingUp, Activity, Star, AlertCircle, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { getDashboardStats } from "@/lib/firebase-service"
import { useFirebase } from "@/components/firebase-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const { isInitialized, error, isLoading: firebaseLoading, retryConnection } = useFirebase()
  const [stats, setStats] = useState({
    totalUsers: 0,
    dailyUsers: 0,
    dailyAnalyses: 0,
    monthlyUsers: 0,
    totalAnalyses: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (!isInitialized || firebaseLoading) return

      try {
        setLoading(true)
        console.log("📊 Dashboard: Loading data from Firestore...")
        const dashboardStats = await getDashboardStats()
        setStats(dashboardStats)
        console.log("✅ Dashboard: Data loaded successfully")
      } catch (error) {
        console.error("❌ Dashboard: Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [isInitialized, firebaseLoading])

  if (firebaseLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Initializing Firebase connection...</p>
            <p className="text-sm text-muted-foreground mt-2">Project: reme-57c1b</p>
            <p className="text-xs text-muted-foreground mt-1">This may take a few moments</p>
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
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Firebase Connection Error</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-3">
              <p className="text-sm">
                <strong>Error:</strong> {error}
              </p>

              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="font-semibold text-red-800 mb-2">Possible solutions:</p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>Check your internet connection</li>
                  <li>Verify that Firestore is enabled in Firebase Console</li>
                  <li>Make sure your Firebase project is active</li>
                  <li>Try using a different browser or incognito mode</li>
                  <li>Clear your browser cache and cookies</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={retryConnection} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                  Refresh Page
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{stats.monthlyUsers} this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dailyUsers}</div>
            <p className="text-xs text-muted-foreground">Active today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Diagnostics</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dailyAnalyses}</div>
            <p className="text-xs text-muted-foreground">Analyses today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnalyses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Trends</CardTitle>
            <CardDescription>Daily diagnostic count over time</CardDescription>
          </CardHeader>
          <CardContent>
            <DiagnosticChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skin Condition Trends</CardTitle>
            <CardDescription>Average skin analysis scores</CardDescription>
          </CardHeader>
          <CardContent>
            <SkinTrendChart />
          </CardContent>
        </Card>
      </div>

      {/* Popular Products */}
      <Card>
        <CardHeader>
          <CardTitle>Product Recommendations</CardTitle>
          <CardDescription>Top products from your database</CardDescription>
        </CardHeader>
        <CardContent>
          <PopularProducts />
        </CardContent>
      </Card>
    </div>
  )
}
