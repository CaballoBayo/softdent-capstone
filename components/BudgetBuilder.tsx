"use client"

import { useState } from "react"
import { createBudget } from "@/lib/actions"
import { useRouter } from "next/navigation"

// Tipos de datos que recibimos desde el servidor
interface Treatment {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface BudgetBuilderProps {
  patientId: string;
  dentists: { id: string, name: string }[];
  treatments: Treatment[];
}

export function BudgetBuilder({ patientId, dentists, treatments }: BudgetBuilderProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Estado para construir el presupuesto
  const [dentistId, setDentistId] = useState(dentists[0]?.id || "")
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("")
  const [selectedTooth, setSelectedTooth] = useState("")
  const [cart, setCart] = useState<{ treatment: Treatment, tooth: number | null }[]>([])

  // Agregar ítem a la lista temporal
  const handleAddToCart = () => {
    if (!selectedTreatmentId) return;
    const treatment = treatments.find(t => t.id === selectedTreatmentId);
    if (!treatment) return;

    const toothNumber = selectedTooth ? parseInt(selectedTooth) : null;
    
    setCart([...cart, { treatment, tooth: toothNumber }]);
    
    // Limpiamos los selectores para el próximo ítem
    setSelectedTreatmentId("");
    setSelectedTooth("");
  }

  // Quitar ítem de la lista
  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  }

  // Guardar el presupuesto en PostgreSQL
  const handleSaveBudget = async () => {
    if (cart.length === 0 || !dentistId) return;
    setLoading(true);

    // Preparamos los datos según la estructura que espera la Action
    const itemsToSave = cart.map(item => ({
      treatmentId: item.treatment.id,
      tooth: item.tooth,
      price: item.treatment.price
    }));

    const result = await createBudget({
      patientId,
      dentistId,
      items: itemsToSave
    });

    if (result.success) {
      alert("Presupuesto guardado exitosamente");
      setCart([]); // Vaciamos el carrito
      router.refresh(); // Recargamos para ver el nuevo presupuesto en pantalla
    } else {
      alert(result.error);
    }
    setLoading(false);
  }

  const total = cart.reduce((sum, item) => sum + item.treatment.price, 0);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mt-8 w-full">
      <h3 className="font-bold text-gray-800 text-xl mb-6">Generar Nuevo Presupuesto</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="col-span-1">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Dentista
          </label>
          <select 
            value={dentistId} 
            onChange={(e) => setDentistId(e.target.value)}
            className="w-full bg-white border border-gray-300 p-2.5 rounded-xl text-gray-900 font-semibold outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          >
            {dentists.map(d => (
              <option key={d.id} value={d.id} className="text-gray-900">
                Dr. {d.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="col-span-2">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Catálogo de Prestaciones
          </label>
          <select 
            value={selectedTreatmentId} 
            onChange={(e) => setSelectedTreatmentId(e.target.value)}
            className="w-full bg-white border border-gray-300 p-2.5 rounded-xl text-gray-900 font-semibold outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          >
            <option value="" className="text-gray-500">Seleccionar tratamiento...</option>
            {treatments.map(t => (
              <option key={t.id} value={t.id} className="text-gray-900">
                {t.name} - ${t.price.toLocaleString('es-CL')}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Pieza (Opcional)
          </label>
          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder="Ej: 18"
              value={selectedTooth}
              onChange={(e) => setSelectedTooth(e.target.value)}
              className="w-full bg-white border border-gray-300 p-2.5 rounded-xl text-gray-900 placeholder:text-gray-400 font-semibold outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
            <button 
              onClick={handleAddToCart}
              disabled={!selectedTreatmentId}
              className="bg-blue-600 text-white px-5 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-sm"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Tabla del Carrito */}
      {cart.length > 0 && (
        <div className="mt-6 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-100 border-b border-gray-200 text-xs text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="p-4 font-bold">Tratamiento</th>
                <th className="p-4 font-bold text-center">Pieza</th>
                <th className="p-4 font-bold text-right">Precio</th>
                <th className="p-4 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cart.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm font-bold text-gray-900">{item.treatment.name}</td>
                  <td className="p-4 text-sm font-semibold text-gray-600 text-center">{item.tooth || 'General'}</td>
                  <td className="p-4 text-sm font-bold text-gray-900 text-right">${item.treatment.price.toLocaleString('es-CL')}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleRemoveFromCart(idx)} className="text-red-500 hover:text-red-700 font-black px-2 py-1 rounded transition-colors">X</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-blue-50 border-t border-blue-100">
              <tr>
                <td colSpan={2} className="p-4 text-sm font-extrabold text-blue-900 text-right uppercase">Total Plan:</td>
                <td className="p-4 text-lg font-black text-blue-700 text-right">${total.toLocaleString('es-CL')}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          <div className="p-4 bg-white border-t border-gray-200 flex justify-end">
            <button 
              onClick={handleSaveBudget}
              disabled={loading}
              className="bg-emerald-600 text-white font-black px-6 py-3 rounded-xl uppercase text-sm hover:bg-emerald-700 disabled:bg-gray-300 transition-colors shadow-sm"
            >
              {loading ? "Guardando..." : "Emitir Presupuesto"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}