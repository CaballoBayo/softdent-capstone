import { prisma } from "@/lib/prisma"
import { CashManager } from "@/components/caja/CashManager"

export default async function CajaPage() {
  const [activeSession, pastSessions, paymentMethods] = await Promise.all([
    // Sesión activa (si la hay)
    prisma.cashSession.findFirst({
      where: { status: "ABIERTA" },
      include: {
        movements: {
          include: { paymentMethod: true },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    // Historial de sesiones cerradas
    prisma.cashSession.findMany({
      where: { status: "CERRADA" },
      orderBy: { closedAt: "desc" },
      take: 10,
    }),
    // Catálogo maestro de métodos de pago
    prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Módulo 5.2: Control de Caja</h1>
        <p className="text-gray-600 mt-1">
          Apertura, cierre de turnos, arqueos de efectivo, ingresos, egresos y trazabilidad de diferencias.
        </p>
      </div>

      <CashManager
        activeSession={activeSession}
        pastSessions={pastSessions}
        paymentMethods={paymentMethods}
      />
    </div>
  )
}