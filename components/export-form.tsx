"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Download } from "lucide-react"
import { useState } from "react"

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

  const handleItemChange = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId])
    } else {
      setSelectedItems(selectedItems.filter((id) => id !== itemId))
    }
  }

  const handleExport = () => {
    // Export logic would go here
    console.log("Exporting:", { selectedItems, dateRange })
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
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="end-date">End Date</Label>
          <Input
            id="end-date"
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
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
              onCheckedChange={(checked) => handleItemChange(item.id, checked as boolean)}
            />
            <Label htmlFor={item.id}>{item.label}</Label>
          </div>
        ))}
      </div>

      <Button onClick={handleExport} className="w-full">
        <Download className="h-4 w-4 mr-2" />
        Export to CSV
      </Button>
    </div>
  )
}
