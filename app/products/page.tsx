"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductTable } from "@/components/product-table"
import { TagManagement } from "@/components/tag-management"
import { Search, Plus, Upload } from "lucide-react"
import { useState, useRef } from "react"
import { AddProductModal } from "@/components/add-product-modal"
import Papa from "papaparse"
import { importProductsFromCsv } from "@/lib/firebase-service"

export default function ProductsPage() {
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [importLoading, setImportLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImportLoading(true)
    const start = Date.now()
    console.log("[CSV Import] File selected:", file.name)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const products = results.data as any[]
          console.log(`[CSV Import] Parsed products: count=${products.length}`, products)
          if (!products.length) {
            alert("❌ No products found in CSV.")
            setImportLoading(false)
            return
          }

          // Optional: Validate required fields
          const requiredFields = [
            "カテゴリ",
            "タグ",
            "ブランド名",
            "口コミ件数",
            "商品URL",
            "商品名",
            "商品画像URL",
            "商品詳細",
            "外部URL",
            "容量・参考価格",
            "評価スコア"
          ]
          const validProducts = products.filter(p =>
            requiredFields.every(f => typeof p[f] !== "undefined" && p[f] !== "")
          )
          const skipped = products.length - validProducts.length

          if (validProducts.length === 0) {
            alert("❌ No valid products found in CSV. Please check your columns.")
            setImportLoading(false)
            return
          }

          await importProductsFromCsv(validProducts)
          const elapsed = ((Date.now() - start) / 1000).toFixed(1)
          console.log(`[CSV Import] Successfully uploaded ${validProducts.length} products to Firebase in ${elapsed}s.`)
          if (skipped > 0) {
            alert(`✅ Imported ${validProducts.length} products in ${elapsed}s.\n⚠️ Skipped ${skipped} invalid rows. The table will refresh.`)
          } else {
            alert(`✅ Imported ${validProducts.length} products in ${elapsed}s. The table will refresh.`)
          }
          setRefreshKey(k => k + 1)
        } catch (err) {
          console.error("[CSV Import] Import failed:", err)
          alert("❌ Import failed: " + (err instanceof Error ? err.message : String(err)))
        } finally {
          setImportLoading(false)
        }
      },
      error: (err) => {
        console.error("[CSV Import] Parse error:", err)
        alert("❌ CSV Parse error: " + err.message)
        setImportLoading(false)
      }
    })
    e.target.value = ""
  }

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
                  <div className="flex items-center gap-2 mb-4">

                    <input
                      type="file"
                      accept=".csv"
                      id="csv-upload"
                      style={{ display: "none" }}
                      ref={fileInputRef}
                      onChange={handleCsvImport}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1"
                    >
                      <Upload className="h-4 w-4" />
                      Import CSV
                    </Button>
                  </div>
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
