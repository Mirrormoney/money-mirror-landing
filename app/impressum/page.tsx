'use client'
import { useLanguage } from '@/lib/i18n'
export default function Impressum() {
 const { lang } = useLanguage(); const de = lang === 'de'
 return <section className="container py-16 prose prose-invert max-w-none">
 <h1>{de ? 'Impressum' : 'Legal notice'}</h1>
 <h2>{de ? 'Dienstanbieter' : 'Service provider'}</h2>
 <p><strong>{de ? 'Name/Firma' : 'Name/company'}:</strong> MirrorMoney<br/><strong>E-Mail:</strong> <a href="mailto:contact@mirrormoney.com">contact@mirrormoney.com</a></p>
 <h2>{de ? 'Haftung für Inhalte' : 'Responsibility for content'}</h2>
 <p>{de ? 'Wir sind für eigene Inhalte nach den allgemeinen Gesetzen verantwortlich. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben unberührt.' : 'We are responsible for our own content under applicable law. Legal obligations to remove information or restrict its use remain unaffected.'}</p>
 <h2>{de ? 'Haftung für Links' : 'External links'}</h2>
 <p>{de ? 'Unser Angebot enthält Links zu externen Websites, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte keine Gewähr übernehmen.' : 'Our website includes links to external websites whose content we do not control. We cannot guarantee the content of those websites.'}</p>
 <h2>{de ? 'Urheberrecht' : 'Copyright'}</h2>
 <p>{de ? 'Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet.' : 'Content and works created by the website operator are subject to German copyright law. Third-party contributions are identified as such.'}</p>
 <p className="text-sm text-slate-400">{de ? 'Stand' : 'Last updated'}: 16.09.2026</p>
 </section>
}
