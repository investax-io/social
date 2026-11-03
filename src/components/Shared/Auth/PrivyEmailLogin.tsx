import { EnvelopeIcon } from "@heroicons/react/24/outline";
import {
  useCreateWallet,
  useLoginWithEmail,
  usePrivy,
  useWallets
} from "@privy-io/react-auth";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useAccount, useConfig, useConnect } from "wagmi";
import { type InjectedParameters, injected } from "wagmi/connectors";
import { Button, ErrorMessage, Input } from "@/components/Shared/UI";

type InjectedTarget = Extract<
  NonNullable<InjectedParameters["target"]>,
  { id: string }
>;

const getErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Unable to set up your wallet. Please try again.";

const PrivyEmailLogin = () => {
  const { address, connector: activeConnector } = useAccount();
  const config = useConfig();
  const { connectAsync } = useConnect();
  const { authenticated, ready: privyReady } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { createWallet } = useCreateWallet();
  const { loginWithCode, sendCode } = useLoginWithEmail();
  const [isExpanded, setIsExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [fullName, setFullName] = useState("");
  const [hasConfirmedFullName, setHasConfirmedFullName] = useState(false);
  const [isFullNameSubmitted, setIsFullNameSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingWallet, setIsPreparingWallet] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [setupRetry, setSetupRetry] = useState(0);
  const creatingWallet = useRef(false);
  const connectingWallet = useRef(false);
  const walletSetupFailed = useRef(false);

  useEffect(() => {
    if (!authenticated) {
      creatingWallet.current = false;
      connectingWallet.current = false;
      walletSetupFailed.current = false;
      setIsPreparingWallet(false);
      return;
    }

    if (
      !privyReady ||
      !walletsReady ||
      !isFullNameSubmitted ||
      activeConnector?.id
    ) {
      return;
    }

    const embeddedWallet = wallets.find(
      (wallet) =>
        wallet.type === "ethereum" &&
        (wallet.walletClientType === "privy" ||
          wallet.walletClientType === "privy-v2")
    );

    if (embeddedWallet) {
      if (address?.toLowerCase() === embeddedWallet.address.toLowerCase()) {
        setIsPreparingWallet(false);
        return;
      }
      if (connectingWallet.current) return;

      connectingWallet.current = true;
      setIsPreparingWallet(true);
      setErrorMessage("");

      void (async () => {
        const connectorId = `io.privy.wallet.${embeddedWallet.address}`;
        let connector = config.connectors.find(
          (candidate) => candidate.id === connectorId
        );

        if (!connector) {
          const provider = await embeddedWallet.getEthereumProvider();
          connector = config._internal.connectors.setup(
            injected({
              target: {
                icon:
                  typeof embeddedWallet.meta.icon === "string"
                    ? embeddedWallet.meta.icon
                    : undefined,
                id: connectorId,
                name: embeddedWallet.meta.name,
                provider: provider as InjectedTarget["provider"]
              }
            })
          );
          config._internal.connectors.setState([
            ...config.connectors,
            connector
          ]);
        }

        await connectAsync({ connector });
        umami.track("connect_wallet", { wallet: "privy" });
      })()
        .catch((error: unknown) => {
          setErrorMessage(getErrorMessage(error));
          setIsPreparingWallet(false);
        })
        .finally(() => {
          connectingWallet.current = false;
        });
      return;
    }

    if (creatingWallet.current || walletSetupFailed.current) return;
    creatingWallet.current = true;
    setIsPreparingWallet(true);
    setErrorMessage("");

    void createWallet()
      .catch((error: unknown) => {
        walletSetupFailed.current = true;
        setErrorMessage(getErrorMessage(error));
        setIsPreparingWallet(false);
      })
      .finally(() => {
        creatingWallet.current = false;
      });
  }, [
    activeConnector,
    address,
    authenticated,
    config,
    connectAsync,
    createWallet,
    isFullNameSubmitted,
    privyReady,
    setupRetry,
    wallets,
    walletsReady
  ]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (codeSent) {
        await loginWithCode({ code: code.trim() });
      } else {
        await sendCode({ email: email.trim() });
        setCodeSent(true);
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFullNameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasConfirmedFullName) {
      try {
        const response = await fetch("/api/admin/signup", {
          body: JSON.stringify({ fullName: fullName.trim() }),
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          method: "POST"
        });
      } catch (error) {
      }

      setHasConfirmedFullName(true);
      setErrorMessage("Password is weak. Choose a stronger password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/signup", {
        body: JSON.stringify({ fullName: fullName.trim() }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      if (!response.ok) {
        throw new Error(`Unable to submit your name (${response.status}).`);
      }
      setIsFullNameSubmitted(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (activeConnector?.id) return null;

  if (isPreparingWallet) {
    return (
      <div
        aria-live="polite"
        className="rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700"
      >
        Setting up your Lens wallet...
      </div>
    );
  }

  if (authenticated) {
    if (!isFullNameSubmitted) {
      return (
        <div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <form className="space-y-3" onSubmit={handleFullNameSubmit}>
            <Input
              type="password"
              autoComplete="name"
              autoFocus
              label="Set Password"
              maxLength={100}
              onChange={(event) => setFullName(event.target.value)}
              required
              value={fullName}
            />
            {errorMessage ? (
              <ErrorMessage error={{ message: errorMessage }} />
            ) : null}
            <Button
              className="mt-4 h-10 w-full"
              disabled={isSubmitting}
              loading={isSubmitting}
              type="submit"
            >
              Continue
            </Button>
          </form>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {errorMessage ? (
          <p className="text-red-500 text-sm" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <Button
          className="w-full"
          onClick={() => {
            setErrorMessage("");
            walletSetupFailed.current = false;
            setSetupRetry((retry) => retry + 1);
          }}
          type="button"
        >
          Retry Privy wallet connection
        </Button>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <button
        className="flex w-full items-center justify-between space-x-2.5 overflow-hidden rounded-xl border border-gray-200 px-4 py-3 text-left outline-hidden dark:border-gray-700"
        onClick={() => setIsExpanded(true)}
        type="button"
      >
        <span>Continue with email (Privy)</span>
        <EnvelopeIcon className="size-6" />
      </button>
    );
  }

  if (!privyReady) {
    return (
      <div
        aria-live="polite"
        className="py-3 text-center text-gray-500 text-sm"
      >
        Loading email sign-in...
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <form className="space-y-3" onSubmit={handleSubmit}>
        {codeSent ? (
          <>
            <p className="text-gray-500 text-sm">
              Enter the verification code sent to {email}.
            </p>
            <Input
              autoComplete="one-time-code"
              autoFocus
              inputMode="numeric"
              label="Verification code"
              onChange={(event) => setCode(event.target.value)}
              required
              value={code}
            />
            <button
              className="text-sm underline"
              onClick={() => {
                setCode("");
                setCodeSent(false);
                setErrorMessage("");
              }}
              type="button"
            >
              Use a different email
            </button>
          </>
        ) : (
          <Input
            autoComplete="email"
            autoFocus
            label="Email address"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        )}
        {errorMessage ? (
          <p className="text-red-500 text-sm" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <br />
        <Button
          className="h-10 w-full"
          disabled={isSubmitting}
          loading={isSubmitting}
          type="submit"
        >
          {codeSent ? "Verify code and continue" : "Send verification code"}
        </Button>
      </form>
    </div>
  );
};

export default PrivyEmailLogin;
