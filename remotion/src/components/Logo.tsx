// Brand wordmarks as styled text — no external file dependency (render-safe).
const BRAND: Record<string, { c: string; label: string }> = {
  google: { c: "#0B1220", label: "Google" },
  amazon: { c: "#FF9900", label: "amazon" },
  walmart: { c: "#0071CE", label: "Walmart" },
  target: { c: "#CC0000", label: "Target" },
  temu: { c: "#FB7701", label: "Temu" },
  shein: { c: "#0B1220", label: "SHEIN" },
};

export const Logo: React.FC<{ name: string; size?: number }> = ({ name, size = 44 }) => {
  const b = BRAND[name] ?? { c: "#fff", label: name };
  return (
    <span style={{ color: b.c, fontWeight: 800, fontSize: size, fontFamily: "Inter, system-ui, sans-serif", letterSpacing: -0.5 }}>
      {b.label}
    </span>
  );
};
