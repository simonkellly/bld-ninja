import { Store, useStore } from '@tanstack/react-store';

const SETTINGS_KEY = 'ninja-settings';
const DEFAULT_LETTERS = 'ABCDYRSTEFGHIJKLMNOPUVW';

const cornerBuffers = 'UFR UBR UFL UBL DFR DBR DFL DBL';
const edgeBuffers = 'UF UR UL UB FR FL BR BL DF DR DB DL';

interface Settings {
  cornerScheme: string;
  edgeScheme: string;
  cornerBufferOrder: string;
  edgeBufferOrder: string;
}

let settingStore: null | Store<Partial<Settings>> = null;

function getSettingsStore() {
  if (settingStore) return settingStore;
  const strVal = localStorage.getItem(SETTINGS_KEY);
  const settings: Partial<Settings> = strVal ? JSON.parse(strVal) : {};
  settingStore = new Store(settings);
  return settingStore;
}

function setSettings(newVal: Partial<Settings>) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(newVal));
  getSettingsStore().setState(() => newVal);
}

export function settingsWithDefaults(partialSettings: Partial<Settings>) {
  return {
    cornerScheme: partialSettings.cornerScheme || DEFAULT_LETTERS,
    edgeScheme: partialSettings.edgeScheme || DEFAULT_LETTERS,
    cornerBufferOrder: partialSettings.cornerBufferOrder || cornerBuffers,
    edgeBufferOrder: partialSettings.edgeBufferOrder || edgeBuffers,
  } satisfies Settings;
}

export function useLiveSettings(
  selector?: Parameters<
    typeof useStore<Partial<Settings>, Partial<Settings>>
  >['1']
) {
  const store = useStore(getSettingsStore(), selector);
  return settingsWithDefaults(store);
}

export function updateSettings(partSettings: Partial<Settings>) {
  const settings = getSettingsStore().state;
  const newSettings = {
    ...settings,
    ...partSettings,
  };
  setSettings(newSettings);
}
