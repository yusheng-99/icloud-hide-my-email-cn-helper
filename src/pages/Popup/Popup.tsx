import React, { useEffect, useState } from 'react';
import ICloudClient, { CN_SETUP_URL } from '../../iCloudClient';
import './Popup.css';
import { useBrowserStorageState } from '../../hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExternalLink, faPlugCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { Spinner, TitledComponent } from '../../commonComponents';
import browser from 'webextension-polyfill';

const Popup = () => {
  const [clientState, , isClientStateLoading] = useBrowserStorageState('clientState', undefined);
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const ok =
        clientState?.setupUrl === CN_SETUP_URL &&
        (await new ICloudClient(CN_SETUP_URL).isAuthenticated());
      setConnected(Boolean(ok));
      setReady(true);
    };

    if (!isClientStateLoading) {
      checkConnection().catch(() => {
        setConnected(false);
        setReady(true);
      });
    }
  }, [clientState?.setupUrl, isClientStateLoading]);

  const openManagePage = async () => {
    await browser.runtime.openOptionsPage();
    window.close();
  };

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full">
        {!ready ? (
          <Spinner />
        ) : connected ? (
          <TitledComponent title="iCloud 已连接" subtitle="可以进入隐藏邮箱管理界面">
            <div className="space-y-4 text-center">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700">
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                已检测到可用的 iCloud 登录状态
              </div>
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-200 transition hover:-translate-y-0.5 hover:from-sky-600 hover:to-cyan-500 focus:outline-hidden focus:ring-4 focus:ring-sky-100"
                onClick={openManagePage}
              >
                进入管理界面
              </button>
            </div>
          </TitledComponent>
        ) : (
          <TitledComponent title="iCloud 未连接" subtitle="请先登录 iCloud 中国区">
            <div className="space-y-4 text-center text-sm text-slate-600">
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-700">
                <FontAwesomeIcon icon={faPlugCircleXmark} className="mr-2" />
                暂未检测到可用的 iCloud 登录状态
              </div>
              <a
                href="https://www.icloud.com.cn"
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-200 transition hover:-translate-y-0.5 hover:from-sky-600 hover:to-cyan-500 focus:outline-hidden focus:ring-4 focus:ring-sky-100"
              >
                <FontAwesomeIcon icon={faExternalLink} className="mr-2" />
                打开 iCloud 登录
              </a>
            </div>
          </TitledComponent>
        )}
      </div>
    </div>
  );
};

export default Popup;