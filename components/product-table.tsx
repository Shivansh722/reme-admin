"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, ExternalLink } from "lucide-react"
import { useEffect, useState } from "react"
import { getProducts, type Product } from "@/lib/firebase-service"

export function ProductTable() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const productData = await getProducts()
        setProducts(productData)
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
        {[...Array(10)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Brand</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Links</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl || "/placeholder.svg"}
                    alt={product.productName}
                    className="w-10 h-10 rounded object-cover"
                  />
                )}
                {product.productName || "Unknown Product"}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{product.category || "Uncategorized"}</Badge>
            </TableCell>
            <TableCell>{product.brand || "Unknown Brand"}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{product.evaluationScore || 0}</span>
              </div>
            </TableCell>
            <TableCell className="max-w-xs">
              <div className="truncate" title={product.description}>
                {product.description || "No description"}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                {product.productUrl && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {product.externalUrl && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={product.externalUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
