import { z } from "zod";

// 1. Función para validar y normalizar el RUT Chileno (Módulo 11)
export function cleanAndValidateRut(rawRut: string): { isValid: boolean; formatted: string } {
  if (!rawRut || typeof rawRut !== "string") return { isValid: false, formatted: "" };
  
  // Limpiar caracteres especiales (puntos, guiones, espacios)
  const clean = rawRut.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 8) return { isValid: false, formatted: "" };

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDv = 11 - (sum % 11);
  const computedDv = expectedDv === 11 ? "0" : expectedDv === 10 ? "K" : expectedDv.toString();

  const isValid = dv === computedDv;
  const formatted = `${body}-${dv}`; // Formato normalizado sin puntos, con guion

  return { isValid, formatted };
}

// 2. Esquema Zod para la creación y edición de Pacientes
export const patientSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "El nombre es obligatorio (mínimo 2 caracteres)"),
      
    lastName: z
      .string()
      .min(2, "El apellido es obligatorio (mínimo 2 caracteres)"),

    rut: z
      .string()
      .min(1, "El RUT es obligatorio")
      .refine((rut) => cleanAndValidateRut(rut).isValid, {
        message: "El RUT ingresado no es válido (Dígito verificador incorrecto)",
      }),

    email: z
      .string()
      .email("Ingrese un correo electrónico válido")
      .optional()
      .or(z.literal("")),

    phone: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val) return true;
          // Valida números de teléfono chilenos (Celular +569... o red fija)
          return /^(\+?56)?(\s?)(0?9|[2-9])(\s?)[0-9]{8}$/.test(val.trim());
        },
        { message: "Ingrese un formato de teléfono chileno válido (ej: +56 9 1234 5678)" }
      ),

    birthDate: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val) return true;
          const date = new Date(val);
          const now = new Date();
          const minDate = new Date("1900-01-01");
          // No puede ser fecha futura ni anterior a 1900
          return date <= now && date >= minDate;
        },
        { message: "La fecha de nacimiento no puede ser futura ni inconsistente" }
      ),

    prevision: z
      .string()
      .min(1, "Debe seleccionar una previsión"),
  })
  // Regla: Exigir al menos un medio de contacto (Correo O Teléfono)
  .refine(
    (data) => Boolean((data.email && data.email.trim() !== "") || (data.phone && data.phone.trim() !== "")),
    {
      message: "Debe ingresar al menos un medio de contacto (Correo electrónico o Teléfono)",
      path: ["email"], // Despliega la advertencia sobre el campo correo
    }
  );

export type PatientFormData = z.infer<typeof patientSchema>;