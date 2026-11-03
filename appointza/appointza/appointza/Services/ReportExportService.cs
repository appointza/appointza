using appointza.Models;
using PdfSharpCore.Drawing;
using PdfSharpCore.Pdf;
using System.Globalization;
using System.Text;
using System.Xml.Linq;

namespace appointza.Services
{
    public class ReportExportService
    {
        private readonly ReportExecutionService _execution;
        private readonly ReportDefinitionService _definitions;

        public ReportExportService(ReportExecutionService execution, ReportDefinitionService definitions)
        {
            _execution = execution;
            _definitions = definitions;
        }

        public async Task<(byte[] bytes, string contentType, string fileName)> ExportForOrganisation(
            long reportId,
            ReportExportReq req)
        {
            var format = (req.format ?? "csv").Trim().ToLowerInvariant();
            var executed = await _execution.ExecuteForOrganisation(reportId, new ReportExecuteReq
            {
                parameters = req.parameters ?? new(),
            });

            var report = executed.report
                ?? await _definitions.GetById(reportId)
                ?? throw new Exception("Report not found.");

            // View already enforced during execute; re-check export permission.
            await _execution.EnsureOrgCanExport(report);

            if (format is "excel" or "xlsx" or "xls")
            {
                if (!report.export_excel) throw new Exception("Excel export is disabled for this report.");
            }
            else if (format == "pdf")
            {
                if (!report.export_pdf) throw new Exception("PDF export is disabled for this report.");
            }
            else if (!report.export_csv)
            {
                throw new Exception("CSV export is disabled for this report.");
            }

            var safeName = SanitizeFileName(string.IsNullOrWhiteSpace(report.name) ? "report" : report.name);

            return format switch
            {
                "excel" or "xlsx" or "xls" => (
                    BuildExcelXml(report, executed),
                    "application/vnd.ms-excel",
                    $"{safeName}.xls"),
                "pdf" => (
                    BuildPdf(report, executed),
                    "application/pdf",
                    $"{safeName}.pdf"),
                _ => (
                    Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(BuildCsv(report, executed))).ToArray(),
                    "text/csv; charset=utf-8",
                    $"{safeName}.csv"),
            };
        }

