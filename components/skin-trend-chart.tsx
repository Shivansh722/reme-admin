"use client"

import { useEffect, useState } from "react"
import { getAnalyticsTrends } from "@/lib/firebase-service"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useFirebase } from "@/components/firebase-provider"

interface TrendData {
  date: string
  diagnostics: number
  skinAge: number
  pimples: number
  pores: number
  firmness: number
  redness: number
  sagging: number
}

export function SkinTrendChart() {
  const [data, setData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const { isInitialized } = useFirebase()
  
  useEffect(() => {
    async function fetchData() {
      if (!isInitialized) return
      
      try {
        setLoading(true)
        console.log("Fetching skin condition trends data...")
        const trends = await getAnalyticsTrends()
        console.log("Received trends data:", trends)
        setData(trends)
      } catch (error) {
        console.error("Error fetching skin trends:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [isInitialized])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  // For debugging - add a message if data is empty
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-center">
        <div>
          <p className="text-muted-foreground">No skin analysis data available</p>
          <p className="text-xs text-muted-foreground mt-1">Try adding some skin analyses to see trends</p>
        </div>
      </div>
    )
  }

  // Add test data if in development and no real data
  const displayData = data.some(day => 
    day.pimples > 0 || day.pores > 0 || day.firmness > 0 || 
    day.redness > 0 || day.sagging > 0 || day.skinAge > 0
  ) ? data : generateDemoData();
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={displayData}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }} 
          tickFormatter={(date) => {
            const d = new Date(date);
            return `${d.getMonth()+1}/${d.getDate()}`;
          }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          domain={[0, 100]}
        />
        <Tooltip 
          formatter={(value, name) => [`${value}`, name]}
          contentStyle={{
            backgroundColor: "white",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="firmness" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="pimples" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="pores" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="redness" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="sagging" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="skinAge" stroke="#64748b" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Generate demo data for development purposes
function generateDemoData() {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  return last7Days.map(date => ({
    date,
    firmness: Math.floor(80 + Math.random() * 15),
    pimples: Math.floor(40 + Math.random() * 40),
    pores: Math.floor(50 + Math.random() * 30),
    redness: Math.floor(30 + Math.random() * 40),
    sagging: Math.floor(60 + Math.random() * 30),
    skinAge: Math.floor(60 + Math.random() * 20),
    diagnostics: Math.floor(3 + Math.random() * 8)
  }));
}
