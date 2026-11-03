import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import PageLayout from "@/components/Shared/PageLayout";
import Skeleton from "@/components/Shared/Skeleton";
import { Card, ErrorMessage, Image } from "@/components/Shared/UI";
import { DEFAULT_AVATAR } from "@/data/constants";
import getAccount from "@/helpers/getAccount";
import getAvatar from "@/helpers/getAvatar";
import { useAccountsBulkQuery } from "@/indexer/generated";
import { useAccountStore } from "@/store/persisted/useAccountStore";

const SUPABASE_URL = "https://bvtwdonxehrrgwxiaadz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_VLCChSC60JJOtnbeueCvYA_N5bi-43T";
const PAGE_SIZE = 20;
const LEADERBOARD_COLUMNS =
  "account_address,total_author_wei,hub_wei,rule_wei,payout_count,interaction_hp,referral_hp,gho_hp,total_points,last_payout_at,updated_at";

interface LeaderboardEntry {
  account_address: string;
  total_points: number;
}

interface LeaderboardPage {
  rows: LeaderboardEntry[];
  totalCount: number;
}

interface LeaderboardStats {
  participantCount: number;
  totalPoints: number;
}

interface LeaderboardRank {
  rank: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const apiHeaders = () => ({
  Accept: "application/json",
  Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
  apikey: SUPABASE_PUBLISHABLE_KEY
});

const getLeaderboardPage = async (offset: number): Promise<LeaderboardPage> => {
  const params = new URLSearchParams({
    or: "(total_points.gt.0)",
    order: "total_points.desc,account_address.asc",
    select: LEADERBOARD_COLUMNS
  });
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/leaderboard?${params.toString()}`,
    {
      headers: {
        ...apiHeaders(),
        Prefer: "count=exact",
        Range: `${offset}-${offset + PAGE_SIZE - 1}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Leaderboard request failed (${response.status}).`);
  }

  const contentRange = response.headers.get("content-range");
  const totalCount = Number(contentRange?.split("/")[1]);
  if (!Number.isSafeInteger(totalCount) || totalCount < 0) {
    throw new Error("The leaderboard response is missing its result count.");
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("The leaderboard response has an invalid format.");
  }

  const rows = payload.map((entry): LeaderboardEntry => {
    if (
      !isRecord(entry) ||
      typeof entry.account_address !== "string" ||
      typeof entry.total_points !== "number" ||
      !Number.isFinite(entry.total_points)
    ) {
      throw new Error("The leaderboard contains an invalid entry.");
    }

    return {
      account_address: entry.account_address,
      total_points: entry.total_points
    };
  });

  return { rows, totalCount };
};

const getLeaderboardStats = async (): Promise<LeaderboardStats> => {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/get_leaderboard_stats`,
    {
      body: "{}",
      headers: {
        ...apiHeaders(),
        "Content-Type": "application/json"
      },
      method: "POST"
    }
  );

  if (!response.ok) {
    throw new Error(`Leaderboard stats request failed (${response.status}).`);
  }

  const payload: unknown = await response.json();
  if (
    !Array.isArray(payload) ||
    !isRecord(payload[0]) ||
    typeof payload[0].participant_count !== "number" ||
    typeof payload[0].total_points !== "number"
  ) {
    throw new Error("The leaderboard stats response has an invalid format.");
  }

  return {
    participantCount: payload[0].participant_count,
    totalPoints: payload[0].total_points
  };
};

