import { CheckBadgeIcon, CheckIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { toast } from "sonner";
import PageLayout from "@/components/Shared/PageLayout";
import { Card, Modal } from "@/components/Shared/UI";
import getAccount from "@/helpers/getAccount";
import { useAccountStore } from "@/store/persisted/useAccountStore";

const plans = [
  {
    badgeClass: "text-rose-400",
    benefits: [
      "Basic badge",
      "Visibility in All Posts",
      "Extra visibility in Discussions",
      "Eligible for Hey User Rewards",
      "Create referral links and earn Hey Points"
    ],
    name: "Basic",
    price: "1.99"
  },
  {
    badgeClass: "text-rose-500",
    benefits: [
      "Pro badge",
      "All Basic plan benefits",
      "Priority in Who to Follow"
    ],
    name: "Pro",
    price: "4.99"
  },
  {
    badgeClass: "text-amber-400",
    benefits: [
      "Ultra badge",
      "All Pro plan benefits",
      "Top priority in Who to Follow",
      "Priority in You might like",
      "2x Hey Points"
    ],
    name: "Ultra",
    popular: true,
    price: "14.99"
  }
];

type PremiumPlan = (typeof plans)[number];

const Premium = () => {
  const { currentAccount } = useAccountStore();
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan | null>(null);
  const accountName = currentAccount
    ? getAccount(currentAccount).username
    : "yourusername";

  const handleConfirmSubscription = () => {
    toast.error("Insufficient balance.");
  };

  return (
    <PageLayout title="Premium">
      <div className="space-y-5">
        <Card className="sticky top-0 isolate z-50 px-5 py-4" forceRounded>
          <h1 className="font-medium text-lg">Premium</h1>
        </Card>

        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-600 via-rose-700 to-red-950 px-5 py-8 text-center text-white sm:py-9">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"
          />
          <div className="relative mx-auto max-w-lg">
            <div className="mb-3 flex items-center justify-center gap-2">
              <CheckBadgeIcon className="size-10 text-rose-300" />
              <CheckBadgeIcon className="size-12 text-rose-400" />
              <CheckBadgeIcon className="size-14 text-amber-400" />
            </div>
            <h2 className="font-bold text-xl">Premium Options</h2>
            <p className="mt-2 text-sm text-white/90">
              Stand out with a colored badge that verifies your profile on posts
              and mentions.
            </p>
          </div>
        </section>

        <div className="grid gap-4 pt-1 md:grid-cols-3 md:gap-3">
          {plans.map((plan) => (
            <Card
              className={`relative flex min-h-[430px] flex-col overflow-visible p-5 shadow-sm ${
                plan.popular
                  ? "border-amber-300 shadow-amber-100/70 dark:border-amber-400 dark:shadow-none"
                  : ""
              }`}
              forceRounded
              key={plan.name}
            >
              {plan.popular && (
                <div className="absolute -top-3 right-5 rounded-full bg-amber-500 px-4 py-1 font-semibold text-white text-xs shadow-sm">
                  Most popular
                </div>
              )}
              <div className="relative">
                <CheckBadgeIcon
                  aria-hidden="true"
                  className={`absolute -top-1 -right-1 size-20 opacity-[0.08] ${plan.badgeClass}`}
                />
                <div className="flex items-center gap-2 font-medium text-lg">
                  <CheckBadgeIcon
                    aria-hidden="true"
                    className={`size-7 ${plan.badgeClass}`}
                  />
                  {plan.name}
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-bold text-2xl">{plan.price}</span>
                  <span className="text-gray-500 text-sm">USDC · per year</span>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-2xl bg-gray-200 px-3 py-3 text-sm dark:bg-gray-800">
                  <span className="truncate">{accountName}</span>
                  <CheckBadgeIcon
                    aria-label={`${plan.name} badge`}
                    className={`size-5 shrink-0 ${plan.badgeClass}`}
                  />
                </div>
              </div>

              <ul className="mt-4 space-y-2.5 text-gray-600 text-sm dark:text-gray-300">
                {plan.benefits.map((benefit) => (
                  <li className="flex items-start gap-2" key={benefit}>
                    <CheckIcon
                      aria-hidden="true"
                      className={`mt-0.5 size-4 shrink-0 ${plan.badgeClass}`}
                    />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`mt-auto w-full rounded-2xl border px-4 py-3 font-medium transition-colors ${
                  plan.popular
                    ? "border-rose-600 bg-rose-600 text-white hover:bg-rose-700"
                    : "border-gray-200 bg-white text-gray-950 hover:bg-gray-50 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
                }`}
                onClick={() => setSelectedPlan(plan)}
                type="button"
              >
                Subscribe
              </button>
            </Card>
          ))}
        </div>

        <section className="space-y-2 pb-5">
          <h2 className="font-semibold text-gray-500 text-xs uppercase tracking-wide">
            Your subscription
          </h2>
          <div className="rounded-2xl bg-gray-200 px-5 py-4 text-gray-600 text-sm dark:bg-gray-800 dark:text-gray-300">
            No active Premium subscription
          </div>
        </section>
      </div>
      <Modal
        onClose={() => setSelectedPlan(null)}
        show={selectedPlan !== null}
        size="xs"
        title={selectedPlan ? `Subscribe to ${selectedPlan.name}` : undefined}
      >
        {selectedPlan && (
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-2 font-medium">
              <CheckBadgeIcon
                aria-hidden="true"
                className={`size-6 ${selectedPlan.badgeClass}`}
              />
              {selectedPlan.name}
            </div>
            <div className="space-y-5 rounded-xl bg-gray-200 p-4 text-xs dark:bg-gray-700">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-600 dark:text-gray-300">
                  Annual plan price
                </span>
                <span>
                  {selectedPlan.price} USDC{" "}
                  <span className="text-gray-500">/ per year</span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Amount due today</span>
                <span className="font-semibold text-base">
                  {selectedPlan.price}{" "}
                  <span className="font-normal text-gray-500">USDC</span>
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="w-full rounded-xl border border-gray-200 px-4 py-3 font-medium text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                onClick={() => setSelectedPlan(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="w-full rounded-xl bg-rose-600 px-4 py-3 font-medium text-sm text-white transition-colors hover:bg-rose-700"
                onClick={handleConfirmSubscription}
                type="button"
              >
                Confirm and pay
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
};

export default Premium;
