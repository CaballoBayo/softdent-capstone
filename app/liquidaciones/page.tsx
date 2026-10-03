import { PayrollDashboard } from "@/components/PayrollDashboard"

export default function LiquidacionesPage() {
  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Cierre de Caja</h1>
        <p className="text-gray-500 mt-2">Visión global de producción clínica, rendimientos médicos y pagos.</p>
      </div>
      
      <PayrollDashboard />
    </div>
  );
}