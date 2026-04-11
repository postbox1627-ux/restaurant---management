export const Dialog = ({ children }: any) => {
  return <div>{children}</div>;
};

export const DialogHeader = ({ children }: any) => {
  return <div style={{ marginBottom: "10px", fontWeight: "bold" }}>{children}</div>;
};

export const DialogTitle = ({ children }: any) => {
  return <div style={{ fontSize: "18px" }}>{children}</div>;
};

export const DialogTrigger = ({ children }: any) => {
  return <div>{children}</div>;
};

export const DialogFooter = ({ children }: any) => {
  return <div style={{ marginTop: "10px" }}>{children}</div>;
};
export const DialogContent = ({ children }: any) => {
  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        background: "#fff"
      }}
    >
      {children}
    </div>
  );
};
