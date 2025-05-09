import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
}

export function Logo({ className, iconSize = 24, textSize = "text-xl" }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-semibold text-primary ${className}`}>
      <ShieldAlert size={iconSize} className="text-accent" />
      <span className={textSize}>Complaint Central</span>
    </Link>
  );
}
