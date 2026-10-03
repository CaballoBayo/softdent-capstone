"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { patientSchema, PatientFormData } from "@/lib/schemas"
import { createPatient, updatePatient, checkDuplicatePatient, reactivatePatient } from "@/lib/actions"

interface PatientFormProps {
  patientId?: string
  initialData?: PatientFormData
  onSuccess?: () => void
}

interface DuplicatePatient {
  id: string
  rut: string
  firstName: string
  lastName: string
  birthDate?: Date | null
}

export function PatientForm({ patientId, initialData, onSuccess }: PatientFormProps) {
  const router = useRouter()
  const isEditing = Boolean(patientId && initialData)

  const [duplicates, setDuplicates] = useState<DuplicatePatient[]>([])
  const [pendingData, setPendingData] = useState<PatientFormData | null>(null)
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)

  // Estado para gestionar si se detecta un paciente inactivo por RUT
  const [inactivePatient, setInactivePatient] = useState<DuplicatePatient | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    mode: "onBlur",
    defaultValues: initialData || {
      prevision: "Particular",
    },
  })

  // Función para ejecutar la creación o edición del paciente
  async function executeSave(data: PatientFormData) {
    let result

    if (isEditing && patientId) {
      result = await updatePatient(patientId, data)
    } else {
      result = await createPatient(data)
    }

    if (result.success) {
      if (!isEditing) {
        reset()
      }
      setShowDuplicateWarning(false)
      setPendingData(null)
      setDuplicates([])
      router.refresh()
      if (onSuccess) {
        onSuccess()
      }
    } else {
      // Manejo de respuesta cuando el RUT ingresado pertenece a un paciente inactivo
      if (result.isInactive && result.existingPatient) {
        setInactivePatient(result.existingPatient)
      } else {
        alert(result.error)
      }
    }
  }

  // Función para reactivar al paciente inactivo detectado
  async function handleReactivate() {
    if (!inactivePatient) return
    const res = await reactivatePatient(inactivePatient.id)
    if (res.success) {
      alert("Paciente reactivado exitosamente")
      setInactivePatient(null)
      reset()
      router.refresh()
      if (onSuccess) {
        onSuccess()
      }
    } else {
      alert(res.error)
    }
  }

  async function onSubmit(data: PatientFormData) {
    // Si estamos editando, guardamos directamente sin validar duplicados de creación
    if (isEditing) {
      await executeSave(data)
      return
    }

    // 1. Verificar si existen coincidencias por Nombre + Apellido / Fecha
    const check = await checkDuplicatePatient(data.firstName, data.lastName, data.birthDate)

    if (check.success && check.duplicates && check.duplicates.length > 0) {
      setDuplicates(check.duplicates)
      setPendingData(data)
      setShowDuplicateWarning(true)
    } else {
      await executeSave(data)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 shadow-sm rounded-2xl border border-gray-200 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isEditing ? "Editar Datos del Paciente" : "Registrar Nuevo Paciente"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* RUT */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              RUT <span className="text-red-500">*</span>
            </label>
            <input
              {...register("rut")}
              type="text"
              placeholder="12.345.678-9"
              className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 font-semibold placeholder-gray-400 ${
                errors.rut ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.rut && <p className="text-red-500 text-xs mt-1 font-bold">{errors.rut.message}</p>}
          </div>

          {/* Nombres */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              {...register("firstName")}
              type="text"
              placeholder="Juan Andrés"
              className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 font-semibold placeholder-gray-400 ${
                errors.firstName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.firstName && <p className="text-red-500 text-xs mt-1 font-bold">{errors.firstName.message}</p>}
          </div>

          {/* Apellidos */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Apellidos <span className="text-red-500">*</span>
            </label>
            <input
              {...register("lastName")}
              type="text"
              placeholder="Pérez Cotapos"
              className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 font-semibold placeholder-gray-400 ${
                errors.lastName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.lastName && <p className="text-red-500 text-xs mt-1 font-bold">{errors.lastName.message}</p>}
          </div>

          {/* Correo Electrónico */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Correo Electrónico</label>
            <input
              {...register("email")}
              type="email"
              placeholder="paciente@correo.com"
              className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 font-semibold placeholder-gray-400 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1 font-bold">{errors.email.message}</p>}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Teléfono</label>
            <input
              {...register("phone")}
              type="text"
              placeholder="+56 9 1234 5678"
              className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 font-semibold placeholder-gray-400 ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1 font-bold">{errors.phone.message}</p>}
          </div>

          {/* Previsión */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Previsión <span className="text-red-500">*</span>
            </label>
            <select
              {...register("prevision")}
              className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 font-semibold ${
                errors.prevision ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="Particular">Particular</option>
              <option value="Fonasa">Fonasa</option>
              <option value="Isapre">Isapre</option>
              <option value="Convenio">Convenio</option>
            </select>
            {errors.prevision && <p className="text-red-500 text-xs mt-1 font-bold">{errors.prevision.message}</p>}
          </div>

          {/* Fecha de Nacimiento */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Fecha de Nacimiento</label>
            <input
              {...register("birthDate")}
              type="date"
              className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 font-semibold ${
                errors.birthDate ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.birthDate && <p className="text-red-500 text-xs mt-1 font-bold">{errors.birthDate.message}</p>}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white font-extrabold px-6 py-2.5 rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow-sm"
          >
            {isSubmitting
              ? "Validando y Guardando..."
              : isEditing
              ? "Actualizar Paciente"
              : "Guardar Paciente"}
          </button>
        </div>
      </form>

      {/* Modal 1: Advertencia por Posible Duplicado (Nombre + Apellido) */}
      {showDuplicateWarning && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <span className="text-2xl">⚠️</span>
              <h3 className="font-extrabold text-lg text-gray-900">Posible Paciente Duplicado</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 font-medium">
              Se encontraron coincidencias registradas en el sistema con un nombre similar:
            </p>

            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
              {duplicates.map((dup) => (
                <div key={dup.id} className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-sm">
                  <p className="font-bold text-gray-900">{dup.firstName} {dup.lastName}</p>
                  <p className="text-xs text-gray-600 font-mono">RUT: {dup.rut}</p>
                  {dup.birthDate && (
                    <p className="text-xs text-gray-500">
                      Nacimiento: {new Date(dup.birthDate).toLocaleDateString("es-CL")}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mb-6 font-bold">
              ¿Deseas registrar este nuevo paciente de todas formas?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDuplicateWarning(false)
                  setPendingData(null)
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => pendingData && executeSave(pendingData)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
              >
                Registrar De Todas Formas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Ofrecer Reactivación si el RUT pertenece a un paciente inactivo */}
      {inactivePatient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4 text-blue-600">
              <span className="text-2xl">ℹ️</span>
              <h3 className="font-extrabold text-lg text-gray-900">Paciente Inactivo Detectado</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4 font-medium">
              El RUT ingresado pertenece a un paciente que actualmente se encuentra inactivo:
            </p>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-sm mb-6">
              <p className="font-extrabold text-gray-900">{inactivePatient.firstName} {inactivePatient.lastName}</p>
              <p className="text-xs text-gray-500 font-mono mt-1">RUT: {inactivePatient.rut}</p>
            </div>

            <p className="text-xs text-gray-600 font-bold mb-6">
              ¿Deseas reactivar a este paciente en el sistema?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setInactivePatient(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReactivate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
              >
                Reactivar Paciente
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}