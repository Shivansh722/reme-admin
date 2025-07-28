import { useState } from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@radix-ui/react-dialog"
import { addProduct } from "@/lib/firebase-service"



// If you have DialogHeader and DialogFooter components, import them from the correct path.
// Otherwise, define them here as simple wrappers:

function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="dialog-header">{children}</div>
}

function DialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="dialog-footer">{children}</div>
}


export interface AddProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductAdded?: () => void
}

export function AddProductModal({ open, onOpenChange, onProductAdded }: AddProductModalProps) {
  const [form, setForm] = useState({
    "カテゴリ": "",
    "タグ": "",
    "ブランド名": "",
    "口コミ件数": "",
    "商品URL": "",
    "商品名": "",
    "商品画像URL": "",
    "商品詳細": "",
    "外部URL": "",
    "容量・参考価格": "",
    "評価スコア": "",
  })
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    console.log("Submitting product form:", form)
    try {
      const payload = {
        ...form,
        "評価スコア": form["評価スコア"] ? Number(form["評価スコア"]) : "",
      }
      console.log("[AddProductModal] Payload to addProduct:", payload)
      const result = await addProduct(payload)
      console.log("[AddProductModal] addProduct result (new doc ID):", result)
      if (!result) {
        alert("Product was not added. Please check the logs for errors.")
        return
      }
      onOpenChange(false)
      setForm({
        "カテゴリ": "",
        "タグ": "",
        "ブランド名": "",
        "口コミ件数": "",
        "商品URL": "",
        "商品名": "",
        "商品画像URL": "",
        "商品詳細": "",
        "外部URL": "",
        "容量・参考価格": "",
        "評価スコア": "",
      })
      onProductAdded?.()
    } catch (err) {
      console.error("[AddProductModal] Failed to add product:", err)
      alert("Failed to add product: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>商品を追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="カテゴリ" placeholder="カテゴリ" value={form["カテゴリ"]} onChange={handleChange} required />
          <Input name="タグ" placeholder="タグ（カンマ区切り）" value={form["タグ"]} onChange={handleChange} />
          <Input name="ブランド名" placeholder="ブランド名" value={form["ブランド名"]} onChange={handleChange} />
          <Input name="口コミ件数" placeholder="口コミ件数" value={form["口コミ件数"]} onChange={handleChange} />
          <Input name="商品URL" placeholder="商品URL" value={form["商品URL"]} onChange={handleChange} />
          <Input name="商品名" placeholder="商品名" value={form["商品名"]} onChange={handleChange} />
          <Input name="商品画像URL" placeholder="商品画像URL" value={form["商品画像URL"]} onChange={handleChange} />
          <textarea name="商品詳細" placeholder="商品詳細" value={form["商品詳細"]} onChange={handleChange} className="w-full border rounded p-2" rows={3} />
          <Input name="外部URL" placeholder="外部URL" value={form["外部URL"]} onChange={handleChange} />
          <Input name="容量・参考価格" placeholder="容量・参考価格" value={form["容量・参考価格"]} onChange={handleChange} />
          <Input name="評価スコア" placeholder="評価スコア" type="number" value={form["評価スコア"]} onChange={handleChange} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>キャンセル</Button>
            <Button type="submit" disabled={loading}>{loading ? "追加中..." : "追加"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}




