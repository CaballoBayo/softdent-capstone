"use client"

import { useState, useTransition } from "react"
import { openCashSession, createCashMovement, voidCashMovement, closeCashSession } from "@/app/actions/cashActions"

interface CashManagerProps {
  activeSession: any
  pastSessions: any[]
  paymentMethods: any[]
}

export function CashManager({ activeSession, pastSessions, paymentMethods }: CashManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [anulandoId, setAnulandoId] = useState<string | null>(null)
  const [voidReason, setVoidReason] = useState("")

  // Cálculos rápidos de la caja activa
  const activeMovements = activeSession?.movements || []
  const validMovements = activeMovements.filter((m: any) => !m.isVoided)

  const totalIngresos = validMovements
    .filter((m: any) => m.type === "INGRESO")
    .reduce((sum: number, m: any) => sum + m.amount, 0)

  const totalEgresos = validMovements
    .filter((m: any) => m.type === "EGRESO")
    .reduce((sum: number, m: any) => sum + m.amount, 0)

  // Solo efectivo para arqueo
  const efectivoEnCaja =
    (activeSession?.initialAmount || 0) +
    validMovements
      .filter((m: any) => m.paymentMethod.name.toLowerCase().includes("efectivo"))
      .reduce((sum: number, m: any) => sum + (m.type === "INGRESO" ? m.amount : -m.amount), 0)

  async function handleOpen(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await openCashSession(formData)
      if (res?.error) setError(res.error)
    })
  }

  async function handleMovement(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createCashMovement(formData)
      if (res?.error) setError(res.error)
      else (document.getElementById("form-movimiento") as HTMLFormElement)?.reset()
    })
  }

  async function handleClose(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await closeCashSession(formData)
      if (res?.error) setError(res.error)
    })
  }

  async function confirmVoid(id: string) {
    if (!voidReason.trim()) {
      setError("Debe especificar el motivo de la anulación.")
      return
    }
    startTransition(async () => {
      const res = await voidCashMovement(id, voidReason)
      if (res?.error) setError(res.error)
      else {
        setAnulandoId(null)
        setVoidReason("")
      }
    })
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 1. ESTADO DE CAJA: SI NO HAY CAJA ABIERTA -> FORMULARIO DE APERTURA */}
      {!activeSession ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-lg mx-auto text-center space-y-6">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Caja Cerrada</h2>
            <p className="text-gray-500 text-sm mt-1">
              Debe abrir una sesión con un monto inicial para registrar cobros y pagos.
            </p>
          </div>

          <form action={handleOpen} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Monto Inicial en Efectivo ($ CLP)
              </label>
              <input
                name="initialAmount"
                type="number"
                placeholder="Ej: 50000"
                required
                min="0"
                className="w-full px-4 py-2 border rounded-md text-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Responsable de Apertura
              </label>
              <input
                name="openedBy"
                type="text"
                placeholder="Nombre del cajero/a"
                required
                className="w-full px-4 py-2 border rounded-md text-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-md transition-colors disabled:opacity-50"
            >
              {isPending ? "Abriendo caja..." : "Abrir Sesión de Caja"}
            </button>
          </form>
        </div>
      ) : (
        /* 2. CAJA ABIERTA: DASHBOARD + MOVIMIENTOS + CIERRE */
        <div className="space-y-8">
          {/* Tarjetas de Resumen del Turno */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase">Monto Inicial</span>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                ${activeSession.initialAmount.toLocaleString("es-CL")}
              </p>
              <span className="text-xs text-gray-400">Abierta por {activeSession.openedBy}</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-green-600 uppercase">Total Ingresos</span>
              <p className="text-2xl font-bold text-green-700 mt-1">
                +${totalIngresos.toLocaleString("es-CL")}
              </p>
              <span className="text-xs text-gray-400">Todos los medios</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-rose-600 uppercase">Total Egresos</span>
              <p className="text-2xl font-bold text-rose-700 mt-1">
                -${totalEgresos.toLocaleString("es-CL")}
              </p>
              <span className="text-xs text-gray-400">Gastos menores/retiros</span>
            </div>

            <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 shadow-sm">
              <span className="text-xs font-semibold text-blue-700 uppercase">Efectivo Teórico en Caja</span>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                ${efectivoEnCaja.toLocaleString("es-CL")}
              </p>
              <span className="text-xs text-blue-600">Base para el arqueo</span>
            </div>
          </div>

          {/* Grilla: Registro de Movimiento y Arqueo/Cierre */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulario Registrar Movimiento */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Registrar Movimiento en Caja</h3>
              <form id="form-movimiento" action={handleMovement} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Tipo</label>
                    <select name="type" className="w-full mt-1 border px-3 py-2 rounded-md text-sm">
                      <option value="INGRESO">Ingreso (+)</option>
                      <option value="EGRESO">Egreso (-)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Monto ($ CLP)</label>
                    <input
                      name="amount"
                      type="number"
                      placeholder="Monto"
                      required
                      min="1"
                      className="w-full mt-1 border px-3 py-2 rounded-md text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Método de Pago</label>
                    <select name="paymentMethodId" className="w-full mt-1 border px-3 py-2 rounded-md text-sm" required>
                      {paymentMethods.filter((pm) => pm.isActive).map((pm) => (
                        <option key={pm.id} value={pm.id}>{pm.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Responsable</label>
                    <input
                      name="registeredBy"
                      type="text"
                      placeholder="Tu nombre"
                      required
                      className="w-full mt-1 border px-3 py-2 rounded-md text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">Descripción o Motivo</label>
                  <input
                    name="description"
                    type="text"
                    placeholder="Ej: Pago de consulta urgencia / Compra de insumos"
                    required
                    className="w-full mt-1 border px-3 py-2 rounded-md text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-md text-sm transition-colors"
                >
                  {isPending ? "Guardando..." : "Registrar Movimiento"}
                </button>
              </form>
            </div>

            {/* Formulario de Cierre de Caja y Arqueo */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Cierre de Turno y Arqueo</h3>
              <p className="text-xs text-gray-500">
                Cuente el efectivo físico en gaveta para compararlo con el monto esperado (${efectivoEnCaja.toLocaleString("es-CL")}).
              </p>

              <form action={handleClose} className="space-y-3">
                <input type="hidden" name="sessionId" value={activeSession.id} />

                <div>
                  <label className="text-xs font-semibold text-gray-600">Efectivo Físico Contado ($ CLP)</label>
                  <input
                    name="countedAmount"
                    type="number"
                    placeholder="Monto exacto en mano"
                    required
                    min="0"
                    className="w-full mt-1 border px-3 py-2 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">
                    Justificación de Diferencia (Obligatorio si sobra o falta)
                  </label>
                  <input
                    name="differenceNotes"
                    type="text"
                    placeholder="Ej: Descuadre por vuelto mal entregado"
                    className="w-full mt-1 border px-3 py-2 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">Responsable de Cierre</label>
                  <input
                    name="closedBy"
                    type="text"
                    placeholder="Nombre de quien entrega la caja"
                    required
                    className="w-full mt-1 border px-3 py-2 rounded-md text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 rounded-md text-sm transition-colors"
                >
                  {isPending ? "Cerrando turno..." : "Realizar Arqueo y Cerrar Caja"}
                </button>
              </form>
            </div>
          </div>

          {/* Tabla de Movimientos de la Sesión Actual */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Movimientos del Turno</h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Hora</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Tipo</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Descripción</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Método</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Monto</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Responsable</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                        No hay movimientos registrados en este turno.
                      </td>
                    </tr>
                  ) : (
                    activeMovements.map((m: any) => (
                      <tr key={m.id} className={m.isVoided ? "bg-red-50/40 opacity-60" : "hover:bg-gray-50"}>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(m.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              m.type === "INGRESO" ? "bg-green-100 text-green-800" : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {m.description}
                          {m.isVoided && (
                            <div className="text-xs text-red-600 font-normal mt-0.5">
                              ⚠️ Anulado: {m.voidReason} (por {m.voidedBy})
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{m.paymentMethod.name}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${m.type === "INGRESO" ? "text-green-700" : "text-rose-700"}`}>
                          {m.type === "INGRESO" ? "+" : "-"}${m.amount.toLocaleString("es-CL")}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{m.registeredBy}</td>
                        <td className="px-4 py-3 text-right">
                          {!m.isVoided ? (
                            anulandoId === m.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <input
                                  type="text"
                                  placeholder="Motivo..."
                                  value={voidReason}
                                  onChange={(e) => setVoidReason(e.target.value)}
                                  className="px-2 py-1 text-xs border rounded w-32 focus:outline-none"
                                />
                                <button
                                  onClick={() => confirmVoid(m.id)}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => setAnulandoId(null)}
                                  className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setAnulandoId(m.id)
                                  setVoidReason("")
                                }}
                                className="text-xs font-semibold text-red-600 hover:underline"
                              >
                                Anular
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-red-500 font-semibold italic">Anulado</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. HISTORIAL DE CAJAS CERRADAS (CONSULTA Y ARQUEO HISTÓRICO) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Historial de Turnos Cerrados</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Apertura</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Cierre</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Responsables</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Monto Inicial</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Esperado</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Contado</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Diferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pastSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    Aún no hay turnos cerrados registrados.
                  </td>
                </tr>
              ) : (
                pastSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(s.openedAt).toLocaleString("es-CL")}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {s.closedAt ? new Date(s.closedAt).toLocaleString("es-CL") : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>Abre: {s.openedBy}</div>
                      <div className="text-xs text-gray-400">Cierra: {s.closedBy || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-right">${s.initialAmount.toLocaleString("es-CL")}</td>
                    <td className="px-4 py-3 text-right">${(s.expectedAmount || 0).toLocaleString("es-CL")}</td>
                    <td className="px-4 py-3 text-right font-semibold">${(s.countedAmount || 0).toLocaleString("es-CL")}</td>
                    <td className={`px-4 py-3 text-right font-bold ${(s.difference || 0) === 0 ? "text-green-600" : "text-rose-600"}`}>
                      {(s.difference || 0) > 0 ? `+$${s.difference?.toLocaleString("es-CL")}` : `$${s.difference?.toLocaleString("es-CL")}`}
                      {s.differenceNotes && (
                        <div className="text-xs font-normal text-gray-500">{s.differenceNotes}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}