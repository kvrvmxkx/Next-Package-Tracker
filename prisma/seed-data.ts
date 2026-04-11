import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcrypt";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 30000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── helper : findOrCreate sans transaction ───────────────────
async function findOrCreateAgence(id: number, data: object) {
  const existing = await prisma.agence.findFirst({ where: { id } });
  if (!existing) await prisma.agence.create({ data: { id, ...(data as any) } });
}

async function findOrCreateTarif(id: number, nom: string, destination: string) {
  const existing = await prisma.tarif.findFirst({ where: { id } });
  if (existing) return existing;
  const tarif = await prisma.tarif.create({ data: { id, nom, destination, active: true } });
  if (destination === "MALI") {
    await prisma.trancheTarif.create({ data: { tarifId: tarif.id, poidsMin: 0, poidsMax: 10, prixParKg: 5000 } });
    await prisma.trancheTarif.create({ data: { tarifId: tarif.id, poidsMin: 10.01, poidsMax: 50, prixParKg: 4500 } });
    await prisma.trancheTarif.create({ data: { tarifId: tarif.id, poidsMin: 50.01, poidsMax: null, prixParKg: 4000 } });
  } else {
    await prisma.trancheTarif.create({ data: { tarifId: tarif.id, poidsMin: 0, poidsMax: 10, prixParKg: 5500 } });
    await prisma.trancheTarif.create({ data: { tarifId: tarif.id, poidsMin: 10.01, poidsMax: 50, prixParKg: 5000 } });
    await prisma.trancheTarif.create({ data: { tarifId: tarif.id, poidsMin: 50.01, poidsMax: null, prixParKg: 4500 } });
  }
  return tarif;
}

async function findOrCreateUser(email: string, userData: object, password: string) {
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) return existing;
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, ...(userData as any) } });
  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      accountId: email,
      providerId: "credential",
      password: hashed,
      userId: user.id,
    },
  });
  return user;
}

// ─── Données fictives ─────────────────────────────────────────
const prenoms = ["Mamadou","Ibrahim","Oumar","Seydou","Boubacar","Fatoumata","Aminata","Mariam","Kadiatou","Oumou","Adama","Moussa","Cheick","Bintou","Rokia","Modibo","Lamine","Aissatou","Hawa","Djeneba"];
const noms    = ["Coulibaly","Diallo","Traoré","Koné","Kouyaté","Bah","Keïta","Sidibé","Sanogo","Cissé","Dembélé","Touré","Camara","Konaté","Sissoko","Bagayoko","Diabaté","Barry","Diarra","Sylla"];
const villesMali = ["Bamako","Sikasso","Mopti","Ségou","Kayes","Gao","Koulikoro","San","Kidal","Tombouctou"];
const villesCI   = ["Abidjan","Bouaké","Daloa","Korhogo","Man","San-Pédro","Yamoussoukro","Divo","Gagnoa","Abengourou"];
const descriptions = ["Vêtements et textiles","Électronique - téléphones","Pièces automobiles","Chaussures et accessoires","Produits cosmétiques","Jouets et articles enfants","Matériel informatique","Articles ménagers","Tissus wax et bazin","Montres et bijoux","Matériel électrique","Ustensiles de cuisine","Articles de sport","Outillage et bricolage"];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randPhone(pays: "ML"|"CI") { const n = Math.floor(Math.random()*90000000)+10000000; return pays==="ML" ? `+223${n}` : `+225${n}`; }
function randPoids() { const r=Math.random(); if(r<0.7) return Math.round((Math.random()*29+1)*10)/10; if(r<0.9) return Math.round((Math.random()*50+30)*10)/10; return Math.round((Math.random()*120+80)*10)/10; }
function calcPrix(poids: number, dest: string) { let p=dest==="MALI"?(poids<=10?5000:poids<=50?4500:4000):(poids<=10?5500:poids<=50?5000:4500); return Math.round(poids*p); }
function genCode(dest: string, i: number) { return `${dest==="COTE_DIVOIRE"?"CI":"ML"}-2025-${String(10000+i).padStart(5,"0")}`; }
function genToken() { return crypto.randomBytes(24).toString("hex"); }
function randDate(daysAgo: number) { const d=new Date(); d.setDate(d.getDate()-Math.floor(Math.random()*daysAgo)); return d; }

