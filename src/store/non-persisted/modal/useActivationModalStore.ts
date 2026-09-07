import isSiteActive from "@/helpers/isSiteActive";
import { createTrackedStore } from "@/store/createTrackedStore";

interface State {
  setShowActivationModal: (showActivationModal: boolean) => void;
  showActivationModal: boolean;
}

const { useStore: useActivationModalStore } = createTrackedStore<State>(
  (set) => ({
    setShowActivationModal: (showActivationModal) =>
      set(() => ({ showActivationModal })),
    showActivationModal: !isSiteActive()
  })
);

export { useActivationModalStore };
