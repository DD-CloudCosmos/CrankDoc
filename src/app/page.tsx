import Link from "next/link";
import { Search, Database, FileText, Scan } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          CrankDoc
        </h1>
        <p className="text-lg text-muted-foreground sm:text-xl">
          Motorcycle Diagnostic Troubleshooting
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/diagnose"
          className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 transition-colors hover:bg-accent"
        >
          <Search className="h-10 w-10 text-primary" />
          <h2 className="text-lg font-semibold">Diagnose</h2>
          <p className="text-center text-sm text-muted-foreground">
            Step-by-step diagnostic trees
          </p>
        </Link>

        <Link
          href="/bikes"
          className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 transition-colors hover:bg-accent"
        >
          <Database className="h-10 w-10 text-primary" />
          <h2 className="text-lg font-semibold">Bikes</h2>
          <p className="text-center text-sm text-muted-foreground">
            Motorcycle database and specs
          </p>
        </Link>

        <Link
          href="/vin"
          className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 transition-colors hover:bg-accent"
        >
          <Scan className="h-10 w-10 text-primary" />
          <h2 className="text-lg font-semibold">VIN Decoder</h2>
          <p className="text-center text-sm text-muted-foreground">
            Decode your motorcycle VIN
          </p>
        </Link>

        <Link
          href="/dtc"
          className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 transition-colors hover:bg-accent"
        >
          <FileText className="h-10 w-10 text-primary" />
          <h2 className="text-lg font-semibold">DTC Codes</h2>
          <p className="text-center text-sm text-muted-foreground">
            Look up diagnostic trouble codes
          </p>
        </Link>
      </div>
    </div>
  );
}
