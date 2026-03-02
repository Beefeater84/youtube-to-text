type Variant = 'double' | 'thin' | 'thick' | 'dashed';

export function HorizontalRule({ variant = 'thin' }: { variant?: Variant }) {
  return <hr className={`rule--${variant} my-4`} />;
}
