import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
  alt?: string;
}

export function Logo({ width = 28, height = 28, alt = 'Logo', ...props }: LogoProps) {
  return (
    <Image
      src="/CoatofArmsHellenicFederation.svg"
      alt={alt}
      width={width}
      height={height}
      {...props}
    />
  );
}