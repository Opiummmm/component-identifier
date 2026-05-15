import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import type { ScanResult, IdentifiedComponent } from '@/lib/ai/schemas';

// Geist sounds great in the UI but needs registration for PDF.
// Helvetica is the safest built-in fallback and renders identically
// on every viewer — perfect for a lab report.

const colors = {
  ink: '#0a0a0f',
  muted: '#6b7280',
  border: '#e5e7eb',
  background: '#ffffff',
  cardBg: '#f9fafb',
  primary: '#d97706', // amber 600
  success: '#059669',
  warning: '#d97706',
};

const categoryHues: Record<string, string> = {
  resistor: '#e3711e',
  capacitor: '#3b82f6',
  inductor: '#9333ea',
  diode: '#16a34a',
  transistor: '#dc2626',
  ic: '#d97706',
  connector: '#0891b2',
  sensor: '#0d9488',
  switch: '#7c3aed',
  led: '#65a30d',
  crystal: '#a855f7',
  other: '#6b7280',
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.ink,
    backgroundColor: colors.background,
  },
  // Cover
  coverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandMark: {
    width: 16,
    height: 16,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  brandName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  reportDate: {
    fontSize: 9,
    color: colors.muted,
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  coverSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 18,
  },
  // Scene image with annotations
  sceneContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  sceneImage: {
    width: '100%',
    objectFit: 'contain',
  },
  marker: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: 2,
  },
  markerNumber: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  // Stats
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    padding: 10,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Summary table
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  summaryRef: {
    width: 24,
    fontSize: 9,
    color: colors.muted,
    fontFamily: 'Helvetica-Bold',
  },
  summaryName: {
    flex: 1,
    fontSize: 9,
  },
  summaryConf: {
    width: 40,
    fontSize: 9,
    color: colors.muted,
    textAlign: 'right',
  },
  // Per-component detail page
  componentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  componentTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  componentMeta: {
    fontSize: 9,
    color: colors.muted,
  },
  confidencePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  detailSection: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 8,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailTable: {
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 4,
  },
  detailTableRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  detailTableRowLast: {
    borderBottomWidth: 0,
  },
  detailKey: {
    flex: 1,
    fontSize: 9,
    color: colors.muted,
  },
  detailValue: {
    flex: 1.4,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  bulletList: {
    gap: 2,
  },
  bulletItem: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  markingChip: {
    backgroundColor: colors.cardBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 4,
    marginBottom: 4,
    fontSize: 9,
    fontFamily: 'Courier',
  },
  markingsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: colors.muted,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
});

function confidenceColor(value: number): { bg: string; fg: string } {
  if (value >= 0.8) return { bg: '#d1fae5', fg: '#065f46' };
  if (value >= 0.6) return { bg: '#fef3c7', fg: '#92400e' };
  return { bg: '#f3f4f6', fg: '#374151' };
}

function PageFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text>Componently · Component Scan Report</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

interface Props {
  result: ScanResult;
  imageDataUrl: string;
  generatedAt: Date;
}

