import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";
import { Disclosure } from "@/components/ui/disclosure";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about Garage Ghost — is it really free, is your data private, why the AI step uses Puter, and how the diagnosis works.",
  alternates: { canonical: "/faq" },
};

interface FaqEntry {
  question: string;
  answer: string;
}

interface FaqGroup {
  label: string;
  items: FaqEntry[];
}

const FAQ_GROUPS: FaqGroup[] = [
  {
    label: "About Garage Ghost",
    items: [
      {
        question: "Is Garage Ghost really free?",
        answer:
          "Yes — completely free, and there's no catch. There is no pricing page, no paywall, no license key and no hidden cost. Every feature is unlimited: diagnoses, follow-up questions, fault-code lookups, repair cost estimates and printable reports. There is no paid tier anywhere in the app.",
      },
      {
        question: "Do I need to create an account or sign up?",
        answer:
          "No. There are no accounts and no sign-ups — you don't even need an email address. Everything runs directly in your browser, so you can start a diagnosis in seconds.",
      },
      {
        question: "Is this a real diagnosis?",
        answer:
          "No — and that's deliberate. Garage Ghost provides general educational guidance to help you understand a warning light or symptom and choose a safe next step. It is not a diagnosis and not a substitute for a qualified mechanic. Every report carries this disclaimer.",
      },
      {
        question: "What do the risk levels mean?",
        answer:
          "Every report is rated with one of three risk levels:\n\nSTOP NOW — stop safely as soon as possible and call for professional help.\nDRIVE CAREFULLY — drive with care and have the vehicle checked soon.\nBOOK SERVICE — schedule an inspection with a qualified workshop.",
      },
    ],
  },
  {
    label: "Privacy & data",
    items: [
      {
        question: "Is my data private?",
        answer:
          "Yes. Reports, saved vehicles and your history are stored only in this browser's local storage — there is no server database, no account to link them to, and no profile built from them. Your data stays on your device, and you can delete individual reports or clear everything at any time.",
      },
      {
        question: "Can I use Garage Ghost offline?",
        answer:
          "Partially. Garage Ghost is a Progressive Web App: after your first visit you can install it, and the cached app shell loads even without a connection. A full AI diagnosis still needs the internet, because the analysis runs through Puter's servers. The OBD-II fault-code lookup works offline from a built-in reference.",
      },
    ],
  },
  {
    label: "Using the app",
    items: [
      {
        question: "Why does the AI step ask me to sign in to Puter?",
        answer:
          "Garage Ghost itself is free and never uses or stores an AI API key. The analysis runs entirely in your browser through Puter.ai, which uses a user-pays model. When you run a diagnosis, Puter may show a sign-in dialog — signing in with your Puter account covers the request on their side. If you close the dialog without signing in, the app cancels the request after a short wait and lets you try again.",
      },
      {
        question: "How are the repair cost estimates calculated?",
        answer:
          "Estimates are typical USD parts-and-labor ballparks, matched deterministically from the likely causes or fault code in your report — no AI call is involved. When no specific repair matches, a broad generic range is shown instead. Estimates are suppressed for genuine emergencies, so safety stays the focus.",
      },
      {
        question: "What are the free OBD-II and VIN tools?",
        answer:
          "OBD-II lookup: paste a fault code like P0300 for an instant plain-English explanation from a built-in reference — no AI call, and it works offline. VIN decoder: validate a 17-character VIN, read its structure, and optionally pull vehicle details from NHTSA. Both are free and need no account.",
      },
      {
        question: "What should I do in an emergency?",
        answer:
          "If you see a red warning light, smoke, a fuel smell, loss of braking or steering, overheating, or an electrical burning smell — stop safely as soon as possible and contact roadside assistance or a qualified workshop. The app shows this reminder before you start and on every result.",
      },
    ],
  },
];

/** FAQPage schema.org markup for search-engine rich results. */
const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_GROUPS.flatMap((group) =>
    group.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer.replace(/\n+/g, " ") },
    }))
  ),
};

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // \u003c keeps the JSON-LD inert inside the script tag even if an
          // answer ever contains an angle bracket or "</script>".
          __html: JSON.stringify(FAQ_SCHEMA).replace(/</g, "\\u003c"),
        }}
      />

      <div className="text-center">
        <p className="eyebrow">Answers</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          Frequently asked questions
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
          Everything you might want to know about Garage Ghost — what it is, whether it&apos;s
          really free, and how your data is handled.
        </p>
      </div>

      <div className="mt-12 space-y-10">
        {FAQ_GROUPS.map((group) => (
          <section key={group.label} aria-label={group.label}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {group.label}
            </h2>
            <div className="mt-4 space-y-3">
              {group.items.map((item) => (
                <Disclosure key={item.question} title={item.question}>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-400">
                    {item.answer}
                  </p>
                </Disclosure>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Still have questions — point at the contact page */}
      <div className="glass-panel mt-14 flex flex-col items-center gap-4 rounded-2xl p-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-inset ring-brand/20">
            <HelpCircle className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Still have a question?</h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              Reach out — we&apos;ll get back to you.
            </p>
          </div>
        </div>
        <Link
          href="/legal/contact"
          className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          Contact us
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </div>
  );
}
