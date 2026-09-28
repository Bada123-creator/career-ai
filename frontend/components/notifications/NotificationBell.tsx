"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  X,
} from "lucide-react";

import {
  Application,
  getApplications,
} from "@/lib/api/applications";

function getDateDifference(value: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${value}T12:00:00`);
  target.setHours(0, 0, 0, 0);

  return Math.round(
    (target.getTime() - today.getTime()) /
      86_400_000
  );
}

export default function NotificationBell() {
  const [applications, setApplications] =
    useState<Application[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const containerRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const data = await getApplications();
        setApplications(data);
      } catch (error) {
        console.error(
          "CAREERAI NOTIFICATIONS ERROR:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const notifications = useMemo(() => {
    return applications
      .filter((application) => {
        if (
          !application.follow_up_at ||
          application.status === "accepted" ||
          application.status === "rejected"
        ) {
          return false;
        }

        return (
          getDateDifference(
            application.follow_up_at
          ) <= 0
        );
      })
      .sort((a, b) =>
        (a.follow_up_at ?? "").localeCompare(
          b.follow_up_at ?? ""
        )
      );
  }, [applications]);

  return (
    <div
      ref={containerRef}
      className="relative ml-1"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title="Notifications"
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-white"
      >
        <Bell className="h-4 w-4" />

        {notifications.length > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {notifications.length > 9
              ? "9+"
              : notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[100] w-[340px] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <p className="font-semibold text-white">
                Notifications
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Actions qui demandent ton attention
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-3">
            {loading ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">
                Chargement...
              </p>
            ) : notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((application) => {
                  const difference =
                    getDateDifference(
                      application.follow_up_at!
                    );

                  return (
                    <Link
                      key={application.id}
                      href={`/applications/${application.id}`}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl border border-slate-800 p-4 transition hover:border-red-500/30 hover:bg-slate-800/60"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                          <CalendarClock className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-white">
                              {application.job_title}
                            </p>

                            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-300">
                              {difference < 0
                                ? "En retard"
                                : "Aujourd'hui"}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {application.company}
                          </p>

                          <p className="mt-2 text-xs leading-5 text-slate-300">
                            {application.next_action ||
                              "Effectuer la relance prévue."}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-400" />

                <p className="mt-3 text-sm font-medium text-white">
                  Tout est à jour
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Aucune action urgente pour le moment.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 p-3">
            <Link
              href="/applications"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-center text-xs font-medium text-blue-400 transition hover:bg-slate-800"
            >
              Voir toutes les candidatures
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
