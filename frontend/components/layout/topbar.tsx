import { Badge } from "@/components/ui/badge";

export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div>
        <p className="text-sm text-muted-foreground">Bienvenue</p>
        <h2 className="font-semibold">Bonjour Bada 👋</h2>
      </div>

      <Badge variant="secondary">MVP</Badge>
    </header>
  );
}