const statutsDistrib = [
  {s:"ENREGISTRE",w:10},{s:"EN_COURS_ENVOI",w:12},{s:"EN_TRANSIT",w:18},
  {s:"ARRIVE_AGENCE",w:15},{s:"PRET_RETIRER",w:12},{s:"LIVRE",w:22},
  {s:"LITIGE",w:6},{s:"ANNULE",w:5},
];
function pickStatut() { const total=statutsDistrib.reduce((a,x)=>a+x.w,0); let r=Math.random()*total; for(const {s,w} of statutsDistrib){r-=w;if(r<=0)return s;} return "LIVRE"; }

const progression: Record<string,string[]> = {
  ENREGISTRE:    ["ENREGISTRE"],
  EN_COURS_ENVOI:["ENREGISTRE","EN_COURS_ENVOI"],
  EN_TRANSIT:    ["ENREGISTRE","EN_COURS_ENVOI","EN_TRANSIT"],
  ARRIVE_AGENCE: ["ENREGISTRE","EN_COURS_ENVOI","EN_TRANSIT","ARRIVE_AGENCE"],
  PRET_RETIRER:  ["ENREGISTRE","EN_COURS_ENVOI","EN_TRANSIT","ARRIVE_AGENCE","PRET_RETIRER"],
  LIVRE:         ["ENREGISTRE","EN_COURS_ENVOI","EN_TRANSIT","ARRIVE_AGENCE","PRET_RETIRER","LIVRE"],
  LITIGE:        ["ENREGISTRE","EN_COURS_ENVOI","EN_TRANSIT","LITIGE"],
  ANNULE:        ["ENREGISTRE","ANNULE"],
};
const statutNotes: Record<string,string[]> = {
  ENREGISTRE:    ["Colis enregistré à l'agence Chine"],
  EN_COURS_ENVOI:["Colis remis au transporteur"],
  EN_TRANSIT:    ["En transit douanier","Vol cargo en cours"],
  ARRIVE_AGENCE: ["Arrivé à l'agence destination"],
  PRET_RETIRER:  ["Client notifié par SMS"],
  LIVRE:         ["Remis au client, solde encaissé"],
  LITIGE:        ["Colis endommagé à l'ouverture","Colis introuvable"],
  ANNULE:        ["Annulé à la demande du client"],
};

