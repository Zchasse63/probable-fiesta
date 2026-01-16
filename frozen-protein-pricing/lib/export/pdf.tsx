import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 36, // 0.5 inch
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subHeaderText: {
    fontSize: 10,
    color: '#666',
  },
  warehouseSection: {
    marginTop: 15,
    marginBottom: 10,
  },
  warehouseName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  table: {
    width: '100%',
    marginTop: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
    paddingVertical: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '2 solid #000',
    paddingVertical: 6,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
  },
  colCode: { width: '12%', paddingHorizontal: 2 },
  colDescription: { width: '30%', paddingHorizontal: 2 },
  colPack: { width: '15%', paddingHorizontal: 2 },
  colBrand: { width: '18%', paddingHorizontal: 2 },
  colAvail: { width: '12%', paddingHorizontal: 2 },
  colPrice: { width: '13%', paddingHorizontal: 2, textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 36,
    right: 36,
    borderTop: '1 solid #000',
    paddingTop: 10,
    fontSize: 8,
    color: '#666',
  },
  footerText: {
    marginBottom: 3,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    right: 36,
    fontSize: 8,
    color: '#666',
  },
});

export interface PDFExportProduct {
  product_code: string;
  description: string;
  pack_size: string;
  brand: string;
  availability: string;
  price_per_lb: number;
  warehouse_name: string;
  spec_sheet_url?: string | null;
}

export interface PDFExportData {
  zone_name: string;
  generated_date: string;
  products: PDFExportProduct[];
}

export const PriceSheetPDF: React.FC<{ data: PDFExportData }> = ({ data }) => {
  // Group products by warehouse
  const productsByWarehouse = data.products.reduce((acc, product) => {
    const warehouse = product.warehouse_name || 'Unknown';
    if (!acc[warehouse]) {
      acc[warehouse] = [];
    }
    acc[warehouse].push(product);
    return acc;
  }, {} as Record<string, PDFExportProduct[]>);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Price Sheet - {data.zone_name}</Text>
          <Text style={styles.subHeaderText}>Generated: {data.generated_date}</Text>
        </View>

        {/* Products grouped by warehouse */}
        {Object.entries(productsByWarehouse).map(([warehouse, products]) => (
          <View key={warehouse} style={styles.warehouseSection}>
            <Text style={styles.warehouseName}>{warehouse}</Text>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.colCode}>Code</Text>
              <Text style={styles.colDescription}>Description</Text>
              <Text style={styles.colPack}>Pack</Text>
              <Text style={styles.colBrand}>Brand</Text>
              <Text style={styles.colAvail}>Availability</Text>
              <Text style={styles.colPrice}>Price/lb</Text>
            </View>

            {/* Table Rows */}
            {products.map((product, index) => {
              // Validate spec_sheet_url before rendering
              let validatedUrl: string | undefined;
              if (product.spec_sheet_url) {
                try {
                  const urlObj = new URL(product.spec_sheet_url.trim());
                  // Only allow HTTPS from trusted domains
                  if (urlObj.protocol === 'https:') {
                    const trustedDomains = [
                      'drive.google.com',
                      'docs.google.com',
                      'dropbox.com',
                      'box.com',
                      's3.amazonaws.com',
                      'cloudfront.net',
                    ];
                    const isTrusted = trustedDomains.some(
                      (domain) =>
                        urlObj.hostname === domain ||
                        urlObj.hostname.endsWith('.' + domain)
                    );
                    // Validate hostname format (prevent unicode/homograph attacks)
                    const isValidHostname = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i.test(
                      urlObj.hostname
                    );
                    if (isTrusted && isValidHostname) {
                      validatedUrl = product.spec_sheet_url.trim();
                    }
                  }
                } catch {
                  // Invalid URL - skip hyperlink
                }
              }

              return (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.colCode}>{product.product_code}</Text>
                  <Text style={styles.colDescription}>{product.description}</Text>
                  <Text style={styles.colPack}>{product.pack_size}</Text>
                  <Text style={styles.colBrand}>{product.brand}</Text>
                  <Text style={styles.colAvail}>{product.availability}</Text>
                  <Text style={styles.colPrice}>
                    ${product.price_per_lb.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Payment Terms: Net 30 days</Text>
          <Text style={styles.footerText}>
            Delivery: FOB warehouse. Freight charges apply.
          </Text>
          <Text style={styles.footerText}>
            Prices subject to change without notice.
          </Text>
        </View>

        {/* Page Number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};
