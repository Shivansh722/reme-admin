"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase" // adjust import as needed
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogTitle } from "@radix-ui/react-dialog"
// If you don't have DialogHeader and DialogFooter, define them here:
function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="dialog-header">{children}</div>
}
function DialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="dialog-footer flex justify-end gap-2 mt-4">{children}</div>
}

// Or, if you need to create the file, create 'components/dialog.tsx' and export these components from there.

type PromptHistoryItem = {
  id: string
  prompt: string
  timestamp?: { seconds: number; toDate?: () => Date }
}

export default function PromptManagementPage() {
  const [currentPrompt, setCurrentPrompt] = useState("")
  const [editPrompt, setEditPrompt] = useState("")
  const [history, setHistory] = useState<PromptHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)

  // Fetch current prompt and history
  useEffect(() => {
    async function fetchPrompt() {
      setLoading(true)
      const promptDoc = await getDoc(doc(db, "settings", "skin_analysis_prompt"))
      setCurrentPrompt(promptDoc.data()?.prompt || "")
      setEditPrompt(promptDoc.data()?.prompt || "")

      const historySnap = await getDocs(collection(db, "settings", "skin_analysis_prompt", "history"))
      const historyArr: PromptHistoryItem[] = historySnap.docs
        .map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<PromptHistoryItem, "id">),
        }))
        .sort((a, b) => (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0))
      setHistory(historyArr)
      setLoading(false)
    }
    fetchPrompt()
  }, [])

  // Save new prompt (with confirmation)
  async function handleSavePrompt() {
    if (!editPrompt.trim()) return
    setDialogOpen(false)
    setLoading(true)
    // Save current prompt to history before updating
    await addDoc(collection(db, "settings", "skin_analysis_prompt", "history"), {
      prompt: currentPrompt,
      timestamp: serverTimestamp(),
    })
    // Update current prompt
    await setDoc(doc(db, "settings", "skin_analysis_prompt"), {
      prompt: editPrompt,
      updatedAt: serverTimestamp(),
    })
    setCurrentPrompt(editPrompt)
    setLoading(false)
    // Refresh history
    const historySnap = await getDocs(collection(db, "settings", "skin_analysis_prompt", "history"))
    const historyArr: PromptHistoryItem[] = historySnap.docs
      .map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<PromptHistoryItem, "id">),
      }))
      .sort((a, b) => (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0))
    setHistory(historyArr)
  }

  // Restore a prompt from history
  async function handleRestorePrompt(prompt: string) {
    setEditPrompt(prompt)
    setPendingPrompt(prompt)
    setDialogOpen(true)
  }

  // Confirm dialog action
  function handleDialogConfirm() {
    if (pendingPrompt !== null) {
      setEditPrompt(pendingPrompt)
      setPendingPrompt(null)
      handleSavePrompt()
    } else {
      handleSavePrompt()
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Prompt Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Current Prompt</label>
            <Textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)} rows={8} />
          </div>
          <Button
            disabled={loading || editPrompt === currentPrompt}
            onClick={() => setDialogOpen(true)}
          >
            Update Prompt
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Prompt History</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {history.map(h => (
              <li key={h.id} className="border rounded p-3">
                <div className="text-xs text-gray-500 mb-2">
                  {h.timestamp?.toDate
                    ? h.timestamp.toDate().toLocaleString()
                    : "Unknown date"}
                </div>
                <Textarea value={h.prompt} readOnly rows={4} className="mb-2" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRestorePrompt(h.prompt)}
                >
                  Restore This Prompt
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to update the prompt?</DialogTitle>
          </DialogHeader>
          <div>
            This action will overwrite the current prompt. You can always restore previous prompts from history.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDialogConfirm}
              disabled={loading}
            >
              Yes, Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}