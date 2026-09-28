"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Target,
  User,
  X,
} from "lucide-react";

import { logout } from "@/lib/api/auth";
import NotificationBell from "@/components/notifications/NotificationBell";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Nouvelle analyse", href: "/analysis/new", icon: Plus },
  { label: "Mes CV", href: "/resumes", icon: FileText },
  { label: "Mes offres", href: "/jobs", icon: Building2 },
  { label: "Recommandations", href: "/recommendations", icon: Target },
  { label: "Compétences", href: "/skills-gap", icon: BarChart3 },
  { label: "Candidatures", href: "/applications", icon: BriefcaseBusiness },
  { label: "Profil", href: "/profile", icon: User },
];

export default function AppNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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

    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <BrainCircuit className="h-6 w-6 text-white" />
          </div>

          <span className="text-xl font-bold">
            Career<span className="text-blue-500">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition xl:px-4 ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden xl:inline">{item.label}</span>
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

        <div className="flex items-center gap-2 lg:hidden">
          <NotificationBell />

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-800 px-4 pb-4 pt-3 lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            >
              <LogOut className="h-5 w-5" />
              <span>Se déconnecter</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
