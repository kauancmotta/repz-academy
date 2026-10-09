// Seed de DEMONSTRAÇÃO: personais, alunos, treinos e ~8 semanas de histórico de execução.
// Serve para apresentar o sistema e para o desenvolvimento do frontend com dados reais.
//
// Pré-requisito: o catálogo de exercícios (npm run prisma:seed).
// Executar com: npm run prisma:seed:demo
//
// Idempotente: apaga somente os usuários de demonstração (e-mails @demo.repz.app) e seus dados,
// e recria tudo. Datas relativas a hoje, para a "frequência das últimas 8 semanas" sempre ter dados.
// Todas as senhas: senha12345

import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";
import { addDaysToKey, localDateKey, weekStartKey } from "../src/modules/progress/calculations.js";
import type { Weekday } from "../src/generated/prisma/enums.js";

const PASSWORD = "senha12345";
const DEMO_DOMAIN = "@demo.repz.app";
const DEMO_INVITE_CODE = "REPZDEMO";

// ---------- Definição dos treinos ----------

interface ItemSpec {
  exercise: string;
  weekday: Weekday;
  sets: number;
  reps: number;
  rest?: number;
  notes?: string;
}

/** Evolução de carga: carga = base + step × floor(sessão / every). */
interface LoadProfile {
  base: number;
  step: number;
  every: number;
}

const loads: Record<string, LoadProfile> = {
  "Supino reto com barra": { base: 30, step: 2.5, every: 2 },
  "Supino inclinado com halteres": { base: 12, step: 1, every: 3 },
  "Crucifixo com halteres": { base: 8, step: 1, every: 4 },
  "Tríceps corda": { base: 20, step: 2.5, every: 3 },
  "Tríceps testa": { base: 15, step: 2.5, every: 4 },
  "Puxada frontal na polia": { base: 40, step: 2.5, every: 2 },
  "Remada curvada com barra": { base: 30, step: 2.5, every: 3 },
  "Remada baixa no cabo": { base: 35, step: 2.5, every: 3 },
  "Rosca direta com barra": { base: 15, step: 2.5, every: 3 },
  "Rosca martelo": { base: 7, step: 1, every: 3 },
  "Agachamento livre": { base: 40, step: 5, every: 2 },
  "Leg press 45": { base: 100, step: 10, every: 3 },
  "Cadeira extensora": { base: 30, step: 2.5, every: 3 },
  "Mesa flexora": { base: 25, step: 2.5, every: 3 },
  "Panturrilha em pé": { base: 40, step: 5, every: 4 },
  // João (full body)
  "Desenvolvimento com halteres": { base: 14, step: 1, every: 2 },
  "Levantamento terra": { base: 50, step: 5, every: 2 },
  "Elevação lateral": { base: 6, step: 1, every: 3 },
  // Ana (treino em casa)
  "Flexão de braços": { base: 0, step: 0, every: 1 },
  "Abdominal supra": { base: 0, step: 0, every: 1 },
  "Afundo com halteres": { base: 6, step: 1, every: 2 },
  "Elevação pélvica": { base: 20, step: 5, every: 3 },
  "Rosca alternada com halteres": { base: 5, step: 1, every: 3 },
};

