import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const metrics = [
  {
    title: "Product Click-Through Rate",
    value: "8.7%",
    change: "+2.1%",
    progress: 87,
  },
  {
    title: "User Engagement Rate",
    value: "64.2%",
    change: "+5.3%",
    progress: 64,
  },
  {
    title: "Diagnostic Completion Rate",
    value: "92.1%",
    change: "+1.8%",
    progress: 92,
  },
  {
    title: "Recommendation Acceptance",
    value: "76.5%",
    change: "+3.2%",
    progress: 77,
  },
]

export function MetricsCard() {
  return (
    <div className="space-y-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="pb-2">
            <CardDescription>{metric.title}</CardDescription>
            <CardTitle className="text-2xl">{metric.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600">{metric.change}</span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
            <Progress value={metric.progress} className="mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
