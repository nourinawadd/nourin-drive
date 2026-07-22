// Builds the CV as a real vector PDF in the browser and downloads it directly —
// no print dialog, selectable text (not an image). @react-pdf/renderer and the
// document are dynamically imported so they stay out of the initial bundle and
// only load when the user actually clicks Export.

export async function exportCvPdf(): Promise<void> {
  const [{ pdf }, { CVDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./CVDocument"),
  ]);

  const blob = await pdf(<CVDocument />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Nourin-Awad-CV.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
