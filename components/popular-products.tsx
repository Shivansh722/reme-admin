"use client"

import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { getProducts, type Product } from "@/lib/firebase-service"

export function PopularProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const productData = await getProducts()
        // Sort by evaluation score and take top 5
        const topProducts = productData.sort((a, b) => (b.evaluationScore || 0) - (a.evaluationScore || 0)).slice(0, 5)
        setProducts(topProducts)
      } catch (error) {
        console.error("Error loading products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="animate-pulse flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {products.map((product, index) => (
        <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full font-bold">
              {index + 1}
            </div>
            <div>
              <h3 className="font-semibold">{product.productName || "Unknown Product"}</h3>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary">{product.category || "Uncategorized"}</Badge>
                {product.brand && <Badge variant="outline">{product.brand}</Badge>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">Score: {product.evaluationScore || 0}</div>
            {product.externalUrl && (
              <a
                href={product.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                View Product
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
