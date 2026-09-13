"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Zap } from "lucide-react";
import { useState } from "react";
import { ConnectWallet } from "./ConnectWallet";

const links = [
  { href: "/", label: "Overview" },
  { href: "/counter-app", label: "Counter" },
  { href: "/todo-app", label: "Todo" },
  { href: "/architecture", label: "Architecture" },
  { href: "/sdk", label: "SDK" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navLink = (href: string) => `rounded-lg px-3 py-2 text-sm font-semibold ${pathname === href ? "bg-[var(--primary)] text-[#0b100c]" : "text-[var(--muted)] hover:bg-white/5 hover:text-white"}`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--line)] bg-[#070908e8] backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-[1440px] items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setIsOpen(false)}>
          <span className="grid size-9 place-items-center rounded-xl bg-[var(--primary)] text-[#0b100c] shadow-[0_0_26px_#c9ff3d3d]"><Zap className="size-5 fill-current" /></span>
          <span className="font-[family-name:var(--font-heading)] text-base font-bold tracking-tight">Arc<span className="text-[var(--primary)]">Flow</span></span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">{links.map(({ href, label }) => <Link key={href} href={href} className={navLink(href)}>{label}</Link>)}</nav>
        <div className="hidden lg:block"><ConnectWallet /></div>
        <button type="button" className="grid size-10 place-items-center rounded-lg border border-[var(--line)] text-white lg:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle navigation">
          {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {isOpen && <div className="border-t border-[var(--line)] bg-[var(--surface)] px-5 py-4 lg:hidden"><nav className="flex flex-col gap-1">{links.map(({ href, label }) => <Link key={href} href={href} className={navLink(href)} onClick={() => setIsOpen(false)}>{label}</Link>)}</nav><div className="mt-4 border-t border-[var(--line)] pt-4"><ConnectWallet /></div></div>}
    </header>
  );
}
