"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { useEffect, useState } from "react"
import { getSkinAnalyses } from "@/lib/firebase-service"

// Define a type for our chart data
interface DiagnosticData {
  date: string
  count: number
}

export function DiagnosticChart() {
  const [data, setData] = useState<DiagnosticData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDiagnosticData() {
      try {
        console.log("🔍 [DiagnosticChart] Starting to fetch skin analyses...")
        
        // Fetch all skin analyses
        const analyses = await getSkinAnalyses()
        console.log("🔍 [DiagnosticChart] getSkinAnalyses returned:", analyses)
        console.log(`🔍 [DiagnosticChart] Retrieved ${analyses.length} skin analyses`)
        
        // Log each analysis timestamp to see what we're dealing with
        console.log("🔍 [DiagnosticChart] First few analyses timestamps:")
        analyses.slice(0, 3).forEach((analysis, i) => {
          console.log(`🔍 Analysis ${i}: timestamp type: ${typeof analysis.timestamp}`, analysis.timestamp)
          
          // Try to format the date to see if it works
          try {
            let dateString
            if (typeof analysis.timestamp === 'string') {
              dateString = new Date(analysis.timestamp).toISOString()
            } else if (analysis.timestamp && typeof analysis.timestamp.toDate === 'function') {
              dateString = analysis.timestamp.toDate().toISOString()
            } else {
              dateString = "Unknown timestamp format"
            }
            console.log(`🔍 Formatted date for analysis ${i}: ${dateString}`)
          } catch (err) {
            console.error(`🔍 Error formatting date for analysis ${i}:`, err)
          }
        })
        
        // Group analyses by date with verbose logging
        console.log("🔍 [DiagnosticChart] Grouping analyses by date...")
        const groupedByDate: Record<string, number> = {}
        
        for (const analysis of analyses) {
          let dateStr: string
          
          try {
            if (!analysis.timestamp) {
              console.log("🔍 Analysis has no timestamp, using today's date")
              dateStr = new Date().toISOString().split('T')[0]
            } else if (typeof analysis.timestamp === 'string') {
              console.log(`🔍 String timestamp: ${analysis.timestamp}`)
              dateStr = new Date(analysis.timestamp).toISOString().split('T')[0]
            } else if (analysis.timestamp.seconds) {
              // Handle Firestore timestamp format directly
              console.log(`🔍 Firestore timestamp with seconds: ${analysis.timestamp.seconds}`)
              const date = new Date(analysis.timestamp.seconds * 1000)
              dateStr = date.toISOString().split('T')[0]
            } else if (typeof analysis.timestamp.toDate === 'function') {
              console.log("🔍 Firestore timestamp with toDate method")
              dateStr = analysis.timestamp.toDate().toISOString().split('T')[0]
            } else {
              console.log("🔍 Unknown timestamp format, using today's date")
              dateStr = new Date().toISOString().split('T')[0]
            }
            
            if (!groupedByDate[dateStr]) {
              groupedByDate[dateStr] = 0
            }
            groupedByDate[dateStr]++
            
            console.log(`🔍 Added analysis to date ${dateStr}, count now ${groupedByDate[dateStr]}`)
          } catch (err) {
            console.error("🔍 Error processing analysis timestamp:", err)
          }
        }
        
        console.log("🔍 [DiagnosticChart] Date groups:", groupedByDate)
        
        // Get the last 7 days for the chart
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (6 - i)) // 0 to 6 days back
          return d.toISOString().split('T')[0]
        })
        
        console.log("🔍 [DiagnosticChart] Last 7 days:", last7Days)
        
        // Create the formatted chart data with 0 counts for days with no data
        const chartData = last7Days.map(date => ({
          date,
          count: groupedByDate[date] || 0
        }))
        
        console.log("🔍 [DiagnosticChart] Final chart data:", chartData)
        setData(chartData)
      } catch (error) {
        console.error("❌ [DiagnosticChart] Error fetching diagnostic data:", error)
        setError(error instanceof Error ? error.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchDiagnosticData()
  }, [])

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="h-[300px] flex items-center justify-center text-red-500">
        <div className="text-center">
          <p>Error loading chart data</p>
          <p className="text-xs mt-2">{error}</p>
        </div>
      </div>
    )
  }

  // Create mock data for demo purposes if no real data exists
  if (data.every(item => item.count === 0)) {
    const demoData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return {
        date: d.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10) + 1 // Random value between 1-10
      }
    })
    
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="bg-yellow-50 text-yellow-800 text-xs px-2 py-1 rounded border border-yellow-200">
            Showing sample data - No actual diagnostic data available yet
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={demoData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getMonth() + 1}/${date.getDate()}`
              }}
            />
            <YAxis allowDecimals={false} />
            <Tooltip
              labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
              formatter={(value) => [`${value} diagnostics`, ""]}
              contentStyle={{
                backgroundColor: "white",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "#8b5cf6" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => {
            const date = new Date(value)
            return `${date.getMonth() + 1}/${date.getDate()}`
          }}
        />
        <YAxis allowDecimals={false} />
        <Tooltip
          labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
          formatter={(value) => [`${value} diagnostics`, ""]}
          contentStyle={{
            backgroundColor: "white",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
          }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: "#8b5cf6" }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
