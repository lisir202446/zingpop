import "../brand/index.css"
import "./common.css"
import { Meta, Title } from "@solidjs/meta"
import type { JSX } from "solid-js"
import { Footer } from "~/component/footer"
import { Header } from "~/component/header"
import { Legal } from "~/component/legal"
import { LocaleLinks } from "~/component/locale-links"

export function LegalPage(props: { path: string; title: string; description: string; children: JSX.Element }) {
  return (
    <main data-page="legal">
      <Title>{`Zingpop | ${props.title}`}</Title>
      <LocaleLinks path={props.path} />
      <Meta name="description" content={props.description} />
      <div data-component="container">
        <Header />

        <div data-component="content">
          <section data-component="brand-content">
            <article data-component="legal-document">{props.children}</article>
          </section>
        </div>

        <Footer />
      </div>
      <Legal />
    </main>
  )
}
