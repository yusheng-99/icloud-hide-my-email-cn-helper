import browser from 'webextension-polyfill';

export const CONTEXT_MENU_ITEM_ID = browser.runtime.id.concat(
  '/',
  'hme_generation_and_reservation'
);

export const SIGNED_OUT_CTA_COPY = '请先登录 iCloud';
export const LOADING_COPY = '隐藏邮箱助手 — 生成中...';
export const SIGNED_IN_CTA_COPY = '生成并保存 iCloud 隐藏邮箱';
export const NOTIFICATION_MESSAGE_COPY =
  'iCloud 隐藏邮箱助手已准备就绪！';
export const NOTIFICATION_TITLE_COPY = 'iCloud 隐藏邮箱助手';
