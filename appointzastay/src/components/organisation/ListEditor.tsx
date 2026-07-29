export interface ListField {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "checkbox" | "hidden";
  readOnly?: boolean;
  defaultValue?: string | boolean;
  className?: string;
}

export function ListEditor({
  items,
  fields,
  emptyRow,
  addLabel,
  onChange,
  rowClassName,
  hideAddButton = false,
}: {
  items: Record<string, unknown>[];
  fields: ListField[];
  emptyRow: () => Record<string, unknown>;
  addLabel: string;
  onChange: (items: Record<string, unknown>[]) => void;
  rowClassName?: string;
  hideAddButton?: boolean;
}) {
  const rows = items.length > 0 ? items : [emptyRow()];

  const setField = (index: number, key: string, value: unknown) => {
    const base = items.length > 0 ? items : [emptyRow()];
    onChange(base.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const addRow = () => onChange([...rows, emptyRow()]);
  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [emptyRow()]);
  };

  return (
    <div>
      {!hideAddButton ? (
        <div className="org-profile-editor-toolbar">
          <button type="button" className="org-profile-add-row org-profile-add-row-top" onClick={addRow}>
            {addLabel}
          </button>
        </div>
      ) : null}
      <div className="org-profile-rows">
        {rows.map((row, index) => (
          <div key={index} className={`org-profile-row${rowClassName ? ` ${rowClassName}` : fields.length > 2 ? " org-profile-row-3" : ""}`}>
            {fields.map((f) => {
              if (f.type === "hidden") return null;
              if (f.type === "checkbox") {
                return (
                  <label key={f.key} className="flex items-center gap-1 text-xs whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={Boolean(row[f.key] ?? f.defaultValue ?? false)}
                      onChange={(e) => setField(index, f.key, e.target.checked)}
                    />
                    {f.label}
                  </label>
                );
              }
              return (
                <input
                  key={f.key}
                  type={f.type === "number" ? "number" : "text"}
                  placeholder={f.placeholder ?? f.label}
                  readOnly={f.readOnly}
                  className={`org-profile-input${f.className ? ` ${f.className}` : ""}`}
                  value={String(row[f.key] ?? f.defaultValue ?? "")}
                  onChange={(e) =>
                    setField(index, f.key, f.type === "number" ? Number(e.target.value) : e.target.value)
                  }
                />
              );
            })}
            <button type="button" className="org-profile-row-remove" onClick={() => removeRow(index)} title="Remove">
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function stripEmptyRows(items: Record<string, unknown>[], requiredKey: string) {
  return items.filter((row) => {
    const v = row[requiredKey];
    return v != null && String(v).trim() !== "";
  });
}
