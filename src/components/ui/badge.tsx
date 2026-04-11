export const Badge = ({ children }: any) => {
  return (
    <span
      style={{
        padding: "4px 8px",
        background: "#eee",
        borderRadius: "6px",
        fontSize: "12px"
      }}
    >
      {children}
    </span>
  );
};
