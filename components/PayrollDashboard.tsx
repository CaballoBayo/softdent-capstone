"use client"

import { useState, useEffect } from "react"
import { getDashboardStats } from "@/lib/actions"
import Link from "next/link"

interface DentistStats {
  id: string
  name: string
  commission: number
  production: number
  liquidToPay: number
  status?: string
}

interface DashboardStats {
  success: boolean
  global?: {
    totalProduction?: number
    totalPending?: number
    pendingPayment?: number
    netMargin?: number
  }
  dentists?: DentistStats[]
  stats?: {
    global?: {
      totalProduction?: number
      totalPending?: number
      pendingPayment?: number
      netMargin?: number
    }
    dentists?: DentistStats[]
  }
}

export function PayrollDashboard() {
  const [loading, setLoading] = useState(true)
  
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      try {
        const result = await getDashboardStats()
        if (isMounted) {
          if (result.success) {
            setStats(result as DashboardStats)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error("Error al cargar el dashboard:", error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [month, year])

  if (loading && !stats) {
    return <div className="p-8 text-center text-gray-500 font-bold">Calculando cierres de caja...</div>
  }

  // Acceso seguro a las propiedades de global con fallbacks
  const globalStats = stats?.global || stats?.stats?.global || {}
  const totalProduction = globalStats?.totalProduction ?? 0
  const totalPending = globalStats?.totalPending ?? globalStats?.pendingPayment ?? 0
  const netMargin = globalStats?.netMargin ?? 0
  const dentistsList: DentistStats[] = stats?.dentists || stats?.stats?.dentists || []

  return (
    <div className="w-full space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex gap-4 items-center w-full">
        <h2 className="font-bold text-gray-700 mr-4">Filtro de Período:</h2>
        <select 
          value={month} 
          onChange={e => setMonth(parseInt(e.target.value))} 
          className="border p-2 rounded-xl bg-gray-50 font-bold text-gray-700"
        >
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
            <option key={m} value={m}>Mes {m.toString().padStart(2, '0')}</option>
          ))}
        </select>
        <input 
          type="number" 
          value={year} 
          onChange={e => setYear(parseInt(e.target.value))} 
          className="border p-2 rounded-xl bg-gray-50 font-bold text-gray-700 w-24"
        />
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <div className="bg-white p-6 rounded-3xl border-l-4 border-blue-500 shadow-sm">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Producción Total</p>
              <p className="text-3xl font-black text-gray-800 mt-2">${totalProduction.toLocaleString('es-CL')}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border-l-4 border-yellow-500 shadow-sm">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Pendiente de Pago (Drs)</p>
              <p className="text-3xl font-black text-gray-800 mt-2">${totalPending.toLocaleString('es-CL')}</p>
            </div>
            <div className="bg-slate-800 p-6 rounded-3xl border-l-4 border-emerald-400 shadow-sm">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Margen Clínica Neta</p>
              <p className="text-3xl font-black text-emerald-400 mt-2">${netMargin.toLocaleString('es-CL')}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mt-8 w-full">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">Rendimiento por Especialista</h3>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left">
                <thead className="bg-white border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-4 font-bold">Especialista Responsable</th>
                    <th className="p-4 font-bold text-center">Contrato (%)</th>
                    <th className="p-4 font-bold text-right">Producción</th>
                    <th className="p-4 font-bold text-right text-emerald-600">Líquido a Pagar</th>
                    <th className="p-4 font-bold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dentistsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400 font-medium">
                        No hay especialistas registrados en este período.
                      </td>
                    </tr>
                  ) : (
                    dentistsList.map((d: DentistStats) => (
                      <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg">
                              {(d.name || 'D').charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 uppercase text-sm">{d.name || 'Sin nombre'}</p>
                              <p className="text-xs text-gray-400 font-mono">ID: {d.id?.split('-')[0] ?? d.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center font-bold text-gray-600">{d.commission ?? 0}%</td>
                        <td className="p-4 text-right font-semibold text-gray-700">${(d.production ?? 0).toLocaleString('es-CL')}</td>
                        <td className="p-4 text-right font-black text-emerald-600">${(d.liquidToPay ?? 0).toLocaleString('es-CL')}</td>
                        
                        <td className="p-4 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <Link 
                              href={`/liquidaciones/${d.id}?month=${month}&year=${year}`}
                              className="bg-white text-gray-700 border border-gray-300 font-bold px-3 py-2 rounded-lg text-xs uppercase hover:bg-gray-50 transition-colors shadow-sm"
                            >
                              Detalle
                            </Link>

                            {d.status === 'CERRADA' ? (
                              <span className="bg-emerald-100 text-emerald-700 font-bold px-4 py-2 rounded-lg text-xs uppercase cursor-not-allowed">
                                Cerrado
                              </span>
                            ) : (
                              <Link 
                                href={`/liquidaciones/${d.id}?month=${month}&year=${year}`}
                                className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase hover:bg-blue-700 transition-colors shadow-sm"
                              >
                                Pagar
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}