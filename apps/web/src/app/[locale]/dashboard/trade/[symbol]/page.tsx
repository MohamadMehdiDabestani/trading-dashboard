import { notFound } from "next/navigation";
import { SYMBOLS } from "@/features/order/constants/symbols";
import { TradingForm } from "@/features/order/components/tradingForm";

export default async function TradePage({ params }: { params: Promise<{ symbol: string }> }) {
  const {symbol }= await params;

  const matched = SYMBOLS.find((s) => s.slug === symbol);

  if (!matched) {
    notFound();
  }

  return <TradingForm initialSymbol={matched.value} />;
}