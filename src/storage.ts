import browser from 'webextension-polyfill';
import ICloudClient from './iCloudClient';
import { PopupState } from './pages/Popup/stateMachine';

export type Autofill = {
  button: boolean;
  contextMenu: boolean;
};

export type Options = {
  autofill: Autofill;
};

export type AutoHmeEntry = {
  email: string;
  createdAt: string;
  batchId: string;
};

export type AutoHmeSettings = {
  enabled: boolean;
  running: boolean;
  nextRunAt?: string;
  lastRunAt?: string;
  lastSuccessAt?: string;
  lastStoppedAt?: string;
  lastError?: string;
  lastCount?: number;
  desktopAppend?: string;
  desktopAppendEnabled: boolean;
};

export type Store = {
  popupState: PopupState;
  iCloudHmeOptions: Options; // TODO: rename key to options
  autoHmeEmails: AutoHmeEntry[];
  autoHmeSettings: AutoHmeSettings;
  clientState?: {
    setupUrl: ConstructorParameters<typeof ICloudClient>[0];
    webservices: ConstructorParameters<typeof ICloudClient>[1];
  };
};

export const DEFAULT_STORE = {
  popupState: PopupState.SignedOut,
  iCloudHmeOptions: {
    autofill: {
      button: false,
      contextMenu: false,
    },
  },
  autoHmeEmails: [],
  autoHmeSettings: {
    enabled: false,
    running: false,
    desktopAppendEnabled: true,
  },
  clientState: undefined,
};

export async function getBrowserStorageValue<K extends keyof Store>(
  key: K
): Promise<Store[K] | undefined> {
  const store: Partial<Store> = await browser.storage.local.get(key);
  return store[key];
}

export async function setBrowserStorageValue<K extends keyof Store>(
  key: K,
  value: Store[K]
): Promise<void> {
  if (value === undefined) {
    await browser.storage.local.remove(key);
  } else {
    await browser.storage.local.set({ [key]: value });
  }
}
