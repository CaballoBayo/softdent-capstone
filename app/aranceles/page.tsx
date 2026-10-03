import { prisma } from "@/lib/prisma"
import { TreatmentManager } from "@/components/TreatmentManager"

export default async function ArancelesPage() {
  // Obtenemos todos los tratamientos desde PostgreSQL
  const treatments = await prisma.treatment.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Catálogo de Prestaciones</h1>
        <p className="text-gray-500 mt-2">Gestiona los aranceles y agrúpalos por categorías clínicas.</p>
      </div>

      <TreatmentManager initialTreatments={treatments} />
    </div>
  );
} 