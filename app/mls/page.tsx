import { AppShell } from "@/components/AppShell";
import ComingSoonPage from "@/components/ComingSoonPage";

export default function MLSPage() {
  return (
    <AppShell>
      <ComingSoonPage
        title="MLS Coming Soon"
        subtitle="Alpha Wagerz MLS analytics, projections, matchup data, and betting insights are currently being built."
      />
    </AppShell>
  );
}