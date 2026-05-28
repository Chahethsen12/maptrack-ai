import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { haversine, formatDist, buildMatrix, formatDate } from '../utils'

const TEAL   = [0, 212, 170]
const DARK   = [13, 17, 23]
const SURFACE = [22, 27, 34]
const MUTED  = [139, 148, 158]
const TEXT   = [230, 237, 243]

function distFill(km) {
  if (km === 0)  return [30, 40, 50]
  if (km < 1)    return [0, 80, 65]
  if (km < 10)   return [20, 50, 100]
  if (km < 50)   return [90, 65, 0]
  return                [100, 30, 40]
}

export async function exportPDF({ places, userLoc }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  let y = 0

  // ── Cover header ───────────────────────────────────────────────────────
  doc.setFillColor(...DARK)
  doc.rect(0, 0, W, 38, 'F')

  doc.setFillColor(...TEAL)
  doc.rect(0, 0, 4, 38, 'F')

  doc.setTextColor(...TEAL)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('MapTrack AI', 12, 16)

  doc.setTextColor(...MUTED)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Remember places smarter.', 12, 23)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 12, 29)
  doc.text(`Total places: ${places.length}`, 12, 35)

  if (userLoc) {
    doc.text(`Your location: ${userLoc.lat.toFixed(5)}, ${userLoc.lng.toFixed(5)}`, W / 2, 29)
  }

  y = 46

  // ── Section 1: Places list ─────────────────────────────────────────────
  doc.setFillColor(...SURFACE)
  doc.rect(0, y - 5, W, 10, 'F')
  doc.setTextColor(...TEAL)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('01  Saved Places', 10, y + 1)
  y += 10

  const placeRows = places.map((p, i) => {
    const distVal = userLoc
      ? formatDist(haversine(userLoc.lat, userLoc.lng, p.lat, p.lng))
      : 'N/A'
    return [
      i + 1,
      p.title,
      p.category,
      p.note ? p.note.slice(0, 60) + (p.note.length > 60 ? '…' : '') : '',
      `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`,
      distVal,
      formatDate(p.created_at),
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [['#', 'Title', 'Category', 'Note', 'Coordinates', 'Distance from me', 'Saved']],
    body: placeRows,
    styles: {
      fontSize: 8,
      fillColor: DARK,
      textColor: TEXT,
      lineColor: [30, 37, 48],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: SURFACE,
      textColor: TEAL,
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [16, 21, 28] },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center', textColor: MUTED },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 20 },
      3: { cellWidth: 45 },
      4: { cellWidth: 28, textColor: MUTED, fontSize: 7 },
      5: { cellWidth: 22, halign: 'right', textColor: TEAL, fontStyle: 'bold' },
      6: { cellWidth: 20, textColor: MUTED, fontSize: 7 },
    },
    margin: { left: 10, right: 10 },
    theme: 'grid',
  })

  y = doc.lastAutoTable.finalY + 14

  // ── Section 2: Distance matrix ─────────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20 }

  doc.setFillColor(...SURFACE)
  doc.rect(0, y - 5, W, 10, 'F')
  doc.setTextColor(...TEAL)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('02  Distance Matrix (all places ↔ all places)', 10, y + 1)
  y += 10

  const matrix = buildMatrix(places)
  const shortLabels = places.map(p => p.title.length > 10 ? p.title.slice(0, 9) + '…' : p.title)

  const matrixRows = matrix.map((row, i) => [
    shortLabels[i],
    ...row.map((km, j) => (i === j ? '—' : formatDist(km))),
  ])

  // Colour-code body cells
  const didParseCell = (data) => {
    if (data.section === 'body' && data.column.index > 0) {
      const rowI = data.row.index
      const colJ = data.column.index - 1
      if (rowI !== colJ) {
        const km = matrix[rowI][colJ]
        doc.setFillColor(...distFill(km))
      }
    }
  }

  autoTable(doc, {
    startY: y,
    head: [['', ...shortLabels]],
    body: matrixRows,
    styles: {
      fontSize: 7,
      fillColor: DARK,
      textColor: TEXT,
      lineColor: [30, 37, 48],
      lineWidth: 0.15,
      cellPadding: 1.5,
      halign: 'right',
    },
    headStyles: {
      fillColor: SURFACE,
      textColor: TEAL,
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
    },
    columnStyles: {
      0: { fillColor: SURFACE, textColor: MUTED, fontStyle: 'bold', halign: 'left' },
    },
    didParseCell,
    margin: { left: 10, right: 10 },
    theme: 'grid',
  })

  y = doc.lastAutoTable.finalY + 10

  // ── Legend ─────────────────────────────────────────────────────────────
  doc.setFontSize(7)
  doc.setTextColor(...MUTED)
  doc.text('Distance legend:', 10, y)
  const legend = [
    { color: [0, 80, 65],   label: '< 1 km' },
    { color: [20, 50, 100], label: '1–10 km' },
    { color: [90, 65, 0],   label: '10–50 km' },
    { color: [100, 30, 40], label: '> 50 km' },
  ]
  let lx = 40
  legend.forEach(({ color, label }) => {
    doc.setFillColor(...color)
    doc.rect(lx, y - 3, 4, 4, 'F')
    doc.setTextColor(...TEXT)
    doc.text(label, lx + 5.5, y)
    lx += 24
  })

  // ── Footer on every page ───────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(...DARK)
    doc.rect(0, 287, W, 10, 'F')
    doc.setTextColor(...MUTED)
    doc.setFontSize(7)
    doc.text('MapTrack AI  ·  Remember places smarter.', 10, 293)
    doc.text(`Page ${i} / ${pageCount}`, W - 10, 293, { align: 'right' })
  }

  doc.save(`MapTrack-AI-Report-${Date.now()}.pdf`)
}
