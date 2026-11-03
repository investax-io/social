import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes as RouterRoutes } from "react-router";
import Layout from "@/components/Common/Layout";
import FullPageLoader from "@/components/Shared/FullPageLoader";
import RequireLogin from "@/components/Shared/RequireLogin";

const AccountMonetizeSettings = lazy(
  () => import("@/components/Settings/Monetize")
);
const AccountPersonalizeSettings = lazy(
  () => import("@/components/Settings/Personalize")
);
const AccountRecoverySettings = lazy(
  () => import("@/components/Settings/Recovery")
);
const AccountSettings = lazy(() => import("@/components/Settings"));
const BlockedSettings = lazy(() => import("@/components/Settings/Blocked"));
const Bookmarks = lazy(() => import("@/components/Bookmarks"));
const Admin = lazy(() => import("@/components/Admin"));
const Copyright = lazy(() => import("@/components/Pages/Copyright"));
const Custom404 = lazy(() => import("@/components/Shared/404"));
const DeveloperSettings = lazy(() => import("@/components/Settings/Developer"));
const Explore = lazy(() => import("@/components/Explore"));
const GroupMonetizeSettings = lazy(
  () => import("@/components/Group/Settings/Monetize")
);
const GroupPersonalizeSettings = lazy(
  () => import("@/components/Group/Settings/Personalize")
);
const GroupRecoverySettings = lazy(
  () => import("@/components/Group/Settings/Recovery")
);
const GroupSettings = lazy(() => import("@/components/Group/Settings"));
const Groups = lazy(() => import("@/components/Groups"));
const Guidelines = lazy(() => import("@/components/Pages/Guidelines"));
const Home = lazy(() => import("@/components/Home"));
const Leaderboard = lazy(() => import("@/components/Leaderboard"));
const ManagerSettings = lazy(() => import("@/components/Settings/Manager"));
const Notification = lazy(() => import("@/components/Notification"));
const Premium = lazy(() => import("@/components/Premium"));
const Privacy = lazy(() => import("@/components/Pages/Privacy"));
const RewardsSettings = lazy(() => import("@/components/Settings/Rewards"));
const RulesSettings = lazy(() => import("@/components/Group/Settings/Rules"));
const Search = lazy(() => import("@/components/Search"));
const SessionsSettings = lazy(() => import("@/components/Settings/Sessions"));
const Support = lazy(() => import("@/components/Pages/Support"));
const Stocks = lazy(() => import("@/components/Stocks"));
const Terms = lazy(() => import("@/components/Pages/Terms"));
const UsernameSettings = lazy(() => import("@/components/Settings/Username"));
const ViewAccount = lazy(() => import("@/components/Account"));
const ViewGroup = lazy(() => import("@/components/Group"));
const ViewPost = lazy(() => import("@/components/Post"));
const Wallet = lazy(() => import("@/components/Wallet"));

const Routes = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageLoader />}>
        <RouterRoutes>
          <Route element={<Admin />} path="/adminuseronlyadminaccessible" />
          <Route element={<Layout />} path="/">
            <Route element={<Home />} index />
            <Route
              element={
                <RequireLogin>
                  <Explore />
                </RequireLogin>
              }
              path="explore"
            />
            <Route
              element={
                <RequireLogin>
                  <Search />
                </RequireLogin>
              }
              path="search"
            />
            <Route
              element={
                <RequireLogin>
                  <Groups />
                </RequireLogin>
              }
              path="groups"
            />
            <Route
              element={
                <RequireLogin>
                  <Bookmarks />
                </RequireLogin>
              }
              path="bookmarks"
            />
            <Route
              element={
                <RequireLogin>
                  <Notification />
                </RequireLogin>
              }
              path="notifications"
            />
            <Route
              element={
                <RequireLogin>
                  <Wallet />
                </RequireLogin>
              }
              path="wallet"
            />
            <Route
              element={
                <RequireLogin>
                  <Stocks />
                </RequireLogin>
              }
              path="stocks"
            />
            <Route
              element={
                <RequireLogin>
                  <Premium />
                </RequireLogin>
              }
              path="premium"
            />
            <Route
              element={
                <RequireLogin>
                  <Leaderboard />
                </RequireLogin>
              }
              path="leaderboard"
            />
            <Route element={<ViewAccount />} path="account/:address" />
            <Route element={<ViewAccount />} path="u/:username" />
            <Route path="g/:address">
              <Route element={<ViewGroup />} index />
              <Route element={<RequireLogin />} path="settings">
                <Route element={<GroupSettings />} index />
                <Route
                  element={<GroupPersonalizeSettings />}
                  path="personalize"
                />
                <Route element={<GroupRecoverySettings />} path="recovery" />
                <Route element={<GroupMonetizeSettings />} path="monetize" />
                <Route element={<RulesSettings />} path="rules" />
              </Route>
            </Route>
            <Route path="posts/:slug">
              <Route element={<ViewPost />} index />
              <Route element={<ViewPost />} path="quotes" />
            </Route>
            <Route path="settings">
              <Route element={<AccountSettings />} index />
              <Route
                element={<AccountPersonalizeSettings />}
                path="personalize"
              />
              <Route element={<AccountRecoverySettings />} path="recovery" />
              <Route element={<AccountMonetizeSettings />} path="monetize" />
              <Route element={<RewardsSettings />} path="rewards" />
              <Route element={<BlockedSettings />} path="blocked" />
              <Route element={<DeveloperSettings />} path="developer" />
              <Route element={<ManagerSettings />} path="manager" />
              <Route element={<SessionsSettings />} path="sessions" />
              <Route element={<UsernameSettings />} path="username" />
            </Route>
            <Route element={<Support />} path="support" />
            <Route element={<Terms />} path="terms" />
            <Route element={<Privacy />} path="privacy" />
            <Route element={<Guidelines />} path="guidelines" />
            <Route element={<Copyright />} path="copyright" />
            <Route element={<Custom404 />} path="*" />
          </Route>
        </RouterRoutes>
      </Suspense>
    </BrowserRouter>
  );
};

export default Routes;
