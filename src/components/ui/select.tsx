export const Select = ({ children, ...props }: any) => {
  return (
    <select {...props} style={{ padding: "8px" }}>
      {children}
    </select>
  );
};
