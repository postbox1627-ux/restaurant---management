export const Calendar = ({ ...props }: any) => {
  return (
    <input
      type="date"
      {...props}
      style={{ padding: "8px" }}
    />
  );
};
