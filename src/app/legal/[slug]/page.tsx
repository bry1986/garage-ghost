import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { APP_NAME } from "@/lib/constants";

interface LegalPageProps {
  params: Promise<{ slug: string }>;
}

const LEGAL_CONTENT: Record<
  string,
  { title: string; updated: string; body: string[] }
> = {
  privacy: {
    title: "Privacy",
    updated: "August 2026",
    body: [
      `${APP_NAME} is designed to be privacy-first: your vehicle details, symptoms and reports are stored only in this browser (localStorage) on your device. They are never uploaded to our servers.`,
      "When you run an AI analysis, your description and optional photo are sent to Puter, whose user-pays model powers the analysis. No API key is used or stored by this app. See Puter's own privacy policy for how they handle data.",
      "Payments are processed by Lemon Squeezy; we only receive the license-key activation status in your browser. Clearing your browser data removes all locally stored history and licenses.",
    ],
  },
  terms: {
    title: "Terms",
    updated: "August 2026",
    body: [
      `${APP_NAME} provides general educational guidance about vehicle warning lights and symptoms. It is not a diagnosis, not a professional inspection, and not a substitute for a qualified mechanic, workshop, or roadside assistance.`,
      "Never work on airbags, brakes, steering, fuel systems, high-voltage EV components, or on a vehicle that is not safely supported. If you see a red warning light, smoke, a fuel smell, overheating, or loss of braking or steering, stop safely and call for professional help.",
      "By using this service you accept that results may be incomplete or inaccurate, and you use them at your own risk. The free tier is provided as-is; Pro purchases are managed by Lemon Squeezy under their terms.",
    ],
  },
  refunds: {
    title: "Refunds",
    updated: "August 2026",
    body: [
      "Pro subscriptions and license keys are sold through Lemon Squeezy. Refund requests are handled by Lemon Squeezy in line with their refund policy.",
      `If you have a problem with a Pro purchase, contact us via the Contact page within 14 days of purchase and we will help resolve it — including processing a refund through Lemon Squeezy where appropriate.`,
    ],
  },
  contact: {
    title: "Contact",
    updated: "August 2026",
    body: [
      `Questions, feedback or refund requests? Reach out and we will get back to you.`,
      "For urgent vehicle safety matters, always contact roadside assistance or a qualified workshop first — do not wait for a reply.",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(LEGAL_CONTENT).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = LEGAL_CONTENT[slug];
  if (!page) return { title: "Not found" };
  return { title: page.title };
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { slug } = await params;
  const page = LEGAL_CONTENT[slug];
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-2xl space-y-4">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-50">
          {page.title}
        </h1>
        <p className="mt-1 text-xs text-zinc-500">Last updated: {page.updated}</p>
      </header>
      {page.body.map((paragraph, index) => (
        <p key={index} className="text-sm leading-relaxed text-zinc-300">
          {paragraph}
        </p>
      ))}
    </article>
  );
}
