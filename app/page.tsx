import { DashboardClient } from "@/components/DashboardClient";
import { detailToDashboardItem } from "@/lib/site-view-model";
import { rankSiteDetails } from "@/reasoning";

export default function Home() {
  const sites = rankSiteDetails().map(detailToDashboardItem);

  return <DashboardClient initialSites={sites} />;
}
