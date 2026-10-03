"use client"

import { useState } from "react"
import { togglePatientStatus } from "@/lib/actions"
import { useRouter } from "next/navigation"

interface TogglePatientButtonProps {
  patientId: string
  active: boolean
}

export function TogglePatientButton({ patientId, active }: TogglePatientButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setLoading(true)
    const res = await togglePatientStatus(patientId, active)
    if (res.success) {
      router.refresh()
    } else {
      alert(res.error)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-3 py-1 text-xs font-bold rounded-full transition-all shadow-sm ${
        active 
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" 
          : "bg-red-100 text-red-800 hover:bg-red-200"
      } disabled:opacity-50`}
      title="Haz clic para cambiar el estado"
    >
      {loading ? "..." : active ? "Activo" : "Inactivo"}
    </button>
  )
}