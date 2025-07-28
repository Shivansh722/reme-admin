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
    { id: "user-info", label: "User Information" },
    { id: "diagnostic-results", label: "Diagnostic Results" },
    { id: "product-recommendations", label: "Product Recommendations" },
    { id: "consultation-records", label: "Consultation Records" },
    { id: "chat-history", label: "Chat History" },
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
            alert("Please select at least one item to export")
            return
        }

        const startDate = new Date(dateRange.startDate)
        const endDate = new Date(dateRange.endDate)

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            alert("Please select valid date range")
            return
        }

        setLoading(true)
        console.log("Exporting:", { selectedItems, dateRange })
        
        try {
            // Initialize Firestore
            const db = getFirestore(getApp())
            
            // Prepare headers for CSV
            const headers = ["User ID", "Created Date", "Display Name", "Email"]
            
            // Add selected items to headers
            if (selectedItems.includes("diagnostic-results")) {
                headers.push("Latest Analysis Date", "Skin Age", "Skin Grade", 
                    "Firmness", "Pimples", "Pores", "Redness", "Sagging", "Analysis Result")
            }
            
            // Fetch users data
            const usersRef = collection(db, "users")
            const q = query(
                usersRef,
                where("createdAt", ">=", startDate),
                where("createdAt", "<=", endDate)
            )
            
            const querySnapshot = await getDocs(q)
            const rows = []
            
            // Process each user
            for (const userDoc of querySnapshot.docs) {
                const userData = userDoc.data()
                const userId = userDoc.id
                
                const row = [
                    userId,
                    userData.createdAt?.toDate()?.toISOString() || "",
                    userData.displayName || "",
                    userData.email || ""
                ]
                
                // Add diagnostic data if selected
                if (selectedItems.includes("diagnostic-results")) {
                    // Default empty values
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
                    
                    // If user has a latest analysis ID, fetch that specific analysis
                    if (userData.latestAnalysisId) {
                        try {
                            // Get the latest analysis document from skinAnalysis subcollection
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
                            console.error(`Error fetching analysis for user ${userId}:`, error)
                        }
                    }
                    
                    // Add the analysis data to the row
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
            
            // Convert to CSV
            const escapeCell = (cell: any) => {
              if (cell === null || cell === undefined) return ""
              // Convert to string, escape quotes, remove line breaks
              const cellStr = String(cell)
                .replace(/"/g, '""')         // Escape double quotes
                .replace(/[\r\n]+/g, " ")    // Replace line breaks with space
              return `"${cellStr}"`
            }

            const csvContent = [
              headers.map(escapeCell).join(","),
              ...rows.map(row => row.map(escapeCell).join(","))
            ].join("\n")
            
            // Create download link
            const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`)
            const link = document.createElement("a")
            link.setAttribute("href", encodedUri)
            link.setAttribute(
                "download",
                `skincare-users-export-${new Date().toISOString().split("T")[0]}.csv`
            )
            document.body.appendChild(link)
            
            // Trigger download and cleanup
            link.click()
            document.body.removeChild(link)
            
        } catch (error) {
            console.error("Error exporting data:", error)
            alert("Error exporting data. Please check console for details.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="start-date">Start Date</Label>
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
                    <Label htmlFor="end-date">End Date</Label>
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
                <Label>Select Data to Export</Label>
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
                {loading ? "Exporting..." : "Export to CSV"}
            </Button>
        </div>
    )
}
