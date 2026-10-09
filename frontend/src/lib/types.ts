// Tipos espelhando o contrato da API (docs/api/openapi.json).

export type Role = "PERSONAL" | "STUDENT";

export type Weekday =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type MuscleGroup =
  | "CHEST"
  | "BACK"
  | "SHOULDERS"
  | "BICEPS"
  | "TRICEPS"
  | "LEGS"
  | "GLUTES"
  | "CORE"
  | "CARDIO"
  | "OTHER";

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Me extends UserPublic {
  personal: { id: string; name: string } | null;
}

export interface AuthResponse {
  user: UserPublic;
  token: string;
}

export interface Invite {
  id: string;
  code: string;
  expiresAt: string;
  usedAt: string | null;
  usedByStudent: { id: string; name: string } | null;
  status: "ACTIVE" | "USED" | "EXPIRED";
}

export interface InviteCreated {
  id: string;
  code: string;
  expiresAt: string;
  status: "ACTIVE" | "USED" | "EXPIRED";
}

export interface Student {
  id: string;
  name: string;
  email: string;
  lastSessionAt: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  description: string | null;
  videoUrl: string | null;
  videoEmbedUrl: string | null;
  isGlobal: boolean;
}

export interface ExerciseInput {
  name: string;
  muscleGroup: MuscleGroup;
  description?: string | null;
  videoUrl?: string | null;
}

export interface WorkoutItemInput {
  exerciseId: string;
  weekday: Weekday;
  order: number;
  sets: number;
  targetReps: number;
  restSeconds?: number | null;
  notes?: string | null;
}

export interface WorkoutInput {
  name: string;
  studentId?: string;
  items: WorkoutItemInput[];
}

export interface WorkoutSummary {
  id: string;
  name: string;
  studentId: string;
  authorId: string;
  archivedAt: string | null;
  archived: boolean;
  readOnly: boolean;
  itemsCount: number;
  weekdays: Weekday[];
}

export interface ItemExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  videoEmbedUrl: string | null;
}

export interface WorkoutItem {
  id: string;
  order: number;
  exercise: ItemExercise;
  sets: number;
  targetReps: number;
  restSeconds: number | null;
  notes: string | null;
}

export interface WorkoutDay {
  weekday: Weekday;
  items: WorkoutItem[];
}

export interface WorkoutDetail {
  id: string;
  name: string;
  studentId: string;
  authorId: string;
  archivedAt: string | null;
  archived: boolean;
  readOnly: boolean;
  days: WorkoutDay[];
}

export interface TodayWorkouts {
  weekday: Weekday;
  workouts: { id: string; name: string; items: WorkoutItem[] }[];
}

export interface PerformanceSet {
  setNumber: number;
  weightKg: number;
  reps: number;
}

export interface LastPerformance {
  sessionId: string;
  date: string;
  sets: PerformanceSet[];
}

export interface LoggedSet {
  id: string;
  workoutItemId: string | null;
  exerciseId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  completedAt: string;
}

export interface SessionItem extends WorkoutItem {
  lastPerformance: LastPerformance | null;
  loggedSets: LoggedSet[];
}

export interface SessionView {
  id: string;
  workoutId: string;
  workoutName: string;
  weekday: Weekday;
  startedAt: string;
  finishedAt: string | null;
  items: SessionItem[];
}

export interface SessionExerciseSummary {
  exerciseId: string;
  exerciseName: string;
  setsCount: number;
  volumeKg: number;
  maxWeightKg: number;
  previousBestKg: number | null;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  previousBestKg: number | null;
}

export interface SessionSummary {
  id: string;
  workoutId: string;
  workoutName: string;
  weekday: Weekday;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  totalVolumeKg: number;
  setsCount: number;
  exercises: SessionExerciseSummary[];
  personalRecords: PersonalRecord[];
}

export interface SessionDetail extends Omit<SessionSummary, "exercises"> {
  exercises: (SessionExerciseSummary & {
    sets: { setNumber: number; weightKg: number; reps: number; completedAt: string }[];
  })[];
}

export interface ProgressExercise {
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  sessionsCount: number;
  lastMaxWeightKg: number;
  weightChangePct: number | null;
  volumeChangePct: number | null;
  lastSessionAt: string;
}

export interface ProgressPoint {
  sessionId: string;
  date: string;
  maxWeightKg: number;
  repsAtMax: number;
  volumeKg: number;
  setsCount: number;
  isPersonalRecord: boolean;
}

export interface ExerciseProgress {
  exercise: { id: string; name: string; muscleGroup: MuscleGroup };
  points: ProgressPoint[];
  personalRecord: { weightKg: number; reps: number; date: string; sessionId: string } | null;
  weightChangePct: number | null;
  volumeChangePct: number | null;
}

export interface WeeklyFrequency {
  weekStart: string;
  sessions: number;
}

export interface SessionHistoryItem {
  id: string;
  workoutName: string;
  weekday: Weekday;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  totalVolumeKg: number;
  setsCount: number;
}

export interface SessionHistory {
  total: number;
  items: SessionHistoryItem[];
}

export interface StudentOverview {
  student: { id: string; name: string };
  lastSessionAt: string | null;
  totalSessions: number;
  sessionsLast30Days: number;
  weeklyFrequency: WeeklyFrequency[];
  recentPersonalRecords: {
    exerciseId: string;
    exerciseName: string;
    weightKg: number;
    reps: number;
    previousBestKg: number | null;
    date: string;
    sessionId: string;
  }[];
}
