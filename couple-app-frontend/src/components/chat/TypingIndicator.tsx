export default function TypingIndicator() {
  return (
    <div style={styles.container}>
      <div style={styles.dot} className="dot-1"></div>
      <div style={styles.dot} className="dot-2"></div>
      <div style={styles.dot} className="dot-3"></div>
      <style>{`
        @keyframes jump {
          0% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0); }
        }
        .dot-1 { animation: jump 1s infinite 0.1s; }
        .dot-2 { animation: jump 1s infinite 0.2s; }
        .dot-3 { animation: jump 1s infinite 0.3s; }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "10px 15px",
    background: "#f0f0f0",
    borderRadius: 15,
    width: "fit-content",
    display: "flex",
    gap: 4,
    marginLeft: 10,
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    background: "#888",
    borderRadius: "50%",
  },
};
