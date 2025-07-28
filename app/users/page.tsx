"use client"

import { useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserTable } from "@/components/user-table"
import { Search, Plus } from "lucide-react"
import { createUserWithEmail } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"

export default function UsersPage() {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ email: "", password: "", displayName: "" })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createUserWithEmail(form)
      toast({ title: "User created", description: "User can now log in.", variant: "default" })
      setShowModal(false)
      setForm({ email: "", password: "", displayName: "" })
      // Optionally: refresh user table here
      window.location.reload()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>User List</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-8 w-64" />
              </div>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UserTable />
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleAddUser}
            className="bg-white p-6 rounded-lg shadow-lg space-y-4 min-w-[320px]"
          >
            <h2 className="text-lg font-bold">Add User</h2>
            <div>
              <label className="block mb-1">Name</label>
              <input
                className="w-full border rounded px-2 py-1"
                value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block mb-1">Email</label>
              <input
                className="w-full border rounded px-2 py-1"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block mb-1">Password</label>
              <input
                className="w-full border rounded px-2 py-1"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add User"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
