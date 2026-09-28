import Link from "next/link";
import { BarChart3, Briefcase, FileText, Home, Send, Sparkles, User } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/resumes", label: "CV", icon: FileText },
  { href: "/jobs", label: "Offres", icon: Briefcase },
  { href: "/applications", label: "Candidatures", icon: Send },
  { href: "/ai", label: "Assistant IA", icon: Sparkles },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/profile", label: "Profil", icon: User },
];

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 border-r bg-background p-6 md:block">
      <h1 className="text-xl font-bold">ApplyPilot AI</h1>

      <nav className="mt-8 space-y-2">
        {links.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}