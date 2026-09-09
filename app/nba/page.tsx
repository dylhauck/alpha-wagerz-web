import { AppShell } from "@/components/AppShell";
import ComingSoonPage from "@/components/ComingSoonPage";

export default function NBAPage() {
  return (
    <AppShell>
      <ComingSoonPage
        title="NBA Coming Soon"
        subtitle="Alpha Wagerz NBA analytics, projections, matchup data, and betting insights are currently being built."
      />
    </AppShell>
  );
}