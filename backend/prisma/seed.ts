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

// Vídeos de execução (YouTube) de todos os exercícios do catálogo.
// Cada link foi conferido (existe e permite incorporação). Se algum sair do ar, troque a URL aqui e rode o seed de novo.
const videos: Record<string, string> = {
  "Supino reto com barra": "https://www.youtube.com/watch?v=vIGvt-vgrvY",
  "Supino inclinado com halteres": "https://www.youtube.com/watch?v=RGeSgQmO1EU",
  "Crucifixo com halteres": "https://www.youtube.com/watch?v=ZjIKUMtW37c",
  "Tríceps corda": "https://www.youtube.com/watch?v=YQ6MRBeyIAE",
  "Tríceps testa": "https://www.youtube.com/watch?v=VakpIeaaeXA",
  "Puxada frontal na polia": "https://www.youtube.com/watch?v=BOW9my4J_ek",
  "Remada curvada com barra": "https://www.youtube.com/watch?v=_vO2dAnz__c",
  "Remada baixa no cabo": "https://www.youtube.com/watch?v=5zvxMuf378g",
  "Rosca direta com barra": "https://www.youtube.com/watch?v=Et1wgGMGW8w",
  "Rosca martelo": "https://www.youtube.com/watch?v=R0yB-Q7Ighs",
  "Agachamento livre": "https://www.youtube.com/watch?v=rM6SDUdl9fs",
  "Leg press 45": "https://www.youtube.com/watch?v=waAxlYvtCcI",
  "Cadeira extensora": "https://www.youtube.com/watch?v=RHgqvYAed_8",
  "Mesa flexora": "https://www.youtube.com/watch?v=8Nat6GRiEoc",
  "Panturrilha em pé": "https://www.youtube.com/watch?v=cklp_Xh5V8M",
  "Desenvolvimento com halteres": "https://www.youtube.com/watch?v=eufDL9MmF8A",
  "Levantamento terra": "https://www.youtube.com/watch?v=6E-rUBDENzA",
  "Elevação lateral": "https://www.youtube.com/watch?v=jannLx4RxKo",
  "Flexão de braços": "https://www.youtube.com/watch?v=RRi0-tvte6A",
  "Abdominal supra": "https://www.youtube.com/watch?v=tGobCIvFPHI",
  "Afundo com halteres": "https://www.youtube.com/watch?v=6Zz_RG0EHFE",
  "Elevação pélvica": "https://www.youtube.com/watch?v=kvmT_ZlgVI0",
  "Rosca alternada com halteres": "https://www.youtube.com/watch?v=P-boCddkUVg",
  "Esteira": "https://www.youtube.com/watch?v=nQdMzvhaSrI",
  "Supino declinado com barra": "https://www.youtube.com/watch?v=ifWEwZDWMAw",
  "Crossover na polia": "https://www.youtube.com/watch?v=E3aha5zhlc0",
  "Peck deck": "https://www.youtube.com/watch?v=a5XwjsD3AOI",
  "Remada unilateral com halter": "https://www.youtube.com/watch?v=JE3XUqMyHXo",
  "Barra fixa": "https://www.youtube.com/watch?v=oH-NrOccUOg",
  "Pulldown com corda": "https://www.youtube.com/watch?v=e9XbR9Hvm4c",
  "Desenvolvimento militar com barra": "https://www.youtube.com/watch?v=8YV_80VjJGc",
  "Elevação frontal": "https://www.youtube.com/watch?v=jhxLYSm_P-k",
  "Crucifixo inverso": "https://www.youtube.com/watch?v=r1efeCcUW-8",
  "Encolhimento de ombros": "https://www.youtube.com/watch?v=qCOOMxQPPSA",
  "Rosca scott": "https://www.youtube.com/watch?v=zaAx8tPX64k",
  "Rosca concentrada": "https://www.youtube.com/watch?v=NftBaXxrLJ4",
  "Tríceps na polia com barra": "https://www.youtube.com/watch?v=iioOkPqsVr0",
  "Tríceps francês": "https://www.youtube.com/watch?v=9EkGm94Q2Ms",
  "Mergulho no banco": "https://www.youtube.com/watch?v=qAKB1H2kz2g",
  "Stiff com barra": "https://www.youtube.com/watch?v=BHfY5-jGNDA",
  "Agachamento búlgaro": "https://www.youtube.com/watch?v=gmDBJYTgRUA",
  "Panturrilha sentado": "https://www.youtube.com/watch?v=Vp788-iQqiI",
  "Glúteo no cabo (coice)": "https://www.youtube.com/watch?v=S2_Rsx-Ud2w",
  "Cadeira abdutora": "https://www.youtube.com/watch?v=50qHGus1TZk",
  "Agachamento sumô": "https://www.youtube.com/watch?v=u_TTcv8FvOk",
  "Prancha": "https://www.youtube.com/watch?v=9dn5Fb3cSoE",
  "Elevação de pernas": "https://www.youtube.com/watch?v=cCGSbAjIP3k",
  "Abdominal na polia": "https://www.youtube.com/watch?v=eB-LUPltCfM",
  "Abdominal bicicleta": "https://www.youtube.com/watch?v=pIaXc4aH1VY",
  "Bicicleta ergométrica": "https://www.youtube.com/watch?v=_NyqsWSkOKc",
  "Elíptico": "https://www.youtube.com/watch?v=Rltlu55sBLE",
  "Corda de pular": "https://www.youtube.com/watch?v=bB2BMeZTygg",
};

async function main() {
  let created = 0;
  let updated = 0;

  for (const item of exercises) {
    // O índice único (name, createdById) não considera NULL igual a NULL, por isso o findFirst.
    const existing = await prisma.exercise.findFirst({ where: { name: item.name, createdById: null } });

    if (existing) {
      await prisma.exercise.update({
        where: { id: existing.id },
        data: { muscleGroup: item.muscleGroup, description: item.description, ...(videos[item.name] ? { videoUrl: videos[item.name] } : {}) },
      });
      updated++;
    } else {
      await prisma.exercise.create({ data: { ...item, videoUrl: videos[item.name] ?? null, createdById: null } });
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
