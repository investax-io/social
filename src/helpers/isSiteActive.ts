import { Localstorage } from "@/data/storage";

const isSiteActive = () =>
  localStorage.getItem(Localstorage.ActivationStatus) === "true";

export default isSiteActive;
