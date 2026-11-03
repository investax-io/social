import {
  CameraIcon,
  CpuChipIcon,
  NewspaperIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { memo } from "react";
import { Link } from "react-router";
import SignupCard from "@/components/Shared/Auth/SignupCard";
import Footer from "@/components/Shared/Footer";
import { Card } from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import WhoToFollow from "./WhoToFollow";

const communities = [
  {
    icon: <SparklesIcon className="size-5" />,
    name: "Crypto",
    style: "from-gray-950 via-slate-800 to-gray-600"
  },
  {
    icon: <NewspaperIcon className="size-5" />,
    name: "News",
    style: "from-zinc-900 via-gray-700 to-zinc-500"
  },
  {
    icon: <CpuChipIcon className="size-5" />,
    name: "AI",
    style: "from-black via-slate-900 to-gray-700"
  },
  {
    icon: <CameraIcon className="size-5" />,
    name: "Photography",
    style: "from-neutral-900 via-stone-700 to-neutral-500"
  }
];

const Sidebar = () => {
  const { currentAccount } = useAccountStore();

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-4" forceRounded>
        <h2 className="text-gray-600 text-sm uppercase tracking-wide">
          Activities all time
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-gray-500 text-sm">Views</div>
            <div className="text-xl">14,568</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Posts viewed</div>
            <div className="text-xl">6,220</div>
          </div>
        </div>
      </Card>

      <Card className="space-y-3 p-4" forceRounded>
        <h2 className="px-1 text-gray-600 text-sm uppercase tracking-wide">
          Popular communities
        </h2>
        <div className="space-y-2">
          {communities.map(({ icon, name, style }) => (
            <Link
              className={`flex h-12 items-center gap-3 rounded-2xl bg-gradient-to-r ${style} px-3 text-white transition-opacity hover:opacity-90`}
              key={name}
              to="/groups"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-white text-gray-900">
                {icon}
              </span>
              <span>{name}</span>
            </Link>
          ))}
        </div>
        <Link className="inline-block px-1 pt-1 text-brand-600" to="/groups">
          Show more
        </Link>
      </Card>

      <Card className="space-y-2 p-4" forceRounded>
        <h2>Your rank</h2>
        <p className="text-gray-500">
          You are not on the leaderboard yet - no author earnings recorded.
        </p>
      </Card>

      <Card className="space-y-3 p-4" forceRounded>
        <h2 className="text-lg">User Rewards</h2>
        <p className="text-gray-500">
          Top 10 active Basic, Pro, and Ultra members by all-time author
          earnings can earn rewards.
        </p>
        <Link
          className="inline-block pt-2 text-brand-600"
          to="/settings/rewards"
        >
          View ranking&nbsp;›
        </Link>
      </Card>

      {currentAccount ? <WhoToFollow /> : <SignupCard />}
      <Footer />
    </div>
  );
};

export default memo(Sidebar);
