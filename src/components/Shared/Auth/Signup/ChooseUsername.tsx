import {
  CheckIcon,
  ExclamationTriangleIcon,
  FaceFrownIcon,
  FaceSmileIcon
} from "@heroicons/react/24/outline";
import { account as accountMetadata } from "@lens-protocol/metadata";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAccount, useSignMessage } from "wagmi";
import { z } from "zod";
import AuthMessage from "@/components/Shared/Auth/AuthMessage";
import { Button, Form, Input, useZodForm } from "@/components/Shared/UI";
import { HEY_APP } from "@/data/constants";
import { ERRORS } from "@/data/errors";
import { Regex } from "@/data/regex";
import errorToast from "@/helpers/errorToast";
import uploadMetadata from "@/helpers/uploadMetadata";
import useHandleWrongNetwork from "@/hooks/useHandleWrongNetwork";
import useTransactionLifecycle from "@/hooks/useTransactionLifecycle";
import {
  useAccountQuery,
  useAuthenticateMutation,
  useChallengeMutation,
  useCreateAccountWithUsernameMutation
} from "@/indexer/generated";
import { useSignupStore } from ".";

export const SignupMessage = () => (
  <AuthMessage
    description="Let's start by buying your username for you. Buying you say? Yep - usernames cost a little bit of money to support the network and keep bots away"
    title="Welcome to Alchemy!"
  />
);

const ValidationSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(26, { message: "Username must be at most 26 characters long" })
    .regex(Regex.username, {
      message:
        "Username must start with a letter/number, only _ allowed in between"
    })
});

const ChooseUsername = () => {
  const {
    setChosenUsername,
    setScreen,
    setTransactionHash,
    setOnboardingToken
  } = useSignupStore();
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { address } = useAccount();
  const handleWrongNetwork = useHandleWrongNetwork();
  const handleTransactionLifecycle = useTransactionLifecycle();
  const form = useZodForm({ mode: "onChange", schema: ValidationSchema });

  const onCompleted = (hash: string) => {
    setIsSubmitting(false);
    setChosenUsername(username);
    setTransactionHash(hash);
    setScreen("minting");
  };

  const onError = useCallback((error?: unknown) => {
    setIsSubmitting(false);

    if (
      error instanceof Error &&
      error.message.includes("must be routed through the approval popup")
    ) {
      toast.error(
        "Family couldn't complete the wallet approval. Please retry and approve the request in Family.",
        { id: "error" }
      );
      return;
    }

    errorToast(error);
  }, []);

  const { signMessageAsync } = useSignMessage({ mutation: { onError } });
  const [loadChallenge] = useChallengeMutation({ onError });
  const [authenticate] = useAuthenticateMutation({ onError });

  const [createAccountWithUsername] = useCreateAccountWithUsernameMutation({
    onCompleted: async ({ createAccountWithUsername }) => {
      if (createAccountWithUsername.__typename === "CreateAccountResponse") {
        return onCompleted(createAccountWithUsername.hash);
      }

      if (createAccountWithUsername.__typename === "UsernameTaken") {
        return onError({ message: createAccountWithUsername.reason });
      }

      return await handleTransactionLifecycle({
        onCompleted,
        onError,
        transactionData: createAccountWithUsername
      });
    },
    onError
  });

  const username = form.watch("username");
  const canCheck = Boolean(username && username.length > 2);
  const isInvalid = !form.formState.isValid;

  const {
    error: availabilityError,
    loading: isCheckingAvailability,
    refetch: retryAvailabilityCheck
  } = useAccountQuery({
    fetchPolicy: "no-cache",
    onCompleted: (data) => setIsAvailable(!data.account),
    skip: !canCheck,
    variables: {
      request: { username: { localName: username?.toLowerCase() } }
    }
  });

  const handleSignup = async ({
    username
  }: z.infer<typeof ValidationSchema>) => {
    try {
      setIsSubmitting(true);

      if (!address) {
        throw new Error("Connect a wallet before signing up.");
      }

      await handleWrongNetwork();

      const challenge = await loadChallenge({
        variables: {
          request: { onboardingUser: { app: HEY_APP, wallet: address } }
        }
      });

      if (!challenge?.data?.challenge?.text) {
        return toast.error(ERRORS.SomethingWentWrong);
      }

      // Get signature
      const signature = await signMessageAsync({
        message: challenge?.data?.challenge?.text
      });

      // Auth account
      const auth = await authenticate({
        variables: { request: { id: challenge.data.challenge.id, signature } }
      });

      if (auth.data?.authenticate.__typename === "AuthenticationTokens") {
        const accessToken = auth.data?.authenticate.accessToken;
        const metadataUri = await uploadMetadata(
          accountMetadata({ name: username })
        );
        setOnboardingToken(accessToken);
        return await createAccountWithUsername({
          context: { headers: { "X-Access-Token": accessToken } },
          variables: {
            request: {
              metadataUri,
              username: { localName: username.toLowerCase() }
            }
          }
        });
      }
      return onError({ message: ERRORS.SomethingWentWrong });
    } catch (error: unknown) {
      onError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled =
    !canCheck ||
    isAvailable !== true ||
    isCheckingAvailability ||
    Boolean(availabilityError) ||
    isSubmitting ||
    isInvalid;

  return (
    <div className="space-y-5">
      <SignupMessage />
      <Form
        className="space-y-5 pt-3"
        form={form}
        onSubmit={async ({ username }) =>
          await handleSignup({ username: username.toLowerCase() })
        }
      >
        <div className="mb-5">
          <Input
            hideError
            placeholder="username"
            prefix="@lens/"
            {...form.register("username")}
          />
          {availabilityError ? (
            <div className="mt-2 flex items-center justify-between gap-2 text-red-500 text-sm">
              <span>Could not check username availability.</span>
              <button
                className="shrink-0 underline"
                onClick={() => {
                  void retryAvailabilityCheck().catch(onError);
                }}
                type="button"
              >
                Retry
              </button>
            </div>
          ) : canCheck && !isInvalid ? (
            isAvailable === false ? (
              <div className="mt-2 flex items-center space-x-1 text-red-500 text-sm">
                <FaceFrownIcon className="size-4" />
                <b>Username not available!</b>
              </div>
            ) : isAvailable === true ? (
              <div className="mt-2 flex items-center space-x-1 text-green-500 text-sm">
                <CheckIcon className="size-4" />
                <b>You're in luck - it's available!</b>
              </div>
            ) : isCheckingAvailability ? (
              <output className="mt-2 flex items-center space-x-1 text-gray-500 text-sm dark:text-gray-200">
                Checking username availability…
              </output>
            ) : null
          ) : canCheck && isInvalid ? (
            <div className="mt-2 flex items-center space-x-1 text-red-500 text-sm">
              <ExclamationTriangleIcon className="size-4" />
              <b>{form.formState.errors.username?.message?.toString()}</b>
            </div>
          ) : (
            <div className="mt-2 flex items-center space-x-1 text-gray-500 text-sm dark:text-gray-200">
              <FaceSmileIcon className="size-4" />
              <b>Hope you get a good one!</b>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <Button
            className="h-10 w-full"
            disabled={disabled}
            loading={isSubmitting}
            type="submit"
          >
            Signup
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ChooseUsername;
