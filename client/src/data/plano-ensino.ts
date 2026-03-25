/**
 * Plano de Ensino — Dados pré-determinados para o FAMP Planner
 * Estrutura: Grande Área > Especialidade > Semana > Temas da Aula
 * 
 * Ao selecionar uma Grande Área, as especialidades correspondentes são filtradas.
 * Ao selecionar uma especialidade + semana, os temas da aula são sugeridos.
 */

export interface TemaAula {
  nome: string;
  descricao?: string;
}

export interface SemanaPlano {
  semana: number;
  temas: TemaAula[];
  tipo?: 'aula' | 'avaliacao' | 'recesso';
  label?: string; // Ex: "1ª semana de avaliações"
}

export interface EspecialidadePlano {
  nome: string;
  semanas: SemanaPlano[];
}

export interface GrandeAreaPlano {
  nome: string;
  especialidades: EspecialidadePlano[];
}

export const PLANO_ENSINO: GrandeAreaPlano[] = [
  {
    nome: 'Clínica Médica',
    especialidades: [
      {
        nome: 'Reumatologia',
        semanas: [
          {
            semana: 1,
            temas: [
              { nome: 'Abordagem inicial do paciente reumático' },
              { nome: 'Exame físico na Reumatologia parte 1', descricao: 'Anamnese do paciente reumático, exame físico de coluna e membros superiores' },
            ],
          },
          {
            semana: 2,
            temas: [
              { nome: 'Abordagem inicial do paciente reumático e exame físico na Reumatologia parte 2' },
              { nome: 'Exame físico de quadril, sacroilíacas e membros inferiores' },
            ],
          },
          {
            semana: 3,
            temas: [
              { nome: 'Exames complementares em Reumatologia parte I' },
              { nome: 'Correlação clínica e laboratorial' },
              { nome: 'Provas de atividade inflamatória, FAN, fator reumatoide e outros autoanticorpos' },
            ],
          },
          {
            semana: 4,
            temas: [
              { nome: 'Exames complementares em Reumatologia parte II' },
              { nome: 'Correlação clínica e exames de imagem' },
              { nome: 'Radiografia e densitometria óssea' },
            ],
          },
          {
            semana: 5,
            temas: [
              { nome: 'Síndromes de dor musculoesquelética localizada' },
              { nome: 'Reumatismos de partes moles' },
              { nome: 'Uso de anti-inflamatórios na prática clínica' },
            ],
          },
          {
            semana: 6,
            temas: [
              { nome: 'Síndromes de dor musculoesquelética difusa' },
              { nome: 'Fibromialgia' },
              { nome: 'Diagnósticos diferenciais' },
              { nome: 'Bases neurobiológicas e farmacológicas da dor na fibromialgia' },
            ],
          },
          {
            semana: 7,
            temas: [
              { nome: 'Síndromes monoarticulares' },
              { nome: 'Artropatias microcristalinas' },
              { nome: 'Gota' },
              { nome: 'Atualização sobre consenso ACR/EULAR 2020 para gota' },
            ],
          },
          {
            semana: 8,
            temas: [
              { nome: 'Síndromes de poliartralgia/poliartrite' },
              { nome: 'Artrite reumatoide parte I' },
            ],
          },
          {
            semana: 11,
            temas: [
              { nome: 'Síndromes poliarticulares parte II' },
              { nome: 'Lúpus eritematoso sistêmico parte I' },
              { nome: 'Atividade prática sobre mitos do lúpus' },
            ],
          },
          {
            semana: 12,
            temas: [
              { nome: 'Síndrome antifosfolípide' },
              { nome: 'Anticoagulação na prática clínica' },
            ],
          },
          {
            semana: 13,
            temas: [
              { nome: 'Síndromes poliarticulares parte IV' },
              { nome: 'Síndrome de Sjögren' },
              { nome: 'Abordagem multidisciplinar da síndrome de Sjögren' },
            ],
          },
          {
            semana: 15,
            temas: [
              { nome: 'Osteoartrite' },
              { nome: 'Abordagem multidisciplinar com nutrição e fisioterapia' },
            ],
          },
          {
            semana: 16,
            temas: [
              { nome: 'Osteoporose' },
              { nome: 'Orientação de pacientes, cuidadores e familiares sobre osteoporose e fraturas' },
            ],
          },
          {
            semana: 17,
            temas: [
              { nome: 'Febre reumática' },
              { nome: 'Febre chikungunya sob a visão da Reumatologia' },
              { nome: 'Produção de material educativo para a população' },
            ],
          },
        ],
      },
      {
        nome: 'Nefrologia',
        semanas: [
          {
            semana: 1,
            temas: [
              { nome: 'Anatomia e fisiologia renal' },
            ],
          },
          {
            semana: 2,
            temas: [
              { nome: 'Anatomia e fisiologia renal' },
              { nome: 'Sinais e sintomas de doença renal' },
            ],
          },
          {
            semana: 3,
            temas: [
              { nome: 'Anatomia e fisiologia renal 3' },
              { nome: 'Sinais e sintomas de doença renal' },
            ],
          },
          {
            semana: 4,
            temas: [
              { nome: 'Pielonefrite' },
              { nome: 'Fisiologia do metabolismo do cálcio' },
              { nome: 'Litíase renal' },
            ],
          },
          {
            semana: 5,
            temas: [
              { nome: 'Insuficiência renal aguda' },
            ],
          },
          {
            semana: 6,
            temas: [
              { nome: 'Síndrome nefrítica' },
              { nome: 'Insuficiência renal aguda por sepse' },
            ],
          },
          {
            semana: 7,
            temas: [
              { nome: 'Síndrome nefrótica' },
              { nome: 'Litíase renal, IRA, síndrome nefrítica e síndrome nefrótica como estudo dirigido' },
            ],
          },
          {
            semana: 8,
            temas: [
              { nome: 'Insuficiência renal crônica' },
              { nome: 'Revisão dos assuntos' },
              { nome: 'Correção de estudo dirigido' },
              { nome: 'Anemia na doença renal crônica' },
            ],
          },
          {
            semana: 11,
            temas: [
              { nome: 'Insuficiência renal crônica' },
              { nome: 'Terapia dialítica' },
            ],
          },
          {
            semana: 12,
            temas: [
              { nome: 'Nefropatia hipertensiva' },
              { nome: 'Nefropatia hipertensiva II' },
              { nome: 'Hipertensão maligna' },
            ],
          },
          {
            semana: 13,
            temas: [
              { nome: 'Distúrbios do sódio' },
              { nome: 'HAS renovascular' },
            ],
          },
          {
            semana: 15,
            temas: [
              { nome: 'Nefropatia diabética' },
              { nome: 'Alterações renais no ultrassom' },
            ],
          },
          {
            semana: 16,
            temas: [
              { nome: 'Hipocalemia' },
              { nome: 'ISGLT2' },
              { nome: 'Hipercalemia' },
            ],
          },
          {
            semana: 17,
            temas: [
              { nome: 'Nefropatia por anti-inflamatórios' },
              { nome: 'Nefropatia por anti-HAS' },
            ],
          },
        ],
      },
      {
        nome: 'Hematologia',
        semanas: [
          {
            semana: 1,
            temas: [
              { nome: 'Introdução à Hematologia' },
            ],
          },
          {
            semana: 2,
            temas: [
              { nome: 'Deficiência de ferro e outras anemias hipoproliferativas' },
            ],
          },
          {
            semana: 3,
            temas: [
              { nome: 'Hemoglobinopatias' },
            ],
          },
          {
            semana: 4,
            temas: [
              { nome: 'Anemias megaloblásticas' },
            ],
          },
          {
            semana: 5,
            temas: [
              { nome: 'Anemias hemolíticas' },
              { nome: 'Anemias causadas por perdas sanguíneas agudas' },
            ],
          },
          {
            semana: 6,
            temas: [
              { nome: 'Distúrbios de hemostasia primária' },
              { nome: 'Trombocitopenias' },
              { nome: 'Distúrbios de hemostasia secundária' },
              { nome: 'Coagulopatias hereditárias e adquiridas' },
            ],
          },
          {
            semana: 7,
            temas: [
              { nome: 'Leucemias agudas parte I' },
            ],
          },
          {
            semana: 8,
            temas: [
              { nome: 'Leucemias agudas parte II' },
            ],
          },
          {
            semana: 11,
            temas: [
              { nome: 'Neoplasias mieloproliferativas crônicas' },
              { nome: 'Leucemia mieloide crônica' },
              { nome: 'Policitemia vera' },
            ],
          },
          {
            semana: 12,
            temas: [
              { nome: 'Doenças linfoproliferativas crônicas' },
              { nome: 'Linfomas' },
              { nome: 'Leucemia linfocítica crônica' },
            ],
          },
          {
            semana: 13,
            temas: [
              { nome: 'Falências medulares' },
              { nome: 'Anemia aplástica' },
              { nome: 'Síndrome mielodisplásica' },
            ],
          },
          {
            semana: 15,
            temas: [
              { nome: 'Mieloma múltiplo' },
              { nome: 'Gamopatias monoclonais' },
            ],
          },
          {
            semana: 16,
            temas: [
              { nome: 'Terapia transfusional' },
              { nome: 'Transplante de células-tronco hematopoiéticas' },
            ],
          },
        ],
      },
    ],
  },
  {
    nome: 'Cirurgia',
    especialidades: [
      { nome: 'Cirurgia Geral', semanas: [] },
      { nome: 'Cirurgia Vascular', semanas: [] },
      { nome: 'Urologia', semanas: [] },
      { nome: 'Ortopedia', semanas: [] },
    ],
  },
  {
    nome: 'Ginecologia',
    especialidades: [
      { nome: 'Ginecologia Geral', semanas: [] },
      { nome: 'Mastologia', semanas: [] },
    ],
  },
  {
    nome: 'Obstetrícia',
    especialidades: [
      { nome: 'Obstetrícia Geral', semanas: [] },
      { nome: 'Medicina Fetal', semanas: [] },
    ],
  },
  {
    nome: 'Pediatria',
    especialidades: [
      { nome: 'Pediatria Geral', semanas: [] },
      { nome: 'Neonatologia', semanas: [] },
    ],
  },
  {
    nome: 'Medicina de Família e Comunidade',
    especialidades: [
      { nome: 'APS', semanas: [] },
      { nome: 'Saúde da Família', semanas: [] },
    ],
  },
  {
    nome: 'Saúde Coletiva',
    especialidades: [
      { nome: 'Epidemiologia', semanas: [] },
      { nome: 'Políticas de Saúde', semanas: [] },
    ],
  },
  {
    nome: 'Psiquiatria',
    especialidades: [
      { nome: 'Psiquiatria Geral', semanas: [] },
    ],
  },
  {
    nome: 'Medicina do Trabalho',
    especialidades: [
      { nome: 'Medicina do Trabalho', semanas: [] },
    ],
  },
];

