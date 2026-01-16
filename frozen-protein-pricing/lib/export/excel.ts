import ExcelJS from 'exceljs';

export interface ExcelExportProduct {
  product_code: string;
  description: string;
  pack_size: string;
  brand: string;
  availability: string;
  price_per_lb: number;
  warehouse_name: string;
  spec_sheet_url?: string | null;
}

export interface ExcelExportData {
  zone_name: string;
  generated_date: string;
  products: ExcelExportProduct[];
}

export async function generatePriceSheetExcel(
  data: ExcelExportData
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Price Sheet');

  // Set column widths
  worksheet.columns = [
    { header: 'Product Code', key: 'product_code', width: 12 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Pack Size', key: 'pack_size', width: 15 },
    { header: 'Brand', key: 'brand', width: 20 },
    { header: 'Availability', key: 'availability', width: 12 },
    { header: 'Price/lb', key: 'price_per_lb', width: 10 },
    { header: 'Warehouse', key: 'warehouse', width: 20 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Freeze header row
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Group products by warehouse
  const productsByWarehouse = data.products.reduce((acc, product) => {
    const warehouse = product.warehouse_name || 'Unknown';
    if (!acc[warehouse]) {
      acc[warehouse] = [];
    }
    acc[warehouse].push(product);
    return acc;
  }, {} as Record<string, ExcelExportProduct[]>);

  // Add products grouped by warehouse
  let rowIndex = 2;
  let isAlternate = false;

  Object.entries(productsByWarehouse).forEach(([warehouse, products]) => {
    products.forEach((product) => {
      const row = worksheet.addRow({
        product_code: product.product_code,
        description: product.description,
        pack_size: product.pack_size,
        brand: product.brand,
        availability: product.availability,
        price_per_lb: product.price_per_lb,
        warehouse: product.warehouse_name,
      });

      // Alternating row colors
      if (isAlternate) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' },
        };
      }

      // Format price as currency
      const priceCell = row.getCell('price_per_lb');
      priceCell.numFmt = '$0.00';

      // Add hyperlink to spec sheet if available - strict validation with domain whitelist
      if (product.spec_sheet_url) {
        const url = product.spec_sheet_url.trim();
        // Only allow https:// URLs from explicitly trusted domains
        // Prevent javascript:, data:, file:// and malicious HTTPS URLs
        try {
          const urlObj = new URL(url);
          // Strict protocol check
          if (urlObj.protocol !== 'https:') {
            throw new Error('Only HTTPS allowed');
          }
          // Whitelist trusted domains (customize for your use case)
          const trustedDomains = [
            'drive.google.com',
            'docs.google.com',
            'dropbox.com',
            'box.com',
            's3.amazonaws.com',
            'cloudfront.net',
          ];
          const isTrustedDomain = trustedDomains.some(
            (domain) => urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
          );
          // Validate hostname format (prevent unicode/homograph attacks)
          const isValidHostname = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i.test(
            urlObj.hostname
          );
          // Prevent URL shorteners and suspicious patterns
          const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co'];
          const isSuspicious = suspiciousDomains.some(
            (domain) => urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
          );

          if (isTrustedDomain && isValidHostname && !isSuspicious) {
            const descCell = row.getCell('description');
            descCell.value = {
              text: product.description,
              hyperlink: url,
            };
            descCell.font = { color: { argb: 'FF0563C1' }, underline: true };
          }
          // If not trusted, silently skip hyperlink (don't render it at all)
        } catch {
          // Invalid URL - skip hyperlink
        }
      }

      rowIndex++;
      isAlternate = !isAlternate;
    });
  });

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Generate buffer
  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}