export function ScanPDFDocument({ result, imageDataUrl, generatedAt }: Props) {
  const dateStr = generatedAt.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const overallPct = Math.round(result.overallConfidence * 100);

  return (
    <Document
      title="Component Scan Report"
      author="Componently"
      subject="Electronic component identification"
    >
      {/* Cover page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverHeader}>
          <View style={styles.brand}>
            <View style={styles.brandMark} />
            <Text style={styles.brandName}>Componently</Text>
          </View>
          <Text style={styles.reportDate}>{dateStr}</Text>
        </View>

        <Text style={styles.coverTitle}>Component Scan Report</Text>
        <Text style={styles.coverSubtitle}>
          {result.sceneNotes ?? `${result.sceneType.replace('-', ' ')} analysis`}
        </Text>

        <View style={styles.sceneContainer}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={imageDataUrl} style={styles.sceneImage} />
          {/* Markers as positioned absolutely overlay */}
          {result.components.map((c, i) => {
            const color = categoryHues[c.category] ?? colors.muted;
            const left = `${c.boundingBox.x * 100}%`;
            const top = `${c.boundingBox.y * 100}%`;
            const width = `${c.boundingBox.width * 100}%`;
            const height = `${c.boundingBox.height * 100}%`;

            return (
              <View key={c.id}>
                <View
                  style={[
                    styles.marker,
                    {
                      left,
                      top,
                      width,
                      height,
                      borderColor: color,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.markerNumber,
                    {
                      left,
                      top,
                      transform: 'translate(-7px, -7px)',
                      backgroundColor: color,
                    },
                  ]}
                >
                  <Text>{i + 1}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{result.components.length}</Text>
            <Text style={styles.statLabel}>Components</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{overallPct}%</Text>
            <Text style={styles.statLabel}>Overall confidence</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{result.sceneType.replace('-', ' ')}</Text>
            <Text style={styles.statLabel}>Scene type</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Summary</Text>
        <View>
          {result.components.map((c, i) => (
            <View key={c.id} style={styles.summaryRow}>
              <Text style={styles.summaryRef}>#{i + 1}</Text>
              <Text style={styles.summaryName}>{c.identifiedAs}</Text>
              <Text style={styles.summaryConf}>
                {Math.round(c.confidence * 100)}%
              </Text>
            </View>
          ))}
        </View>

        <PageFooter />
      </Page>

      {/* One detail page per component */}
      {result.components.map((c, i) => (
        <ComponentDetailPage
          key={c.id}
          component={c}
          index={i}
        />
      ))}
    </Document>
  );
}

function ComponentDetailPage({
  component: c,
  index,
}: {
  component: IdentifiedComponent;
  index: number;
}) {
  const color = categoryHues[c.category] ?? colors.muted;
  const conf = confidenceColor(c.confidence);
  const category = c.category.charAt(0).toUpperCase() + c.category.slice(1);

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.componentHeader}>
        <View style={[styles.chip, { backgroundColor: color }]}>
          <Text style={styles.chipText}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.componentTitle}>{c.identifiedAs}</Text>
          <Text style={styles.componentMeta}>
            {category}
            {c.packageType ? ` · ${c.packageType}` : ''}
          </Text>
        </View>
        <Text
          style={[
            styles.confidencePill,
            { backgroundColor: conf.bg, color: conf.fg },
          ]}
        >
          {Math.round(c.confidence * 100)}% confidence
        </Text>
      </View>

      {c.markings.length > 0 && (
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Markings</Text>
          <View style={styles.markingsRow}>
            {c.markings.map((m, idx) => (
              <Text key={idx} style={styles.markingChip}>
                {m}
              </Text>
            ))}
          </View>
        </View>
      )}

      {Object.keys(c.specifications).length > 0 && (
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Specifications</Text>
          <View style={styles.detailTable}>
            {Object.entries(c.specifications).map(([k, v], idx, arr) => (
              <View
                key={k}
                style={[
                  styles.detailTableRow,
                  idx === arr.length - 1 ? styles.detailTableRowLast : {},
                ]}
              >
                <Text style={styles.detailKey}>{k}</Text>
                <Text style={styles.detailValue}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {c.pinout && c.pinout.length > 0 && (
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Pinout</Text>
          <View style={styles.detailTable}>
            {c.pinout.map((p, idx, arr) => (
              <View
                key={p.pin}
                style={[
                  styles.detailTableRow,
                  idx === arr.length - 1 ? styles.detailTableRowLast : {},
                ]}
              >
                <Text style={[styles.detailKey, { flex: 0.3 }]}>{p.pin}</Text>
                <Text style={[styles.detailValue, { flex: 0.5 }]}>{p.label}</Text>
                <Text style={[styles.detailValue, { flex: 1.5 }]}>
                  {p.description}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {c.commonUses.length > 0 && (
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Common uses</Text>
          <View style={styles.bulletList}>
            {c.commonUses.map((u, idx) => (
              <Text key={idx} style={styles.bulletItem}>
                · {u}
              </Text>
            ))}
          </View>
        </View>
      )}

      {c.typicalCircuits.length > 0 && (
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Typical circuits</Text>
          <View style={styles.bulletList}>
            {c.typicalCircuits.map((u, idx) => (
              <Text key={idx} style={styles.bulletItem}>
                · {u}
              </Text>
            ))}
          </View>
        </View>
      )}

      {c.alternatives.length > 0 && (
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Alternatives</Text>
          <View style={styles.bulletList}>
            {c.alternatives.map((u, idx) => (
              <Text key={idx} style={styles.bulletItem}>
                · {u}
              </Text>
            ))}
          </View>
        </View>
      )}

      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>Datasheet</Text>
        <Text style={styles.bulletItem}>{c.datasheetSearchQuery}</Text>
      </View>

      <PageFooter />
    </Page>
  );
}