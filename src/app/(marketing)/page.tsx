import Link from 'next/link';
import {
  Sparkles,
  ScanLine,
  Cpu,
  Layers,
  Code2,
  ArrowRight,
  Camera,
  CircuitBoard,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <>
      {/* HERO */}
      <section className="bg-hero-glow relative overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-[0.03]" />
        <div className="container relative mx-auto max-w-5xl px-4 py-24 text-center md:py-32">
          <div className="bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
            <Sparkles className="size-3" />
            AI vision for electronics
          </div>

          <h1 className="text-balance text-5xl font-bold tracking-tight md:text-7xl">
            Identify any component
            <br />
            <span className="text-primary">in a single photo.</span>
          </h1>

          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-balance text-lg md:text-xl">
            Point your camera at a resistor, a breadboard, or an entire PCB.
            Get an annotated map of every part with markings, pinouts, and
            datasheet links.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="shadow-glow">
              <Link href="/scan">
                Start scanning
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="https://github.com/Opiummmm/component-identifier" target="_blank">
                <Code2 className="mr-2 size-4" />
                Source code
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y bg-card/30 py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Three steps. Ten seconds.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Step
              n={1}
              icon={Camera}
              title="Capture"
              body="Drag, drop, or use your phone camera. JPEG, PNG, or WebP up to 5MB."
            />
            <Step
              n={2}
              icon={ScanLine}
              title="Identify"
              body="A vision model parses every component, reads markings, and infers package types."
            />
            <Step
              n={3}
              icon={CircuitBoard}
              title="Explore"
              body="Annotated bounding boxes, pinouts, alternatives, and exportable BOMs."
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Built for the bench.
            </h2>
            <p className="text-muted-foreground mt-3">
              Engineered for ECE students, hobbyists, and engineers who need
              answers fast.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={Layers}
              title="Multi-component scenes"
              body="A single photo of a populated PCB returns every distinguishable part with bounding boxes."
            />
            <Feature
              icon={Cpu}
              title="Auto-generated pinouts"
              body="ICs and connectors get SVG pinout diagrams built from the identified package and part number."
            />
            <Feature
              icon={Download}
              title="BOM export"
              body="One click turns any scan into a Bill of Materials CSV ready for ordering."
            />
            <Feature
              icon={ScanLine}
              title="Confidence-aware"
              body="Every detection comes with a calibrated confidence score and explicit warnings."
            />
            <Feature
              icon={Sparkles}
              title="Datasheet ready"
              body="Each component links to a tailored datasheet search query for the manufacturer."
            />
            <Feature
              icon={CircuitBoard}
              title="Lab-friendly"
              body="Print-friendly results page tucks neatly into a lab report."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Stop squinting at colour bands.
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-lg text-balance">
            Sign up and get your first scan done in under a minute.
          </p>
          <Button asChild size="lg" className="mt-8 shadow-glow">
            <Link href="/scan">
              Try it now
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  body,
}: {
  n: number;
  icon: typeof Camera;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-card relative rounded-xl border p-6 shadow-soft">
      <div className="text-muted-foreground absolute right-4 top-4 font-mono text-xs">
        0{n}
      </div>
      <div className="bg-primary/10 text-primary mb-4 grid size-10 place-items-center rounded-lg">
        <Icon className="size-5" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{body}</p>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Camera;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-card rounded-xl border p-6 transition-all hover:shadow-elevated">
      <Icon className="text-primary mb-3 size-5" />
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1.5 text-sm">{body}</p>
    </div>
  );
}