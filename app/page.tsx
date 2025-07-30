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
        console.log("📊 ダッシュボード: Firestoreからデータを読み込み中...")
        const dashboardStats = await getDashboardStats()
        setStats(dashboardStats)
        console.log("✅ ダッシュボード: データの読み込みに成功しました")
      } catch (error) {
        console.error("❌ ダッシュボード: データの読み込みエラー:", error)
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
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Firebase接続を初期化中...</p>
            <p className="text-sm text-muted-foreground mt-2">プロジェクト: reme-57c1b</p>
            <p className="text-xs text-muted-foreground mt-1">しばらくお待ちください</p>
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
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Firebase接続エラー</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-3">
              <p className="text-sm">
                <strong>エラー:</strong> {error}
              </p>

              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="font-semibold text-red-800 mb-2">考えられる解決策:</p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>インターネット接続を確認してください</li>
                  <li>FirebaseコンソールでFirestoreが有効になっているか確認してください</li>
                  <li>Firebaseプロジェクトがアクティブであることを確認してください</li>
                  <li>別のブラウザやシークレットモードでお試しください</li>
                  <li>ブラウザのキャッシュとクッキーをクリアしてください</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={retryConnection} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  再接続
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                  ページを再読み込み
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
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
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
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{stats.monthlyUsers} 今月</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本日のユーザー数</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dailyUsers}</div>
            <p className="text-xs text-muted-foreground">本日アクティブ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本日の診断数</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dailyAnalyses}</div>
            <p className="text-xs text-muted-foreground">本日の分析</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総診断数</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnalyses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">累計</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>診断トレンド</CardTitle>
            <CardDescription>日別診断件数の推移</CardDescription>
          </CardHeader>
          <CardContent>
            <DiagnosticChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>肌状態トレンド</CardTitle>
            <CardDescription>平均肌分析スコア</CardDescription>
          </CardHeader>
          <CardContent>
            <SkinTrendChart />
          </CardContent>
        </Card>
      </div>

      {/* Popular Products */}
      <Card>
        <CardHeader>
          <CardTitle>おすすめ商品</CardTitle>
          <CardDescription>データベース内の人気商品</CardDescription>
        </CardHeader>
        <CardContent>
          <PopularProducts />
        </CardContent>
      </Card>
    </div>
  )
}
