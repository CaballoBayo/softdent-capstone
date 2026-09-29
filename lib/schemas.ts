import { z } from "zod";
import { checkRutExists, checkPhoneExists, checkPatientEmailExists, checkEmailExists } from "@/lib/actions";

export function validateRut(rut: string): boolean {
  if (!rut || typeof rut !== "string") return false;
  const cleanRut = rut.replace(/[^0-9kK]/g, "");
  if (cleanRut.length < 8) return false;

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDv = 11 - (sum % 11);
  const computedDv = expectedDv === 11 ? "0" : expectedDv === 10 ? "K" : expectedDv.toString();

  return dv === computedDv;
}

export const patientSchema = z.object({
  firstName: z.string().min(2, "El nombre es obligatorio"),
  lastName: z.string().min(2, "El apellido es obligatorio"),
  
  rut: z
    .string()
    .min(1, "El RUT es obligatorio")
    .refine((rut) => validateRut(rut), {
      message: "El RUT ingresado no es válido (Módulo 11)",
    })
    .refine(
      async (rut) => {
        const res = await checkRutExists(rut);
        return !res.exists;
      },
      { message: "Este RUT ya se encuentra registrado" }
    ),

  email: z
    .string()
    .email("Ingrese un correo válido")
    .optional()
    .or(z.literal(""))
    .refine(
      async (email) => {
        if (!email) return true;
        const res = await checkPatientEmailExists(email);
        return !res.exists;
      },
      { message: "Este correo electrónico ya está registrado" }
    ),

  phone: z
    .string()
    .optional()
    .refine(
      async (phone) => {
        if (!phone) return true;
        const res = await checkPhoneExists(phone);
        return !res.exists;
      },
      { message: "Este teléfono ya se encuentra registrado" }
    ),
});

export type PatientFormData = z.infer<typeof patientSchema>;