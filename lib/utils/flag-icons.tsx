import { NewsFlag } from '@/lib/db/schema';
import { AlertTriangle, ServerCrash, AlertCircle, RefreshCw, Megaphone } from 'lucide-react';

interface FlagIconProps {
  flag: NewsFlag;
  className?: string;
}

/**
 * Icon per flag, paired with the severity colours in lib/utils/badges.ts so
 * shape carries the meaning for anyone who can't rely on colour alone.
 *
 * Rendered as a switch rather than a Record lookup: selecting a component type
 * during render defeats reconciliation, and eslint's react-hooks rules flag it.
 */
export function FlagIcon({ flag, className }: FlagIconProps) {
  switch (flag) {
    case 'URGENTE':
      return <AlertTriangle className={className} aria-hidden="true" />;
    case 'CAIDA_SISTEMA':
      return <ServerCrash className={className} aria-hidden="true" />;
    case 'IMPORTANTE':
      return <AlertCircle className={className} aria-hidden="true" />;
    case 'ACTUALIZACION':
      return <RefreshCw className={className} aria-hidden="true" />;
    case 'SALA_PRENSA':
      return <Megaphone className={className} aria-hidden="true" />;
    default:
      return <AlertCircle className={className} aria-hidden="true" />;
  }
}
