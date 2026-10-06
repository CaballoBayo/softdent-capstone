"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// 1. Obtener la caja activa actual (si existe)
export async function getActiveCashSession() {
  return await prisma.cashSession.findFirst({
    where: { status: "ABIERTA" },
    include: {
      movements: {
        include: { paymentMethod: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })
}

// 2. Apertura de caja
export async function openCashSession(formData: FormData) {
  const initialAmount = parseInt(formData.get("initialAmount") as string, 10)
  const openedBy = (formData.get("openedBy") as string)?.trim() || "Recepcionista Turno"

  if (isNaN(initialAmount) || initialAmount < 0) {
    return { error: "El monto inicial debe ser un número válido mayor o igual a 0." }
  }

  // Regla: Validar si ya existe una caja abierta
  const existingActive = await prisma.cashSession.findFirst({
    where: { status: "ABIERTA" },
  })
  if (existingActive) {
    return { error: "Ya existe una caja abierta en curso. Debe cerrarla primero." }
  }

  await prisma.cashSession.create({
    data: {
      initialAmount,
      openedBy,
      status: "ABIERTA",
    },
  })

  revalidatePath("/caja")
  return { success: true }
}

// 3. Registrar Movimiento (Ingreso o Egreso)
export async function createCashMovement(formData: FormData) {
  const type = formData.get("type") as "INGRESO" | "EGRESO"
  const amount = parseInt(formData.get("amount") as string, 10)
  const description = (formData.get("description") as string)?.trim()
  const paymentMethodId = formData.get("paymentMethodId") as string
  const registeredBy = (formData.get("registeredBy") as string)?.trim() || "Usuario Actual"

  if (!description || isNaN(amount) || amount <= 0 || !paymentMethodId) {
    return { error: "Todos los campos son obligatorios y el monto debe ser mayor a 0." }
  }

  // Regla del módulo: No se registran movimientos sin una caja abierta
  const activeSession = await prisma.cashSession.findFirst({
    where: { status: "ABIERTA" },
  })
  if (!activeSession) {
    return { error: "No es posible registrar movimientos: No hay una caja abierta actualmente." }
  }

  await prisma.cashMovement.create({
    data: {
      type,
      amount,
      description,
      paymentMethodId,
      registeredBy,
      sessionId: activeSession.id,
    },
  })

  revalidatePath("/caja")
  return { success: true }
}

// 4. Anular Movimiento (Regla: Conserva registro, exige motivo y usuario)
export async function voidCashMovement(movementId: string, voidReason: string, voidedBy: string = "Admin") {
  if (!voidReason?.trim()) {
    return { error: "La anulación exige indicar un motivo obligatorio." }
  }

  const movement = await prisma.cashMovement.findUnique({
    where: { id: movementId },
    include: { session: true },
  })

  if (!movement) return { error: "Movimiento no encontrado." }

  // Regla: Una caja cerrada no admite modificaciones
  if (movement.session.status === "CERRADA") {
    return { error: "No se puede anular un movimiento de una caja que ya fue cerrada." }
  }

  await prisma.cashMovement.update({
    where: { id: movementId },
    data: {
      isVoided: true,
      voidReason: voidReason.trim(),
      voidedBy,
      voidedAt: new Date(),
    },
  })

  revalidatePath("/caja")
  return { success: true }
}

// 5. Cierre de caja y Arqueo (Compara esperado vs contado)
export async function closeCashSession(formData: FormData) {
  const sessionId = formData.get("sessionId") as string
  const countedAmount = parseInt(formData.get("countedAmount") as string, 10)
  const differenceNotes = (formData.get("differenceNotes") as string)?.trim() || null
  const closedBy = (formData.get("closedBy") as string)?.trim() || "Admin Turno"

  if (isNaN(countedAmount) || countedAmount < 0) {
    return { error: "Debe ingresar el monto físico contado en el arqueo." }
  }

  const session = await prisma.cashSession.findUnique({
    where: { id: sessionId },
    include: {
      movements: {
        include: { paymentMethod: true },
      },
    },
  })

  if (!session || session.status === "CERRADA") {
    return { error: "La sesión no existe o ya se encuentra cerrada." }
  }

  // Calcular el monto esperado en EFECTIVO (Monto inicial + Ingresos en efectivo - Egresos en efectivo no anulados)
  let expectedAmount = session.initialAmount

  for (const m of session.movements) {
    if (!m.isVoided && m.paymentMethod.name.toLowerCase().includes("efectivo")) {
      if (m.type === "INGRESO") expectedAmount += m.amount
      if (m.type === "EGRESO") expectedAmount -= m.amount
    }
  }

  const difference = countedAmount - expectedAmount

  // Regla: Si hay sobrante o faltante, exigir justificación
  if (difference !== 0 && !differenceNotes) {
    return { error: `Existe una diferencia de $${difference.toLocaleString("es-CL")}. Debe ingresar una justificación.` }
  }

  await prisma.cashSession.update({
    where: { id: sessionId },
    data: {
      status: "CERRADA",
      closedAt: new Date(),
      closedBy,
      expectedAmount,
      countedAmount,
      difference,
      differenceNotes,
    },
  })

  revalidatePath("/caja")
  return { success: true }
}