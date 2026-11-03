import PageLayout from "@/components/Shared/PageLayout";
import { HomeFeedType } from "@/data/enums";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { useHomeTabStore } from "@/store/persisted/useHomeTabStore";
import FeedType from "./FeedType";
import Hero from "./Hero";
import Timeline from "./Timeline";
import TopAccounts from "./TopAccounts";

const Home = () => {
  const { currentAccount } = useAccountStore();
  const { feedType } = useHomeTabStore();
  const loggedInWithAccount = Boolean(currentAccount);

  return (
    <PageLayout>
      <div className="home-page-typography">
        {loggedInWithAccount ? (
          <>
            <FeedType />
            {feedType === HomeFeedType.DISCOVER ? (
              <TopAccounts />
            ) : (
              <Timeline />
            )}
          </>
        ) : (
          <>
            <Hero />
            <TopAccounts />
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default Home;
