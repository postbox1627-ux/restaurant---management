export const ScrollArea = ({ children, ...props }: any) => {
  return (
    <div
      {...props}
      style={{
        maxHeight: "300px",
        overflowY: "auto",
        padding: "10px",
      }}
    >
      {children}
    </div>
  );
};
