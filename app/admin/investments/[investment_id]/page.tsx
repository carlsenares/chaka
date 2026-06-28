import { InvestmentDetailClient } from "@/components/InvestmentDetailClient";

type InvestmentPageProps = {
  params: Promise<{
    investment_id: string;
  }>;
};

export default async function InvestmentPage({ params }: InvestmentPageProps) {
  const { investment_id } = await params;
  return <InvestmentDetailClient investmentId={decodeURIComponent(investment_id)} />;
}
