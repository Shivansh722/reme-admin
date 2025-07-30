"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Download } from "lucide-react"
import { useState } from "react"
import { collection, query, where, getDocs, getFirestore } from "firebase/firestore"
import { getApp } from "firebase/app"

const exportItems = [
    { id: "user-info", label: "ユーザー情報" },
    { id: "diagnostic-results", label: "診断結果" },
    { id: "product-recommendations", label: "商品おすすめ" },
    { id: "consultation-records", label: "相談履歴" },
    { id: "chat-history", label: "チャット履歴" },
]

export function ExportForm() {
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [dateRange, setDateRange] = useState({
        startDate: "",
        endDate: "",
    })
    const [loading, setLoading] = useState(false)

    const handleItemChange = (itemId: string, checked: boolean) => {
        if (checked) {
            setSelectedItems([...selectedItems, itemId])
        } else {
            setSelectedItems(selectedItems.filter((id) => id !== itemId))
        }
    }

    const handleExport = async () => {
        if (selectedItems.length === 0) {
            alert("エクスポートする項目を1つ以上選択してください")
            return
        }

        const startDate = new Date(dateRange.startDate)
        const endDate = new Date(dateRange.endDate)

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            alert("有効な日付範囲を選択してください")
            return
        }

        setLoading(true)
        console.log("エクスポート中:", { selectedItems, dateRange })
        
        try {
            // Firestore初期化
            const db = getFirestore(getApp())
            
            // CSVヘッダー
            const headers = ["ユーザーID", "登録日", "表示名", "メールアドレス"]
            
            // 選択項目に応じてヘッダー追加
            if (selectedItems.includes("diagnostic-results")) {
                headers.push("最新診断日", "肌年齢", "肌ランク", 
                    "ハリ", "ニキビ", "毛穴", "赤み", "たるみ", "診断結果")
            }
            
            // ユーザーデータ取得
            const usersRef = collection(db, "users")
            const q = query(
                usersRef,
                where("createdAt", ">=", startDate),
                where("createdAt", "<=", endDate)
            )
            
            const querySnapshot = await getDocs(q)
            const rows = []
            
            // 各ユーザー処理
            for (const userDoc of querySnapshot.docs) {
                const userData = userDoc.data()
                const userId = userDoc.id
                
                const row = [
                    userId,
                    userData.createdAt?.toDate()?.toISOString() || "",
                    userData.displayName || "",
                    userData.email || ""
                ]
                
                // 診断データ追加
                if (selectedItems.includes("diagnostic-results")) {
                    let analysisData = {
                        latestAnalysisDate: "",
                        skin_age: "",
                        skin_grade: "",
                        firmness: "",
                        pimples: "",
                        pores: "",
                        redness: "",
                        sagging: "",
                        analysisResult: ""
                    }
                    
                    if (userData.latestAnalysisId) {
                        try {
                            const analysisRef = collection(db, "users", userId, "skinAnalysis")
                            const analysisDoc = await getDocs(query(
                                analysisRef,
                                where("__name__", "==", userData.latestAnalysisId)
                            ))
                            
                            if (!analysisDoc.empty) {
                                const analysis = analysisDoc.docs[0].data()
                                analysisData = {
                                    latestAnalysisDate: userData.latestAnalysisDate?.toDate()?.toISOString() || "",
                                    skin_age: analysis.scores?.skin_age || userData.skin_age || "",
                                    skin_grade: analysis.scores?.skin_grade || userData.skin_grade || "",
                                    firmness: analysis.scores?.firmness || userData.firmness || "",
                                    pimples: analysis.scores?.pimples || userData.pimples || "",
                                    pores: analysis.scores?.pores || userData.pores || "",
                                    redness: analysis.scores?.redness || userData.redness || "",
                                    sagging: analysis.scores?.sagging || userData.sagging || "",
                                    analysisResult: analysis.analysisResult || ""
                                }
                            }
                        } catch (error) {
                            console.error(`ユーザー${userId}の診断取得エラー:`, error)
                        }
                    }
                    
                    row.push(
                        analysisData.latestAnalysisDate,
                        analysisData.skin_age,
                        analysisData.skin_grade,
                        analysisData.firmness,
                        analysisData.pimples,
                        analysisData.pores,
                        analysisData.redness,
                        analysisData.sagging,
                        analysisData.analysisResult
                    )
                }
                
                rows.push(row)
            }
            
            // CSV変換
            const escapeCell = (cell: any) => {
              if (cell === null || cell === undefined) return ""
              const cellStr = String(cell)
                .replace(/"/g, '""')
                .replace(/[\r\n]+/g, " ")
              return `"${cellStr}"`
            }

            const csvContent = [
              headers.map(escapeCell).join(","),
              ...rows.map(row => row.map(escapeCell).join(","))
            ].join("\n")
            
            // ダウンロードリンク作成
            const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`)
            const link = document.createElement("a")
            link.setAttribute("href", encodedUri)
            link.setAttribute(
                "download",
                `skincare-users-export-${new Date().toISOString().split("T")[0]}.csv`
            )
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
        } catch (error) {
            console.error("エクスポートエラー:", error)
            alert("エクスポート中にエラーが発生しました。詳細はコンソールをご確認ください。")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="start-date">開始日</Label>
                    <Input
                        id="start-date"
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) =>
                            setDateRange({ ...dateRange, startDate: e.target.value })
                        }
                    />
                </div>
                <div>
                    <Label htmlFor="end-date">終了日</Label>
                    <Input
                        id="end-date"
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) =>
                            setDateRange({ ...dateRange, endDate: e.target.value })
                        }
                    />
                </div>
            </div>

            <div className="space-y-3">
                <Label>エクスポートするデータを選択</Label>
                {exportItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={item.id}
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) =>
                                handleItemChange(item.id, checked as boolean)
                            }
                        />
                        <Label htmlFor={item.id}>{item.label}</Label>
                    </div>
                ))}
            </div>

            <Button onClick={handleExport} className="w-full" disabled={loading}>
                <Download className="h-4 w-4 mr-2" />
                {loading ? "エクスポート中..." : "CSVでエクスポート"}
            </Button>
        </div>
    )
}
