import { RecommendationDetailClient } from "./RecommendationDetailClient";

type RecommendationDetailPageProps = {
  params: Promise<{
    areaId: string;
  }>;
};

export default async function RecommendationDetailPage({ params }: RecommendationDetailPageProps) {
  const { areaId } = await params;

  return <RecommendationDetailClient areaId={areaId} />;
}
