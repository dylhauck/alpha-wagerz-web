import { AppShell } from "@/components/AppShell";
import ComingSoonPage from "@/components/ComingSoonPage";

export default function NotFound() {
  return (
    <AppShell>
      <ComingSoonPage
        title="Coming Soon"
        subtitle="This Alpha Wagerz section is still being built and will be available soon."
      />
    </AppShell>
  );
}