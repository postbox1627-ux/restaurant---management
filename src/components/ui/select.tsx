export const Select = ({ children, ...props }: any) => {
  return <select {...props}>{children}</select>;
};

export const SelectTrigger = ({ children }: any) => {
  return <div>{children}</div>;
};

export const SelectValue = ({ children }: any) => {
  return <span>{children}</span>;
};

export const SelectContent = ({ children }: any) => {
  return <>{children}</>;
};

export const SelectItem = ({ children, value }: any) => {
  return <option value={value}>{children}</option>;
};
