"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Chat" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
  { href: "/health", label: "Health" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-black/10 bg-white dark:border-white/10 dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-8">
        {links.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
                isActive
                  ? "text-black dark:text-zinc-50"
                  : "text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