/** Semanas especiais (avaliações, recesso) */
export const SEMANAS_ESPECIAIS: SemanaPlano[] = [
  { semana: 9, temas: [], tipo: 'avaliacao', label: '1ª semana de avaliações' },
  { semana: 10, temas: [], tipo: 'avaliacao', label: '2ª semana de avaliações' },
  { semana: 14, temas: [], tipo: 'recesso', label: 'Recesso / FAMP ZEN' },
  { semana: 18, temas: [], tipo: 'avaliacao', label: '2ª semana de avaliações' },
  { semana: 19, temas: [], tipo: 'avaliacao', label: '2ª semana de avaliações' },
  { semana: 20, temas: [], tipo: 'avaliacao', label: '2ª semana de avaliações' },
  { semana: 21, temas: [], tipo: 'avaliacao', label: 'Prova substitutiva e final' },
];

/** Helper: obter especialidades de uma grande área */
export function getEspecialidades(grandeArea: string): string[] {
  const area = PLANO_ENSINO.find(a => a.nome === grandeArea);
  return area ? area.especialidades.map(e => e.nome) : [];
}

/** Helper: obter semanas disponíveis para uma especialidade */
export function getSemanasDisponiveis(grandeArea: string, especialidade: string): number[] {
  const area = PLANO_ENSINO.find(a => a.nome === grandeArea);
  if (!area) return [];
  const esp = area.especialidades.find(e => e.nome === especialidade);
  if (!esp) return [];
  return esp.semanas.map(s => s.semana).sort((a, b) => a - b);
}

/** Helper: obter temas de uma semana específica */
export function getTemasParaSemana(grandeArea: string, especialidade: string, semana: number): TemaAula[] {
  const area = PLANO_ENSINO.find(a => a.nome === grandeArea);
  if (!area) return [];
  const esp = area.especialidades.find(e => e.nome === especialidade);
  if (!esp) return [];
  const sem = esp.semanas.find(s => s.semana === semana);
  return sem ? sem.temas : [];
}

/** Helper: verificar se semana é especial */
export function isSemanaEspecial(semana: number): SemanaPlano | undefined {
  return SEMANAS_ESPECIAIS.find(s => s.semana === semana);
}

/** Total de semanas no semestre */
export const TOTAL_SEMANAS = 21;
