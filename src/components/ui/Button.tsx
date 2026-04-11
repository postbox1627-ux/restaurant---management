export const Button = ({ children, ...props }: any) => {
  return (
    <button {...props} style={{ padding: "8px 12px" }}>
      {children}
    </button>
  );
};
