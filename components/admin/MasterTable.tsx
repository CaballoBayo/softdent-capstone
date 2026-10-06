"use client"

import { useState, useTransition } from "react"
import { createMasterRecord, toggleMasterStatus, updateMasterRecord } from "@/app/actions/masterData"

interface MasterItem {
  id: string
  name: string
  description?: string | null
  isActive: boolean
}

interface MasterTableProps {
  catalogKey: "specialty" | "box" | "healthInsurance" | "paymentMethod" | "appointmentType" | "procedureCategory"
  title: string
  subtitle: string
  items: MasterItem[]
  showDescription?: boolean
}

export function MasterTable({ catalogKey, title, subtitle, items, showDescription = false }: MasterTableProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Estado para controlar qué fila se está editando
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")

  function startEditing(item: MasterItem) {
    setEditingId(item.id)
    setEditName(item.name)
    setEditDescription(item.description || "")
    setErrorMessage(null)
  }

  function cancelEditing() {
    setEditingId(null)
    setEditName("")
    setEditDescription("")
  }

  async function handleSaveEdit(id: string) {
    setErrorMessage(null)
    startTransition(async () => {
      const res = await updateMasterRecord(catalogKey, id, editName, editDescription)
      if (res?.error) {
        setErrorMessage(res.error)
      } else {
        cancelEditing()
      }
    })
  }

  async function handleCreate(formData: FormData) {
    setErrorMessage(null)
    startTransition(async () => {
      const res = await createMasterRecord(catalogKey, formData)
      if (res?.error) {
        setErrorMessage(res.error)
      } else {
        const formElement = document.getElementById(`form-${catalogKey}`) as HTMLFormElement
        formElement?.reset()
      }
    })
  }

  async function handleToggle(id: string, currentStatus: boolean) {
    startTransition(async () => {
      await toggleMasterStatus(catalogKey, id, currentStatus)
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      {/* Formulario de creación */}
      <form id={`form-${catalogKey}`} action={handleCreate} className="flex flex-col sm:flex-row gap-3">
        <input
          name="name"
          type="text"
          placeholder="Nuevo nombre..."
          required
          className="flex-1 px-4 py-2 border rounded-md text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {showDescription && (
          <input
            name="description"
            type="text"
            placeholder="Descripción (opcional)..."
            className="flex-1 px-4 py-2 border rounded-md text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Agregar"}
        </button>
      </form>

      {errorMessage && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
          {errorMessage}
        </div>
      )}

      {/* Tabla con edición y cambio de estado */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
              {showDescription && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Descripción</th>
              )}
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white text-sm">
            {items.length === 0 ? (
              <tr>
                <td colSpan={showDescription ? 4 : 3} className="px-4 py-6 text-center text-gray-400">
                  No hay registros creados.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isEditing = editingId === item.id

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {/* Celda Nombre */}
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 border border-blue-400 rounded text-sm w-full focus:outline-none"
                        />
                      ) : (
                        item.name
                      )}
                    </td>

                    {/* Celda Descripción (si aplica) */}
                    {showDescription && (
                      <td className="px-4 py-3 text-gray-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="px-2 py-1 border border-blue-400 rounded text-sm w-full focus:outline-none"
                          />
                        ) : (
                          item.description || "-"
                        )}
                      </td>
                    )}

                    {/* Celda Estado */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          item.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600 line-through"
                        }`}
                      >
                        {item.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    {/* Celda Acciones */}
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            disabled={isPending}
                            className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded transition-colors disabled:opacity-50"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={isPending}
                            className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded transition-colors"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(item)}
                            disabled={isPending}
                            className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggle(item.id, item.isActive)}
                            disabled={isPending}
                            className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                              item.isActive
                                ? "text-red-700 bg-red-50 hover:bg-red-100"
                                : "text-green-700 bg-green-50 hover:bg-green-100"
                            }`}
                          >
                            {item.isActive ? "Desactivar" : "Reactivar"}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}