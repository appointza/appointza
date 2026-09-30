import { createFileRoute } from "@tanstack/react-router";
import { jsPDF } from "jspdf";
import { Download, FileSpreadsheet, FileText, RotateCcw, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import appointzaFullLogoAsset from "@/assets/appointza-full-logo.png.asset.json";
import appointzaMark from "@/assets/appointza-mark.png";
import signatureImage from "@/assets/appointza-signature.png";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Internship Document Generator | Appointza" },
      { name: "description", content: "Create and download personalized Appointza internship acceptance letters and certificates." },
      { property: "og:title", content: "Appointza Internship Document Generator" },
      { property: "og:description", content: "Create personalized internship letters and certificates in your browser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentGenerator,
});

type DocumentType = "letter" | "certificate";
type PrintMode = "letter" | "certificate" | "both" | null;

type FormData = {
  name: string;
  startDate: string;
  endDate: string;
  reportTo: string;
  year: string;
  course: string;
  department: string;
  institution: string;
  learningTopic: string;
  issueDate: string;
  pronoun: "he" | "she" | "they";
  signatory: string;
  designation: string;
};

type ImportedPerson = FormData & {
  id: string;
  rowNumber: number;
};

const initialData: FormData = {
  name: "Sanjay",
  startDate: "2026-06-01",
  endDate: "2026-06-23",
  reportTo: "Mr. Aravindan M",
  year: "2nd Year",
  course: "B.Com ISM",
  department: "Information Systems Management",
  institution: "SRM Institute of Science and Technology, Kattankulathur",
  learningTopic: "software product development",
  issueDate: "2026-06-23",
  pronoun: "he",
  signatory: "Sumathiraj M",
  designation: "Founder",
};

const pronouns = {
  he: { subject: "he", possessive: "his", object: "him" },
  she: { subject: "she", possessive: "her", object: "her" },
  they: { subject: "they", possessive: "their", object: "them" },
};

const emptyCertificateData: FormData = {
  name: "",
  startDate: "",
  endDate: "",
  reportTo: "",
  year: "",
  course: "",
  department: "",
  institution: "",
  learningTopic: "",
  issueDate: "",
  pronoun: "they",
  signatory: initialData.signatory,
  designation: initialData.designation,
};

const columnAliases: Record<keyof FormData, string[]> = {
  name: ["full name", "name", "student name", "intern name"],
  startDate: ["start date", "internship start date", "from date"],
  endDate: ["end date", "internship end date", "to date"],
  reportTo: ["report to", "report to name", "reporting person", "reporting manager", "supervisor"],
  year: ["year", "study year", "academic year"],
  course: ["course", "degree", "programme", "program"],
  department: ["department", "dept", "branch"],
  institution: ["institution name", "institution", "college name", "college", "university"],
  learningTopic: ["what they learned", "what they learnt", "learning topic", "basics of", "topic"],
  issueDate: ["issue date", "certificate date", "date of issue"],
  pronoun: ["pronouns", "pronoun", "gender"],
  signatory: ["signatory", "signatory name", "authorized by"],
  designation: ["designation", "signatory designation", "title"],
};

