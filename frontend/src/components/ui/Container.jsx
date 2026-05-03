export function Container({ children, className }) {
  return <div className={"px-4 mx-auto " + className}>{children}</div>;
}

export default Container;
