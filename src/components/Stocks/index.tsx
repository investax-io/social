import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import PageLayout from "@/components/Shared/PageLayout";
import Skeleton from "@/components/Shared/Skeleton";
import { Card, ErrorMessage, Image } from "@/components/Shared/UI";

interface StockToken {
  contractAddress: string;
  hasPrice: boolean;
  hasSeries: boolean;
  iconUrl: string | null;
  isin: string;
  name: string;
  price: number | null;
  symbol: string;
  ticker: string;
  tickerAliases: string[];
}

interface StocksResponse {
  ranges: string[];
  tokens: StockToken[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseStocksResponse = (payload: unknown): StocksResponse => {
  if (!isRecord(payload) || !Array.isArray(payload.ranges)) {
    throw new Error("The stock catalog response has an invalid format.");
  }

  if (
    !payload.ranges.every((range) => typeof range === "string") ||
    !Array.isArray(payload.tokens)
  ) {
    throw new Error("The stock catalog response has an invalid format.");
  }

  const tokens = payload.tokens.map((entry): StockToken => {
    if (!isRecord(entry)) {
      throw new Error("The stock catalog contains an invalid stock entry.");
    }

    const {
      contractAddress,
      hasPrice,
      hasSeries,
      iconUrl,
      isin,
      name,
      price,
      symbol,
      ticker,
      tickerAliases
    } = entry;

    if (
      typeof contractAddress !== "string" ||
      typeof hasPrice !== "boolean" ||
      typeof hasSeries !== "boolean" ||
      (iconUrl !== null && typeof iconUrl !== "string") ||
      typeof isin !== "string" ||
      typeof name !== "string" ||
      (price !== null && typeof price !== "number") ||
      typeof symbol !== "string" ||
      typeof ticker !== "string" ||
      !Array.isArray(tickerAliases) ||
      !tickerAliases.every((alias) => typeof alias === "string")
    ) {
      throw new Error("The stock catalog contains an invalid stock entry.");
    }

    return {
      contractAddress,
      hasPrice,
      hasSeries,
      iconUrl,
      isin,
      name,
      price,
      symbol,
      ticker,
      tickerAliases
    };
  });

  return {
    ranges: payload.ranges,
    tokens
  };
};

const fetchStocks = async (): Promise<StocksResponse> => {
  const response = await fetch("https://hey.xyz/stocks");

  if (!response.ok) {
    throw new Error(`Stock catalog request failed (${response.status}).`);
  }

  return parseStocksResponse(await response.json());
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    style: "currency"
  }).format(price);

const StockRow = ({ stock }: { stock: StockToken }) => {
  const hasAvailablePrice = stock.hasPrice && stock.price !== null;

  const handleTradeClick = (action: "Buy" | "Sell") => {
    toast.info(`${action} is not available yet.`);
  };

  return (
    <div className="flex min-h-[68px] items-center gap-3 border-white/70 border-b px-3 py-2 last:border-b-0 sm:gap-4 sm:px-5">
      <Image
        alt=""
        className="size-11 shrink-0 rounded-xl object-cover"
        height={44}
        loading="lazy"
        src={stock.iconUrl ?? ""}
        width={44}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{stock.name}</div>
        <div className="truncate text-gray-500 text-xs">
          ${stock.symbol} ·{" "}
          {stock.hasPrice && stock.price !== null
            ? formatPrice(stock.price)
            : "Waiting for a price"}
          <span aria-hidden="true" className="ml-1">
            ›
          </span>
        </div>
      </div>
      <div className="w-12 shrink-0 text-right">
        <div>0</div>
        <div className="text-gray-500 text-xs">
          {hasAvailablePrice ? "$0.00" : "—"}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          className="h-8 rounded-full bg-gray-950 px-3 font-semibold text-white text-xs transition-opacity disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-gray-950"
          disabled={!hasAvailablePrice}
          onClick={() => handleTradeClick("Buy")}
          type="button"
        >
          Buy
        </button>
        <button
          className="h-8 rounded-full bg-white px-3 font-semibold text-gray-950 text-xs shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-700 dark:text-white"
          disabled={!hasAvailablePrice}
          onClick={() => handleTradeClick("Sell")}
          type="button"
        >
          Sell
        </button>
      </div>
    </div>
  );
};

const Stocks = () => {
  const { data, error, isPending } = useQuery({
    queryFn: fetchStocks,
    queryKey: ["stocks"]
  });
  const stocks = data?.tokens.toSorted((left, right) =>
    left.name.localeCompare(right.name)
  );

  return (
    <PageLayout title="Stocks">
      <div>
        <Card className="sticky top-0 isolate z-50 mb-1 px-5 py-4" forceRounded>
          <h1 className="font-medium text-lg">Stocks</h1>
        </Card>
        <div className="space-y-3 py-5">
          <div className="px-1 font-medium text-gray-500 text-xs uppercase">
            {isPending
              ? "Loading stocks"
              : `${stocks?.length ?? 0} stocks are listed`}
          </div>
          {error ? (
            <ErrorMessage error={error} title="Failed to load stocks" />
          ) : isPending ? (
            <Card className="space-y-2 bg-gray-200 p-3 dark:bg-gray-800">
              {Array.from({ length: 8 }, (_, index) => `stock-${index}`).map(
                (key) => (
                  <Skeleton className="h-[68px] rounded-xl" key={key} />
                )
              )}
            </Card>
          ) : (
            <Card className="overflow-hidden bg-gray-200 dark:bg-gray-800">
              {stocks?.map((stock) => (
                <StockRow key={stock.contractAddress} stock={stock} />
              ))}
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Stocks;
