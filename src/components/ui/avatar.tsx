export const Avatar = ({ children }: any) => {
  return (
    <div style={{
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      background: "#ccc",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      {children}
    </div>
  );
};
