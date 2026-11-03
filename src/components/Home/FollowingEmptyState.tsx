import { UserGroupIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router";
import SingleAccount from "@/components/Shared/Account/SingleAccount";
import SingleAccountShimmer from "@/components/Shared/Shimmer/SingleAccountShimmer";
import { Card, ErrorMessage } from "@/components/Shared/UI";
import {
  type AccountFragment,
  AccountsOrderBy,
  PageSize,
  useAccountsQuery
} from "@/indexer/generated";

const FollowingEmptyState = () => {
  const { data, error, loading } = useAccountsQuery({
    variables: {
      request: {
        filter: { searchBy: { localNameQuery: "a" } },
        orderBy: AccountsOrderBy.AccountScore,
        pageSize: PageSize.Fifty
      }
    }
  });

  const accounts =
    data?.accounts.items.filter(
      (account) =>
        !account.operations?.isBlockedByMe &&
        !account.operations?.isFollowedByMe &&
        !account.operations?.hasBlockedMe
    ) ?? [];

  return (
    <>
      <section className="flex min-h-[270px] flex-col items-center justify-center gap-4 px-5 py-8 text-center">
        <UserGroupIcon aria-hidden="true" className="size-8 text-gray-500" />
        <p className="text-gray-500">
          Follow people to see their posts in your feed.
        </p>
        <Link
          className="rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-500"
          to="/search"
        >
          Discover accounts
        </Link>
      </section>

      <Card forceRounded={false}>
        <h2 className="border-gray-200 border-b px-5 py-4 dark:border-gray-700">
          Discover members to follow.
        </h2>
        {error && (
          <ErrorMessage
            className="m-5"
            error={error}
            title="Failed to load members to follow"
          />
        )}
        {loading ? (
          <div className="divide-y divide-gray-200 px-5 dark:divide-gray-700">
            {Array.from({ length: 5 }, (_, index) => `account-${index}`).map(
              (key) => (
                <div className="py-5" key={key}>
                  <SingleAccountShimmer showFollowUnfollowButton />
                </div>
              )
            )}
          </div>
        ) : accounts.length ? (
          <div className="divide-y divide-gray-200 px-5 dark:divide-gray-700">
            {accounts.map((account) => (
              <div className="py-5" key={account.address}>
                <SingleAccount
                  account={account as AccountFragment}
                  showBio
                  showUserPreview={false}
                />
              </div>
            ))}
          </div>
        ) : error ? null : (
          <p className="px-5 py-6 text-gray-500">
            No accounts are available to follow right now.
          </p>
        )}
      </Card>
    </>
  );
};

export default FollowingEmptyState;
