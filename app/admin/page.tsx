import { prisma } from "@/lib/prisma"
import { MasterTable } from "@/components/admin/MasterTable"

export default async function AdminPage() {
  const [
    specialties,
    boxes,
    insurances,
    paymentMethods,
    appointmentTypes,
    categories,
    parameters,
  ] = await Promise.all([
    prisma.specialty.findMany({ orderBy: { name: "asc" } }),
    prisma.box.findMany({ orderBy: { name: "asc" } }),
    prisma.healthInsurance.findMany({ orderBy: { name: "asc" } }),
    prisma.paymentMethod.findMany({ orderBy: { name: "asc" } }),
    prisma.appointmentType.findMany({ orderBy: { name: "asc" } }),
    prisma.procedureCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.systemParameter.findMany({ orderBy: { key: "asc" } }),
  ])

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Módulo 5.1: Administración</h1>
        <p className="text-gray-600 mt-1">
          Gestión de datos maestros, catálogos clínicos y parámetros globales del sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MasterTable
          catalogKey="specialty"
          title="Especialidades"
          subtitle="Consumido por Profesionales y Prestaciones"
          items={specialties}
          showDescription
        />

        <MasterTable
          catalogKey="box"
          title="Boxes de Atención"
          subtitle="Espacios físicos consumidos por la Agenda"
          items={boxes}
        />

        <MasterTable
          catalogKey="healthInsurance"
          title="Previsiones y Convenios"
          subtitle="Consumido por Pacientes, Aranceles y FONASA"
          items={insurances}
        />

        <MasterTable
          catalogKey="paymentMethod"
          title="Métodos de Pago"
          subtitle="Formas de pago aceptadas en Caja"
          items={paymentMethods}
        />

        <MasterTable
          catalogKey="appointmentType"
          title="Tipos de Atención"
          subtitle="Clasificación de citas en Agenda"
          items={appointmentTypes}
        />

        <MasterTable
          catalogKey="procedureCategory"
          title="Categorías de Prestaciones"
          subtitle="Agrupación de aranceles y reportes"
          items={categories}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Parámetros del Sistema</h2>
          <p className="text-sm text-gray-500">Variables de configuración institucional y operativa.</p>
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Parámetro (Key)</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Descripción</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Valor Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {parameters.map((param) => (
                <tr key={param.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-blue-700">{param.key}</td>
                  <td className="px-4 py-3 text-gray-600">{param.description}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{param.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}