"use server";

import { revalidatePath } from "next/cache";
import { Prisma, Patient } from "@prisma/client";
import { prisma } from "./prisma";
import { cleanAndValidateRut, PatientFormData } from "./schemas";

// --- TIPOS DE RETORNO PARA PACIENTES ---
export type PatientActionResult =
  | { success: true; patient?: Patient }
  | { 
      success: false; 
      error: string; 
      isInactive?: boolean; 
      existingPatient?: Patient | null 
    };

// --- VALIDACIONES Y PACIENTES (PUNTO 4.2) ---

export async function checkRutExists(rut: string, excludeId?: string) {
  try {
    const { formatted } = cleanAndValidateRut(rut);
    const patient = await prisma.patient.findFirst({
      where: {
        rut: formatted || rut,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return { exists: !!patient, patient };
  } catch {
    return { exists: false, patient: null };
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
  } catch {
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
  } catch {
    return { exists: false };
  }
}

// Detección de duplicados probables por coincidencia de nombre/apellido
export async function checkDuplicatePatient(firstName: string, lastName: string, birthDate?: string) {
  try {
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    const duplicates = await prisma.patient.findMany({
      where: {
        OR: [
          // Coincidencia por Nombre Y Apellido
          {
            AND: [
              { firstName: { contains: cleanFirstName, mode: "insensitive" } },
              { lastName: { contains: cleanLastName, mode: "insensitive" } },
            ],
          },
          // Coincidencia por Fecha de Nacimiento (si viene especificada)
          ...(birthDate
            ? [
                {
                  birthDate: new Date(birthDate),
                },
              ]
            : []),
        ],
      },
      select: {
        id: true,
        rut: true,
        firstName: true,
        lastName: true,
        birthDate: true,
      },
    });

    return { success: true, duplicates };
  } catch (error) {
    console.error("Error al comprobar duplicados:", error);
    return { success: false, duplicates: [] };
  }
}

// Unica función createPatient con reglas del Punto 4.2 + soporte para Zod / React Hook Form
export async function createPatient(data: PatientFormData): Promise<PatientActionResult> {
  try {
    // 1. Normalizar RUT usando la función limpia de schemas.ts
    const { formatted: normalizedRut } = cleanAndValidateRut(data.rut);

    // 2. Verificar si el RUT ya existe en la base de datos
    const existingPatient = await prisma.patient.findUnique({
      where: { rut: normalizedRut },
    });

    if (existingPatient) {
      if (existingPatient.active) {
        return {
          success: false,
          error: `El RUT ya pertenece al paciente activo: ${existingPatient.firstName} ${existingPatient.lastName}.`,
          existingPatient,
        };
      } else {
        return {
          success: false,
          isInactive: true,
          error: `El RUT pertenece a un paciente inactivo (${existingPatient.firstName} ${existingPatient.lastName}). ¿Deseas reactivarlo?`,
          existingPatient,
        };
      }
    }

    // 3. Crear nuevo paciente con RUT normalizado
    const newPatient = await prisma.patient.create({
      data: {
        rut: normalizedRut,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        prevision: data.prevision,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        active: true,
      },
    });

    revalidatePath("/pacientes");
    return { success: true, patient: newPatient };
  } catch (error) {
    console.error("Error al crear paciente:", error);
    return { success: false, error: "No se pudo registrar el paciente." };
  }
}

// Server Action para Reactivar Paciente
export async function reactivatePatient(patientId: string) {
  try {
    await prisma.patient.update({
      where: { id: patientId },
      data: { active: true },
    });
    revalidatePath("/pacientes");
    revalidatePath(`/pacientes/${patientId}`);
    return { success: true };
  } catch (error) {
    console.error("Error al reactivar paciente:", error);
    return { success: false, error: "No se pudo reactivar el paciente." };
  }
}

// Desactivar / Activar Paciente (Sin eliminación física)
export async function togglePatientActiveStatus(patientId: string, active: boolean) {
  try {
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: { active },
    });
    revalidatePath("/pacientes");
    return { success: true, patient: updatedPatient };
  } catch (error) {
    console.error("Error al cambiar estado del paciente:", error);
    return { success: false, error: "No se pudo actualizar el estado del paciente." };
  }
}

// Editar datos del paciente
export async function updatePatient(patientId: string, data: PatientFormData): Promise<PatientActionResult> {
  try {
    const { formatted: normalizedRut } = cleanAndValidateRut(data.rut);
    const birthDateParsed = data.birthDate ? new Date(data.birthDate) : null;

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        rut: normalizedRut || data.rut,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        prevision: data.prevision,
        birthDate: birthDateParsed,
      },
    });

    revalidatePath("/pacientes");
    revalidatePath(`/pacientes/${patientId}`);
    return { success: true, patient: updatedPatient };
  } catch (error) {
    console.error("Error en updatePatient:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error al actualizar el paciente" 
    };
  }
}

