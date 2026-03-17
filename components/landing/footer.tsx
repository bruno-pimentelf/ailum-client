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
    <footer className="border-t border-white/[0.04]">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid grid-cols-2 gap-8 sm:gap-10 md:grid-cols-5 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center">
              <span className="font-display text-sm font-bold tracking-[0.3em] text-foreground">
                AILUM
              </span>
            </Link>
            <p className="mt-5 text-[13px] leading-relaxed text-white/25 max-w-[220px] md:max-w-none">
              {t.footer.tagline}
            </p>
          </div>

          {/* Link columns */}
          {footerSections.map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50">
                {title}
              </h4>
              <ul className="mt-5 flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-[13px] text-white/25 transition-colors duration-300 hover:text-white/60"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/[0.04] pt-8 md:flex-row">
          <p className="text-[11px] text-white/20">
            &copy; {new Date().getFullYear()} Ailum. {t.footer.direitos}
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-[11px] text-white/20 transition-colors duration-300 hover:text-white/50">
              {t.footer.politica}
            </Link>
            <Link href="#" className="text-[11px] text-white/20 transition-colors duration-300 hover:text-white/50">
              {t.footer.termos}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
