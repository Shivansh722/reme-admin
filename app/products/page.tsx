"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductTable } from "@/components/product-table"
import { TagManagement } from "@/components/tag-management"
import { Search, Plus, Upload } from "lucide-react"
import { useState } from "react"
import { AddProductModal } from "@/components/add-product-modal"

export default function ProductsPage() {
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-3xl font-bold">Product Recommendation Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Product Management</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      className="pl-8 w-64"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  {/* <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    CSV Import
                  </Button> */}
                  <Button onClick={() => setAddOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ProductTable search={search} refreshKey={refreshKey} />
            </CardContent>
          </Card>
        </div>

        <div>
          <TagManagement />
        </div>
      </div>
      <AddProductModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onProductAdded={() => setRefreshKey(k => k + 1)}
      />
    </div>
  )
}
