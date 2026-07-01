import React from 'react';
import { TitledComponent, Link } from '../../commonComponents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { isFirefox } from '../../browserUtils';

const GuideCard = (props: {
  title: string;
  children: React.ReactNode;
  actionHref?: string;
  actionText?: string;
}) => {
  return (
    <div className="space-y-3 text-sm leading-6 text-slate-600">
      <h3 className="text-lg font-black text-slate-900">{props.title}</h3>
      <div className="space-y-2">{props.children}</div>
      {props.actionHref && props.actionText && (
        <Link
          href={props.actionHref}
          className="mt-2 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2 text-sm font-bold text-white no-underline shadow-sm shadow-sky-200 hover:text-white"
        >
          {props.actionText}
          <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
        </Link>
      )}
    </div>
  );
};

const Tip = (props: { children: React.ReactNode }) => (
  <div className="flex rounded-2xl border border-sky-100 bg-sky-50/70 p-3 text-sm leading-6 text-slate-600">
    <FontAwesomeIcon icon={faInfoCircle} className="mr-2 mt-1 text-sky-500" />
    <div>{props.children}</div>
  </div>
);

const Userguide = () => {
  return (
    <div className="mx-auto mb-24 mt-6 max-w-3xl px-4">
      <TitledComponent title="使用前准备" subtitle="登录 iCloud 后即可进入管理页面">
        <GuideCard
          title="1. 登录 iCloud 中国区"
          actionHref="https://www.icloud.com.cn"
          actionText="打开 iCloud 中国区"
        >
          <p>
            请先在当前浏览器登录 iCloud 中国区，完成双重认证，并在提示时选择“信任此浏览器”。
          </p>
          <p>登录完成后，不需要在扩展里输入 Apple ID 或密码。</p>
          {isFirefox && (
            <Tip>
              Firefox 用户请在默认标签页登录 iCloud，不要使用容器标签页。
            </Tip>
          )}
        </GuideCard>
        <GuideCard
          title="2. 进入隐藏邮箱管理"
          actionHref="./options.html"
          actionText="进入管理页面"
        >
          <p>
            管理页面里可以批量获取、复制、停用、启用、删除隐藏邮箱，也可以管理自动获取邮箱池。
          </p>
          <p>以后点击浏览器右上角的扩展图标，也可以快速进入这个管理页面。</p>
        </GuideCard>
      </TitledComponent>
    </div>
  );
};

export default Userguide;
