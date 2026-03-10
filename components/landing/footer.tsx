"use client"

import Link from "next/link"
import { useLanguage } from "@/components/providers/language-provider"

export function Footer() {
  const { t } = useLanguage()
  const footerSections = [
    { title: t.footer.produto, links: t.footer.produtoLinks },
    { title: t.footer.empresa, links: t.footer.empresaLinks },
    { title: t.footer.suporte, links: t.footer.suporteLinks },
    { title: t.footer.legal, links: t.footer.legalLinks },
  ] as const

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center">
              <span
                className="text-lg font-bold tracking-[0.35em] text-foreground"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                A I L U M
              </span>
            </Link>
            <p className="mt-4 max-w-[200px] text-xs leading-relaxed text-muted-foreground">
              {t.footer.tagline}
            </p>
          </div>

          {/* Link columns */}
          {footerSections.map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground">{title}</h4>
              <ul className="mt-4 flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-xs text-muted-foreground transition-colors duration-300 hover:text-foreground"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} Ailum. {t.footer.direitos}
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-[11px] text-muted-foreground transition-colors duration-300 hover:text-foreground">
              {t.footer.politica}
            </Link>
            <Link href="#" className="text-[11px] text-muted-foreground transition-colors duration-300 hover:text-foreground">
              {t.footer.termos}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
