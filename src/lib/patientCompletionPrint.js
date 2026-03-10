const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const formatCurrency = (amount) => `${Number(amount || 0).toLocaleString('uz-UZ')} so'm`

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' })
}

const buildServicesRows = (services = []) => {
  if (!Array.isArray(services) || services.length === 0) {
    return '<tr><td colspan="5" class="muted">Bajarilgan xizmatlar topilmadi</td></tr>'
  }

  return services.map((service, index) => {
    const visit = service.visitId ? `#${escapeHtml(service.visitId)}` : '-'
    const tooth = service.tooth != null ? `#${escapeHtml(service.tooth)}` : '-'
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${visit}</td>
        <td>${escapeHtml(service.name || 'Xizmat')}</td>
        <td>${tooth}</td>
        <td class="num">${formatCurrency(service.price)}</td>
      </tr>
    `
  }).join('')
}

const buildDiscountRows = (discounts = []) => {
  if (!Array.isArray(discounts) || discounts.length === 0) {
    return '<tr><td colspan="4" class="muted">Chegirmalar qo\'llanmagan</td></tr>'
  }

  return discounts.map((discount, index) => {
    const visit = discount.visitId ? `#${escapeHtml(discount.visitId)}` : '-'
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${visit}</td>
        <td>${escapeHtml(discount.note || '-')}</td>
        <td class="num">-${formatCurrency(discount.amount)}</td>
      </tr>
    `
  }).join('')
}

export const buildPatientCompletionPrintHtml = ({
  clinicName = 'SHIFOCRM',
  patientName = '-',
  patientMedId = '-',
  doctorName = '-',
  visitDate = '',
  services = [],
  discounts = [],
  totalBeforeDiscount = 0,
  totalDiscount = 0,
  totalAfterDiscount = 0,
  paid = 0,
  remaining = 0,
  printedAt = new Date().toISOString()
}) => {
  const title = `Yakuniy hisobot - ${patientName}`
  return `<!doctype html>
<html lang="uz">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; color: #111827; }
    .sheet { width: 100%; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .title { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
    .clinic { font-size: 13px; color: #374151; }
    .meta { font-size: 12px; color: #4b5563; text-align: right; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin: 10px 0 14px; font-size: 13px; }
    .label { color: #6b7280; margin-right: 6px; }
    h3 { margin: 14px 0 8px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 10px; }
    th, td { border: 1px solid #e5e7eb; padding: 6px 8px; vertical-align: top; }
    th { background: #f9fafb; text-align: left; }
    td.num { text-align: right; white-space: nowrap; }
    .muted { color: #6b7280; text-align: center; }
    .totals { margin-top: 8px; width: 360px; margin-left: auto; font-size: 13px; }
    .totals-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #e5e7eb; padding: 5px 0; }
    .totals-row strong { font-size: 14px; }
    .footer { margin-top: 18px; font-size: 11px; color: #6b7280; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <p class="title">Yakuniy davolash hisoboti</p>
        <div class="clinic">Klinika: ${escapeHtml(clinicName)}</div>
      </div>
      <div class="meta">
        <div>Chop etildi: ${escapeHtml(formatDateTime(printedAt))}</div>
      </div>
    </div>

    <div class="grid">
      <div><span class="label">Bemor:</span>${escapeHtml(patientName)}</div>
      <div><span class="label">Med ID:</span>${escapeHtml(patientMedId || '-')}</div>
      <div><span class="label">Shifokor:</span>${escapeHtml(doctorName || '-')}</div>
      <div><span class="label">Yakun sanasi:</span>${escapeHtml(visitDate || '-')}</div>
    </div>

    <h3>Bajarilgan ishlar</h3>
    <table>
      <thead>
        <tr>
          <th style="width:44px">#</th>
          <th style="width:78px">Visit</th>
          <th>Xizmat</th>
          <th style="width:78px">Tish</th>
          <th style="width:130px">Narx</th>
        </tr>
      </thead>
      <tbody>${buildServicesRows(services)}</tbody>
    </table>

    <h3>Chegirmalar</h3>
    <table>
      <thead>
        <tr>
          <th style="width:44px">#</th>
          <th style="width:78px">Visit</th>
          <th>Izoh</th>
          <th style="width:130px">Miqdor</th>
        </tr>
      </thead>
      <tbody>${buildDiscountRows(discounts)}</tbody>
    </table>

    <div class="totals">
      <div class="totals-row"><span>Jami (chegirmagacha)</span><span>${formatCurrency(totalBeforeDiscount)}</span></div>
      <div class="totals-row"><span>Chegirma jami</span><span>-${formatCurrency(totalDiscount)}</span></div>
      <div class="totals-row"><span>Chegirmadan keyin</span><span>${formatCurrency(totalAfterDiscount)}</span></div>
      <div class="totals-row"><span>To'langan</span><span>${formatCurrency(paid)}</span></div>
      <div class="totals-row"><strong>Qolgan qarz</strong><strong>${formatCurrency(remaining)}</strong></div>
    </div>

    <div class="footer">
      <span>ShifoCRM</span>
      <span>Imzo: ____________________</span>
    </div>
  </div>
</body>
</html>`
}

export const openPatientCompletionPrint = (printData) => {
  const html = buildPatientCompletionPrintHtml(printData)
  const popup = window.open('', '_blank', 'width=960,height=900')
  if (!popup) return { ok: false, error: 'POPUP_BLOCKED' }

  popup.document.open()
  popup.document.write(html)
  popup.document.close()

  const printNow = () => {
    popup.focus()
    popup.print()
  }

  if (popup.document.readyState === 'complete') {
    printNow()
  } else {
    popup.onload = printNow
  }

  return { ok: true }
}
