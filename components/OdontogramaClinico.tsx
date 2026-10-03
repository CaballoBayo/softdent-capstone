"use client"

import { useState } from "react"
import { Tooth } from "@/components/Tooth"
import { SurfaceStatus, ToothSurfaces, ToothCondition } from "@/types/clinical"
import { updateOdontogram } from "@/lib/actions"
import { useRouter } from "next/navigation"

// Tipo estricto para el estado del odontograma (reemplaza 'any')
type OdontogramState = Record<number, { condition: ToothCondition; surfaces: ToothSurfaces }>

const c1 = [18, 17, 16, 15, 14, 13, 12, 11]; 
const c2 = [21, 22, 23, 24, 25, 26, 27, 28]; 
const c3 = [48, 47, 46, 45, 44, 43, 42, 41]; 
const c4 = [31, 32, 33, 34, 35, 36, 37, 38]; 
const t1 = [55, 54, 53, 52, 51]; 
const t2 = [61, 62, 63, 64, 65]; 
const t3 = [85, 84, 83, 82, 81]; 
const t4 = [71, 72, 73, 74, 75]; 

function generateInitialState(): OdontogramState {
  const allTeeth = [...c1, ...c2, ...c3, ...c4, ...t1, ...t2, ...t3, ...t4];
  const state: OdontogramState = {};
  allTeeth.forEach(id => {
    state[id] = { condition: "SANO", surfaces: { vestibular: "SANO", palatine: "SANO", mesial: "SANO", distal: "SANO", oclusal: "SANO" } };
  });
  return state;
}

interface Props {
  patientId: string;
  initialData?: OdontogramState;
}

export function OdontogramaClinico({ patientId, initialData }: Props) {
  const router = useRouter();
  const [isChildView, setIsChildView] = useState(false);
  const [currentTool, setCurrentTool] = useState<SurfaceStatus>("CARIES");
  const [isSaving, setIsSaving] = useState(false);
  
  const [odontogramaState, setOdontogramaState] = useState<OdontogramState>(
    initialData && Object.keys(initialData).length > 0 ? initialData : generateInitialState()
  );

  const handleSurfaceClick = (toothId: number, surface: keyof ToothSurfaces) => {
    setOdontogramaState((prev) => ({
      ...prev,
      [toothId]: { ...prev[toothId], surfaces: { ...prev[toothId].surfaces, [surface]: currentTool } }
    }));
  }

  const handleRootClick = (toothId: number) => {
    setOdontogramaState((prev) => ({
      ...prev,
      [toothId]: { ...prev[toothId], condition: prev[toothId].condition === "SANO" ? "AUSENTE" : "SANO" }
    }));
  }

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateOdontogram(patientId, odontogramaState);
    if (result.success) {
      alert("Odontograma guardado correctamente");
      router.refresh();
    } else {
      alert(result.error);
    }
    setIsSaving(false);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 mt-6 items-start">
      {/* Panel de Herramientas */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 w-full lg:w-64 shrink-0">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Herramientas</h2>
        <div className="flex flex-col gap-2">
          <button onClick={() => setCurrentTool("CARIES")} className={`p-2.5 text-sm rounded-xl border transition-all text-left ${currentTool === "CARIES" ? "bg-slate-100 border-slate-500 text-slate-900 font-bold shadow-sm" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}>⚫ Lesión / Caries</button>
          <button onClick={() => setCurrentTool("RESTAURACION")} className={`p-2.5 text-sm rounded-xl border transition-all text-left ${currentTool === "RESTAURACION" ? "bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-sm" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}>🔵 Restauración</button>
          <button onClick={() => setCurrentTool("SELLANTE")} className={`p-2.5 text-sm rounded-xl border transition-all text-left ${currentTool === "SELLANTE" ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold shadow-sm" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}>🟢 Preventivo</button>
          <button onClick={() => setCurrentTool("FRACTURA")} className={`p-2.5 text-sm rounded-xl border transition-all text-left ${currentTool === "FRACTURA" ? "bg-red-50 border-red-500 text-red-700 font-bold shadow-sm" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}>🔴 Fractura</button>
          <button onClick={() => setCurrentTool("SANO")} className={`p-2.5 text-sm rounded-xl border transition-all text-left ${currentTool === "SANO" ? "bg-slate-200 border-slate-500 text-slate-800 font-bold shadow-sm" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}>⚪ Sano (Borrar)</button>
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="mt-6 w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow-sm"
        >
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      {/* Lienzo del Odontograma */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex-1 w-full overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800 text-lg">Estado Dental</h3>
          <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button onClick={() => setIsChildView(false)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${!isChildView ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Adulto</button>
            <button onClick={() => setIsChildView(true)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${isChildView ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Niño</button>
          </div>
        </div>

        <div className="min-w-max flex flex-col items-center gap-10">
          <div className="flex gap-2">
            <div className="flex gap-0.5 border-r-2 border-slate-200 pr-2">
              {(!isChildView ? c1 : t1).map(id => (
                <Tooth key={id} number={id} condition={odontogramaState[id].condition} surfaces={odontogramaState[id].surfaces} onSurfaceClick={(s) => handleSurfaceClick(id, s)} onRootClick={() => handleRootClick(id)}/>
              ))}
            </div>
            <div className="flex gap-0.5">
              {(!isChildView ? c2 : t2).map(id => (
                <Tooth key={id} number={id} condition={odontogramaState[id].condition} surfaces={odontogramaState[id].surfaces} onSurfaceClick={(s) => handleSurfaceClick(id, s)} onRootClick={() => handleRootClick(id)}/>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-slate-100"></div>

          <div className="flex gap-2">
            <div className="flex gap-0.5 border-r-2 border-slate-200 pr-2">
              {(!isChildView ? c3 : t3).map(id => (
                <Tooth key={id} number={id} condition={odontogramaState[id].condition} surfaces={odontogramaState[id].surfaces} invert={true} onSurfaceClick={(s) => handleSurfaceClick(id, s)} onRootClick={() => handleRootClick(id)}/>
              ))}
            </div>
            <div className="flex gap-0.5">
              {(!isChildView ? c4 : t4).map(id => (
                <Tooth key={id} number={id} condition={odontogramaState[id].condition} surfaces={odontogramaState[id].surfaces} invert={true} onSurfaceClick={(s) => handleSurfaceClick(id, s)} onRootClick={() => handleRootClick(id)}/>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}