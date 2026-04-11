export const Card = ({ children }: any) => {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "10px" }}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children }: any) => {
  return <div style={{ marginBottom: "8px", fontWeight: "bold" }}>{children}</div>;
};

export const CardTitle = ({ children }: any) => {
  return <div style={{ fontSize: "18px" }}>{children}</div>;
};

export const CardContent = ({ children }: any) => {
  return <div>{children}</div>;
};
export const CardDescription = ({ children }: any) => {
  return (
    <div style={{ fontSize: "14px", color: "#666" }}>
      {children}
    </div>
  );
};
