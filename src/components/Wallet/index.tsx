import { ArrowPathIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router";
import { toast } from "sonner";
import AccountLink from "@/components/Shared/Account/AccountLink";
import TopUpButton from "@/components/Shared/Account/TopUp/Button";
import NotLoggedIn from "@/components/Shared/NotLoggedIn";
import PageLayout from "@/components/Shared/PageLayout";
import { Card, ErrorMessage, Image } from "@/components/Shared/UI";
import { NATIVE_TOKEN_SYMBOL } from "@/data/constants";
import getAccount from "@/helpers/getAccount";
import getAvatar from "@/helpers/getAvatar";
import getTokenImage from "@/helpers/getTokenImage";
import { useBalancesBulkQuery } from "@/indexer/generated";
import { useAccountStore } from "@/store/persisted/useAccountStore";

const actionClassName =
  "inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gray-950 px-4 text-xs font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200";

const Wallet = () => {
  const { currentAccount } = useAccountStore();
  const { data, error, loading } = useBalancesBulkQuery({
    fetchPolicy: "no-cache",
    pollInterval: 3000,
    skip: !currentAccount?.address,
    variables: {
      request: {
        address: currentAccount?.address,
        includeNative: true
      }
    }
  });

  if (!currentAccount) {
    return <NotLoggedIn />;
  }

  const nativeBalance = data?.balancesBulk.find(
    (balance) => balance.__typename === "NativeAmount"
  );
  const balance =
    nativeBalance?.__typename === "NativeAmount"
      ? Number(nativeBalance.value).toLocaleString(undefined, {
          maximumFractionDigits: 4
        })
      : loading
        ? "Loading…"
        : "—";
  const accountInfo = getAccount(currentAccount);

  return (
    <PageLayout title="Wallet">
      <div className="space-y-8">
        <Card className="px-5 py-4" forceRounded>
          <h1 className="mb-5 font-semibold text-xl">Wallet</h1>
          {error && (
            <ErrorMessage
              className="mb-4"
              error={error}
              title="Failed to load wallet balance"
            />
          )}
          <div className="flex flex-col gap-6 rounded-2xl bg-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 dark:bg-gray-800">
            <AccountLink
              account={currentAccount}
              className="flex min-w-0 items-center gap-4"
            >
              <Image
                alt={accountInfo.name}
                className="size-16 shrink-0 rounded-full"
                height={64}
                src={getAvatar(currentAccount)}
                width={64}
              />
              <div className="min-w-0">
                <div className="truncate font-semibold text-[15px]">
                  {accountInfo.name}
                </div>
                <div className="truncate text-[15px] text-gray-500">
                  @{accountInfo.username.replace(/^#/, "")}
                </div>
              </div>
            </AccountLink>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <div className="text-right">
                <div className="text-gray-500 text-sm uppercase">
                  Your account
                </div>
                <div className="flex items-center justify-end gap-2 font-semibold text-3xl">
                  {balance}
                  <Image
                    alt={NATIVE_TOKEN_SYMBOL}
                    className="size-9"
                    src={getTokenImage(NATIVE_TOKEN_SYMBOL)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  className={actionClassName}
                  href="https://lens.xyz/bridge"
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  <ArrowPathIcon className="size-4" />
                  Bridge
                </a>
                <TopUpButton
                  className="!h-12 !rounded-2xl !bg-gray-950 !px-4 !text-xs !text-white dark:!bg-white dark:!text-gray-950"
                  label="Deposit"
                  size="md"
                />
                <button
                  className={actionClassName}
                  onClick={() =>
                    toast.info("Withdrawals are not available yet.")
                  }
                  type="button"
                >
                  <ArrowUpTrayIcon className="size-4" />
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        </Card>

        <section className="space-y-3">
          <h2 className="px-1 font-medium text-gray-500 text-xs uppercase">
            Accrued on-chain (all posts)
          </h2>
          <Card
            className="space-y-4 bg-gray-200 p-5 dark:bg-gray-800"
            forceRounded
          >
            <div className="flex items-center gap-2 font-semibold text-3xl">
              0
              <Image
                alt={NATIVE_TOKEN_SYMBOL}
                className="size-9"
                src={getTokenImage(NATIVE_TOKEN_SYMBOL)}
              />
            </div>
            <p className="max-w-2xl text-[11px] text-gray-600 leading-6 dark:text-gray-300">
              This total is summed per publication on the contract; payouts add
              to the balance you see above once settled. It is not split by
              activity type on-chain.
            </p>
          </Card>
        </section>

        <section className="space-y-6 px-1">
          <h2 className="font-medium text-gray-500 text-xs uppercase">
            By publication (on-chain)
          </h2>
          <p className="text-xs">
            No accrued social payment author share on your publications yet.
            Amounts appear here once others pay fees on your content.
          </p>
          <Link
            className="inline-block font-medium text-brand-600 text-xs"
            to="/support"
          >
            How Social Payment works →
          </Link>
        </section>
      </div>
    </PageLayout>
  );
};

export default Wallet;
