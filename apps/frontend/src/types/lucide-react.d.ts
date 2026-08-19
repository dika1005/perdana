declare module 'lucide-react' {
  import * as React from 'react';

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    className?: string;
  }

  export type LucideIcon = React.FC<LucideProps>;

  export const Search: LucideIcon;
  export const Plus: LucideIcon;
  export const Minus: LucideIcon;
  export const Trash2: LucideIcon;
  export const CreditCard: LucideIcon;
  export const ShoppingCart: LucideIcon;
  export const User: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const X: LucideIcon;
  export const Check: LucideIcon;
  export const Printer: LucideIcon;
  export const Calculator: LucideIcon;
  export const History: LucideIcon;
  export const Calendar: LucideIcon;
  export const Filter: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Clock: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const DollarSign: LucideIcon;
  export const FileText: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const Download: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const Package: LucideIcon;
  export const PackageCheck: LucideIcon;
  export const Layers: LucideIcon;
  export const Tag: LucideIcon;
  export const Users: LucideIcon;
  export const UserCog: LucideIcon;
  export const UserPlus: LucideIcon;
  export const UserCheck: LucideIcon;
  export const UserX: LucideIcon;
  export const KeyRound: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Lock: LucideIcon;
  export const Bell: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const LogOut: LucideIcon;
  export const Sun: LucideIcon;
  export const Moon: LucideIcon;
  export const Edit: LucideIcon;
  export const Edit2: LucideIcon;
  export const Edit3: LucideIcon;
  export const ArrowUpDown: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const ArrowDownRight: LucideIcon;
  export const Phone: LucideIcon;
  export const MapPin: LucideIcon;
  export const ShoppingBag: LucideIcon;
  export const Sparkles: LucideIcon;
  export const FolderTree: LucideIcon;
}
