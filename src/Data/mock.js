export const MOCK = {
  distributors: [
    {
      id: 'd1',
      external_code: 'ESPSB123',
      channel_type: 'exclusiva',
      brands_enabled: ['silbo', 'lowi', 'vodafone_resid'],
      nombre_pdv: 'Tech Canarias',
      provincia: 'Las Palmas',
      poblacion: 'Las Palmas',
      cp: '35001',
      telefono: '928000000',
      email: 'info@techcanarias.es',
      operational_status: 'activo',
      fecha_alta: '2025-09-01',
      responsable: 'Ana Suárez',
      responsableSecundario: 'David Romero'
    },
    {
      id: 'd2',
      external_code: 'LWMY987',
      channel_type: 'no_exclusiva',
      brands_enabled: ['silbo', 'lowi', 'vodafone_resid'],
      nombre_pdv: 'InfoTelde',
      provincia: 'Las Palmas',
      poblacion: 'Telde',
      cp: '35200',
      telefono: '928111111',
      email: 'hola@infotelde.es',
      operational_status: 'pendiente',
      fecha_alta: '2025-09-10',
      responsable: 'Óscar Cabrera',
      responsableSecundario: 'Laura Díaz'
    },
    {
      id: 'd3',
      external_code: 'EXISTENTE_VF',
      channel_type: 'd2d',
      brands_enabled: ['silbo', 'vodafone_resid'],
      nombre_pdv: 'Equipo D2D Norte',
      provincia: 'Sta. Cruz de Tenerife',
      poblacion: 'La Laguna',
      cp: '38201',
      telefono: '',
      email: '',
      operational_status: 'activo',
      fecha_alta: '2025-09-15',
      responsable: 'Elena Martín',
      responsableSecundario: ''
    }
  ],
  candidates: [
    {
      id: 'c1',
      nombre: 'PC Arucas',
      poblacion: 'Arucas',
      contacto: {
        nombre: 'Laura',
        movil: '600111111',
        email: 'laura@pcarucas.es'
      },
      propuesta_nomenclatura: 'PVPTE',
      stage: 'cualificado',
      notes: ''
    },
    {
      id: 'c2',
      nombre: 'iPhone Adeje',
      poblacion: 'Adeje',
      contacto: {
        nombre: 'Diego',
        movil: '600222222',
        email: 'diego@iphoneadeje.es'
      },
      propuesta_nomenclatura: 'ESPSB',
      stage: 'nuevo',
      notes: ''
    }
  ],
  visits: [
    {
      id: 'v1',
      distributor_id: 'd1',
      visit_date: '2025-10-02',
      visit_type: 'presentacion',
      objetivo: 'Presentar Silbö+Lowi',
      resumen: 'Interés alto',
      proximos_pasos: 'Enviar propuesta',
      resultado: 'pendiente',
      duracion_min: 45
    },
    {
      id: 'v2',
      distributor_id: 'd2',
      visit_date: '2025-10-03',
      visit_type: 'seguimiento',
      objetivo: 'Completar datos PVPTE',
      resumen: 'Faltan CIF y dirección',
      proximos_pasos: 'Recoger documentación',
      resultado: 'pendiente',
      duracion_min: 30
    }
  ],
  sales: [
    {
      id: 's1',
      distributor_id: 'd1',
      sale_date: '2025-10-04',
      brand: 'silbo',
      family: 'convergente',
      operaciones: 2,
      notes: 'Pack 600Mb'
    },
    {
      id: 's2',
      distributor_id: 'd1',
      sale_date: '2025-10-04',
      brand: 'lowi',
      family: 'movil',
      operaciones: 3,
      notes: ''
    }
  ]
}
