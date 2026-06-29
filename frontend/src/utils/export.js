/**
 * Exports data to MS Excel CSV format
 * @param {Array<string>} headers - Table columns headers
 * @param {Array<Object>} rows - Table raw objects or arrays
 * @param {string} fileName - File name to save
 */
export function exportToExcel(headers, rows, fileName = 'report') {
  // Map row objects or arrays into rows CSV content
  const csvRows = [];
  
  // 1. Headers array
  csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));

  // 2. Data rows
  rows.forEach(row => {
    let values = [];
    if (Array.isArray(row)) {
      values = row.map(v => `"${String(v !== null && v !== undefined ? v : '').replace(/"/g, '""')}"`);
    } else {
      values = Object.keys(row).map(k => {
        const val = row[k];
        return `"${String(val !== null && val !== undefined ? val : '').replace(/"/g, '""')}"`;
      });
    }
    csvRows.push(values.join(','));
  });

  const csvContent = "\uFEFF" + csvRows.join("\n"); // Add UTF-8 BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Invokes browser print dialog for printing tabular layouts as PDF
 */
export function exportToPDF() {
  window.print();
}
