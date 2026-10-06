"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

type CatalogType = 
  | "specialty" 
  | "box" 
  | "healthInsurance" 
  | "paymentMethod" 
  | "appointmentType" 
  | "procedureCategory"

// 1. Alternar estado (Soft Delete)
export async function toggleMasterStatus(catalog: CatalogType, id: string, currentStatus: boolean) {
  try {
    const delegate = (prisma as any)[catalog]
    if (!delegate) throw new Error("Catálogo no válido")

    await delegate.update({
      where: { id },
      data: { isActive: !currentStatus },
    })

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar estado:", error)
    return { error: "No se pudo actualizar el estado del registro." }
  }
}

// 2. Crear un nuevo elemento maestro
export async function createMasterRecord(catalog: CatalogType, formData: FormData) {
  const name = (formData.get("name") as string)?.trim()
  const description = (formData.get("description") as string)?.trim() || null

  if (!name) {
    return { error: "El nombre es obligatorio." }
  }

  try {
    const delegate = (prisma as any)[catalog]
    if (!delegate) throw new Error("Catálogo no válido")

    const existing = await delegate.findUnique({ where: { name } })
    if (existing) {
      return { error: `Ya existe un registro con el nombre "${name}".` }
    }

    const data: Record<string, any> = { name }
    if (catalog === "specialty" && description) {
      data.description = description
    }

    await delegate.create({ data })

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Error al crear registro:", error)
    return { error: "Ocurrió un error al guardar el registro." }
  }
}

// 3. EDITAR nombre y descripción de un elemento existente
export async function updateMasterRecord(
  catalog: CatalogType,
  id: string,
  newName: string,
  newDescription?: string | null
) {
  const trimmedName = newName.trim()
  if (!trimmedName) {
    return { error: "El nombre no puede quedar vacío." }
  }

  try {
    const delegate = (prisma as any)[catalog]
    if (!delegate) throw new Error("Catálogo no válido")

    // Verificar que el nuevo nombre no pertenezca a OTRO registro distinto
    const existing = await delegate.findUnique({ where: { name: trimmedName } })
    if (existing && existing.id !== id) {
      return { error: `Ya existe otro registro con el nombre "${trimmedName}".` }
    }

    const data: Record<string, any> = { name: trimmedName }
    if (catalog === "specialty" && newDescription !== undefined) {
      data.description = newDescription ? newDescription.trim() : null
    }

    await delegate.update({
      where: { id },
      data,
    })

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Error al editar registro:", error)
    return { error: "No se pudo actualizar el registro." }
  }
}