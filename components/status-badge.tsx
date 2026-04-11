import { Badge } from "@/components/ui/badge";
import { getStatutText, getStatutVariant } from "@/lib/utils";

interface StatusBadgeProps {
  statut: string | null;
}

export default function StatusBadge({ statut }: StatusBadgeProps) {
  const variant = getStatutVariant(statut);
  return <Badge variant={variant}>{getStatutText(statut)}</Badge>;
}
