import { api } from "@/lib/convex/http";
import { requireAuthedConvex } from "@/lib/convex/server";
import YoYClient from "./YoYClient";

export default async function YoYComparisonPage() {
  const { convex } = await requireAuthedConvex();
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const [current, previous] = await Promise.all([
    convex.query(api.transactions.totalsForYear, { taxYear: currentYear }),
    convex.query(api.transactions.totalsForYear, { taxYear: previousYear }),
  ]);

  const data = {
    currentYear: {
      year: currentYear,
      revenue: current.income,
      expenses: current.expenses,
      profit: current.income - current.expenses,
    },
    previousYear: {
      year: previousYear,
      revenue: previous.income,
      expenses: previous.expenses,
      profit: previous.income - previous.expenses,
    },
  };

  return <YoYClient data={data} />;
}
