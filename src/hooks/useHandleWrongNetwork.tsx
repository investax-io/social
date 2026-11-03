import { useConfig, useSwitchChain } from "wagmi";
import { getAccount } from "wagmi/actions";
import { CHAIN } from "@/data/constants";

interface HandleWrongNetworkParams {
  chainId?: number;
}

const useHandleWrongNetwork = () => {
  const config = useConfig();
  const { switchChainAsync } = useSwitchChain();

  const handleWrongNetwork = async (params?: HandleWrongNetworkParams) => {
    const chainId = params?.chainId ?? CHAIN.id;
    const { chainId: activeChainId, isConnected } = getAccount(config);

    if (!isConnected) {
      throw new Error("No active wallet connection found.");
    }

    if (activeChainId !== chainId) {
      await switchChainAsync({ chainId });
    }
  };

  return handleWrongNetwork;
};

export default useHandleWrongNetwork;
