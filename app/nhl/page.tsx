import { AppShell } from "@/components/AppShell";
import ComingSoonPage from "@/components/ComingSoonPage";

export default function NHLPage() {
  return (
    <AppShell>
      <ComingSoonPage
        title="NHL Coming Soon"
        subtitle="Alpha Wagerz NHL analytics, projections, matchup data, and betting insights are currently being built."
      />
    </AppShell>
  );
}