// --- AGENDA ---

interface CreateAppointmentInput {
  patientId: string;
  dentistId?: string;
  doctorId?: string;
  professionalId?: string;
  date: string | Date;
  reason?: string;
  status?: string;
}

export async function createAppointment(data: CreateAppointmentInput) {
  try {
    const dentistId = data.dentistId || data.doctorId || data.professionalId;

    const appointmentData: Record<string, unknown> = {
      patient: { connect: { id: data.patientId } },
      ...(dentistId ? { dentist: { connect: { id: dentistId } } } : {}),
      date: new Date(data.date),
      ...(data.reason ? { reason: data.reason } : {}),
      ...(data.status ? { status: data.status } : {}),
    };

    const appointment = await prisma.appointment.create({
      data: appointmentData as unknown as Prisma.AppointmentCreateInput,
    });

    revalidatePath("/agenda");
    return { success: true, data: appointment };
  } catch (error) {
    console.error("Error al crear cita:", error);
    return { success: false, error: "Error al crear la cita en la agenda." };
  }
}

export async function updateOdontogram(patientId: string, odontogramaData: Record<string, unknown>) {
  try {
    await prisma.patient.update({
      where: { id: patientId },
      data: {
        odontogram: JSON.stringify(odontogramaData),
      },
    });

    revalidatePath(`/pacientes/${patientId}`);
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar odontograma:", error);
    return { success: false, error: "No se pudo guardar el odontograma." };
  }
}

export async function getProfessionals() {
  try {
    const professionals = await prisma.user.findMany({
      where: { role: 'DENTISTA' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: professionals };
  } catch (error) {
    console.error("Error al obtener profesionales:", error);
    return { success: false, error: "No se pudieron obtener los profesionales.", data: [] };
  }
}

export async function createTreatment(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const category = (formData.get("category") as string) || "GENERAL";

    if (!name || isNaN(price)) {
      return { success: false, error: "Nombre y precio válidos son requeridos." };
    }

    await prisma.treatment.create({
      data: {
        name,
        price,
        category,
      },
    });

    revalidatePath("/aranceles");
    return { success: true };
  } catch (error) {
    console.error("Error al crear tratamiento:", error);
    return { success: false, error: "No se pudo guardar el tratamiento." };
  }
}

export async function deleteTreatment(id: string) {
  try {
    await prisma.treatment.delete({
      where: { id },
    });

    revalidatePath("/aranceles");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar tratamiento:", error);
    return { success: false, error: "No se pudo eliminar el tratamiento." };
  }
}

export async function getDashboardStats() {
  try {
    const statsData = {
      global: {
        totalProduction: 0,
        pendingPayment: 0,
        totalPaid: 0,
      },
      dentists: [],
    };

    return {
      success: true,
      stats: statsData,
      ...statsData,
    };
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    const fallbackData = {
      global: {
        totalProduction: 0,
        pendingPayment: 0,
        totalPaid: 0,
      },
      dentists: [],
    };
    return {
      success: false,
      stats: fallbackData,
      ...fallbackData,
    };
  }
}

export async function createBudget(data: {
  patientId: string;
  dentistId: string;
  items: { treatmentId: string; price: number; toothNumber?: number }[];
}) {
  try {
    const budget = await prisma.budget.create({
      data: {
        patientId: data.patientId,
        dentistId: data.dentistId,
        items: {
          create: data.items,
        },
      },
    });

    revalidatePath(`/pacientes/${data.patientId}`);
    return { success: true, budget };
  } catch (error) {
    console.error("Error al crear presupuesto:", error);
    return { success: false, error: "No se pudo guardar el presupuesto" };
  }
}

export async function registerPayment(data: {
  budgetId: string;
  amount: number;
  method?: string;
}) {
  try {
    const payment = await prisma.payment.create({
      data: {
        budgetId: data.budgetId,
        amount: data.amount,
        method: data.method || "EFECTIVO",
      },
    });

    revalidatePath("/pacientes");
    return { success: true, payment };
  } catch (error) {
    console.error("Error al registrar el pago:", error);
    return { success: false, error: "No se pudo procesar el pago" };
  }
}

// Cambiar estado Activo / Inactivo
export async function togglePatientStatus(patientId: string, currentStatus: boolean) {
  try {
    await prisma.patient.update({
      where: { id: patientId },
      data: { active: !currentStatus },
    });
    revalidatePath("/pacientes");
    return { success: true };
  } catch (error) {
    console.error("Error al ejecutar la acción:", error);
    return { success: false, error: "No se pudo realizar la operación" };
  }
}