        public async Task<(byte[] bytes, string contentType, string fileName)> ExportPreview(
            ReportPreviewReq previewReq,
            string format)
        {
            var executed = await _execution.Preview(previewReq);
            var report = executed.report ?? new ReportDefinitionDto
            {
                name = "preview",
                columns = executed.columns.Select((c, i) => new ReportColumnDto
                {
                    column_key = c,
                    display_name = c,
                    is_visible = true,
                    sort_order = i,
                }).ToList(),
            };
            var safeName = SanitizeFileName(report.name);
            var f = (format ?? "csv").Trim().ToLowerInvariant();
            return f switch
            {
                "excel" or "xlsx" or "xls" => (BuildExcelXml(report, executed), "application/vnd.ms-excel", $"{safeName}.xls"),
                "pdf" => (BuildPdf(report, executed), "application/pdf", $"{safeName}.pdf"),
                _ => (
                    Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(BuildCsv(report, executed))).ToArray(),
                    "text/csv; charset=utf-8",
                    $"{safeName}.csv"),
            };
        }

        private static List<ReportColumnDto> VisibleColumns(ReportDefinitionDto report, ReportExecutionResult data)
        {
            if (report.columns != null && report.columns.Count > 0)
            {
                return report.columns
                    .Where(c => c.is_visible)
                    .OrderBy(c => c.sort_order)
                    .ThenBy(c => c.display_name)
                    .ToList();
            }
            return data.columns.Select((c, i) => new ReportColumnDto
            {
                column_key = c,
                display_name = c,
                is_visible = true,
                sort_order = i,
            }).ToList();
        }

        private static string Cell(Dictionary<string, object?> row, string key)
        {
            if (row.TryGetValue(key, out var v) && v != null) return Convert.ToString(v, CultureInfo.InvariantCulture) ?? "";
            var match = row.FirstOrDefault(kv => string.Equals(kv.Key, key, StringComparison.OrdinalIgnoreCase));
            return match.Key == null || match.Value == null
                ? ""
                : Convert.ToString(match.Value, CultureInfo.InvariantCulture) ?? "";
        }

        private static string BuildCsv(ReportDefinitionDto report, ReportExecutionResult data)
        {
            var cols = VisibleColumns(report, data);
            var sb = new StringBuilder();
            sb.AppendLine(string.Join(",", cols.Select(c => EscapeCsv(c.display_name.Length > 0 ? c.display_name : c.column_key))));
            foreach (var row in data.rows)
            {
                sb.AppendLine(string.Join(",", cols.Select(c => EscapeCsv(Cell(row, c.column_key)))));
            }
            return sb.ToString();
        }

        private static string EscapeCsv(string value)
        {
            if (value.Contains('"') || value.Contains(',') || value.Contains('\n') || value.Contains('\r'))
                return $"\"{value.Replace("\"", "\"\"")}\"";
            return value;
        }

        private static byte[] BuildExcelXml(ReportDefinitionDto report, ReportExecutionResult data)
        {
            var cols = VisibleColumns(report, data);
            XNamespace ss = "urn:schemas-microsoft-com:office:spreadsheet";
            var rows = new List<XElement>
            {
                new XElement(ss + "Row",
                    cols.Select(c => new XElement(ss + "Cell",
                        new XElement(ss + "Data",
                            new XAttribute(ss + "Type", "String"),
                            c.display_name.Length > 0 ? c.display_name : c.column_key))))
            };
            foreach (var row in data.rows)
            {
                rows.Add(new XElement(ss + "Row",
                    cols.Select(c => new XElement(ss + "Cell",
                        new XElement(ss + "Data",
                            new XAttribute(ss + "Type", "String"),
                            Cell(row, c.column_key))))));
            }

            var doc = new XDocument(
                new XDeclaration("1.0", "utf-8", "yes"),
                new XElement(ss + "Workbook",
                    new XAttribute(XNamespace.Xmlns + "ss", ss),
                    new XElement(ss + "Worksheet",
                        new XAttribute(ss + "Name", "Report"),
                        new XElement(ss + "Table", rows))));

            using var ms = new MemoryStream();
            using (var writer = new StreamWriter(ms, new UTF8Encoding(false), leaveOpen: true))
            {
                doc.Save(writer);
            }
            return ms.ToArray();
        }

        private static byte[] BuildPdf(ReportDefinitionDto report, ReportExecutionResult data)
        {
            var cols = VisibleColumns(report, data);
            var document = new PdfDocument();
            document.Info.Title = report.name;

            var page = document.AddPage();
            page.Orientation = PdfSharpCore.PageOrientation.Landscape;
            var gfx = XGraphics.FromPdfPage(page);
            var titleFont = new XFont("Arial", 14, XFontStyle.Bold);
            var headerFont = new XFont("Arial", 8, XFontStyle.Bold);
            var cellFont = new XFont("Arial", 7, XFontStyle.Regular);

            double margin = 28;
            double y = margin;
            gfx.DrawString(report.name, titleFont, XBrushes.Black, new XRect(margin, y, page.Width - margin * 2, 20), XStringFormats.TopLeft);
            y += 24;
            gfx.DrawString($"Rows: {data.row_count}  ·  Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC",
                cellFont, XBrushes.Gray, new XRect(margin, y, page.Width - margin * 2, 12), XStringFormats.TopLeft);
            y += 18;

            double usableWidth = page.Width - margin * 2;
            double colWidth = cols.Count == 0 ? usableWidth : usableWidth / cols.Count;
            double rowHeight = 14;

            void DrawHeader()
            {
                double x = margin;
                foreach (var c in cols)
                {
                    var label = c.display_name.Length > 0 ? c.display_name : c.column_key;
                    gfx.DrawRectangle(XBrushes.LightGray, x, y, colWidth, rowHeight);
                    gfx.DrawString(Truncate(label, 28), headerFont, XBrushes.Black,
                        new XRect(x + 2, y + 2, colWidth - 4, rowHeight - 2), XStringFormats.TopLeft);
                    x += colWidth;
                }
                y += rowHeight;
            }

            DrawHeader();

            foreach (var row in data.rows)
            {
                if (y + rowHeight > page.Height - margin)
                {
                    page = document.AddPage();
                    page.Orientation = PdfSharpCore.PageOrientation.Landscape;
                    gfx = XGraphics.FromPdfPage(page);
                    y = margin;
                    DrawHeader();
                }

                double x = margin;
                foreach (var c in cols)
                {
                    gfx.DrawString(Truncate(Cell(row, c.column_key), 36), cellFont, XBrushes.Black,
                        new XRect(x + 2, y + 2, colWidth - 4, rowHeight - 2), XStringFormats.TopLeft);
                    x += colWidth;
                }
                y += rowHeight;
            }

            using var stream = new MemoryStream();
            document.Save(stream, false);
            return stream.ToArray();
        }

        private static string Truncate(string value, int max) =>
            string.IsNullOrEmpty(value) ? "" : value.Length <= max ? value : value[..(max - 1)] + "…";

        private static string SanitizeFileName(string name)
        {
            var invalid = Path.GetInvalidFileNameChars();
            var cleaned = new string(name.Select(ch => invalid.Contains(ch) ? '_' : ch).ToArray()).Trim();
            return string.IsNullOrWhiteSpace(cleaned) ? "report" : cleaned.Replace(' ', '_');
        }
    }
}
