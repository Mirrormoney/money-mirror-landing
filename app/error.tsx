'use client'
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="container py-20"><h1 className="text-3xl font-semibold">We couldn’t load this page.</h1><p className="mt-4 text-slate-400">Please try again in a moment. Your saved spending is still in your account.</p><button className="button-primary mt-6" onClick={reset}>Try again</button></section>
}
