import Link from "next/link";

const footerColumns = [
  {
    title: "Product",
    links: [
      { href: "/finances", label: "Finances" },
      { href: "/login", label: "Log in" },
      { href: "/profile", label: "Profile" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#about", label: "About" },
      { href: "/#location", label: "Location" },
      { href: "/#hero", label: "Home" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/#about", label: "How it works" },
      { href: "/finances", label: "Google Sheets" },
      { href: "/login", label: "Connect Google" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-heading text-base font-semibold">Ledger</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            A read-only workspace that pulls expenses, savings, debt, and actions
            from a Google Sheet.
          </p>
        </div>
        {footerColumns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-medium">{column.title}</p>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Ledger. Amounts are stored as integer cents.
        </p>
      </div>
    </footer>
  );
}
