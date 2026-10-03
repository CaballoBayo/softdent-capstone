"use client"

import { useState } from "react"
import { Tooth } from "@/components/Tooth"
import { SurfaceStatus, ToothSurfaces, ToothCondition } from "@/types/clinical"

// Arrays de Nomenclatura FDI
const c1 = [18, 17, 16, 15, 14, 13, 12, 11]; // Permanente Sup. Derecho
const c2 = [21, 22, 23, 24, 25, 26, 27, 28]; // Permanente Sup. Izquierdo
const c3 = [48, 47, 46, 45, 44, 43, 42, 41]; // Permanente Inf. Derecho
const c4 = [31, 32, 33, 34, 35, 36, 37, 38]; // Permanente Inf. Izquierdo

const t1 = [55, 54, 53, 52, 51]; // Temporal Sup. Derecho
const t2 = [61, 62, 63, 64, 65]; // Temporal Sup. Izquierdo
const t3 = [85, 84, 83, 82, 81]; // Temporal Inf. Derecho
const t4 = [71, 72, 73, 74, 75]; // Temporal Inf. Izquierdo

// Función para generar el estado base de todos los dientes
function generateInitialState() {
  const allTeeth = [...c1, ...c2, ...c3, ...c4, ...t1, ...t2, ...t3, ...t4];
  const state: Record<number, { condition: ToothCondition, surfaces: ToothSurfaces }> = {};
  
  allTeeth.forEach(id => {
    state[id] = {
      condition: "SANO",
      surfaces: { vestibular: "SANO", palatine: "SANO", mesial: "SANO", distal: "SANO", oclusal: "SANO" }
    };
  });
  return state;
}

export default function OdontogramaTest() {
  const [isChildView, setIsChildView] = useState(false);
  const [currentTool, setCurrentTool] = useState<SurfaceStatus>("CARIES");
  const [odontogramaState, setOdontogramaState] = useState(generateInitialState());

  const handleSurfaceClick = (toothId: number, surface: keyof ToothSurfaces) => {
    setOdontogramaState(prev => ({
      ...prev,
      [toothId]: {
        ...prev[toothId],
        surfaces: { ...prev[toothId].surfaces, [surface]: currentTool }
      }
    }));
  }

  const handleRootClick = (toothId: number) => {
    setOdontogramaState(prev => ({
      ...prev,
      [toothId]: {
        ...prev[toothId],
        condition: prev[toothId].condition === "SANO" ? "AUSENTE" : "SANO"
      }
    }));
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Odontograma Digital</h1>
          
          {/* Toggle Adulto / Niño */}
          <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button 
              onClick={() => setIsChildView(false)} 
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${!isChildView ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Adulto
            </button>
            <button 
              onClick={() => setIsChildView(true)} 
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${isChildView ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Niño
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Panel de Herramientas */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 w-full lg:w-64 shrink-0">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Herramientas</h2>
            <div className="flex flex-col gap-2">
              <button onClick={() => setCurrentTool("CARIES")} className={`p-2.5 text-sm rounded-xl border transition-all text-left ${currentTool === "CARIES" ? "bg-slate-100 border-slate-500 text-slate-900 font-bold shadow-sm" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}>
                ⚫ Marcar Lesión
              </button>
              <button onClick={() => setCurrentTool("RESTAURACION")} className={`p-2.5 text-sm rounded-xl border transition-all text-left ${currentTool === "RESTAURACION" ? "bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-sm" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}>
                🔵 Restauración
              </button>
              <button onClick={() => setCurrentTool("SELLANTE")} className={`p-2.5 text-sm rounded-xl border transition-all text-left ${currentTool === "SELLANTE" ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold shadow-sm" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}>
                🟢 Prevención
              </button>
              <button onClick={() => setCurrentTool("SANO")} className={`p-2.5 text-sm rounded-xl border transition-all text-left ${currentTool === "SANO" ? "bg-slate-200 border-slate-500 text-slate-800 font-bold shadow-sm" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}>
                ⚪ Borrar / Sano
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-6 leading-relaxed italic">Nota: Haz clic en la raíz (número) para marcar el diente como ausente.</p>
          </div>

          {/* Lienzo del Odontograma */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex-1 w-full overflow-x-auto">
            <div className="min-w-max flex flex-col items-center gap-10">
              
              {/* ARCADA SUPERIOR */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maxilar Superior</span>
                <div className="flex gap-2">
                  <div className="flex gap-0.5 border-r-2 border-slate-200 pr-2">
                    {(!isChildView ? c1 : t1).map(id => (
                      <Tooth 
                        key={id} number={id} 
                        condition={odontogramaState[id].condition} 
                        surfaces={odontogramaState[id].surfaces} 
                        onSurfaceClick={(surface) => handleSurfaceClick(id, surface)}
                        onRootClick={() => handleRootClick(id)}
                      />
                    ))}
                  </div>
                  <div className="flex gap-0.5">
                    {(!isChildView ? c2 : t2).map(id => (
                      <Tooth 
                        key={id} number={id} 
                        condition={odontogramaState[id].condition} 
                        surfaces={odontogramaState[id].surfaces} 
                        onSurfaceClick={(surface) => handleSurfaceClick(id, surface)}
                        onRootClick={() => handleRootClick(id)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100"></div>

              {/* ARCADA INFERIOR */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  <div className="flex gap-0.5 border-r-2 border-slate-200 pr-2">
                    {(!isChildView ? c3 : t3).map(id => (
                      <Tooth 
                        key={id}
                        number={id} 
                        condition={odontogramaState[id].condition} 
                        surfaces={odontogramaState[id].surfaces} 
                        invert={true}
                        onSurfaceClick={(surface) => handleSurfaceClick(id, surface)}
                        onRootClick={() => handleRootClick(id)}
                      />
                    ))}
                  </div>
                  <div className="flex gap-0.5">
                    {(!isChildView ? c4 : t4).map(id => (
                      <Tooth 
                        key={id}
                        number={id} 
                        condition={odontogramaState[id].condition} 
                        surfaces={odontogramaState[id].surfaces} 
                        invert={true}
                        onSurfaceClick={(surface) => handleSurfaceClick(id, surface)}
                        onRootClick={() => handleRootClick(id)}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Mandíbula Inferior</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  )
}