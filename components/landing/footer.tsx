import Link from "next/link"

const footerLinks = {
  Produto: ["Recursos", "Como funciona", "Lista de espera", "Integracoes"],
  Empresa: ["Sobre", "Blog", "Carreiras"],
  Suporte: ["Central de ajuda", "Contato", "Status"],
  Legal: ["Privacidade", "Termos de uso"],
}

export function Footer() {
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
              A luz da inteligencia artificial para clinicas que querem crescer.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground">{category}</h4>
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
            &copy; {new Date().getFullYear()} Ailum. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-[11px] text-muted-foreground transition-colors duration-300 hover:text-foreground">
              Politica de privacidade
            </Link>
            <Link href="#" className="text-[11px] text-muted-foreground transition-colors duration-300 hover:text-foreground">
              Termos de uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
