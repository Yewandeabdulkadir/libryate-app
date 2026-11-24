export function Logo({ size = 21 }: { size?: number }) {
  return (
    <span className="logo" style={{ fontSize: size }}>
      <i aria-hidden="true" />
      Libryate
    </span>
  );
}
