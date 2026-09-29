"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { patientSchema, PatientFormData } from "@/lib/schemas"
import { createPatient } from "@/lib/actions"

export function PatientForm() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    mode: "onBlur",
  })

  async function onSubmit(data: PatientFormData) {
    const result = await createPatient(data)

    if (result.success) {
      reset()
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 shadow rounded-lg mb-8">
      <h2 className="text-xl font-semibold mb-4">Registrar Nuevo Paciente</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* RUT */}
        <div>
          <label className="block text-sm font-medium text-gray-700">RUT</label>
          <input
            {...register("rut")}
            type="text"
            placeholder="12.345.678-9"
            className={`mt-1 p-2 w-full border rounded-md ${errors.rut ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.rut && <p className="text-red-500 text-xs mt-1">{errors.rut.message}</p>}
        </div>

        {/* Correo Electrónico */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
          <input
            {...register("email")}
            type="email"
            placeholder="paciente@correo.com"
            className={`mt-1 p-2 w-full border rounded-md ${errors.email ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input
            {...register("phone")}
            type="text"
            placeholder="+56 9..."
            className={`mt-1 p-2 w-full border rounded-md ${errors.phone ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            {...register("firstName")}
            type="text"
            className={`mt-1 p-2 w-full border rounded-md ${errors.firstName ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
        </div>

        {/* Apellidos */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Apellidos</label>
          <input
            {...register("lastName")}
            type="text"
            className={`mt-1 p-2 w-full border rounded-md ${errors.lastName ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
      >
        {isSubmitting ? "Validando e Ingresando..." : "Guardar Paciente"}
      </button>
    </form>
  )
}