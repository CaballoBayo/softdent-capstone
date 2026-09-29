"use server"

import { prisma } from "./prisma"
import { OdontogramData } from "@/types/clinical"

// --- VALIDACIONES DE UNICIDAD Y VERIFICACIONES EN TIEMPO REAL ---

export async function checkRutExists(rut: string, excludeId?: string) {
  try {
    const patient = await prisma.patient.findFirst({
      where: {
        rut: rut,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return { exists: !!patient };
  } catch (error) {
    return { exists: false };
  }
}

export async function checkPatientEmailExists(email: string, excludeId?: string) {
  try {
    const patient = await prisma.patient.findFirst({
      where: {
        email: email,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return { exists: !!patient };
  } catch (error) {
    return { exists: false };
  }
}

export async function checkPhoneExists(phone: string, excludeId?: string) {
  try {
    const patient = await prisma.patient.findFirst({
      where: {
        phone: phone,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return { exists: !!patient };
  } catch (error) {
    return { exists: false };
  }
}

export async function checkEmailExists(email: string, excludeId?: string) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return { exists: !!user };
  } catch (error) {
    return { exists: false };
  }
}

// --- PACIENTES ---

export async function createPatient(data: {
  rut: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}) {
  try {
    const newPatient = await prisma.patient.create({
      data: {
        rut: data.rut,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        odontogram: {} 
      }
    });
    
    return { success: true, patient: newPatient };
  } catch (error) {
    console.error("Error al crear paciente:", error);
    return { success: false, error: "No se pudo registrar el paciente. Verifique los datos o si ya existe." };
  }
}

export async function updateOdontogram(patientId: string, odontogramData: OdontogramData) {
  try {
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        odontogram: odontogramData as any 
      }
    });
    
    return { success: true, patient: updatedPatient };
  } catch (error) {
    console.error("Error al actualizar odontograma:", error);
    return { success: false, error: "No se pudo actualizar el odontograma clínico." };
  }
}

// --- AGENDA Y CITAS ---

export async function getAppointments(startDate: Date, endDate: Date, dentistId?: string) {
  try {
    const whereClause: any = {
      date: { gte: startDate, lte: endDate }
    };
    
    // Si se pasa un dentista específico, filtramos, si no, traemos todos (para la vista general)
    if (dentistId) {
      whereClause.dentistId = dentistId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, rut: true } },
        dentist: { select: { id: true, name: true } }
      },
      orderBy: { date: 'asc' }
    });

    return { success: true, appointments };
  } catch (error) {
    console.error("Error al cargar citas:", error);
    return { success: false, error: "No se pudieron cargar las citas." };
  }
}

export async function createAppointment(data: {
  date: Date;
  patientId: string;
  dentistId: string;
  duration: number;
  notes?: string;
}) {
  try {
    // Validación básica: evitar agendar en el pasado
    if (data.date < new Date()) {
      return { success: false, error: "No puedes agendar citas en el pasado." };
    }

    const newAppointment = await prisma.appointment.create({
      data: {
        date: data.date,
        duration: data.duration,
        notes: data.notes,
        patientId: data.patientId,
        dentistId: data.dentistId,
        status: "AGENDADO",
      }
    });
    
    return { success: true, appointment: newAppointment };
  } catch (error) {
    console.error("Error al crear cita:", error);
    return { success: false, error: "No se pudo agendar la cita. Verifique los datos." };
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  try {
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status }
    });
    return { success: true, appointment: updated };
  } catch (error) {
    return { success: false, error: "Error al actualizar el estado de la cita." };
  }
}

export async function deleteAppointment(appointmentId: string) {
  try {
    await prisma.appointment.delete({ where: { id: appointmentId } });
    return { success: true };
  } catch (error) {
    return { success: false, error: "No se pudo cancelar la cita." };
  }
}

// --- PRESUPUESTOS Y ARANCELES ---

export async function createBudget(data: {
  patientId: string;
  dentistId: string;
  items: { treatmentId: string, tooth: number | null, price: number }[];
}) {
  try {
    const total = data.items.reduce((sum, item) => sum + item.price, 0);

    const budget = await prisma.budget.create({
      data: {
        patientId: data.patientId,
        dentistId: data.dentistId,
        total: total,
        items: {
          create: data.items.map(item => ({
            treatmentId: item.treatmentId,
            tooth: item.tooth,
            price: item.price
          }))
        }
      }
    });
    
    return { success: true, budget };
  } catch (error) {
    console.error("Error al crear presupuesto:", error);
    return { success: false, error: "No se pudo generar el presupuesto clínico." };
  }
}

// --- CATÁLOGO DE ARANCELES (TRATAMIENTOS) ---

export async function createTreatment(data: {
  name: string;
  price: number;
  category: string;
}) {
  try {
    const newTreatment = await prisma.treatment.create({
      data: {
        name: data.name,
        price: data.price,
        category: data.category
      }
    });
    return { success: true, treatment: newTreatment };
  } catch (error) {
    console.error("Error al crear tratamiento:", error);
    return { success: false, error: "No se pudo crear el tratamiento." };
  }
}

