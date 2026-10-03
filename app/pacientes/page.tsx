import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PatientForm } from "@/components/PatientForm"
import { TogglePatientButton } from "@/components/TogglePatientButton"
import { Patient } from "@prisma/client"

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams)?.q?.trim() || "";
  const cleanSearchRut = query.replace(/[^0-9kK]/g, "").toUpperCase();

  const whereCondition = query
    ? {
        OR: [
          ...(cleanSearchRut ? [{ rut: { contains: cleanSearchRut } }] : []),
          { firstName: { contains: query, mode: "insensitive" as const } },
          { lastName: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const pacientes: Patient[] = await prisma.patient.findMany({
    where: whereCondition,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6 md:p-10 space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Directorio de Pacientes</h1>
      </div>

      {/* Formulario para registrar paciente */}
      <PatientForm />

      {/* Buscador */}
      <div className="my-6">
        <form method="GET" className="flex gap-2 max-w-lg">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Buscar por RUT, Nombre o Apellido..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-400 font-semibold shadow-sm"
          />
          {query && (
            <Link
              href="/pacientes"
              className="px-4 py-2.5 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors flex items-center text-sm font-bold"
            >
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {/* Tabla con la lista de pacientes en alto contraste */}
      <div className="w-full bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
        <table className="w-full divide-y divide-gray-200 text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider">RUT</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider">Previsión</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider">Contacto</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pacientes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 font-semibold">
                  {query ? "No se encontraron pacientes que coincidan con la búsqueda." : "No hay pacientes registrados aún."}
                </td>
              </tr>
            ) : (
              pacientes.map((p: Patient) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 font-bold">{p.rut}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-extrabold">{p.firstName} {p.lastName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">{p.prevision}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                    <div className="font-bold text-gray-900">{p.phone || "-"}</div>
                    <div className="text-xs text-gray-500">{p.email || ""}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {/* Componente del botón para conmutar Activo / Inactivo */}
                    <TogglePatientButton patientId={p.id} active={p.active} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Link
                      href={`/pacientes/${p.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors font-bold text-xs shadow-sm"
                    >
                      Ver Ficha →
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