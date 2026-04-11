export const Label = ({ children, ...props }: any) => {
  return (
    <label {...props} style={{ fontWeight: "bold", marginBottom: "4px" }}>
      {children}
    </label>
  );
};
