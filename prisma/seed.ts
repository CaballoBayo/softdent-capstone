import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Iniciando sembrado de datos...')

  // 1. Categorías de Prestaciones (Consumido por Prestaciones y Reportes)
  const categorias = [
    'Prevención',
    'Operatoria',
    'Endodoncia',
    'Cirugía',
    'Ortodoncia',
    'Implantología',
    'Estética Dental',
  ]

  const categoryMap = new Map<string, string>()
  for (const catName of categorias) {
    const cat = await prisma.procedureCategory.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName },
    })
    categoryMap.set(catName, cat.id)
  }
  console.log('✅ Categorías de prestaciones cargadas')

  // 2. Especialidades Odontológicas (Consumido por Profesionales y Prestaciones)
  const especialidades = [
    { name: 'Odontología General', description: 'Atención primaria y preventiva' },
    { name: 'Ortodoncia', description: 'Corrección y alineación dental' },
    { name: 'Endodoncia', description: 'Tratamientos de conducto' },
    { name: 'Periodoncia', description: 'Salud de encías' },
    { name: 'Implantología', description: 'Implantes y rehabilitación fija' },
    { name: 'Cirugía Maxilofacial', description: 'Cirugías y extracciones complejas' },
  ]

  let defaultSpecialtyId: string | undefined
  for (const esp of especialidades) {
    const res = await prisma.specialty.upsert({
      where: { name: esp.name },
      update: {},
      create: esp,
    })
    if (esp.name === 'Odontología General') {
      defaultSpecialtyId = res.id
    }
  }
  console.log('✅ Especialidades cargadas')

  // 3. Boxes de Atención (Consumido por Agenda)
  const boxes = ['Box 1 - General', 'Box 2 - Ortodoncia', 'Box 3 - Cirugía', 'Box Rayos X']
  for (const box of boxes) {
    await prisma.box.upsert({
      where: { name: box },
      update: {},
      create: { name: box },
    })
  }
  console.log('✅ Boxes de atención cargados')

  // 4. Previsiones y Convenios (Consumido por Pacientes, Aranceles, FONASA y Convenios)
  const previsiones = [
    'Particular',
    'FONASA AA',
    'FONASA B',
    'FONASA C',
    'FONASA D',
    'Isapre Banmédica',
    'Isapre Colmena',
    'Isapre Consalud',
    'Isapre CruzBlanca',
  ]
  for (const prev of previsiones) {
    await prisma.healthInsurance.upsert({
      where: { name: prev },
      update: {},
      create: { name: prev },
    })
  }
  console.log('✅ Previsiones cargadas')

  // 5. Métodos de Pago (Consumido por Pagos y Caja)
  const metodosPago = [
    'Efectivo',
    'Tarjeta de Débito',
    'Tarjeta de Crédito',
    'Transferencia Bancaria',
    'Bono FONASA',
  ]
  for (const metodo of metodosPago) {
    await prisma.paymentMethod.upsert({
      where: { name: metodo },
      update: {},
      create: { name: metodo },
    })
  }
  console.log('✅ Métodos de pago cargados')

  // 6. Tipos de Atención (Consumido por Agenda y Reportes)
  const tiposAtencion = [
    'Evaluación / Diagnóstico',
    'Tratamiento',
    'Control',
    'Urgencia',
  ]
  for (const tipo of tiposAtencion) {
    await prisma.appointmentType.upsert({
      where: { name: tipo },
      update: {},
      create: { name: tipo },
    })
  }
  console.log('✅ Tipos de atención cargados')

  // 7. Parámetros de Configuración Global del Sistema
  const parametros = [
    { key: 'CLINIC_NAME', value: 'Clínica SoftDent', description: 'Nombre comercial de la clínica' },
    { key: 'DEFAULT_APPOINTMENT_DURATION', value: '30', description: 'Duración base de citas en minutos' },
    { key: 'REMINDER_HOURS_BEFORE', value: '24', description: 'Horas de anticipación para recordatorios' },
    { key: 'MAX_LOGIN_ATTEMPTS', value: '5', description: 'Intentos máximos fallidos de login' },
  ]
  for (const param of parametros) {
    await prisma.systemParameter.upsert({
      where: { key: param.key },
      update: {},
      create: param,
    })
  }
  console.log('✅ Parámetros del sistema cargados')

  // 8. Usuario Dentista (vinculado a su especialidad)
  const dentista = await prisma.user.upsert({
    where: { email: 'juan.perez@dignidad.cl' },
    update: { specialtyId: defaultSpecialtyId },
    create: {
      email: 'juan.perez@dignidad.cl',
      name: 'Juan Pérez',
      role: 'DENTISTA',
      specialtyId: defaultSpecialtyId,
    },
  })
  console.log('✅ Profesional verificado:', dentista.name)

  // 9. Aranceles / Tratamientos (vinculados a sus categorías maestras)
  const tratamientos = [
    { name: 'Exodoncia Simple', price: 25000, categoryName: 'Cirugía' },
    { name: 'Restauración Resina Simple', price: 35000, categoryName: 'Operatoria' },
    { name: 'Endodoncia Unirradicular', price: 90000, categoryName: 'Endodoncia' },
    { name: 'Limpieza y Destartraje', price: 40000, categoryName: 'Prevención' },
  ]

  for (const t of tratamientos) {
    const categoryId = categoryMap.get(t.categoryName)
    const existe = await prisma.treatment.findFirst({ where: { name: t.name } })
    if (!existe) {
      await prisma.treatment.create({
        data: {
          name: t.name,
          price: t.price,
          categoryId: categoryId,
        },
      })
    }
  }
  console.log('✅ Catálogo de aranceles cargado')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })