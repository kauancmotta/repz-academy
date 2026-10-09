// Seed do banco: catálogo inicial de exercícios globais (003).
// Idempotente: rodar mais de uma vez não duplica nem apaga nada.
// Executar com: npx prisma db seed

import { prisma } from "../src/lib/prisma.js";
import type { MuscleGroup } from "../src/generated/prisma/client.js";

interface SeedExercise {
  name: string;
  muscleGroup: MuscleGroup;
  description: string;
}

const exercises: SeedExercise[] = [
  // Peito
  { name: "Supino reto com barra", muscleGroup: "CHEST", description: "Deitado no banco, desça a barra até o peito e empurre para cima." },
  { name: "Supino inclinado com halteres", muscleGroup: "CHEST", description: "Banco inclinado, empurre os halteres para cima focando a parte superior do peito." },
  { name: "Supino declinado com barra", muscleGroup: "CHEST", description: "Banco declinado, desça a barra até a parte baixa do peito e empurre." },
  { name: "Crucifixo com halteres", muscleGroup: "CHEST", description: "Abra os braços em arco com leve flexão dos cotovelos e feche acima do peito." },
  { name: "Crossover na polia", muscleGroup: "CHEST", description: "Em pé entre as polias altas, traga as mãos à frente do corpo cruzando-as." },
  { name: "Flexão de braços", muscleGroup: "CHEST", description: "Com o corpo alinhado, desça o peito até perto do chão e empurre." },
  { name: "Peck deck", muscleGroup: "CHEST", description: "Na máquina, una os braços à frente do peito controlando o retorno." },

  // Costas
  { name: "Puxada frontal na polia", muscleGroup: "BACK", description: "Puxe a barra até a altura do queixo, levando os cotovelos para baixo." },
  { name: "Remada curvada com barra", muscleGroup: "BACK", description: "Tronco inclinado, puxe a barra em direção ao abdômen." },
  { name: "Remada baixa no cabo", muscleGroup: "BACK", description: "Sentado, puxe o triângulo até o abdômen mantendo a coluna reta." },
  { name: "Remada unilateral com halter", muscleGroup: "BACK", description: "Apoiado no banco, puxe o halter ao lado do tronco." },
  { name: "Barra fixa", muscleGroup: "BACK", description: "Pendurado na barra, suba até o queixo ultrapassar a barra." },
  { name: "Levantamento terra", muscleGroup: "BACK", description: "Com a barra no chão, estenda quadris e joelhos até ficar em pé, coluna neutra." },
  { name: "Pulldown com corda", muscleGroup: "BACK", description: "Na polia alta, puxe a corda para baixo com braços quase estendidos." },

  // Ombros
  { name: "Desenvolvimento com halteres", muscleGroup: "SHOULDERS", description: "Sentado, empurre os halteres acima da cabeça." },
  { name: "Desenvolvimento militar com barra", muscleGroup: "SHOULDERS", description: "Em pé, empurre a barra da altura dos ombros até acima da cabeça." },
  { name: "Elevação lateral", muscleGroup: "SHOULDERS", description: "Eleve os halteres lateralmente até a altura dos ombros." },
  { name: "Elevação frontal", muscleGroup: "SHOULDERS", description: "Eleve os halteres à frente do corpo até a altura dos ombros." },
  { name: "Crucifixo inverso", muscleGroup: "SHOULDERS", description: "Tronco inclinado, abra os braços trabalhando a parte posterior do ombro." },
  { name: "Encolhimento de ombros", muscleGroup: "SHOULDERS", description: "Com halteres ou barra, eleve os ombros em direção às orelhas." },

  // Bíceps
  { name: "Rosca direta com barra", muscleGroup: "BICEPS", description: "Em pé, flexione os cotovelos levando a barra até os ombros." },
  { name: "Rosca alternada com halteres", muscleGroup: "BICEPS", description: "Flexione um braço de cada vez girando o punho ao subir." },
  { name: "Rosca martelo", muscleGroup: "BICEPS", description: "Com pegada neutra, flexione os cotovelos mantendo os halteres na vertical." },
  { name: "Rosca scott", muscleGroup: "BICEPS", description: "Com os braços apoiados no banco scott, flexione a barra até o peito." },
  { name: "Rosca concentrada", muscleGroup: "BICEPS", description: "Sentado, com o cotovelo apoiado na coxa, flexione o halter." },

  // Tríceps
  { name: "Tríceps na polia com barra", muscleGroup: "TRICEPS", description: "Cotovelos junto ao corpo, estenda os braços empurrando a barra para baixo." },
  { name: "Tríceps corda", muscleGroup: "TRICEPS", description: "Estenda os braços na polia abrindo a corda ao final do movimento." },
  { name: "Tríceps testa", muscleGroup: "TRICEPS", description: "Deitado, flexione os cotovelos levando a barra em direção à testa e estenda." },
  { name: "Tríceps francês", muscleGroup: "TRICEPS", description: "Com um halter atrás da cabeça, estenda os braços para cima." },
  { name: "Mergulho no banco", muscleGroup: "TRICEPS", description: "Mãos apoiadas no banco, flexione e estenda os cotovelos." },

  // Pernas
  { name: "Agachamento livre", muscleGroup: "LEGS", description: "Com a barra nas costas, agache mantendo a coluna reta e suba." },
  { name: "Leg press 45", muscleGroup: "LEGS", description: "Empurre a plataforma com os pés até estender as pernas, sem travar os joelhos." },
  { name: "Cadeira extensora", muscleGroup: "LEGS", description: "Sentado, estenda os joelhos elevando a alavanca." },
  { name: "Mesa flexora", muscleGroup: "LEGS", description: "Deitado, flexione os joelhos levando a alavanca em direção aos glúteos." },
  { name: "Afundo com halteres", muscleGroup: "LEGS", description: "Dê um passo à frente e flexione os joelhos até quase tocar o chão com o joelho de trás." },
  { name: "Stiff com barra", muscleGroup: "LEGS", description: "Com joelhos levemente flexionados, incline o tronco levando a barra rente às pernas." },
  { name: "Agachamento búlgaro", muscleGroup: "LEGS", description: "Com o pé de trás apoiado no banco, agache com a perna da frente." },
  { name: "Panturrilha em pé", muscleGroup: "LEGS", description: "Eleve os calcanhares o máximo possível e desça com controle." },
  { name: "Panturrilha sentado", muscleGroup: "LEGS", description: "Sentado com carga sobre os joelhos, eleve os calcanhares." },

  // Glúteos
  { name: "Elevação pélvica", muscleGroup: "GLUTES", description: "Costas apoiadas no banco, eleve o quadril contraindo os glúteos." },
  { name: "Glúteo no cabo (coice)", muscleGroup: "GLUTES", description: "Na polia baixa, estenda a perna para trás contraindo o glúteo." },
  { name: "Cadeira abdutora", muscleGroup: "GLUTES", description: "Sentado, abra as pernas contra a resistência da máquina." },
  { name: "Agachamento sumô", muscleGroup: "GLUTES", description: "Pés afastados e apontados para fora, agache segurando um halter à frente." },

  // Abdômen
  { name: "Abdominal supra", muscleGroup: "CORE", description: "Deitado, eleve o tronco contraindo o abdômen." },
  { name: "Prancha", muscleGroup: "CORE", description: "Apoiado nos antebraços e pontas dos pés, mantenha o corpo alinhado." },
  { name: "Elevação de pernas", muscleGroup: "CORE", description: "Deitado ou suspenso, eleve as pernas retas até a altura do quadril." },
  { name: "Abdominal na polia", muscleGroup: "CORE", description: "Ajoelhado, flexione o tronco puxando a corda em direção ao chão." },
  { name: "Abdominal bicicleta", muscleGroup: "CORE", description: "Deitado, alterne cotovelo e joelho opostos em movimento de pedalada." },

  // Cardio
  { name: "Esteira", muscleGroup: "CARDIO", description: "Caminhada ou corrida na esteira em ritmo constante ou intervalado." },
  { name: "Bicicleta ergométrica", muscleGroup: "CARDIO", description: "Pedalada em ritmo constante ou intervalado." },
  { name: "Elíptico", muscleGroup: "CARDIO", description: "Movimento de caminhada deslizante, de baixo impacto." },
  { name: "Corda de pular", muscleGroup: "CARDIO", description: "Saltos contínuos com a corda, aterrissando com a ponta dos pés." },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const item of exercises) {
    // O índice único (name, createdById) não considera NULL igual a NULL, por isso o findFirst.
    const existing = await prisma.exercise.findFirst({ where: { name: item.name, createdById: null } });

    if (existing) {
      await prisma.exercise.update({
        where: { id: existing.id },
        data: { muscleGroup: item.muscleGroup, description: item.description },
      });
      updated++;
    } else {
      await prisma.exercise.create({ data: { ...item, createdById: null } });
      created++;
    }
  }

  console.log(`Seed concluído: ${created} exercícios criados, ${updated} já existiam (${exercises.length} no catálogo).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
