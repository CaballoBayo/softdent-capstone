import Link from 'next/link'
import { prisma } from '@/lib/prisma'

// Definimos la interfaz con los campos opcionales del usuario
interface ProfessionalUser {
  id: string
  name: string | null
  email: string
  role: string
  commission?: number | null
}

export default async function ProfesionalesPage() {
  const profesionales: ProfessionalUser[] = await prisma.user.findMany({
    orderBy: { name: 'asc' },
  })

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Equipo Clínico</h1>
            <p className="text-sm text-slate-500 mt-1">Gestiona los dentistas, recepcionistas y administradores.</p>
          </div>
          <Link
            href="/profesionales/nuevo"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm text-sm"
          >
            + Nuevo Profesional
          </Link>
        </div>

        {/* Tabla de Profesionales */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Nombre</th>
                  <th className="p-4">Correo</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4 pr-6 text-right">Comisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {profesionales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-400 font-medium">
                      No hay profesionales registrados aún.
                    </td>
                  </tr>
                ) : (
                  profesionales.map((prof) => (
                    <tr key={prof.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-800">{prof.name || 'Sin nombre'}</td>
                      <td className="p-4 text-slate-600">{prof.email}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 uppercase">
                          {prof.role || 'DENTISTA'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right font-medium text-slate-600">
                        {prof.commission !== undefined && prof.commission !== null ? `${prof.commission}%` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  )
} 