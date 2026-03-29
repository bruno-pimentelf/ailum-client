"use client"

import Link from "next/link"
import { useLanguage } from "@/components/providers/language-provider"

export function Footer() {
  const { t } = useLanguage()
  const footerSections = [
    {
      title: t.footer.produto,
      links: t.footer.produtoLinks.map((label: string, i: number) => ({
        label,
        href: ["/#features", "/#how-it-works", "/#integrations", "/auth/sign-in"][i] ?? "#",
      })),
    },
    {
      title: t.footer.empresa,
      links: t.footer.empresaLinks.map((label: string) => ({ label, href: "#" })),
    },
    {
      title: t.footer.suporte,
      links: t.footer.suporteLinks.map((label: string) => ({ label, href: "#" })),
    },
    {
      title: t.footer.legal,
      links: t.footer.legalLinks.map((label: string, i: number) => ({
        label,
        href: ["/politicas-de-privacidade", "/termos-de-uso"][i] ?? "#",
        external: true,
      })),
    },
  ]

  return (
    <footer className="border-t border-foreground/[0.04]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 md:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-10 md:grid-cols-5 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center">
              <span className="font-display text-sm font-bold tracking-[0.3em] text-foreground">
                AILUM
              </span>
            </Link>
            <p className="mt-5 text-[13px] leading-relaxed text-foreground/85 max-w-[220px] md:max-w-none">
              {t.footer.tagline}
            </p>
          </div>

          {/* Link columns */}
          {footerSections.map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground/85">
                {title}
              </h4>
              <ul className="mt-5 flex flex-col gap-3">
                {links.map((link: { label: string; href: string; external?: boolean }) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="text-[13px] text-foreground/85 transition-colors duration-300 hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-foreground/[0.04] pt-8 md:flex-row">
          <p className="text-[11px] text-foreground">
            &copy; {new Date().getFullYear()} Ailum. {t.footer.direitos}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/politicas-de-privacidade" target="_blank" rel="noopener noreferrer" className="text-[11px] text-foreground transition-colors duration-300 hover:text-foreground/85">
              {t.footer.politica}
            </Link>
            <Link href="/termos-de-uso" target="_blank" rel="noopener noreferrer" className="text-[11px] text-foreground transition-colors duration-300 hover:text-foreground/85">
              {t.footer.termos}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
