import { prisma } from "@/lib/prisma"
import { AppointmentModal } from "@/components/AppointmentModal"
import Link from "next/link"

// Función para asegurar formato YYYY-MM-DD correcto
function formatDateForURL(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generador dinámico de bloques de 15 minutos
function generateTimeBlocks() {
  const blocks = [];
  let currentHour = 9;
  let currentMinute = 0;

  while (currentHour <= 18) {
    blocks.push(`${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
    currentMinute += 15;
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour += 1;
    }
  }
  return blocks;
}

export default async function AgendaPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ date?: string }> 
}) {
  const { date } = await searchParams;

  // 1. Configuramos el "Día Seleccionado" leyendo la URL o usando hoy por defecto
  const selectedDate = date ? new Date(date + "T00:00:00") : new Date();
  selectedDate.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(selectedDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 2. Calculamos los días para los botones Anterior/Siguiente
  const prevDay = new Date(selectedDate);
  prevDay.setDate(prevDay.getDate() - 1);
  
  const nextDay = new Date(selectedDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const [appointments, patients, dentists] = await Promise.all([
    prisma.appointment.findMany({
      where: { date: { gte: selectedDate, lt: tomorrow } },
      include: { patient: true, dentist: true },
      orderBy: { date: 'asc' }
    }),
    prisma.patient.findMany({
      select: { id: true, firstName: true, lastName: true, rut: true },
      orderBy: { lastName: 'asc' }
    }),
    prisma.user.findMany({
      where: { role: 'DENTISTA' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
  ]);

  const timeBlocks = generateTimeBlocks();
  const isToday = formatDateForURL(selectedDate) === formatDateForURL(new Date());

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Cabecera con Controles de Navegación */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Agenda Diaria</h1>
          
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <Link 
              href={`/agenda?date=${formatDateForURL(prevDay)}`}
              className="px-4 py-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600 font-bold text-sm"
            >
              ← Anterior
            </Link>
            
            <div className="flex flex-col items-center min-w-[220px]">
              <span className="text-sm font-bold text-slate-700 capitalize">
                {selectedDate.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              {isToday ? (
                <span className="text-[10px] bg-blue-100 text-blue-700 font-black uppercase px-2 py-0.5 rounded-full mt-1">Hoy</span>
              ) : (
                <Link href="/agenda" className="text-[10px] text-blue-600 hover:underline font-bold mt-1">Volver a Hoy</Link>
              )}
            </div>

            <Link 
              href={`/agenda?date=${formatDateForURL(nextDay)}`}
              className="px-4 py-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600 font-bold text-sm"
            >
              Siguiente →
            </Link>
          </div>
        </div>
        
        {/* Grilla de Citas Ancha */}
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-slate-200">
          <div className="grid grid-cols-1 divide-y divide-slate-100">
            {timeBlocks.map((time) => {
              const [blockHour, blockMin] = time.split(':').map(Number);
              const blockTime = new Date(selectedDate);
              blockTime.setHours(blockHour, blockMin, 0, 0);
              
              const overlappingAppt = appointments.find(appt => {
                const start = new Date(appt.date);
                const end = new Date(start.getTime() + appt.duration * 60000);
                return blockTime >= start && blockTime < end;
              });

              const isStartOfAppt = overlappingAppt && new Date(overlappingAppt.date).getTime() === blockTime.getTime();

              return (
                <div key={time} className="flex hover:bg-slate-50/80 transition-colors h-14">
                  <div className="w-28 px-4 font-semibold text-xs text-slate-500 border-r border-slate-100 flex items-center justify-center bg-slate-50/50 shrink-0">
                    {time}
                  </div>
                  
                  <div className="flex-1 p-1">
                    {overlappingAppt ? (
                      <div className={`h-full flex items-center px-4 transition-all
                        ${overlappingAppt.status === 'NO_ASISTE' ? 'bg-red-50 border-x-4 border-red-500 opacity-70' : 'bg-blue-50 border-x-4 border-blue-500'}
                        ${isStartOfAppt ? 'rounded-t-md pt-2' : ''} 
                        ${blockTime.getTime() === (new Date(overlappingAppt.date).getTime() + (overlappingAppt.duration - 15) * 60000) ? 'rounded-b-md pb-2' : ''}
                      `}>
                        {isStartOfAppt && (
                          <div className="flex justify-between w-full items-center">
                            <div>
                              <span className={`font-bold mr-2 text-sm ${overlappingAppt.status === 'NO_ASISTE' ? 'text-red-900 line-through' : 'text-blue-900'}`}>
                                {overlappingAppt.patient.firstName} {overlappingAppt.patient.lastName}
                              </span>
                              <span className={`text-xs ${overlappingAppt.status === 'NO_ASISTE' ? 'text-red-700' : 'text-blue-700'}`}>
                                Dr. {overlappingAppt.dentist.name} ({overlappingAppt.duration} min)
                              </span>
                              {overlappingAppt.notes && (
                                <span className="ml-2 text-xs italic text-slate-500">• {overlappingAppt.notes}</span>
                              )}
                            </div>
                            
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider
                              ${overlappingAppt.status === 'AGENDADO' ? 'bg-blue-100 text-blue-800' : ''}
                              ${overlappingAppt.status === 'EN_SALA' || overlappingAppt.status === 'EN_ESPERA' ? 'bg-amber-100 text-amber-800' : ''}
                              ${overlappingAppt.status === 'ATENDIDO' || overlappingAppt.status === 'EN_BOX' ? 'bg-emerald-100 text-emerald-800' : ''}
                              ${overlappingAppt.status === 'NO_ASISTE' ? 'bg-red-100 text-red-800' : ''}
                            `}>
                              {overlappingAppt.status}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full">
                        <AppointmentModal timeBlock={time} date={selectedDate} patients={patients} dentists={dentists} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </main>
  );
}