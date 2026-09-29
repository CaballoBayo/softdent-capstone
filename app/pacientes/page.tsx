import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PatientForm } from "@/components/PatientForm"

export default async function PacientesPage() {
  const pacientes = await prisma.patient.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Directorio de Pacientes</h1>
      
      <PatientForm />
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RUT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pacientes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No hay pacientes registrados aún.
                </td>
              </tr>
            ) : (
              pacientes.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{p.rut}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{p.firstName} {p.lastName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{p.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{p.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link 
                      href={`/pacientes/${p.id}`}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors text-sm font-semibold"
                    >
                      Ver Ficha
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}