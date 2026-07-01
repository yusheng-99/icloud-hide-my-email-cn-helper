import {
  getBrowserStorageValue,
  setBrowserStorageValue,
  Store,
  DEFAULT_STORE,
  Options,
} from '../../storage';
import ICloudClient, {
  PremiumMailSettings,
  DEFAULT_SETUP_URL,
  CN_SETUP_URL,
} from '../../iCloudClient';
import {
  ActiveInputElementWriteData,
  Message,
  MessageType,
  ReservationRequestData,
  sendMessageToTab,
} from '../../messages';
import browser from 'webextension-polyfill';
import {
  CONTEXT_MENU_ITEM_ID,
  LOADING_COPY,
  NOTIFICATION_MESSAGE_COPY,
  NOTIFICATION_TITLE_COPY,
  SIGNED_IN_CTA_COPY,
  SIGNED_OUT_CTA_COPY,
} from './constants';
import { isFirefox } from '../../browserUtils';

const constructClient = async (): Promise<ICloudClient> => {
  const clientState = await getBrowserStorageValue('clientState');

  if (clientState === undefined || clientState.setupUrl !== CN_SETUP_URL) {
    if (clientState?.setupUrl !== undefined) {
      console.debug('constructClient: clearing non-China iCloud session');
      performDeauthSideEffects();
    } else {
      console.debug('constructClient: Using China setupUrl');
    }
    return new ICloudClient(CN_SETUP_URL);
  }

  return new ICloudClient(CN_SETUP_URL, clientState.webservices);
};

const performDeauthSideEffects = () => {
  setBrowserStorageValue('popupState', DEFAULT_STORE.popupState);
  setBrowserStorageValue('clientState', DEFAULT_STORE.clientState);

  browser.contextMenus
    .update(CONTEXT_MENU_ITEM_ID, {
      title: SIGNED_OUT_CTA_COPY,
      enabled: false,
    })
    .catch(console.debug);
};

const performAuthSideEffects = (
  client: ICloudClient,
  options: { notification?: boolean } = {}
) => {
  const { notification = false } = options;

  setBrowserStorageValue('clientState', {
    setupUrl: client.setupUrl,
    webservices: client.webservices,
  });

  browser.contextMenus
    .update(CONTEXT_MENU_ITEM_ID, {
      title: SIGNED_IN_CTA_COPY,
      enabled: true,
      visible: false,
    })
    .catch(console.debug);

  if (notification) {
    browser.notifications
      .create({
        type: 'basic',
        title: NOTIFICATION_TITLE_COPY,
        message: NOTIFICATION_MESSAGE_COPY,
        iconUrl: 'icon-128.png',
      })
      .catch(console.debug);
  }
};

// ===== Auto HME collector =====

const AUTO_HME_ALARM_NAME = 'auto-hme-collector';
const AUTO_HME_PERIOD_MINUTES = 65;
const AUTO_HME_BATCH_SIZE = 5;
const AUTO_HME_APPEND_URL = 'http://127.0.0.1:37651/append';
// Public local-only placeholder. Keep this matched with your local desktop append helper if you enable desktop TXT writing.
const AUTO_HME_APPEND_TOKEN = 'local-dev-token';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const appendAutoHmeEmails = async (emails: string[]) => {
  if (emails.length === 0) {
    return;
  }
  const response = await fetch(AUTO_HME_APPEND_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-icloud-hme-auto-token': AUTO_HME_APPEND_TOKEN,
    },
    body: JSON.stringify({ emails }),
  });
  if (!response.ok) {
    throw new Error(`Append server failed: HTTP ${response.status}`);
  }
};

const saveAutoHmeEmailsInExtension = async (emails: string[]) => {
  if (emails.length === 0) {
    return;
  }
  const batchId = new Date().toISOString();
  const existing = (await getBrowserStorageValue('autoHmeEmails')) || [];
  await setBrowserStorageValue('autoHmeEmails', [
    ...existing,
    ...emails.map((email) => ({ email, createdAt: batchId, batchId })),
  ]);
};

const getAutoHmeSettings = async () => ({
  ...DEFAULT_STORE.autoHmeSettings,
  ...((await getBrowserStorageValue('autoHmeSettings')) || {}),
});

const updateAutoHmeSettings = async (
  patch: Partial<Store['autoHmeSettings']>
) => {
  const settings = { ...(await getAutoHmeSettings()), ...patch };
  await setBrowserStorageValue('autoHmeSettings', settings);
  return settings;
};

