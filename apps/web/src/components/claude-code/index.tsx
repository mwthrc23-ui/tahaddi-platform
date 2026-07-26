import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function CcPrompt({ path = '~/tahaddi', command }: { path?: string; command: string }) {
  return (
    <p className="cc-prompt" dir="ltr">
      <span className="cc-prompt__path">{path}</span>
      <span className="cc-prompt__chevron">❯</span>
      <span className="cc-prompt__cmd">{command}</span>
      <span className="cc-caret" aria-hidden="true" />
    </p>
  );
}

export function CcRule({ label }: { label?: string }) {
  if (!label) return <hr className="cc-rule" />;

  return (
    <div className="cc-rule cc-rule--labeled" role="presentation">
      <span dir="ltr">{label}</span>
    </div>
  );
}

export function CcButton({
  href,
  children,
  variant = 'solid',
  className,
  ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: 'solid' | 'ghost';
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, 'href' | 'className'>) {
  return (
    <Link href={href} className={cn('cc-btn', `cc-btn--${variant}`, className)} {...rest}>
      <span className="cc-btn__chevron" dir="ltr" aria-hidden="true">
        ❯
      </span>
      {children}
    </Link>
  );
}

export function CcFlag({ name, value, label }: { name: string; value: string; label: string }) {
  return (
    <div>
      <dt>
        <span aria-hidden="true">--{name}</span>
        <span className="sr-only">{label}</span>
      </dt>
      <dd>{value}</dd>
    </div>
  );
}