function normalizeHeader(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizePronoun(value: unknown): FormData["pronoun"] {
  const normalized = normalizeHeader(value);
  if (["he", "him", "male", "he him"].includes(normalized)) return "he";
  if (["she", "her", "female", "she her"].includes(normalized)) return "she";
  return "they";
}

function toInputDate(value: unknown, parseExcelDate: (serial: number) => { y: number; m: number; d: number } | null) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  if (typeof value === "number") {
    const parsed = parseExcelDate(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  const text = String(value ?? "").trim();
  if (!text) return "";
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

function safeFilename(name: string) {
  const safe = name.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  return `${safe || "intern"}-internship-documents.pdf`;
}

async function imageToDataUrl(source: string) {
  const response = await fetch(source);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not load certificate image."));
    reader.readAsDataURL(blob);
  });
}

function drawAcceptanceLetter(doc: jsPDF, data: FormData, logo: string, signature: string) {
  doc.addImage(logo, "PNG", 91, 20, 28, 28);
  doc.setTextColor(226, 129, 45);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Appointza", 105, 53, { align: "center" });
  doc.setTextColor(32, 34, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(130, 132, 138);
  doc.text("Appointza Team", 27, 74);
  doc.setTextColor(32, 34, 38);
  doc.setFontSize(25);
  doc.text("Internship Acceptance Letter", 27, 86);
  doc.setFontSize(10);
  doc.setTextColor(130, 132, 138);
  doc.text("Dear", 27, 101);
  doc.setTextColor(32, 34, 38);
  doc.setFont("helvetica", "bold");
  doc.text((data.name || "RECIPIENT").toUpperCase(), 38, 101);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const paragraphs = [
    "We are pleased to inform you that your application for the internship position at Appointza has been accepted.",
    `Your internship will commence on ${formatDate(data.startDate, "long").toUpperCase()} and continue until ${formatDate(data.endDate, "long").toUpperCase()}. Please report to ${data.reportTo || "the designated supervisor"} on your first day.`,
    "We look forward to your contributions and growth during this internship.",
    "Please report on your first day to the designated location and supervisor to begin your successful internship experience.",
  ];
  let y = 132;
  for (const paragraph of paragraphs) {
    const lines = doc.splitTextToSize(paragraph, 156) as string[];
    doc.text(lines, 27, y, { lineHeightFactor: 1.55 });
    y += lines.length * 6.5 + 8;
  }
  doc.addImage(signature, "PNG", 27, 218, 42, 21);
  doc.setFontSize(11);
  doc.text("Sincerely,", 27, 244);
  doc.setFontSize(9);
  doc.setTextColor(130, 132, 138);
  doc.text(data.signatory || initialData.signatory, 27, 251);
  doc.setDrawColor(212, 77, 112);
  doc.setLineWidth(1.2);
  doc.line(27, 279, 105, 279);
  doc.setDrawColor(232, 139, 43);
  doc.line(105, 279, 183, 279);
}

function drawCertificate(doc: jsPDF, data: FormData, logo: string, signature: string) {
  const p = pronouns[data.pronoun];
  doc.addImage(logo, "PNG", 20, 18, 105, 35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const paragraphs = [
    `This is to certify that ${data.name || "Full Name"} from ${data.institution || "Institution Name"}, pursuing ${data.course || "Course"} in the ${data.department || "Department"} during the academic year ${data.year || "Year"}, has successfully completed an internship at Appointza from ${formatDate(data.startDate, "long")} to ${formatDate(data.endDate, "long")}.`,
    `During this internship, ${p.subject} gained valuable knowledge, practical experience, and skills in ${data.learningTopic || "What They Learned"}.`,
    `We appreciate ${data.name || "Full Name"} for ${p.possessive} dedication and contribution during the internship and wish ${p.object} continued success in future endeavors.`,
  ];
  let y = 68;
  for (const paragraph of paragraphs) {
    const lines = doc.splitTextToSize(paragraph, 170) as string[];
    doc.text(lines, 20, y, { lineHeightFactor: 1.55 });
    y += lines.length * 7 + 8;
  }
  doc.setDrawColor(226, 230, 235);
  doc.setLineWidth(5);
  doc.line(93, 152, 205, 235);
  doc.setLineWidth(1);
  doc.setTextColor(32, 34, 38);
  doc.setFontSize(11);
  doc.text(`Date of Issue: ${formatDate(data.issueDate, "short")}`, 20, 219);
  doc.text("Sincerely,", 20, 230);
  doc.addImage(signature, "PNG", 20, 233, 42, 21);
  doc.setFont("helvetica", "bold");
  doc.text(data.signatory || initialData.signatory, 20, 258);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(data.designation || initialData.designation, 20, 264);
  doc.text("APPOINTZA TECHNOLOGY (OPC) PRIVATE LIMITED", 20, 270);
  doc.setFontSize(8);
  doc.text("www.appointza.com", 20, 287);
  doc.text("+91 90805 39126", 90, 287);
  doc.text("appointza@gmail.com", 150, 287);
}

async function downloadInternshipDocumentsPdf(data: FormData, logo: string, signature: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  doc.setProperties({ title: `${data.name || "Intern"} Internship Documents`, author: "Appointza Technology (OPC) Private Limited" });
  drawAcceptanceLetter(doc, data, logo, signature);
  doc.addPage("a4", "portrait");
  drawCertificate(doc, data, logo, signature);
  doc.save(safeFilename(data.name));
}

function formatDate(value: string, style: "long" | "short") {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  if (style === "short") {
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function Field({ label, value, onChange, type = "text", maxLength = 120 }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date";
  maxLength?: number;
}) {
  return (
    <label className="field-group">
      <span>{label}</span>
      <input type={type} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function AppointzaLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "brand brand-compact" : "brand"}>
      <img src={appointzaMark} alt="" />
      <span>Appointza</span>
    </div>
  );
}

function AcceptanceLetter({ data }: { data: FormData }) {
  return (
    <article className="document-page acceptance-page" aria-label="Acceptance letter preview">
      <AppointzaLogo />
      <div className="letter-content">
        <p className="document-eyebrow">Appointza Team</p>
        <h2>Internship Acceptance Letter</h2>
        <p className="salutation">Dear <strong>{data.name.toUpperCase() || "RECIPIENT"}</strong>,</p>
        <div className="letter-body">
          <p>We are pleased to inform you that your application for the internship position at Appointza has been accepted.</p>
          <p>Your internship will commence on <strong>{formatDate(data.startDate, "long").toUpperCase()}</strong> and continue until <strong>{formatDate(data.endDate, "long").toUpperCase()}</strong>. Please report to {data.reportTo || "the designated supervisor"} on your first day.</p>
          <p>We look forward to your contributions and growth during this internship.</p>
          <p>Please report on your first day to the designated location and supervisor to begin your successful internship experience.</p>
        </div>
        <div className="signature-block">
          <img className="signature-image" src={signatureImage} alt="Authorized signature" />
          <p>Sincerely,</p>
          <small>{data.signatory}</small>
        </div>
      </div>
      <div className="letter-rule" />
    </article>
  );
}

function Certificate({ data }: { data: FormData }) {
  const p = pronouns[data.pronoun];
  return (
    <article className="document-page certificate-page" aria-label="Internship certificate preview">
      <div className="certificate-header">
        <img src={appointzaFullLogoAsset.url} alt="Appointza" />
      </div>
      <div className="certificate-copy">
        <p>
          This is to certify that <strong>{data.name || "Full Name"}</strong> from <strong>{data.institution || "Institution Name"}</strong>, pursuing <strong>{data.course || "Course"}</strong> in the <strong>{data.department || "Department"}</strong> during the academic year <strong>{data.year || "Year"}</strong>, has successfully completed an internship at Appointza from {formatDate(data.startDate, "long")} to {formatDate(data.endDate, "long")}.
        </p>
        <p>During this internship, {p.subject} gained valuable knowledge, practical experience, and skills in <strong>{data.learningTopic || "What They Learned"}</strong>.</p>
        <p>We appreciate <strong>{data.name || "Full Name"}</strong> for {p.possessive} dedication and contribution during the internship and wish {p.object} continued success in future endeavors.</p>
      </div>
      <div className="certificate-lines" aria-hidden="true"><i /><i /><i /></div>
      <div className="certificate-signature">
        <p>Date of Issue: {formatDate(data.issueDate, "short")}</p>
        <p>Sincerely,</p>
        <img className="signature-image" src={signatureImage} alt="Authorized signature" />
        <strong>{data.signatory}</strong>
        <span>{data.designation}</span>
        <span>APPOINTZA TECHNOLOGY (OPC) PRIVATE LIMITED</span>
      </div>
      <div className="certificate-footer">
        <span>◎ &nbsp; www.appointza.com</span>
        <span>● &nbsp; +91 90805 39126</span>
        <span>✉ &nbsp; appointza@gmail.com</span>
      </div>
    </article>
  );
}

function DocumentGenerator() {
  const [documentType, setDocumentType] = useState<DocumentType>("letter");
  const [printMode, setPrintMode] = useState<PrintMode>(null);
  const [data, setData] = useState<FormData>(initialData);
  const [importedPeople, setImportedPeople] = useState<ImportedPerson[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploadName, setUploadName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const update = (key: keyof FormData) => (value: string) => setData((current) => ({ ...current, [key]: value }));
  const activeTitle = useMemo(() => documentType === "letter" ? "Acceptance Letter" : "Internship Certificate", [documentType]);

  useEffect(() => {
    if (!printMode) return;
    const printTimer = window.setTimeout(() => window.print(), 50);
    const clearPrintMode = () => setPrintMode(null);
    window.addEventListener("afterprint", clearPrintMode, { once: true });
    return () => {
      window.clearTimeout(printTimer);
      window.removeEventListener("afterprint", clearPrintMode);
    };
  }, [printMode]);

  const printCurrent = () => setPrintMode(documentType);
  const printBoth = () => setPrintMode("both");

  const handleWorkbook = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploadName(file.name);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) throw new Error("The workbook has no sheets.");
      const sheet = workbook.Sheets[firstSheet];
      if (!sheet) throw new Error("The first sheet could not be read.");
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: true });
      if (!rows.length) throw new Error("The first sheet has no data rows.");
      const headers = Object.keys(rows[0] ?? {});
      const headerByField = new Map<keyof FormData, string>();
      for (const [field, aliases] of Object.entries(columnAliases) as [keyof FormData, string[]][]) {
        const match = headers.find((header) => aliases.includes(normalizeHeader(header)));
        if (match) headerByField.set(field, match);
      }
      if (!headerByField.has("name")) throw new Error('A "Full name" or "Name" column is required.');
      const dateParser = (serial: number) => XLSX.SSF.parse_date_code(serial);
      const people = rows.map((row, index): ImportedPerson => {
        const get = (field: keyof FormData) => {
          const header = headerByField.get(field);
          return header ? row[header] : "";
        };
        return {
          ...emptyCertificateData,
          id: `${file.name}-${index + 2}-${String(get("name"))}`,
          rowNumber: index + 2,
          name: String(get("name") ?? "").trim(),
          startDate: toInputDate(get("startDate"), dateParser),
          endDate: toInputDate(get("endDate"), dateParser),
          reportTo: String(get("reportTo") || initialData.reportTo).trim(),
          year: String(get("year") ?? "").trim(),
          course: String(get("course") ?? "").trim(),
          department: String(get("department") ?? "").trim(),
          institution: String(get("institution") ?? "").trim(),
          learningTopic: String(get("learningTopic") ?? "").trim(),
          issueDate: toInputDate(get("issueDate"), dateParser),
          pronoun: normalizePronoun(get("pronoun")),
          signatory: String(get("signatory") || initialData.signatory).trim(),
          designation: String(get("designation") || initialData.designation).trim(),
        };
      }).filter((person) => person.name);
      if (!people.length) throw new Error("No rows with a person’s name were found.");
      setImportedPeople(people);
      setSelectedIds(new Set(people.map((person) => person.id)));
      setData(people[0] ?? initialData);
      setDocumentType("certificate");
    } catch (error) {
      setImportedPeople([]);
      setSelectedIds(new Set());
      setUploadError(error instanceof Error ? error.message : "This Excel file could not be read.");
    } finally {
      event.target.value = "";
    }
  };

  const togglePerson = (person: ImportedPerson) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(person.id)) next.delete(person.id); else next.add(person.id);
      return next;
    });
    setData(person);
  };

  const toggleAll = () => {
    setSelectedIds((current) => current.size === importedPeople.length ? new Set() : new Set(importedPeople.map((person) => person.id)));
  };

  const downloadSelected = async () => {
    const selected = importedPeople.filter((person) => selectedIds.has(person.id));
    if (!selected.length) {
      setUploadError("Select at least one person to download their documents.");
      return;
    }
    setUploadError("");
    setIsDownloading(true);
    try {
      const [logo, certificateLogo, signature] = await Promise.all([imageToDataUrl(appointzaMark), imageToDataUrl(appointzaFullLogoAsset.url), imageToDataUrl(signatureImage)]);
      for (const person of selected) {
        const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
        doc.setProperties({ title: `${person.name || "Intern"} Internship Documents`, author: "Appointza Technology (OPC) Private Limited" });
        drawAcceptanceLetter(doc, person, logo, signature);
        doc.addPage("a4", "portrait");
        drawCertificate(doc, person, certificateLogo, signature);
        doc.save(safeFilename(person.name));
      }
    } catch {
      setUploadError("The documents could not be downloaded. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="header-brand"><AppointzaLogo compact /><span>Document Studio</span></div>
        <div className="header-actions">
          <Button variant="ghost" onClick={() => setData(initialData)}><RotateCcw size={16} /> Reset</Button>
          <Button variant="outline" onClick={printCurrent}><Download size={16} /> Current PDF</Button>
          <Button onClick={printBoth}><Download size={16} /> Download Both</Button>
        </div>
      </header>

      <div className="workspace">
        <aside className="editor-panel">
          <div className="editor-heading">
            <div><span className="step-label">DOCUMENT DETAILS</span><h1>{activeTitle}</h1></div>
            <FileText size={20} />
          </div>
          <div className="document-tabs" role="tablist" aria-label="Document type">
            <Button variant={documentType === "letter" ? "primary" : "secondary"} role="tab" aria-selected={documentType === "letter"} onClick={() => setDocumentType("letter")}>Acceptance letter</Button>
            <Button variant={documentType === "certificate" ? "primary" : "secondary"} role="tab" aria-selected={documentType === "certificate"} onClick={() => setDocumentType("certificate")}>Certificate</Button>
          </div>

          {documentType === "certificate" && (
            <section className="batch-panel" aria-labelledby="batch-title">
              <div className="batch-heading">
                <div><h2 id="batch-title">Create from Excel</h2><p>Your file stays in this browser.</p></div>
                <FileSpreadsheet size={20} />
              </div>
              <input ref={fileInputRef} className="file-input" type="file" accept=".xlsx,.xls" onChange={handleWorkbook} aria-label="Upload Excel file" />
              <Button type="button" variant="outline" className="upload-button" onClick={() => fileInputRef.current?.click()}><Upload size={16} /> Choose Excel file</Button>
              {uploadName && <p className="upload-name">{uploadName}</p>}
              {uploadError && <p className="upload-error" role="alert">{uploadError}</p>}
              {importedPeople.length > 0 && (
                <div className="people-list">
                  <label className="person-row select-all-row">
                    <input type="checkbox" checked={selectedIds.size === importedPeople.length} onChange={toggleAll} />
                    <span><strong>Select all</strong><small>{selectedIds.size} of {importedPeople.length} selected</small></span>
                  </label>
                  <div className="people-scroll">
                    {importedPeople.map((person) => (
                      <label className="person-row" key={person.id}>
                        <input type="checkbox" checked={selectedIds.has(person.id)} onChange={() => togglePerson(person)} />
                        <span><strong>{person.name}</strong><small>{person.course || "Course not provided"} · Row {person.rowNumber}</small></span>
                      </label>
                    ))}
                  </div>
                  <Button type="button" className="batch-download" disabled={!selectedIds.size || isDownloading} onClick={downloadSelected}><Download size={16} /> {isDownloading ? "Preparing documents…" : `Download Both (${selectedIds.size})`}</Button>
                </div>
              )}
            </section>
          )}

          <form className="fields" onSubmit={(event) => event.preventDefault()}>
            <section>
              <h2>Intern details</h2>
              <Field label="Full name" value={data.name} onChange={update("name")} maxLength={80} />
              <div className="field-row"><Field label="Start date" type="date" value={data.startDate} onChange={update("startDate")} /><Field label="End date" type="date" value={data.endDate} onChange={update("endDate")} /></div>
              {documentType === "letter" && <Field label="Report to" value={data.reportTo} onChange={update("reportTo")} />}
            </section>

            {documentType === "certificate" && (
              <>
                <section>
                  <h2>Education & internship</h2>
                  <div className="field-row"><Field label="Year" value={data.year} onChange={update("year")} maxLength={30} /><Field label="Course" value={data.course} onChange={update("course")} maxLength={50} /></div>
                  <Field label="Department" value={data.department} onChange={update("department")} />
                  <Field label="Institution" value={data.institution} onChange={update("institution")} maxLength={160} />
                  <Field label="What they learned" value={data.learningTopic} onChange={update("learningTopic")} maxLength={120} />
                  <div className="field-row">
                    <Field label="Issue date" type="date" value={data.issueDate} onChange={update("issueDate")} />
                    <label className="field-group"><span>Pronouns</span><select value={data.pronoun} onChange={(event) => update("pronoun")(event.target.value)}><option value="he">He / him</option><option value="she">She / her</option><option value="they">They / them</option></select></label>
                  </div>
                </section>
                <section>
                  <h2>Signatory</h2>
                  <div className="field-row"><Field label="Name" value={data.signatory} onChange={update("signatory")} /><Field label="Designation" value={data.designation} onChange={update("designation")} /></div>
                </section>
              </>
            )}
          </form>
        </aside>

        <section className="preview-panel">
          <div className="preview-toolbar"><span>LIVE PREVIEW</span><span>A4 · 1 page</span></div>
          <div className="paper-stage screen-document">
            {documentType === "letter" ? <AcceptanceLetter data={data} /> : <Certificate data={data} />}
          </div>
        </section>
      </div>
      <div className="print-document-stack" aria-hidden="true">
        {(printMode === "letter" || printMode === "both") && <AcceptanceLetter data={data} />}
        {(printMode === "certificate" || printMode === "both") && <Certificate data={data} />}
      </div>
    </main>
  );
}