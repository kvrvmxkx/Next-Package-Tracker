import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-svh gap-4">
      <h1 className="text-6xl font-bold">404</h1>
      <Button asChild><Link href="/">Retour</Link></Button>
    </div>
  );
}
