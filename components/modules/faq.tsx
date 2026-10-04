"use client";

import { useState } from "react";
import { web } from "@/lib/art-direction";

/* The photobook's FAQ, page 220, word for word (the book is the reference
   for every text on the site). In the book's order - its left column,
   then its right. It replaces the live FAQ from norrsken.org/100, which was
   last year's: 50 partners, Norrsken Accelerator, a question on the number
   of nominations. One word is the site's: the images are "on this site"
   rather than "in this book". */
const ITEMS = [
  {
    title: "Whoa, slow down. What is all this?",
    body: `The Norrsken100 is an annual selection of the most promising early-stage startups solving global challenges at scale by outperforming the legacy models that created them. They shape what comes next. In other words: It’s 100 ways to fix the future. Pretty cool, right?`,
  },
  {
    title: "Who made this list?",
    body: `The Norrsken100 is curated by Norrsken Foundation. It is compiled from nominations made by our partners. This year, our team processed 1,400+ nominations from 80 hand-picked nomination partners, among them some of the world's most prominent venture capital firms, academic institutions and NGOs in the field.`,
  },
  {
    title: "What is Norrsken?",
    body: `Glad you asked! Norrsken is a global community of founders, funders, thinkers and advocates united by a shared belief in innovation and entrepreneurship as tools for positive change.

Norrsken manages award-winning Norrsken House hubs in Amsterdam, Barcelona, Kigali, Brussels and Stockholm. Norrsken's five funds have raised more than 750m USD to back exceptional entrepreneurs who combine profit with positive global impact: Norrsken VC, Norrsken22, Norrsken Evolve, Norrsken Launcher and Norrsken Africa Seed Fund. Norrsken is a non-profit, non-partisan and non-religious foundation. It was founded by Niklas Adalberth, co-founder of payment services unicorn Klarna.`,
  },
  {
    title: "What are the criteria for being on the list?",
    body: `The Norrsken100 consists of: Early-stage impact companies, meaning companies where positive global impact is an intrinsic and non-negotiable part of the business model. High-potential ventures that aim to leverage scalable technology to do business and drive positive impact. Businesses with a scalable business model and a proven ability to combine growth with positive global impact. Companies that have delivered at least an MVP product to market and/or raised at least Seed and at most series B-funding.`,
  },
  {
    title: "What’s an Impact Startup?",
    body: `An impact startup is a fast-growing company where positive impact forms an intrinsic and non-negotiable part of the business model. We are particularly interested in companies that leverage scalable technology to solve global problems. We define impact as driving meaningful and measurable progress towards one or several of the 17 Sustainable Development Goals.`,
  },
  {
    title: "Why isn’t company X on the list?",
    body: `It’s hard to say! It might be that our team looked at the company and decided it wasn’t right for the list, at this point in time at least. Or - it might not have been nominated at all. We’ve done our best to source as many relevant nominations as possible, to cover a wide spectrum of companies, problems and solutions. But there will of course be cases we’ve missed, and calls made where you’ll disagree with us. If you’re a startup founder - don’t hesitate to let us know if you think you deserve a spot on the list.`,
  },
  {
    title: "Is the list ranked? Are there winners?",
    body: `The Norrsken100 is not ranked. Being on the list means we think you’re building something that matters.`,
  },
  {
    title: "This is a great project! How can I contribute?",
    body: `Glad you like it! We’re always looking for more partners - to help us source relevant nominations, to give the Norrsken100 companies the attention they deserve, and to build cool things around the initiative throughout the year. Whatever shape that takes, get in touch and we’ll make something happen. Email us at info@norrskenfoundation.org.`,
  },
  {
    title: "Are the images real?",
    body: `All images on this site are AI-generated. They illustrate what each company does, but they are not exact depictions of the company or its products: the real products, facilities and sites differ in both function and appearance.`,
  },
];

function FaqItem({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? " faq-item--open" : ""}`}>
      <button className="faq-row" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="faq-title">{title}</span>
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
          src={web("/title-gifs/faq.gif")}
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
