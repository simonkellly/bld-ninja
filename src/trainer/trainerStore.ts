import { Store } from "@tanstack/react-store";
import { z } from "zod";
import { algSheet } from "./algSheet";

const LOCAL_STORAGE_KEY = 'trainer';

const store = z.object({
  algSheet: algSheet.or(z.undefined()),
  selectedLetters: z.array(z.string()),
  includeInverse: z.boolean(),
})

function getDataFromLocalStorageOrDefault() {
  const localStoreText = localStorage.getItem(LOCAL_STORAGE_KEY);
  const localStore = localStoreText ? JSON.parse(localStoreText) : null;
  
  const previousStore = store.safeParse(localStore);
  
  return previousStore.success ? previousStore.data : {
    selectedLetters: [],
    includeInverse: true,
  } satisfies z.infer<typeof store>;
}

export const trainerStore = new Store(getDataFromLocalStorageOrDefault(), {
  onUpdate: () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trainerStore.state));
  },
});
