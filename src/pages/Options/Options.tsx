import React, { useEffect, useMemo, useState } from 'react';
import './Options.css';
import { useBrowserStorageState } from '../../hooks';
import ICloudClient, {
  CN_SETUP_URL,
  HmeEmail,
  PremiumMailSettings,
} from '../../iCloudClient';
import { ErrorMessage, LoadingButton, Spinner } from '../../commonComponents';
import { AutoHmeEntry, AutoHmeSettings, DEFAULT_STORE, Store } from '../../storage';
import { MessageType } from '../../messages';
import browser from 'webextension-polyfill';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBan,
  faClipboard,
  faDownload,
  faExternalLink,
  faRefresh,
  faSearch,
  faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';

const inputClassName =
  'h-11 w-full rounded-2xl border border-slate-200/80 bg-white/80 px-4 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-inner shadow-slate-100 transition focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100';

const softButtonClassName =
  'inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50';

const primaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-5 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:from-blue-600 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-50';

const constructClient = (clientState: Store['clientState']): ICloudClient => {
  if (clientState === undefined) {
    throw new Error('登录状态为空，无法初始化 iCloud 客户端');
  }

  return new ICloudClient(CN_SETUP_URL, clientState.webservices);
};

const Card = (props: { title?: string; children: React.ReactNode; className?: string }) => (
  <section className={`rounded-[28px] border border-white/70 bg-white/72 p-5 shadow-xl shadow-slate-200/55 backdrop-blur-xl ${props.className || ''}`}>
    {props.title && <h3 className="mb-4 text-lg font-black tracking-tight text-slate-900">{props.title}</h3>}
    {props.children}
  </section>
);

const Sidebar = () => (
  <aside className="fixed inset-y-0 left-0 z-10 hidden w-[180px] border-r border-slate-200/70 bg-white/45 px-5 py-8 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl lg:block">
    <div className="mb-10 flex items-center gap-3">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-lg font-black text-white shadow-lg shadow-blue-500/30">
        iH
      </div>
      <div className="text-sm font-black text-slate-900">iCloud HME</div>
    </div>

    <nav className="space-y-2 text-sm font-bold text-slate-500">
      <a className="flex items-center rounded-2xl bg-blue-100/80 px-4 py-3 text-blue-600 shadow-sm" href="#overview">账户总览</a>
      <a className="flex items-center rounded-2xl px-4 py-3 transition hover:bg-white/70 hover:text-blue-600" href="#manual">批量获取</a>
      <a className="flex items-center rounded-2xl px-4 py-3 transition hover:bg-white/70 hover:text-blue-600" href="#auto">自动获取池</a>
      <a className="flex items-center rounded-2xl px-4 py-3 transition hover:bg-white/70 hover:text-blue-600" href="#manager">邮箱管理</a>
      <a className="flex items-center rounded-2xl px-4 py-3 transition hover:bg-white/70 hover:text-blue-600" href="#forward">转发地址</a>
    </nav>
  </aside>
);

