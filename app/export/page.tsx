import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExportForm } from "@/components/export-form"
import { MetricsCard } from "@/components/metrics-card"

export default function ExportPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-3xl font-bold">Data Export</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Export Diagnostic Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <ExportForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics & Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsCard />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