const scheduleAutoHmeAlarm = async (delayInMinutes = AUTO_HME_PERIOD_MINUTES) => {
  const nextRunAt = new Date(
    Date.now() + delayInMinutes * 60 * 1000
  ).toISOString();
  await browser.alarms.create(AUTO_HME_ALARM_NAME, {
    delayInMinutes,
    periodInMinutes: AUTO_HME_PERIOD_MINUTES,
  });
  return updateAutoHmeSettings({ enabled: true, nextRunAt, lastError: '' });
};

const stopAutoHmeAlarm = async () => {
  await browser.alarms.clear(AUTO_HME_ALARM_NAME);
  return updateAutoHmeSettings({
    enabled: false,
    running: false,
    nextRunAt: undefined,
    lastStoppedAt: new Date().toISOString(),
  });
};

const setupAutoHmeAlarm = async () => {
  const settings = await getAutoHmeSettings();
  if (!settings.enabled) {
    await browser.alarms.clear(AUTO_HME_ALARM_NAME);
    await updateAutoHmeSettings({ running: false, nextRunAt: undefined });
    return;
  }

  const existingAlarm = await browser.alarms.get(AUTO_HME_ALARM_NAME);
  if (existingAlarm) {
    const minNextRunAt = settings.lastSuccessAt
      ? Date.parse(settings.lastSuccessAt) +
        AUTO_HME_PERIOD_MINUTES * 60 * 1000
      : 0;
    if (
      minNextRunAt > Date.now() &&
      existingAlarm.scheduledTime < minNextRunAt - 60 * 1000
    ) {
      await browser.alarms.create(AUTO_HME_ALARM_NAME, {
        delayInMinutes: Math.max(1, (minNextRunAt - Date.now()) / 60000),
        periodInMinutes: AUTO_HME_PERIOD_MINUTES,
      });
      await updateAutoHmeSettings({
        running: false,
        nextRunAt: new Date(minNextRunAt).toISOString(),
      });
      return;
    }
    await updateAutoHmeSettings({
      running: false,
      nextRunAt: new Date(existingAlarm.scheduledTime).toISOString(),
    });
    return;
  }

  await scheduleAutoHmeAlarm(AUTO_HME_PERIOD_MINUTES);
};

const collectAutoHmeBatch = async (manual = false) => {
  const settings = await getAutoHmeSettings();
  if (!manual && !settings.enabled) {
    return settings;
  }
  if (settings.running) {
    return settings;
  }

  await updateAutoHmeSettings({
    running: true,
    lastRunAt: new Date().toISOString(),
    lastError: '',
  });

  try {
    const client = await constructClient();
    const isAuthenticated = await client.isAuthenticated();
    if (!isAuthenticated) {
      performDeauthSideEffects();
      throw new Error('iCloud 未登录，请先在扩展弹窗完成登录');
    }

    const pms = new PremiumMailSettings(client);
    const emails: string[] = [];
    const stamp = new Date().toISOString();

    for (let i = 0; i < AUTO_HME_BATCH_SIZE; i += 1) {
      const hme = await pms.generateHme();
      await pms.reserveHme(
        hme,
        `auto-${stamp}`,
        '本地扩展每 65 分钟自动生成'
      );
      emails.push(hme);
      await sleep(1000);
    }

    await saveAutoHmeEmailsInExtension(emails);
    let desktopAppend = settings.desktopAppendEnabled
      ? '桌面写入助手未启动，仅保存到扩展内部'
      : '桌面写入已关闭，仅保存到扩展内部';
    if (settings.desktopAppendEnabled) {
      try {
        await appendAutoHmeEmails(emails);
        desktopAppend = '同时已追加到桌面 TXT';
      } catch (error) {
        console.debug('Desktop append skipped', error);
      }
    }
    const updated = await updateAutoHmeSettings({
      running: false,
      lastSuccessAt: new Date().toISOString(),
      lastCount: emails.length,
      desktopAppend,
      nextRunAt: settings.enabled
        ? new Date(Date.now() + AUTO_HME_PERIOD_MINUTES * 60 * 1000).toISOString()
        : undefined,
    });
    browser.notifications
      .create({
        type: 'basic',
        title: 'iCloud 隐藏邮箱助手',
        message: `已自动获取 ${emails.length} 个隐藏邮箱，${desktopAppend}`,
        iconUrl: 'icon-128.png',
      })
      .catch(console.debug);
    return updated;
  } catch (error) {
    const message = error?.toString?.() || String(error);
    const updated = await updateAutoHmeSettings({
      running: false,
      lastError: message,
      nextRunAt: settings.enabled
        ? new Date(Date.now() + AUTO_HME_PERIOD_MINUTES * 60 * 1000).toISOString()
        : undefined,
    });
    browser.notifications
      .create({
        type: 'basic',
        title: 'iCloud 隐藏邮箱助手自动获取失败',
        message,
        iconUrl: 'icon-128.png',
      })
      .catch(console.debug);
    return updated;
  }
};

