"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Plus,
  Target,
  User,
} from "lucide-react";

import { logout } from "@/lib/api/auth";
import NotificationBell from "@/components/notifications/NotificationBell";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Nouvelle analyse",
    href: "/analysis/new",
    icon: Plus,
  },
  {
    label: "Mes CV",
    href: "/resumes",
    icon: FileText,
  },
  {
    label: "Mes offres",
    href: "/jobs",
    icon: Building2,
  },
  {
    label: "Recommandations",
    href: "/recommendations",
    icon: Target,
  },
  {
    label: "Compétences",
    href: "/skills-gap",
    icon: BarChart3,
  },
  {
    label: "Candidatures",
    href: "/applications",
    icon: BriefcaseBusiness,
  },
  {
    label: "Profil",
    href: "/profile",
    icon: User,
  },
];

export default function AppNavbar() {
  const pathname = usePathname();

  function handleLogout() {
    logout();
    window.location.href = "/login";
  }

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    if (href === "/analysis/new") {
      return pathname === "/analysis/new";
    }

    if (href === "/resumes") {
      return pathname.startsWith("/resumes");
    }

    if (href === "/jobs") {
      return pathname.startsWith("/jobs");
    }

    if (href === "/recommendations") {
      return pathname.startsWith("/recommendations");
    }

    if (href === "/skills-gap") {
      return pathname.startsWith("/skills-gap");
    }

    if (href === "/applications") {
      return pathname.startsWith("/applications");
    }

    if (href === "/profile") {
      return pathname.startsWith("/profile");
    }

    return false;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <BrainCircuit className="h-6 w-6 text-white" />
          </div>

          <span className="hidden text-xl font-bold sm:block">
            Career<span className="text-blue-500">AI</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition sm:px-4 ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />

                <span className="hidden md:inline">
                  {item.label}
                </span>
              </Link>
            );
          })}

          <NotificationBell />

          <button
            type="button"
            onClick={handleLogout}
            title="Se déconnecter"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </header>
  );
}