const mariaItems: ItemSpec[] = [
  // Segunda: peito e tríceps
  { exercise: "Supino reto com barra", weekday: "MONDAY", sets: 4, reps: 10, rest: 90, notes: "Desça a barra até tocar o peito" },
  { exercise: "Supino inclinado com halteres", weekday: "MONDAY", sets: 3, reps: 10, rest: 75 },
  { exercise: "Crucifixo com halteres", weekday: "MONDAY", sets: 3, reps: 12, rest: 60 },
  { exercise: "Tríceps corda", weekday: "MONDAY", sets: 3, reps: 12, rest: 60 },
  { exercise: "Tríceps testa", weekday: "MONDAY", sets: 3, reps: 10, rest: 60 },
  // Quarta: costas e bíceps
  { exercise: "Puxada frontal na polia", weekday: "WEDNESDAY", sets: 4, reps: 10, rest: 90 },
  { exercise: "Remada curvada com barra", weekday: "WEDNESDAY", sets: 3, reps: 10, rest: 75 },
  { exercise: "Remada baixa no cabo", weekday: "WEDNESDAY", sets: 3, reps: 12, rest: 60 },
  { exercise: "Rosca direta com barra", weekday: "WEDNESDAY", sets: 3, reps: 10, rest: 60 },
  { exercise: "Rosca martelo", weekday: "WEDNESDAY", sets: 3, reps: 12, rest: 60 },
  // Sexta: pernas
  { exercise: "Agachamento livre", weekday: "FRIDAY", sets: 4, reps: 8, rest: 120, notes: "Joelhos alinhados com os pés" },
  { exercise: "Leg press 45", weekday: "FRIDAY", sets: 4, reps: 12, rest: 90 },
  { exercise: "Cadeira extensora", weekday: "FRIDAY", sets: 3, reps: 12, rest: 60 },
  { exercise: "Mesa flexora", weekday: "FRIDAY", sets: 3, reps: 12, rest: 60 },
  { exercise: "Panturrilha em pé", weekday: "FRIDAY", sets: 4, reps: 15, rest: 45 },
];

const joaoItems: ItemSpec[] = [
  { exercise: "Agachamento livre", weekday: "MONDAY", sets: 3, reps: 10, rest: 90 },
  { exercise: "Supino reto com barra", weekday: "MONDAY", sets: 3, reps: 10, rest: 90 },
  { exercise: "Desenvolvimento com halteres", weekday: "MONDAY", sets: 3, reps: 10, rest: 60 },
  { exercise: "Levantamento terra", weekday: "THURSDAY", sets: 3, reps: 8, rest: 120 },
  { exercise: "Puxada frontal na polia", weekday: "THURSDAY", sets: 3, reps: 10, rest: 75 },
  { exercise: "Elevação lateral", weekday: "THURSDAY", sets: 3, reps: 12, rest: 45 },
];

const anaItems: ItemSpec[] = [
  { exercise: "Flexão de braços", weekday: "TUESDAY", sets: 3, reps: 12, rest: 60 },
  { exercise: "Agachamento livre", weekday: "TUESDAY", sets: 3, reps: 12, rest: 60 },
  { exercise: "Abdominal supra", weekday: "TUESDAY", sets: 3, reps: 20, rest: 45 },
  { exercise: "Afundo com halteres", weekday: "THURSDAY", sets: 3, reps: 12, rest: 60 },
  { exercise: "Elevação pélvica", weekday: "THURSDAY", sets: 4, reps: 12, rest: 60 },
  { exercise: "Rosca alternada com halteres", weekday: "THURSDAY", sets: 3, reps: 12, rest: 45 },
];

// ---------- Plano das sessões (w = semanas atrás; 0 = semana atual; dia 0 = segunda) ----------

interface SessionSlot {
  weeksAgo: number;
  dayOffset: number;
  weekday: Weekday;
}

