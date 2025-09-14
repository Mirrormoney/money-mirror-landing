export default function Section({ title, subtitle, children } : { title: string, subtitle?: string, children: React.ReactNode }) {
  return (
    <section className="container py-16">
      <h2 className="text-2xl md:text-3xl font-semibold">{title}</h2>
      {subtitle && <p className="mt-2 text-slate-400 max-w-2xl">{subtitle}</p>}
      <div className="mt-8">
        {children}
      </div>
    </section>
  )
}
