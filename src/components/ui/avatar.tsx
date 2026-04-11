export const Avatar = ({ children }: any) => {
  return (
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        overflow: "hidden",
        background: "#ccc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
};

export const AvatarImage = ({ src }: any) => {
  return (
    <img
      src={src}
      alt="avatar"
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
};

export const AvatarFallback = ({ children }: any) => {
  return <span>{children}</span>;
};
