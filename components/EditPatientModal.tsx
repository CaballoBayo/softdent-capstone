"use client"

import { useState } from "react"
import { PatientForm } from "@/components/PatientForm"

interface EditPatientModalProps {
  patient: {
    id: string
    rut: string
    firstName: string
    lastName: string
    email?: string | null
    phone?: string | null
    prevision: string
    birthDate?: Date | string | null
  }
}

export function EditPatientModal({ patient }: EditPatientModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Formato YYYY-MM-DD para la entrada tipo date
  const formattedBirthDate = patient.birthDate
    ? new Date(patient.birthDate).toISOString().split("T")[0]
    : ""

  const initialData = {
    rut: patient.rut,
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email || "",
    phone: patient.phone || "",
    prevision: patient.prevision,
    birthDate: formattedBirthDate,
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold px-4 py-2 rounded-xl text-xs transition-colors border border-gray-300 shadow-sm flex items-center gap-1.5"
      >
        ✏️ Editar Datos
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
              <h3 className="font-extrabold text-xl text-gray-900">Modificar Ficha de Paciente</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-black text-xl px-2"
              >
                ✕
              </button>
            </div>
            
            <PatientForm
              patientId={patient.id}
              initialData={initialData}
              onSuccess={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}