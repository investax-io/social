import { PlusIcon } from "@heroicons/react/24/outline";
import { HomeFeedType } from "@/data/enums";
import { useNewPostModalStore } from "@/store/non-persisted/modal/useNewPostModalStore";
import { useHomeTabStore } from "@/store/persisted/useHomeTabStore";

const FeedType = () => {
  const { feedType, setFeedType } = useHomeTabStore();
  const { setShow: setShowNewPostModal } = useNewPostModalStore();
  const activeFeed =
    feedType === HomeFeedType.DISCOVER
      ? HomeFeedType.DISCOVER
      : HomeFeedType.FOLLOWING;

  return (
    <div className="sticky top-0 isolate z-50 mx-5 mb-5 flex h-16 items-stretch rounded-b-2xl border-gray-200 border-b bg-white px-3 md:mx-0 dark:border-gray-800 dark:bg-black">
      {[HomeFeedType.FOLLOWING, HomeFeedType.DISCOVER].map((type) => {
        const isActive = activeFeed === type;
        const label =
          type === HomeFeedType.FOLLOWING ? "Following" : "Discover";

        return (
          <button
            aria-pressed={isActive}
            className={`relative flex flex-1 items-center justify-center text-base transition-colors ${
              isActive
                ? "font-medium text-gray-950 dark:text-white"
                : "font-normal text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
            key={type}
            onClick={() => {
              umami.track("switch_home_tab", { tab: type });
              setFeedType(type);
            }}
            type="button"
          >
            {label}
            {isActive && (
              <span className="absolute right-0 bottom-0 left-0 h-[3px] rounded-full bg-brand-500" />
            )}
          </button>
        );
      })}
      <button
        aria-label="Create post"
        className="flex w-12 shrink-0 items-center justify-center text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        onClick={() => setShowNewPostModal(true)}
        type="button"
      >
        <PlusIcon className="size-6" />
      </button>
    </div>
  );
};

export default FeedType;
