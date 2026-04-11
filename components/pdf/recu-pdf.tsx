import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ColisWithRelations } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 16,
  },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#6b7280", marginTop: 4 },
  code: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#374151" },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: { color: "#6b7280" },
  value: { fontFamily: "Helvetica-Bold" },
  divider: { borderBottom: "1px solid #e5e7eb", marginVertical: 12 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 4,
    borderTop: "1px solid #e5e7eb",
  },
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  totalValue: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  footer: {
    marginTop: 32,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 12,
    color: "#9ca3af",
    fontSize: 8,
    textAlign: "center",
  },
});

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount) + " XOF";
}

interface RecuPdfProps {
  colis: ColisWithRelations;
}

export function RecuPdf({ colis }: RecuPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Package Tracker</Text>
            <Text style={styles.subtitle}>Reçu de prise en charge</Text>
          </View>
          <View>
            <Text style={styles.code}>{colis.code}</Text>
            <Text style={styles.subtitle}>
              {new Date(colis.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>

        {/* Expéditeur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expéditeur</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nom</Text>
            <Text style={styles.value}>{colis.expediteurNom}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Téléphone</Text>
            <Text style={styles.value}>{colis.expediteurPhone}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Destinataire */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destinataire</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nom</Text>
            <Text style={styles.value}>{colis.destinataireNom}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Téléphone</Text>
            <Text style={styles.value}>{colis.destinatairePhone}</Text>
          </View>
          {colis.destinataireVille && (
            <View style={styles.row}>
              <Text style={styles.label}>Ville</Text>
              <Text style={styles.value}>{colis.destinataireVille}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Colis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails du colis</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Destination</Text>
            <Text style={styles.value}>
              {colis.destination === "MALI" ? "Mali" : "Côte d'Ivoire"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Poids</Text>
            <Text style={styles.value}>{colis.poids} kg</Text>
          </View>
          {colis.description && (
            <View style={styles.row}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.value}>{colis.description}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Paiement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paiement</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Prix total</Text>
            <Text style={styles.value}>{formatAmount(colis.prixTotal)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Avance versée</Text>
            <Text style={styles.value}>{formatAmount(colis.avance)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Solde restant</Text>
            <Text style={styles.totalValue}>{formatAmount(colis.solde)}</Text>
          </View>
        </View>

        {/* Public tracking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suivi en ligne</Text>
          <Text>
            {process.env.NEXT_PUBLIC_APP_URL ?? "https://app.com"}/suivi/{colis.tokenPublic}
          </Text>
        </View>

        <Text style={styles.footer}>
          Package Tracker — Chine → Mali & Côte d&apos;Ivoire — Document généré
          le{" "}
          {new Date().toLocaleDateString("fr-FR")}
        </Text>
      </Page>
    </Document>
  );
}