const TopNav = () => (
  <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-white/60 bg-slate-50/55 px-4 py-4 backdrop-blur-2xl lg:-mx-8 lg:px-8">
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-blue-600">隐藏邮箱</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">批量获取、自动池、管理和转发地址统一控制台</p>
        </div>
        <div className="rounded-full border border-blue-100 bg-white/75 px-4 py-2 text-xs font-bold text-slate-600 shadow-sm">
          iCloud 中国区 · 已适配
        </div>
      </div>

      <div className="mx-auto flex w-fit flex-wrap items-center justify-center gap-1 rounded-3xl border border-white/80 bg-white/78 p-1.5 text-sm font-black text-slate-500 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
        {[
          ['#overview', '账号总览'],
          ['#manual', '批量获取'],
          ['#auto', '自动任务'],
          ['#manager', '邮箱管理'],
          ['#forward', '转发地址'],
        ].map(([href, label], idx) => (
          <a
            key={href}
            href={href}
            className={`rounded-2xl px-4 py-2.5 transition hover:bg-blue-50 hover:text-blue-600 ${idx === 0 ? 'bg-blue-100 text-blue-600 shadow-sm' : ''}`}
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  </div>
);

const SignedOutPage = () => (
  <div className="min-h-screen px-4 py-10">
    <div className="mx-auto max-w-xl rounded-[32px] border border-white/80 bg-white/75 p-8 text-center shadow-2xl shadow-slate-200/70 backdrop-blur-xl">
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-400 text-2xl font-black text-white shadow-lg shadow-blue-500/30">
        iH
      </div>
      <h1 className="text-3xl font-black text-slate-950">iCloud 未连接</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        请先登录 iCloud 中国区，完成双重认证，并选择信任此浏览器。
      </p>
      <a
        href="https://www.icloud.com.cn"
        target="_blank"
        rel="noreferrer"
        className={`${primaryButtonClassName} mt-6 w-full`}
      >
        <FontAwesomeIcon icon={faExternalLink} className="mr-2" />
        打开 iCloud 登录
      </a>
    </div>
  </div>
);

const ForwardToForm = (props: { client: ICloudClient; onChanged: () => void }) => {
  const [selected, setSelected] = useState<string>();
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const load = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const result = await new PremiumMailSettings(props.client).listHme();
      setEmails(result.forwardToEmails || []);
      setSelected(result.selectedForwardTo);
    } catch (e) {
      setError(e.toString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [props.client]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError(undefined);
    try {
      await new PremiumMailSettings(props.client).updateForwardToHme(selected);
      props.onChanged();
    } catch (e) {
      setError(e.toString());
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <form className="space-y-3" onSubmit={submit}>
      {emails.map((email) => (
        <label
          key={email}
          className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition ${
            email === selected
              ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
              : 'border-slate-200/80 bg-white/70 text-slate-600 hover:border-blue-100 hover:bg-white'
          }`}
        >
          <span className="truncate">{email}</span>
          <input
            type="radio"
            name="fwd-to"
            className="ml-3 size-4 accent-blue-600"
            checked={email === selected}
            disabled={submitting}
            onChange={() => setSelected(email)}
          />
        </label>
      ))}
      <LoadingButton loading={submitting} disabled={!selected}>
        更新转发地址
      </LoadingButton>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </form>
  );
};

const EmailGetter = (props: { client: ICloudClient; onCreated: () => void }) => {
  const [count, setCount] = useState(5);
  const [labelPrefix, setLabelPrefix] = useState('batch');
  const [note, setNote] = useState('通过隐藏邮箱助手获取');
  const [emails, setEmails] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const createEmails = async () => {
    const safeCount = Math.max(1, Math.min(100, Math.floor(count || 1)));
    const pms = new PremiumMailSettings(props.client);
    const created: string[] = [];

    setLoading(true);
    setError(undefined);
    setEmails([]);

    try {
      for (let idx = 0; idx < safeCount; idx++) {
        const email = await pms.generateHme();
        const reserved = await pms.reserveHme(
          email,
          `${labelPrefix || 'batch'}-${new Date().toISOString()}-${idx + 1}`,
          note || undefined
        );
        created.push(reserved.hme);
        setEmails([...created]);
      }
      props.onCreated();
    } catch (e) {
      setError(e.toString());
    } finally {
      setLoading(false);
    }
  };

  const resultText = emails.join('\n');

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm font-black text-slate-700">
            获取数量
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className={inputClassName}
              disabled={loading}
            />
          </label>
          <label className="space-y-1 text-sm font-black text-slate-700">
            标签前缀
            <input
              value={labelPrefix}
              onChange={(e) => setLabelPrefix(e.target.value)}
              className={inputClassName}
              disabled={loading}
            />
          </label>
        </div>
        <label className="space-y-1 text-sm font-black text-slate-700">
          备注
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClassName}
            disabled={loading}
          />
        </label>
        <LoadingButton type="button" loading={loading} disabled={loading} onClick={createEmails}>
          开始获取隐藏邮箱
        </LoadingButton>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </div>

      <div className="space-y-3">
        <textarea
          readOnly
          rows={9}
          className={`${inputClassName} h-56 resize-none py-4 font-mono leading-6`}
          placeholder="获取到的隐藏邮箱会显示在这里，一行一个"
          value={resultText}
        />
        <button
          type="button"
          className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:from-emerald-600 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!resultText}
          onClick={() => navigator.clipboard.writeText(resultText)}
        >
          <FontAwesomeIcon icon={faClipboard} className="mr-2" />
          复制本次获取结果
        </button>
      </div>
    </div>
  );
};

const AutoHmePool = () => {
  const [items, setItems] = useState<AutoHmeEntry[]>(DEFAULT_STORE.autoHmeEmails);
  const [settings, setSettings] = useState<AutoHmeSettings>(DEFAULT_STORE.autoHmeSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommandSubmitting, setIsCommandSubmitting] = useState(false);

  const emails = (items || []).map((item) => item.email);
  const text = emails.join('\n');
  const lastFiveText = emails.slice(-5).join('\n');
  const statusText = settings.running ? '正在获取' : settings.enabled ? '运行中' : '已停止';

  const loadAutoState = async () => {
    const store = await browser.storage.local.get(['autoHmeEmails', 'autoHmeSettings']);
    setItems((store.autoHmeEmails as AutoHmeEntry[]) || []);
    setSettings({
      ...DEFAULT_STORE.autoHmeSettings,
      ...((store.autoHmeSettings as Partial<AutoHmeSettings>) || {}),
    });
  };

  useEffect(() => {
    loadAutoState()
      .catch(console.error)
      .finally(() => setIsLoading(false));

    const listener = (
      changes: Record<string, browser.Storage.StorageChange>,
      namespace: string
    ) => {
      if (namespace !== 'local') return;
      if (changes.autoHmeEmails) {
        setItems((changes.autoHmeEmails.newValue as AutoHmeEntry[]) || []);
      }
      if (changes.autoHmeSettings) {
        setSettings({
          ...DEFAULT_STORE.autoHmeSettings,
          ...((changes.autoHmeSettings.newValue as Partial<AutoHmeSettings>) || {}),
        });
      }
    };

    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, []);

  const sendAutoCommand = async (type: MessageType) => {
    setIsCommandSubmitting(true);
    try {
      const response = (await browser.runtime.sendMessage({ type })) as AutoHmeSettings | undefined;
      if (response) {
        setSettings({ ...DEFAULT_STORE.autoHmeSettings, ...response });
      }
      await loadAutoState();
    } catch (e) {
      setSettings((prev) => ({ ...prev, lastError: e.toString() }));
    } finally {
      setIsCommandSubmitting(false);
    }
  };

  const setDesktopAppendEnabled = async (desktopAppendEnabled: boolean) => {
    const nextSettings = {
      ...DEFAULT_STORE.autoHmeSettings,
      ...settings,
      desktopAppendEnabled,
      desktopAppend: desktopAppendEnabled
        ? settings.desktopAppend || '桌面写入已开启'
        : '桌面写入已关闭，仅保存到扩展内部',
    };
    setSettings(nextSettings);
    await browser.storage.local.set({ autoHmeSettings: nextSettings });
  };

  const downloadTxt = () => {
    const blob = new Blob([`${text}${text ? '\n' : ''}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'icloud-hidden-emails.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-slate-700">自动任务状态</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${
                settings.running
                  ? 'bg-amber-100 text-amber-700'
                  : settings.enabled
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {statusText}
            </span>
          </div>
          <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-500">
            <span>下次运行：{settings.nextRunAt ? new Date(settings.nextRunAt).toLocaleString() : '-'}</span>
            <span>上次成功：{settings.lastSuccessAt ? `${new Date(settings.lastSuccessAt).toLocaleString()}（${settings.lastCount || 0} 个）` : '-'}</span>
            <span>桌面写入：{settings.desktopAppend || '-'}</span>
          </div>
          <label className="mt-4 flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 p-3 text-sm font-black text-slate-700">
            <span>写入桌面 TXT</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.desktopAppendEnabled}
              className={`relative h-7 w-12 rounded-full transition ${
                settings.desktopAppendEnabled ? 'bg-blue-500' : 'bg-slate-300'
              }`}
              onClick={() => setDesktopAppendEnabled(!settings.desktopAppendEnabled)}
            >
              <span
                className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${
                  settings.desktopAppendEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </label>
          {settings.lastError && <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-600">错误：{settings.lastError}</div>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 disabled:opacity-50" disabled={settings.enabled || isCommandSubmitting} onClick={() => sendAutoCommand(MessageType.AutoHmeStart)}>开始</button>
          <button className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-rose-500/20 transition hover:-translate-y-0.5 disabled:opacity-50" disabled={(!settings.enabled && !settings.running) || isCommandSubmitting} onClick={() => sendAutoCommand(MessageType.AutoHmeStop)}>停止</button>
          <button className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 disabled:opacity-50" disabled={settings.running || isCommandSubmitting} onClick={() => sendAutoCommand(MessageType.AutoHmeRunNow)}>立即 5 个</button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-black text-slate-700">已保存 {emails.length} 个</span>
          {items.length > 0 && <span className="font-semibold text-slate-400">最新：{new Date(items[items.length - 1].createdAt).toLocaleString()}</span>}
        </div>
        <textarea readOnly rows={9} className={`${inputClassName} h-56 resize-none py-4 font-mono leading-6`} value={text} placeholder="自动获取后会显示在这里" />
        <div className="grid grid-cols-4 gap-2">
          <button className={softButtonClassName} disabled={!emails.length} onClick={() => navigator.clipboard.writeText(text)}>复制全部</button>
          <button className={softButtonClassName} disabled={!emails.length} onClick={() => navigator.clipboard.writeText(lastFiveText)}>复制最后 5 个</button>
          <button className={softButtonClassName} disabled={!emails.length} onClick={downloadTxt}><FontAwesomeIcon icon={faDownload} className="mr-1" />下载</button>
          <button className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 px-4 text-sm font-bold text-rose-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-100 disabled:opacity-50" disabled={!emails.length} onClick={() => { if (window.confirm('确定清空自动获取邮箱池吗？')) { browser.storage.local.set({ autoHmeEmails: [] }); setItems([]); } }}>清空</button>
        </div>
      </div>
    </div>
  );
};

const EmailManager = (props: { client: ICloudClient; reloadKey: number }) => {
  const [emails, setEmails] = useState<HmeEmail[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string>();

  const load = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const result = await new PremiumMailSettings(props.client).listHme();
      const sorted = result.hmeEmails.sort((a, b) => b.createTimestamp - a.createTimestamp);
      setEmails(sorted);
      setSelectedId((prev) => (prev && sorted.some((item) => item.anonymousId === prev) ? prev : sorted[0]?.anonymousId));
    } catch (e) {
      setError(e.toString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [props.reloadKey]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return emails;
    return emails.filter((item) =>
      [item.hme, item.label, item.forwardToEmail, item.note || '']
        .join('\n')
        .toLowerCase()
        .includes(keyword)
    );
  }, [emails, search]);

  const selected = filtered.find((item) => item.anonymousId === selectedId) || filtered[0];
  const activeCount = emails.filter((item) => item.isActive).length;
  const allText = filtered.map((item) => item.hme).join('\n');

  const toggleActive = async (target: HmeEmail) => {
    setActingId(target.anonymousId);
    setError(undefined);
    try {
      const pms = new PremiumMailSettings(props.client);
      if (target.isActive) {
        await pms.deactivateHme(target.anonymousId);
      } else {
        await pms.reactivateHme(target.anonymousId);
      }
      setEmails((prev) =>
        prev.map((item) =>
          item.anonymousId === target.anonymousId
            ? { ...item, isActive: !target.isActive }
            : item
        )
      );
    } catch (e) {
      setError(e.toString());
    } finally {
      setActingId(undefined);
    }
  };

  const deleteEmail = async (target: HmeEmail) => {
    setActingId(target.anonymousId);
    setError(undefined);
    try {
      await new PremiumMailSettings(props.client).deleteHme(target.anonymousId);
      setEmails((prev) => prev.filter((item) => item.anonymousId !== target.anonymousId));
      setSelectedId(undefined);
    } catch (e) {
      setError(e.toString());
    } finally {
      setActingId(undefined);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-3xl border border-blue-100 bg-blue-50/80 p-4">
          <div className="text-xs font-black text-blue-500">总邮箱</div>
          <div className="mt-1 text-3xl font-black text-blue-700">{emails.length}</div>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4">
          <div className="text-xs font-black text-emerald-500">启用中</div>
          <div className="mt-1 text-3xl font-black text-emerald-700">{activeCount}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="text-xs font-black text-slate-500">已停用</div>
          <div className="mt-1 text-3xl font-black text-slate-700">{emails.length - activeCount}</div>
        </div>
        <div className="rounded-3xl border border-cyan-100 bg-cyan-50/80 p-4">
          <div className="text-xs font-black text-cyan-500">当前结果</div>
          <div className="mt-1 text-3xl font-black text-cyan-700">{filtered.length}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-[26px] border border-white/70 bg-white/72 p-3 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
        <div className="relative min-w-[280px] flex-1">
          <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-3.5 text-sm text-slate-400" />
          <input className={`${inputClassName} pl-10`} placeholder="搜索邮箱、标签、转发地址或备注" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button type="button" className={softButtonClassName} onClick={load} disabled={loading}><FontAwesomeIcon icon={faRefresh} spin={loading} className="mr-2" />刷新</button>
        <button type="button" className={softButtonClassName} disabled={!allText} onClick={() => navigator.clipboard.writeText(allText)}><FontAwesomeIcon icon={faClipboard} className="mr-2" />复制当前列表</button>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {loading ? <Spinner /> : emails.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/60 p-12 text-center text-sm font-bold text-slate-400">暂无隐藏邮箱</div>
      ) : (
        <div className="grid min-h-[560px] overflow-hidden rounded-[28px] border border-white/80 bg-white/76 shadow-xl shadow-slate-200/55 backdrop-blur-xl lg:grid-cols-[minmax(360px,1fr)_420px]">
          <div className="border-r border-slate-200/70 bg-slate-50/55">
            <div className="grid grid-cols-[minmax(0,1fr)_150px_90px] border-b border-slate-200/70 bg-white/70 px-4 py-3 text-xs font-black text-slate-400">
              <span>邮箱</span>
              <span>标签</span>
              <span>状态</span>
            </div>
            <div className="max-h-[560px] overflow-y-auto">
              {filtered.map((item) => (
                <button
                  key={item.anonymousId}
                  type="button"
                  className={`grid w-full grid-cols-[minmax(0,1fr)_150px_90px] items-center gap-2 border-b border-slate-100 px-4 py-3 text-left text-sm transition last:border-b-0 ${
                    selected?.anonymousId === item.anonymousId
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400 font-black text-white shadow-inner'
                      : 'text-slate-700 hover:bg-white/80'
                  }`}
                  onClick={() => setSelectedId(item.anonymousId)}
                >
                  <span className="truncate font-black" title={item.hme}>{item.hme}</span>
                  <span className="truncate text-xs font-bold opacity-80" title={item.label || '-'}>{item.label || '-'}</span>
                  <span className={`w-fit rounded-full px-2 py-1 text-xs font-black ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{item.isActive ? '启用' : '停用'}</span>
                </button>
              ))}
              {filtered.length === 0 && <div className="p-10 text-center text-sm font-bold text-slate-400">没有匹配结果</div>}
            </div>
          </div>

          <div className="bg-white/76 p-5">
            {selected ? (
              <div className="space-y-4 text-sm text-slate-700">
                <div>
                  <div className="mb-1 text-xs font-black text-slate-400">邮箱</div>
                  <div className="break-all rounded-2xl bg-slate-50 p-4 text-base font-black text-slate-950">{selected.hme}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mb-1 text-xs font-black text-slate-400">状态</div>
                    <div className={`rounded-2xl p-3 font-black ${selected.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{selected.isActive ? '启用中' : '已停用'}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-black text-slate-400">创建时间</div>
                    <div className="rounded-2xl bg-slate-50 p-3 font-bold text-slate-600">{new Date(selected.createTimestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs font-black text-slate-400">标签</div>
                  <div className="break-all rounded-2xl bg-slate-50 p-3 font-bold">{selected.label || '-'}</div>
                </div>
                <div>
                  <div className="mb-1 text-xs font-black text-slate-400">转发至</div>
                  <div className="break-all rounded-2xl bg-slate-50 p-3 font-bold">{selected.forwardToEmail || '-'}</div>
                </div>
                {selected.note && (
                  <div>
                    <div className="mb-1 text-xs font-black text-slate-400">备注</div>
                    <div className="break-all rounded-2xl bg-slate-50 p-3 font-bold">{selected.note}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-blue-50 hover:text-blue-600" onClick={() => navigator.clipboard.writeText(selected.hme)}><FontAwesomeIcon icon={faClipboard} className="mr-2" />复制</button>
                  <button className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-600 disabled:opacity-50" disabled={actingId === selected.anonymousId} onClick={() => toggleActive(selected)}><FontAwesomeIcon icon={selected.isActive ? faBan : faRefresh} className="mr-2" />{selected.isActive ? '停用' : '启用'}</button>
                  {!selected.isActive && (
                    <button className="col-span-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-600 disabled:opacity-50" disabled={actingId === selected.anonymousId} onClick={() => deleteEmail(selected)}><FontAwesomeIcon icon={faTrashAlt} className="mr-2" />删除邮箱</button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-sm font-bold text-slate-400">请选择左侧邮箱</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
const Overview = (props: { reloadKey: number }) => (
  <div id="overview" className="grid gap-5 lg:grid-cols-3">
    <Card className="lg:col-span-2">
      <div className="flex h-full flex-col justify-between gap-6">
        <div>
          <div className="mb-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-600">iCloud 已连接</div>
          <h2 className="text-3xl font-black tracking-tight text-slate-950">隐藏邮箱控制台</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            右上角小窗现在只负责连接检测，完整的批量获取、自动获取池、管理和转发地址都集中在这个页面。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black text-slate-500">
          <a href="#manual" className="rounded-2xl bg-white px-4 py-2 shadow-sm hover:text-blue-600">去批量获取</a>
          <a href="#auto" className="rounded-2xl bg-white px-4 py-2 shadow-sm hover:text-blue-600">去自动任务</a>
          <a href="#manager" className="rounded-2xl bg-white px-4 py-2 shadow-sm hover:text-blue-600">去邮箱管理</a>
        </div>
      </div>
    </Card>
    <Card>
      <div className="text-xs font-black text-slate-400">页面状态</div>
      <div className="mt-3 text-4xl font-black text-blue-600">Ready</div>
      <div className="mt-2 text-sm font-semibold text-slate-500">管理刷新批次 #{props.reloadKey}</div>
    </Card>
  </div>
);

const ManagementPage = (props: { client: ICloudClient }) => {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="min-h-screen lg:pl-[180px]">
      <Sidebar />
      <main className="px-4 pb-12 lg:px-8">
        <TopNav />
        <div className="mx-auto max-w-7xl space-y-6">
          <Overview reloadKey={reloadKey} />
          <Card title="批量获取隐藏邮箱" className="scroll-mt-32" >
            <div id="manual" className="-mt-20 pt-20" />
            <EmailGetter client={props.client} onCreated={() => setReloadKey((prev) => prev + 1)} />
          </Card>
          <Card title="自动获取邮箱池" className="scroll-mt-32">
            <div id="auto" className="-mt-20 pt-20" />
            <AutoHmePool />
          </Card>
          <Card title="隐藏邮箱管理" className="scroll-mt-32">
            <div id="manager" className="-mt-20 pt-20" />
            <EmailManager client={props.client} reloadKey={reloadKey} />
          </Card>
          <Card title="转发地址" className="scroll-mt-32">
            <div id="forward" className="-mt-20 pt-20" />
            <ForwardToForm client={props.client} onChanged={() => setReloadKey((prev) => prev + 1)} />
          </Card>
        </div>
      </main>
    </div>
  );
};

const Options = () => {
  const [clientState, setClientState, isClientStateLoading] = useBrowserStorageState('clientState', undefined);
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const ok =
        clientState?.setupUrl === CN_SETUP_URL &&
        (await new ICloudClient(CN_SETUP_URL).isAuthenticated());

      setConnected(Boolean(ok));
      if (!ok && clientState !== undefined) {
        setClientState(undefined);
      }
      setReady(true);
    };

    if (!isClientStateLoading) {
      checkConnection().catch(() => {
        setConnected(false);
        setReady(true);
      });
    }
  }, [clientState?.setupUrl, isClientStateLoading, setClientState]);

  if (!ready) {
    return <div className="mx-auto my-16 max-w-xl px-4"><Spinner /></div>;
  }

  if (!connected || !clientState) {
    return <SignedOutPage />;
  }

  return <ManagementPage client={constructClient(clientState)} />;
};

export default Options;