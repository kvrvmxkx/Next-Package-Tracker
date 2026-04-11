import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ColisWithRelations } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  outer: {
    border: "2px solid #111",
    borderRadius: 4,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  appName: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  code: { fontSize: 12, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  section: { marginBottom: 8 },
  label: { fontSize: 8, color: "#6b7280", textTransform: "uppercase" },
  value: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 1 },
  divider: { borderBottom: "1px dashed #9ca3af", marginVertical: 8 },
  destination: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginVertical: 8,
    padding: 6,
    border: "2px solid #111",
    borderRadius: 4,
  },
  qr: {
    width: 80,
    height: 80,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 8,
  },
});

interface EtiquettePdfProps {
  colis: ColisWithRelations;
}

export function EtiquettePdf({ colis }: EtiquettePdfProps) {
  return (
    <Document>
      <Page size={[283, 340]} style={styles.page}>
        <View style={styles.outer}>
          <View style={styles.header}>
            <Text style={styles.appName}>Package Tracker</Text>
            <Text style={styles.code}>{colis.code}</Text>
          </View>

          <Text style={styles.destination}>
            {colis.destination === "MALI" ? "🇲🇱 MALI" : "🇨🇮 CÔTE D'IVOIRE"}
          </Text>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.label}>Destinataire</Text>
            <Text style={styles.value}>{colis.destinataireNom}</Text>
            <Text>{colis.destinatairePhone}</Text>
            {colis.destinataireVille && (
              <Text>{colis.destinataireVille}</Text>
            )}
            {colis.destinataireAdresse && (
              <Text style={{ fontSize: 9 }}>{colis.destinataireAdresse}</Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.bottomRow}>
            <View>
              <View style={styles.section}>
                <Text style={styles.label}>Poids</Text>
                <Text style={styles.value}>{colis.poids} kg</Text>
              </View>
              {colis.description && (
                <View style={styles.section}>
                  <Text style={styles.label}>Contenu</Text>
                  <Text>{colis.description}</Text>
                </View>
              )}
            </View>
            {colis.qrCode && (
              <Image src={colis.qrCode} style={styles.qr} />
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
