"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { getUsers, type User } from "@/lib/firebase-service"

export function UserTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const userData = await getUsers()
        setUsers(userData)
      } catch (error) {
        console.error("ユーザーの読み込みエラー:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "なし"
    try {
      return timestamp.toDate().toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "なし"
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>名前</TableHead>
          <TableHead>メールアドレス</TableHead>
          <TableHead>登録日</TableHead>
          <TableHead>最終ログイン</TableHead>
          <TableHead>最新診断日</TableHead>
          <TableHead>プロバイダー</TableHead>
          <TableHead>ステータス</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {user.photoURL && (
                  <img
                    src={user.photoURL || "/placeholder.svg"}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                {user.displayName || "不明なユーザー"}
              </div>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{formatDate(user.createdAt)}</TableCell>
            <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
            <TableCell>{formatDate(user.latestAnalysisDate)}</TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {user.provider || "不明"}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="default">アクティブ</Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" aria-label="詳細を見る">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" aria-label="編集">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" aria-label="削除">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
