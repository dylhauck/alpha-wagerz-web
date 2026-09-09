import { AppShell } from "@/components/AppShell";
import ComingSoonPage from "@/components/ComingSoonPage";

export default function UFCPage() {
  return (
    <AppShell>
      <ComingSoonPage
        title="UFC Coming Soon"
        subtitle="Alpha Wagerz UFC analytics, projections, matchup data, and betting insights are currently being built."
      />
    </AppShell>
  );
}