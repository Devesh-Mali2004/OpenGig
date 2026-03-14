export default function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background: color, borderRadius: 12, padding: 16, color: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontSize: 26, fontWeight: 800 }}>{value}</span>
      </div>
      <p style={{ fontSize: 12, opacity: 0.85 }}>{label}</p>
    </div>
  );
}