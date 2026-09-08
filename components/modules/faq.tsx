"use client";

import { useState } from "react";

/* Verbatim from the live FAQ on norrsken.org/100 — questions and answers are
   the Webflow site's copy, not a rewrite. Order matches the live accordion. */
const ITEMS = [
  {
    title: "Who made this list?",
    body: `The Norrsken/100 is curated by Norrsken Foundation. It is compiled from nominations made by our partners. This year, our team processed 1400+ nominations from 50 hand-picked nomination partners, among them some of the world's most prominent venture capital firms.`,
  },
  {
    title: "What’s an Impact Startup?",
    body: `An impact startup is a fast-growing company where positive impact forms an intrinsic and non-negotiable part of the business model. We are particularly interested in companies that leverage scalable technology to solve global problems. We define impact as driving meaningful and measurable progress towards one or several of the UN global development goals. If you want to learn more about how we define and measure impact, check out Norrsken VC:s annual Impact Report at norrsken.org/about.`,
  },
  {
    title: "Why isn’t Company X on the list?",
    body: `It’s hard to say! It might be that our team looked at the company and decided it wasn’t right for the list, at this point in time at least. Or - it might not have been nominated at all. We’ve done our best to source as many relevant nominations as possible, to cover a wide spectrum of companies, problems and solutions. But there will of course be cases we’ve missed, and calls made where you’ll disagree with us. If you’re a startup founder - don’t hesitate to let us know if you think you deserve a spot on the list. Or - if the Norrsken ecosystem can support you in any other way: info@norrskenfoundation.org.`,
  },
  {
    title: "What is Norrsken?",
    body: `Glad you asked! Norrsken is a global community of founders, funders, thinkers and doers, united by a shared belief in entrepreneurship and innovation as forces for positive change. We run award-winning Norrsken Houses in Stockholm, Sweden, Brussels, Belgium, Kigali, Rwanda, Barcelona, Spain and Amsterdam, Netherlands. Norrsken’s five funds have raised >750mUSD to back exceptional entrepreneurs who combine profit with positive global impact: Norrsken VC, Norrsken22, Norrsken Accelerator, Norrsken Launcher and Norrsken Africa Seed. Norrsken is a non-profit, non-partisan and non-religious foundation. It was founded by Niklas Adalberth, co-founder of payment services unicorn Klarna.`,
  },
  {
    title: "Whoa, slow down. What is all this?",
    body: `The Norrsken/100 is an annual list of the world’s most promising impact startups, compiled by Norrsken and our nomination partners. It exists to highlight the power of entrepreneurship to drive positive change, and to celebrate the individuals brave enough to try and change the world for the better. In other words: It’s 100 ways to fix the future. Pretty cool, right?`,
  },
  {
    title: "What are the criteria for being included on the list?",
    body: `The Norrsken/100 consists of: Early-stage impact companies, meaning companies where positive global impact is an intrinsic and non-negotiable part of the business model. High-risk, high-potential ventures that aim to leverage scalable technology to do business and drive positive impact. Businesses with a scalable business model and a proven ability to combine growth with positive global impact. Companies that have delivered at least an MVP product to market and/or raised at least seed/series A-funding and at most series B-funding. Impact is defined as driving measurable, positive progress against the 17 sustainable development goals.`,
  },
  {
    title: "Is the list ranked? Are there winners?",
    body: `The Norrsken/100 is not ranked. Simply being on the list means you’re a winner. It means you’ve been selected by the world’s leading venture capital funds and NGOs as a future impact unicorn - a company that could positively impact the lives of 1 billion people.`,
  },
  {
    title: "How many nominations did you evaluate this year?",
    body: `Our team evaluated more than 1400 nominations this year.`,
  },
  {
    title: "This is a great project! How can I contribute?",
    body: `Glad you like it! We’re always looking for more partners to help us source relevant nominations and give the Norrsken/100 companies the attention they deserve. Get in touch and we’ll make something cool happen. Email us at info@norrskenfoundation.org.`,
  },
];

function FaqItem({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? " faq-item--open" : ""}`}>
      <button className="faq-row" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="faq-title">{title}</span>
        {/* two rules rather than a +/− glyph swap: the vertical one rotates
            flat into the horizontal one, so + becomes − as a movement */}
        <span className="faq-icon" aria-hidden="true">
          <span className="faq-icon-bar" />
          <span className="faq-icon-bar faq-icon-bar--v" />
        </span>
      </button>
      {/* always mounted — collapsing 1fr→0fr is what makes the height
          animatable; aria-hidden keeps the closed copy out of the a11y tree */}
      <div className="faq-reveal" aria-hidden={!open}>
        <div className="faq-reveal-clip">
          <div className="faq-body">
            {body.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  return (
    <section className="mod-faq">
      <div className="mod-section-header">
        <img
          className="mod-title-art mod-title-art--faq"
          src="/title-gifs/faq.gif"
          alt="FAQ"
        />
      </div>
      <div className="faq-top">
        <div className="faq-list">
          {ITEMS.map((item) => (
            <FaqItem key={item.title} title={item.title} body={item.body} />
          ))}
        </div>
      </div>
    </section>
  );
}