const WEEKDAYS: Weekday[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function slots(weeksAgo: number[], dayOffsets: number[], skip: [number, number][] = []): SessionSlot[] {
  const result: SessionSlot[] = [];
  for (const w of weeksAgo) {
    for (const d of dayOffsets) {
      if (skip.some(([sw, sd]) => sw === w && sd === d)) continue;
      result.push({ weeksAgo: w, dayOffset: d, weekday: WEEKDAYS[d]! });
    }
  }
  return result;
}

// Maria: 3x por semana, com algumas faltas para o gráfico de frequência variar.
const mariaSlots = slots([7, 6, 5, 4, 3, 2, 1, 0], [0, 2, 4], [[6, 4], [4, 2], [4, 4], [3, 0], [3, 2], [1, 2]]);
// João: treinou nas 3 primeiras semanas e parou (aparece como "parou de treinar" para o personal).
const joaoSlots = slots([7, 6, 5], [0, 3]);
// Ana (sem personal): 2x por semana nas últimas 4 semanas.
const anaSlots = slots([3, 2, 1, 0], [1, 3]);

// ---------- Utilidades ----------

const todayKey = localDateKey(new Date());
const currentWeek = weekStartKey(todayKey);

/** 18:00 no fuso de São Paulo (UTC-3, sem horário de verão desde 2019). */
function sessionStart(slot: SessionSlot): Date {
  const dateKey = addDaysToKey(currentWeek, -7 * slot.weeksAgo + slot.dayOffset);
  return new Date(`${dateKey}T18:00:00-03:00`);
}

function loadFor(exercise: string, sessionIndex: number): number {
  const profile = loads[exercise] ?? { base: 10, step: 0, every: 1 };
  return profile.base + profile.step * Math.floor(sessionIndex / profile.every);
}

/** Repetições da série: as últimas séries caem um pouco; ao subir a carga, as repetições recuam. */
function repsFor(target: number, setNumber: number, exercise: string, sessionIndex: number): number {
  const profile = loads[exercise];
  const justIncreased = profile !== undefined && profile.step > 0 && sessionIndex > 0 && sessionIndex % profile.every === 0;
  const fatigue = setNumber >= 3 ? setNumber - 2 : 0;
  return Math.max(1, target - fatigue - (justIncreased ? 2 : 0));
}

const exerciseIds = new Map<string, string>();
const exerciseId = (name: string): string => {
  const id = exerciseIds.get(name);
  if (!id) throw new Error(`Exercício "${name}" não está no catálogo. Rode antes: npm run prisma:seed`);
  return id;
};

async function createUser(name: string, emailPrefix: string, role: "PERSONAL" | "STUDENT", personalId?: string) {
  return prisma.user.create({
    data: {
      name,
      email: `${emailPrefix}${DEMO_DOMAIN}`,
      passwordHash: await bcrypt.hash(PASSWORD, 10),
      role,
      personalId: personalId ?? null,
    },
  });
}

async function createWorkout(name: string, studentId: string, authorId: string, items: ItemSpec[]) {
  const orderByDay = new Map<Weekday, number>();
  return prisma.workout.create({
    data: {
      name,
      studentId,
      authorId,
      items: {
        create: items.map((item) => {
          const order = (orderByDay.get(item.weekday) ?? 0) + 1;
          orderByDay.set(item.weekday, order);
          return {
            exerciseId: exerciseId(item.exercise),
            weekday: item.weekday,
            order,
            sets: item.sets,
            targetReps: item.reps,
            restSeconds: item.rest ?? null,
            notes: item.notes ?? null,
          };
        }),
      },
    },
    include: { items: true },
  });
}

/** Cria as sessões finalizadas do aluno nos horários planejados (ignora horários futuros). */
async function createHistory(studentId: string, workout: Awaited<ReturnType<typeof createWorkout>>, plan: SessionSlot[]) {
  const doneByWeekday = new Map<Weekday, number>();
  let created = 0;

  for (const slot of plan) {
    const startedAt = sessionStart(slot);
    if (startedAt.getTime() > Date.now()) continue;

    const sessionIndex = doneByWeekday.get(slot.weekday) ?? 0;
    doneByWeekday.set(slot.weekday, sessionIndex + 1);

    const items = workout.items.filter((item) => item.weekday === slot.weekday).sort((a, b) => a.order - b.order);
    let minute = 2;
    const sets = items.flatMap((item) => {
      const name = [...exerciseIds].find(([, id]) => id === item.exerciseId)![0];
      return Array.from({ length: item.sets }, (_, i) => {
        const setNumber = i + 1;
        minute += 3;
        return {
          workoutItemId: item.id,
          exerciseId: item.exerciseId,
          setNumber,
          weightKg: loadFor(name, sessionIndex),
          reps: repsFor(item.targetReps, setNumber, name, sessionIndex),
          completedAt: new Date(startedAt.getTime() + minute * 60_000),
        };
      });
    });

    await prisma.workoutSession.create({
      data: {
        studentId,
        workoutId: workout.id,
        weekday: slot.weekday,
        startedAt,
        finishedAt: new Date(startedAt.getTime() + (minute + 3) * 60_000),
        sets: { create: sets },
      },
    });
    created++;
  }
  return created;
}

async function removeDemoData() {
  const users = await prisma.user.findMany({ where: { email: { endsWith: DEMO_DOMAIN } }, select: { id: true } });
  const ids = users.map((user) => user.id);
  if (ids.length === 0) return;

  await prisma.setLog.deleteMany({ where: { session: { studentId: { in: ids } } } });
  await prisma.workoutSession.deleteMany({ where: { studentId: { in: ids } } });
  await prisma.workoutItem.deleteMany({ where: { workout: { OR: [{ studentId: { in: ids } }, { authorId: { in: ids } }] } } });
  await prisma.workout.deleteMany({ where: { OR: [{ studentId: { in: ids } }, { authorId: { in: ids } }] } });
  await prisma.invite.deleteMany({ where: { OR: [{ personalId: { in: ids } }, { usedByStudentId: { in: ids } }] } });
  await prisma.exercise.deleteMany({ where: { createdById: { in: ids } } });
  await prisma.user.updateMany({ where: { id: { in: ids } }, data: { personalId: null } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  const catalog = await prisma.exercise.findMany({ where: { createdById: null }, select: { id: true, name: true } });
  if (catalog.length === 0) throw new Error("Catálogo de exercícios vazio. Rode antes: npm run prisma:seed");
  for (const exercise of catalog) exerciseIds.set(exercise.name, exercise.id);

  await removeDemoData();

  const carlos = await createUser("Carlos Personal", "carlos", "PERSONAL");
  const beatriz = await createUser("Beatriz Personal", "beatriz", "PERSONAL");
  const maria = await createUser("Maria Silva", "maria", "STUDENT", carlos.id);
  const joao = await createUser("João Santos", "joao", "STUDENT", carlos.id);
  const ana = await createUser("Ana Costa", "ana", "STUDENT");

  // Convite pronto para demonstrar o vínculo: a Ana (sem personal) resgata o código da Beatriz.
  await prisma.invite.create({
    data: { code: DEMO_INVITE_CODE, personalId: beatriz.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });

  const mariaWorkout = await createWorkout("Hipertrofia ABC", maria.id, carlos.id, mariaItems);
  const joaoWorkout = await createWorkout("Full body", joao.id, carlos.id, joaoItems);
  const anaWorkout = await createWorkout("Treino em casa", ana.id, ana.id, anaItems);

  // Treino antigo arquivado pela própria Ana (demonstra arquivar e desarquivar).
  const archived = await createWorkout("Treino antigo", ana.id, ana.id, [
    { exercise: "Esteira", weekday: "SATURDAY", sets: 1, reps: 30, rest: 0 },
  ]);
  await prisma.workout.update({ where: { id: archived.id }, data: { archivedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } });

  const counts = {
    maria: await createHistory(maria.id, mariaWorkout, mariaSlots),
    joao: await createHistory(joao.id, joaoWorkout, joaoSlots),
    ana: await createHistory(ana.id, anaWorkout, anaSlots),
  };

  console.log("\nSeed de demonstração concluído.\n");
  console.log("Contas (senha de todas: " + PASSWORD + "):");
  console.log(`  PERSONAL  carlos${DEMO_DOMAIN}    Carlos Personal  (alunos: Maria e João)`);
  console.log(`  PERSONAL  beatriz${DEMO_DOMAIN}   Beatriz Personal (sem alunos, com convite ${DEMO_INVITE_CODE})`);
  console.log(`  ALUNO     maria${DEMO_DOMAIN}     Maria Silva  - com personal, ${counts.maria} sessões em ~8 semanas`);
  console.log(`  ALUNO     joao${DEMO_DOMAIN}      João Santos  - com personal, ${counts.joao} sessões e parou de treinar`);
  console.log(`  ALUNO     ana${DEMO_DOMAIN}       Ana Costa    - SEM personal, ${counts.ana} sessões, treino próprio`);
  console.log(`\nConvite para a Ana resgatar: ${DEMO_INVITE_CODE} (válido por 7 dias)\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