export async function deleteTreatment(id: string) {
  try {
    await prisma.treatment.delete({
      where: { id }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "No se puede eliminar porque ya está asociado a un presupuesto existente." };
  }
}

// --- PAGOS Y CAJA ---

export async function registerPayment(data: {
  budgetId: string;
  amount: number;
  method: string;
}) {
  try {
    const payment = await prisma.payment.create({
      data: {
        budgetId: data.budgetId,
        amount: data.amount,
        method: data.method
      }
    });

    const budget = await prisma.budget.findUnique({
      where: { id: data.budgetId }
    });

    if (budget) {
      const newPaidAmount = budget.paid + data.amount;
      const newStatus = newPaidAmount >= budget.total ? "PAGADO" : "APROBADO";

      await prisma.budget.update({
        where: { id: data.budgetId },
        data: { 
          paid: newPaidAmount,
          status: newStatus
        }
      });
    }

    return { success: true, payment };
  } catch (error) {
    console.error("Error al registrar pago:", error);
    return { success: false, error: "No se pudo procesar el pago en caja." };
  }
}

// --- LIQUIDACIONES Y EXCEL ---

export async function getPayrollDetails(dentistId: string, month: number, year: number) {
  try {
    const periodStr = `${year}-${month.toString().padStart(2, '0')}`;
    const existingPayroll = await prisma.payroll.findFirst({
      where: { dentistId, period: periodStr }
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = existingPayroll?.closedAt ? existingPayroll.closedAt : new Date(year, month, 1);

    const dentist = await prisma.user.findUnique({ where: { id: dentistId } });
    if (!dentist) throw new Error("Dentista no encontrado");

    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: startDate, lt: endDate },
        budget: { dentistId: dentistId }
      },
      include: { 
        budget: { 
          include: { 
            patient: true,
            items: { include: { treatment: true } }
          } 
        } 
      },
      orderBy: { createdAt: 'asc' }
    });

    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const doctorCut = Math.round(totalCollected * (dentist.commission / 100));

    const formattedPayments = payments.map(p => {
      const treatmentNames = p.budget.items.map(item => item.treatment.name).join(", ");
      const finalTreatments = treatmentNames.length > 0 ? treatmentNames : "Abono general";

      return {
        id: p.id,
        date: p.createdAt,
        patientName: `${p.budget.patient.firstName} ${p.budget.patient.lastName}`,
        patientRut: p.budget.patient.rut,
        treatments: finalTreatments,
        amount: p.amount,
        method: p.method,
        doctorEarned: Math.round(p.amount * (dentist.commission / 100))
      }
    });

    return {
      success: true,
      status: existingPayroll?.status || "BORRADOR",
      closedAt: existingPayroll?.closedAt,
      periodStr,
      dentistName: dentist.name,
      commissionRate: dentist.commission,
      totalCollected,
      doctorCut,
      payments: formattedPayments
    };
  } catch (error) {
    return { success: false, error: "Error al obtener detalles de la liquidación." };
  }
}

export async function closePayrollAction(dentistId: string, month: number, year: number, doctorCut: number) {
  try {
    const periodStr = `${year}-${month.toString().padStart(2, '0')}`;
    const existing = await prisma.payroll.findFirst({ where: { dentistId, period: periodStr } });

    if (existing?.status === "CERRADA") {
      return { success: false, error: "Esta liquidación ya fue cerrada." };
    }

    const now = new Date();

    if (existing) {
      await prisma.payroll.update({
        where: { id: existing.id },
        data: { status: "CERRADA", closedAt: now, totalPaid: doctorCut }
      });
    } else {
      await prisma.payroll.create({
        data: {
          dentistId, period: periodStr, totalPaid: doctorCut,
          status: "CERRADA", closedAt: now
        }
      });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al realizar el corte." };
  }
}

export async function getDashboardStats(month: number, year: number) {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    const periodStr = `${year}-${month.toString().padStart(2, '0')}`;

    const dentists = await prisma.user.findMany({ where: { role: "DENTISTA" } });

    let totalProduction = 0;
    let totalPending = 0;

    const dentistStats = await Promise.all(dentists.map(async (dentist) => {
      const payroll = await prisma.payroll.findFirst({
        where: { dentistId: dentist.id, period: periodStr }
      });

      const actualEndDate = payroll?.closedAt ? payroll.closedAt : endDate;

      const payments = await prisma.payment.findMany({
        where: {
          createdAt: { gte: startDate, lt: actualEndDate },
          budget: { dentistId: dentist.id }
        }
      });

      const production = payments.reduce((sum, p) => sum + p.amount, 0);
      const liquidToPay = Math.round(production * (dentist.commission / 100));

      totalProduction += production;
      totalPending += liquidToPay;

      return {
        id: dentist.id,
        name: dentist.name,
        commission: dentist.commission,
        production,
        liquidToPay,
        status: payroll?.status || "BORRADOR"
      };
    }));

    dentistStats.sort((a, b) => b.production - a.production);

    return {
      success: true,
      global: {
        totalProduction,
        totalPending,
        netMargin: totalProduction - totalPending
      },
      dentists: dentistStats
    };
  } catch (error) {
    return { success: false, error: "Error al cargar las estadísticas del mes." };
  }
}

export async function createProfessional(data: {
  name: string;
  email: string;
  role: 'ADMIN' | 'DENTISTA' | 'RECEPCIONISTA';
  commission?: number;
}) {
  try {
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        commission: data.commission ?? 0, 
      }
    });
    
    return { success: true, user: newUser };
  } catch (error) {
    console.error("Error al crear profesional:", error);
    
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return { success: false, error: "Ya existe un profesional con ese correo electrónico." };
    }
    
    return { success: false, error: "No se pudo registrar el profesional." };
  }
}

export async function getProfessionals() {
  try {
    const professionals = await prisma.user.findMany({
      orderBy: { name: 'asc' }
    });
    
    return { success: true, professionals };
  } catch (error) {
    console.error("Error al cargar profesionales:", error);
    return { success: false, error: "No se pudieron cargar los profesionales." };
  }
}