browser.runtime.onInstalled.addListener(setupAutoHmeAlarm);
browser.runtime.onStartup.addListener(setupAutoHmeAlarm);
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === AUTO_HME_ALARM_NAME) {
    collectAutoHmeBatch().catch(console.debug);
  }
});
setupAutoHmeAlarm();

// ===== Message handling =====

browser.runtime.onMessage.addListener(async (uncastedMessage: unknown) => {
  const message = uncastedMessage as Message<unknown>;

  switch (message.type) {
    case MessageType.AutoHmeStart:
      return await scheduleAutoHmeAlarm(1);
    case MessageType.AutoHmeStop:
      return await stopAutoHmeAlarm();
    case MessageType.AutoHmeRunNow:
      return await collectAutoHmeBatch(true);
    case MessageType.GenerateRequest:
      {
        const deauthCallback = async () => {
          await sendMessageToTab(MessageType.GenerateResponse, {
            error: SIGNED_OUT_CTA_COPY,
            elementId,
          });
          performDeauthSideEffects();
        };

        const elementId = message.data;

        const clientState = await getBrowserStorageValue('clientState');
        if (clientState === undefined) {
          await deauthCallback();
          break;
        }

        const client = new ICloudClient(
          clientState.setupUrl,
          clientState.webservices
        );
        const isClientAuthenticated = await client.isAuthenticated();
        if (!isClientAuthenticated) {
          await deauthCallback();
          break;
        }

        try {
          const pms = new PremiumMailSettings(client);
          const hme = await pms.generateHme();
          await sendMessageToTab(MessageType.GenerateResponse, {
            hme,
            elementId,
          });
        } catch (e) {
          await sendMessageToTab(MessageType.GenerateResponse, {
            error: e.toString(),
            elementId,
          });
        }
      }
      break;
    case MessageType.ReservationRequest:
      {
        const { hme, label, elementId } =
          message.data as ReservationRequestData;
        const client = await constructClient();
        // Given that the reservation step happens shortly after
        // the generation step, it is safe to assume that the client's
        // auth state has been recently validated. Hence, we are
        // skipping token validation.
        try {
          const pms = new PremiumMailSettings(client);
          await pms.reserveHme(hme, label);
          await sendMessageToTab(MessageType.ReservationResponse, {
            hme,
            elementId,
          });
        } catch (e) {
          await sendMessageToTab(MessageType.ReservationResponse, {
            error: e.toString(),
            elementId,
          });
        }
      }
      break;
    default:
      break;
  }
});

// ===== Context menu =====

const setupContextMenu = async () => {
  const options =
    (await getBrowserStorageValue('iCloudHmeOptions')) ||
    DEFAULT_STORE.iCloudHmeOptions;

  browser.contextMenus.create(
    {
      id: CONTEXT_MENU_ITEM_ID,
      title: LOADING_COPY,
      contexts: ['editable'],
      enabled: false,
      visible: false,
    },
    async () => {
      const client = await constructClient();
      const isAuthenticated = await client.isAuthenticated();
      if (isAuthenticated) {
        performAuthSideEffects(client);
      } else {
        performDeauthSideEffects();
      }
    }
  );
};

// At any given time, there should be 1 created context menu item. We want to prevent
// the creation of multiple items that serve the same purpose (i.e. the context menu having multiple
// iCloud 页面里“生成并保留隐藏邮箱地址”的记录也会经过这里；同时避免拦截导致无法创建。
// Chromium persists the context menu state across browser restarts. Hence in Chromium, the context menu item is
// created once in the lifecycle of the extenstion's installation.
// On Firefox though, the context menu state is not persisted across browser restarts, meaning that the menu item
// will disappear once the user exits their browser session. For this reason, on Firefox, we create the context
// menu item each time the background script is loaded.
browser.runtime.onInstalled.addListener(setupContextMenu);

type OptionsStorageChange = {
  [K in keyof browser.Storage.StorageChange]: browser.Storage.StorageChange[K] extends unknown
    ? Options
    : browser.Storage.StorageChange[K];
};