async function main() {
  console.log("🌱 Seeding 100 colis...\n");

  // Agences — findOrCreate (pas de transaction)
  await findOrCreateAgence(1, { nom:"Agence Chine", pays:"CHINE", ville:"Guangzhou", active:true });
  await findOrCreateAgence(2, { nom:"Agence Mali", pays:"MALI", ville:"Bamako", active:true });
  await findOrCreateAgence(3, { nom:"Agence Côte d'Ivoire", pays:"COTE_DIVOIRE", ville:"Abidjan", active:true });

  // Tarifs — findOrCreate
  const tarifMali = await findOrCreateTarif(1, "Tarif Standard Mali", "MALI");
  const tarifCI   = await findOrCreateTarif(2, "Tarif Standard Côte d'Ivoire", "COTE_DIVOIRE");
  console.log("✅ Agences & Tarifs\n");

  // Utilisateurs — findOrCreate (account créé séparément)
  const superAdmin = await findOrCreateUser("admin@packagetracker.com", {
    name:"Super Admin", firstname:"Super", lastname:"Admin",
    phone:"+22300000000", role:"SUPER_ADMIN", mustChangePassword:false, active:true,
  }, "Admin@1234");

  const agentChine = await findOrCreateUser("agent.chine@packagetracker.com", {
    name:"Agent Chine", firstname:"Zhang", lastname:"Wei",
    phone:"+8613812345678", role:"AGENT_CHINE", agenceId:1, mustChangePassword:false, active:true,
  }, "Agent@1234");

  const agentMali = await findOrCreateUser("agent.mali@packagetracker.com", {
    name:"Agent Mali", firstname:"Mamadou", lastname:"Koné",
    phone:"+22376543210", role:"AGENT_MALI", agenceId:2, mustChangePassword:false, active:true,
  }, "Agent@1234");

  const agentCI = await findOrCreateUser("agent.ci@packagetracker.com", {
    name:"Agent CI", firstname:"Kouassi", lastname:"Yao",
    phone:"+2250708123456", role:"AGENT_CI", agenceId:3, mustChangePassword:false, active:true,
  }, "Agent@1234");

  console.log("✅ Utilisateurs créés");
  console.log("   admin@packagetracker.com       → Admin@1234");
  console.log("   agent.chine@packagetracker.com → Agent@1234");
  console.log("   agent.mali@packagetracker.com  → Agent@1234");
  console.log("   agent.ci@packagetracker.com    → Agent@1234\n");

  // 100 Colis — create séquentiel (pas de nested creates)
  let created = 0;

  for (let i = 0; i < 100; i++) {
    const destination = Math.random() > 0.45 ? "MALI" : "COTE_DIVOIRE";
    const isMali      = destination === "MALI";
    const pays        = isMali ? "ML" : "CI" as "ML"|"CI";
    const villes      = isMali ? villesMali : villesCI;
    const tarifId     = isMali ? tarifMali.id : tarifCI.id;
    const agenceDestId = isMali ? 2 : 3;
    const agentDest   = isMali ? agentMali : agentCI;

    const poids    = randPoids();
    const prixTotal = calcPrix(poids, destination);
    const avance   = Math.round(prixTotal * (0.3 + Math.random() * 0.3));
    const solde    = prixTotal - avance;
    const statut   = pickStatut();
    const isLivre  = statut === "LIVRE";
    const isAnnule = statut === "ANNULE";
    const createdAt = randDate(120);

    // Colis (sans nested creates)
    const colis = await prisma.colis.create({
      data: {
        code: genCode(destination, i + 1),
        tokenPublic: genToken(),
        description: rand(descriptions),
        poids,
        destination,
        statut,
        agenceOrigineId: 1,
        agenceDestinationId: agenceDestId,
        tarifId,
        agentId: agentChine.id,
        expediteurNom: `${rand(prenoms)} ${rand(noms)}`,
        expediteurPhone: randPhone("ML"),
        destinataireNom: `${rand(prenoms)} ${rand(noms)}`,
        destinatairePhone: randPhone(pays),
        destinataireVille: rand(villes),
        prixTotal: isAnnule ? 0 : prixTotal,
        avance: isAnnule ? 0 : avance,
        solde: isAnnule ? 0 : solde,
        avancePaye: !isAnnule,
        soldePaye: isLivre,
        createdAt,
        updatedAt: createdAt,
      },
    });

    // Historique — creates séparés
    const steps = progression[statut] ?? [statut];
    let histDate = new Date(createdAt);
    for (const s of steps) {
      histDate = new Date(histDate.getTime() + 1000 * 60 * 60 * 24 * (2 + Math.random() * 3));
      const agentId = ["ENREGISTRE","EN_COURS_ENVOI"].includes(s) ? agentChine.id : agentDest.id;
      await prisma.colisHistorique.create({
        data: {
          colisId: colis.id,
          statut: s,
          agentId,
          note: rand(statutNotes[s] ?? ["Mise à jour"]),
          createdAt: histDate,
        },
      });
    }

    // Paiements — creates séparés
    if (!isAnnule) {
      await prisma.paiement.create({
        data: { colisId: colis.id, agentId: agentChine.id, type:"AVANCE", montant: avance, note:"Avance à l'enregistrement", createdAt },
      });
    }
    if (isLivre) {
      await prisma.paiement.create({
        data: { colisId: colis.id, agentId: agentDest.id, type:"SOLDE", montant: solde, note:"Solde à la livraison", createdAt: new Date(createdAt.getTime() + 1000*60*60*24*14) },
      });
    }

    created++;
    if (created % 20 === 0) console.log(`   ${created}/100 colis créés...`);
  }

  console.log(`\n✅ ${created} colis créés`);
  console.log("✅ Seed terminé 🎉");
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
