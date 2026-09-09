import { AppShell } from "@/components/AppShell";
import ComingSoonPage from "@/components/ComingSoonPage";

export default function WNBAPage() {
  return (
    <AppShell>
      <ComingSoonPage
        title="WNBA Coming Soon"
        subtitle="Alpha Wagerz WNBA analytics, projections, matchup data, and betting insights are currently being built."
      />
    </AppShell>
  );
}