// The following callback detects changes in the autofill config of the user
// and acts accordingly. In particular:
// * it hides the context menu item when the user un-checks the context menu option.
// * it makes the context menu item visible when the user checks the context menu option.
browser.storage.onChanged.addListener((changes, namespace) => {
  const iCloudHmeOptions = changes['iCloudHmeOptions' as keyof Store];
  if (namespace !== 'local' || iCloudHmeOptions === undefined) {
    return;
  }

  const { oldValue, newValue } = iCloudHmeOptions as OptionsStorageChange;

  if (oldValue?.autofill.contextMenu === newValue?.autofill.contextMenu) {
    // No change has been made to the context menu autofilling config.
    // There is no need to create or remove a context menu item.
    return;
  }

  browser.contextMenus
    .update(CONTEXT_MENU_ITEM_ID, {
      visible: false,
    })
    .catch(console.debug);
});

// Upon clicking on the context menu item, we generate an email, reserve it, and emit it back to the content script
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ITEM_ID) {
    return;
  }

  sendMessageToTab(
    MessageType.ActiveInputElementWrite,
    { text: LOADING_COPY } as ActiveInputElementWriteData,
    tab
  );

  const serializedUrl = info.pageUrl || tab?.url;
  const hostname = serializedUrl ? new URL(serializedUrl).hostname : '';

  const client = await constructClient();
  const isClientAuthenticated = await client.isAuthenticated();

  if (!isClientAuthenticated) {
    sendMessageToTab(
      MessageType.ActiveInputElementWrite,
      {
        text: SIGNED_OUT_CTA_COPY,
        copyToClipboard: false,
      } as ActiveInputElementWriteData,
      tab
    );
    performDeauthSideEffects();
    return;
  }

  try {
    const pms = new PremiumMailSettings(client);
    const hme = await pms.generateHme();
    await pms.reserveHme(hme, hostname);
    await sendMessageToTab(
      MessageType.ActiveInputElementWrite,
      { text: hme, copyToClipboard: true } as ActiveInputElementWriteData,
      tab
    );
  } catch (e) {
    sendMessageToTab(
      MessageType.ActiveInputElementWrite,
      {
        text: e.toString(),
        copyToClipboard: false,
      } as ActiveInputElementWriteData,
      tab
    );
  }
});

// ===== Non-blocking webrequest listeners (used for syncing the authentication state of the user) =====

// The extension needs to be in sync with the icloud.com authentication state of the browser.
// For example, when the user is authenticated we need to render the context menu item
// as enabled.
browser.webRequest.onResponseStarted.addListener(
  async (details: browser.WebRequest.OnResponseStartedDetailsType) => {
    const { statusCode, url } = details;
    if (statusCode < 200 && statusCode > 299) {
      console.debug('Request failed', details);
      return;
    }

    const setupUrl = url.split('/accountLogin')[0] as ICloudClient['setupUrl'];
    const client = new ICloudClient(setupUrl);
    const isAuthenticated = await client.isAuthenticated();
    if (isAuthenticated) {
      performAuthSideEffects(client, { notification: true });
    }
  },
  {
    urls: [
      `${DEFAULT_SETUP_URL}/accountLogin*`,
      `${CN_SETUP_URL}/accountLogin*`,
    ],
  },
  []
);

// When the user signs out of their account through icloud.com, we should
// perform various side effects (e.g. disabling the context menu item)
browser.webRequest.onResponseStarted.addListener(
  async (details: browser.WebRequest.OnResponseStartedDetailsType) => {
    const { statusCode } = details;
    if (statusCode < 200 && statusCode > 299) {
      console.debug('Request failed', details);
      return;
    }

    performDeauthSideEffects();
  },
  {
    urls: [`${DEFAULT_SETUP_URL}/logout*`, `${CN_SETUP_URL}/logout*`],
  },
  []
);

// ===== Post installation hooks =====

// Sync the extension with the authentication state of the browser.
// If the user is already authenticated, they should not need to
// log out and log back in in order to get the extension working.
browser.runtime.onInstalled.addListener(
  async (details: browser.Runtime.OnInstalledDetailsType) => {
    if (['install', 'update'].includes(details.reason)) {
      const client = await constructClient();
      const isAuthenticated = await client.isAuthenticated();
      if (isAuthenticated) {
        performAuthSideEffects(client, { notification: true });
      } else {
        performDeauthSideEffects();
      }
    }
  }
);
// On Firefox the context menu state is not persisted across browser restarts, meaning that the menu item
// will disappear once the user quits their browser. Hence on Firefox, we create the context
// menu item each time the background script is loaded.
if (isFirefox) {
  setupContextMenu();
}