const getAccountRank = async (
  address: string
): Promise<LeaderboardRank | null> => {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/get_author_payout_totals_rank`,
    {
      body: JSON.stringify({ addr: address }),
      headers: {
        ...apiHeaders(),
        "Content-Type": "application/json"
      },
      method: "POST"
    }
  );

  if (!response.ok) {
    throw new Error(`Leaderboard rank request failed (${response.status}).`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("The leaderboard rank response has an invalid format.");
  }
  if (payload.length === 0) {
    return null;
  }

  const rank = payload[0];
  if (!isRecord(rank)) {
    throw new Error("The leaderboard rank response has an invalid format.");
  }

  const rankNumber =
    typeof rank.rank === "number" ? rank.rank : Number(rank.rank);
  if (!Number.isSafeInteger(rankNumber) || rankNumber < 1) {
    throw new Error("The leaderboard rank response has an invalid rank.");
  }

  return { rank: rankNumber };
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

const Leaderboard = () => {
  const { currentAccount } = useAccountStore();
  const leaderboardQuery = useInfiniteQuery<
    LeaderboardPage,
    Error,
    InfiniteData<LeaderboardPage>,
    readonly ["leaderboard"],
    number
  >({
    getNextPageParam: (lastPage, pages) =>
      pages.length * PAGE_SIZE < lastPage.totalCount
        ? pages.length * PAGE_SIZE
        : undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getLeaderboardPage(pageParam),
    queryKey: ["leaderboard"] as const,
    staleTime: 5 * 60 * 1000
  });
  const statsQuery = useQuery({
    queryFn: getLeaderboardStats,
    queryKey: ["leaderboard", "stats"],
    staleTime: 5 * 60 * 1000
  });
  const rankQuery = useQuery({
    enabled: Boolean(currentAccount?.address),
    queryFn: () => {
      const address = currentAccount?.address;
      if (!address) {
        throw new Error("Sign in to load your leaderboard rank.");
      }
      return getAccountRank(address);
    },
    queryKey: ["leaderboard", "rank", currentAccount?.address],
    staleTime: 5 * 60 * 1000
  });
  const entries =
    leaderboardQuery.data?.pages.flatMap((page) => page.rows) ?? [];
  const addresses = entries.map((entry) => entry.account_address);
  const accountsQuery = useAccountsBulkQuery({
    skip: addresses.length === 0,
    variables: { request: { addresses } }
  });
  const accounts = new Map(
    (accountsQuery.data?.accountsBulk ?? []).map((account) => [
      account.address.toLowerCase(),
      account
    ])
  );

  return (
    <PageLayout title="Leaderboard">
      <div className="space-y-5">
        <Card className="sticky top-0 isolate z-50 px-5 py-4" forceRounded>
          <h1 className="font-medium text-lg">Leaderboard</h1>
        </Card>

        <div
          aria-label="Hey token banner"
          className="h-56 rounded-xl bg-center bg-cover bg-gray-900 sm:h-64"
          role="img"
          style={{
            backgroundImage: "url(https://static.hey.xyz/heytoken.png)"
          }}
        />

        <section className="space-y-3 px-5">
          <h2 className="font-medium text-lg">HP Leaderboard</h2>
          <p className="text-gray-500 text-sm leading-6">
            Your points add up from{" "}
            <span className="text-brand-600">social payment</span> earnings,
            posts you publish through social payment (2 HP each), comments,
            reposts, and quotes you make through social payment (1 HP each), and
            successful premium referrals (+5 HP). Ultra members earn 2x HP.
            Rankings sort by this total. New points are added every hour and the
            leaderboard updates accordingly. HP points will be a determining
            factor in future $HEY airdrops.
          </p>
          <p className="text-sm">
            Also see User Rewards for this month prizes.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-3 px-5">
          <div className="rounded-2xl bg-gray-200 px-3 py-3 text-center dark:bg-gray-800">
            {statsQuery.error ? (
              <ErrorMessage
                error={statsQuery.error}
                title="Failed to load stats"
              />
            ) : statsQuery.isPending ? (
              <Skeleton className="mx-auto h-10 w-24 rounded-lg" />
            ) : (
              <>
                <div className="font-medium">
                  {formatNumber(statsQuery.data.participantCount)}
                </div>
                <div className="text-gray-500 text-sm">People with HP</div>
              </>
            )}
          </div>
          <div className="rounded-2xl bg-gray-200 px-3 py-3 text-center dark:bg-gray-800">
            {statsQuery.error ? (
              <ErrorMessage
                error={statsQuery.error}
                title="Failed to load stats"
              />
            ) : statsQuery.isPending ? (
              <Skeleton className="mx-auto h-10 w-24 rounded-lg" />
            ) : (
              <>
                <div className="font-medium">
                  {formatNumber(statsQuery.data.totalPoints)} HP
                </div>
                <div className="text-gray-500 text-sm">
                  Total HP distributed
                </div>
              </>
            )}
          </div>
        </div>

        <section className="mx-5 overflow-hidden rounded-2xl bg-gray-200 dark:bg-gray-800">
          <div className="space-y-1 p-5">
            <h2 className="font-medium">Your rank</h2>
            {rankQuery.error ? (
              <ErrorMessage
                error={rankQuery.error}
                title="Failed to load your rank"
              />
            ) : currentAccount ? (
              rankQuery.isPending ? (
                <p className="text-gray-500">Loading your rank…</p>
              ) : rankQuery.data ? (
                <p className="text-gray-500">
                  You are ranked #{formatNumber(rankQuery.data.rank)} on the
                  leaderboard.
                </p>
              ) : (
                <p className="text-gray-500">
                  You are not on the leaderboard yet - no author earnings
                  recorded.
                </p>
              )
            ) : (
              <p className="text-gray-500">
                Sign in to see your rank on the all-time leaderboard.
              </p>
            )}
          </div>
          <div className="border-gray-300 border-t px-5 py-6 text-gray-500 text-sm dark:border-gray-700">
            Become a{" "}
            <Link className="text-brand-600" to="/premium">
              Premium member
            </Link>{" "}
            to share your referral link and earn +5 HP per successful referral.
          </div>
        </section>

        {leaderboardQuery.error ? (
          <ErrorMessage
            className="mx-5"
            error={leaderboardQuery.error}
            title="Failed to load leaderboard"
          />
        ) : leaderboardQuery.isPending ? (
          <Card className="space-y-1" forceRounded={false}>
            {Array.from({ length: 10 }, (_, index) => (
              <Skeleton className="h-14 rounded-none" key={`row-${index}`} />
            ))}
          </Card>
        ) : (
          <div className="mx-5 overflow-hidden border border-gray-200 dark:border-gray-700">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-gray-200 text-gray-500 text-xs uppercase dark:bg-gray-800">
                <tr>
                  <th className="w-12 px-4 py-4 font-medium">#</th>
                  <th className="px-3 py-4 font-medium">Author</th>
                  <th className="w-32 px-4 py-4 text-right font-medium">
                    Total points
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  const account = accounts.get(
                    entry.account_address.toLowerCase()
                  );
                  const accountInfo = getAccount(account);
                  const accountUrl =
                    accountInfo.link || `/account/${entry.account_address}`;

                  return (
                    <tr
                      className={
                        index % 2 === 0
                          ? "bg-white dark:bg-black"
                          : "bg-gray-100 dark:bg-gray-900"
                      }
                      key={entry.account_address}
                    >
                      <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                      <td className="min-w-0 px-3 py-2">
                        <Link
                          className="flex min-w-0 items-center gap-2"
                          to={accountUrl}
                        >
                          <Image
                            alt=""
                            className="size-10 shrink-0 rounded-full bg-gray-200 object-cover dark:bg-gray-700"
                            height={40}
                            loading="lazy"
                            src={account ? getAvatar(account) : DEFAULT_AVATAR}
                            width={40}
                          />
                          <span className="min-w-0">
                            <span className="flex min-w-0 items-center gap-1">
                              <span className="truncate font-medium">
                                {accountInfo.name}
                              </span>
                              <CheckBadgeIcon
                                aria-label="Premium member"
                                className="size-4 shrink-0 text-amber-400"
                              />
                            </span>
                            <span className="block truncate text-gray-500 text-xs">
                              {accountInfo.username.startsWith("#")
                                ? accountInfo.username
                                : `@${accountInfo.username}`}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatNumber(entry.total_points)} HP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {accountsQuery.error && (
              <ErrorMessage
                className="m-4"
                error={accountsQuery.error}
                title="Failed to load leaderboard profiles"
              />
            )}
            {leaderboardQuery.hasNextPage && (
              <button
                className="w-full border-gray-200 border-t px-4 py-4 font-medium text-sm hover:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:hover:bg-gray-900"
                disabled={leaderboardQuery.isFetchingNextPage}
                onClick={() => leaderboardQuery.fetchNextPage()}
                type="button"
              >
                {leaderboardQuery.isFetchingNextPage
                  ? "Loading more…"
                  : "Load more"}
              </button>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Leaderboard;
