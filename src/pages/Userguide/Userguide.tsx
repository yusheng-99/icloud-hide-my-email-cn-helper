import React from 'react';
import { TitledComponent, Link } from '../../commonComponents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInfoCircle,
  faWarning,
} from '@fortawesome/free-solid-svg-icons';
import { isFirefox } from '../../browserUtils';

const Notice = (props: {
  title: string;
  children: React.ReactNode;
  isAlert?: boolean;
}) => {
  const { title, children, isAlert = false } = props;

  const colourPalette = isAlert
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : 'border-sky-100 bg-sky-50/70 text-slate-600';

  return (
    <div
      className={`flex rounded-2xl border p-3 text-sm leading-6 ${colourPalette}`}
      role={isAlert ? 'alert' : 'note'}
    >
      <FontAwesomeIcon
        icon={isAlert ? faWarning : faInfoCircle}
        className="mr-2 mt-1"
      />
      <span className="sr-only">提示</span>
      <div className="space-y-1">
        <p className="font-bold">{title}</p>
        {children}
      </div>
    </div>
  );
};

const SignInInstructions = () => {
  return (
    <div className="space-y-4 text-sm leading-6 text-slate-600">
      <div className="space-y-3">
        <p>
          使用这个扩展前，需要先在当前浏览器登录 iCloud。打开{' '}
          <Link href="https://www.icloud.com.cn" aria-label="打开 iCloud 中国区">
            icloud.com.cn
          </Link>{' '}
          并完成双重认证和「信任此浏览器」。
        </p>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-center">
          <img
            src="./icloud-sign-in.webp"
            alt="iCloud 登录流程截图"
            className="w-full"
          />
        </div>
        <p>
          登录完成后，点击浏览器工具栏里的扩展图标，就可以生成、管理和批量保存隐藏邮箱。
        </p>
      </div>
      {isFirefox && (
        <Notice title="正在使用 Firefox 容器标签页？" isAlert>
          <p>
            请在默认标签页登录 iCloud，不要在容器标签页内登录。登录成功后，扩展可在普通标签页中正常使用。
          </p>
        </Notice>
      )}
      <Notice title="已经登录了？">
        <p>那就不用再操作，扩展会自动读取当前浏览器里的 iCloud 登录状态。</p>
      </Notice>
      <Notice title="需要勾选“保持登录”吗？">
        <p>
          不是必须，但建议勾选。这样可以减少频繁重新登录 iCloud 的次数，扩展使用起来会更稳定。
        </p>
      </Notice>
    </div>
  );
};

const TechnicalOverview = () => {
  return (
    <div className="space-y-3 text-sm leading-6 text-slate-600">
      <p>
        扩展通过模拟 iCloud 网页端的请求来调用隐藏邮箱接口，认证依赖你当前浏览器里已经登录的 iCloud Cookie。
      </p>
      <p>
        因为扩展声明了 iCloud 域名权限，所以对 iCloud 的请求会被浏览器按同源请求处理，并自动带上登录凭据。
      </p>
      <p>
        扩展不会读取你在 iCloud 登录页输入的 Apple ID 密码。本地改版仅调整了中国区入口、中文 UI、批量生成和自动邮箱池。
      </p>
      <p>
        如果你想手动管理，也可以直接使用 iCloud 网页版；这个扩展只是把常用操作做得更快。
      </p>
    </div>
  );
};

const Userguide = () => {
  return (
    <div className="mx-auto mb-24 mt-6 max-w-5xl px-4">
      <TitledComponent title="隐藏邮箱助手" subtitle="快速使用指南">
        <div>
          <h3 className="mb-3 text-lg font-black text-slate-900">登录 iCloud</h3>
          <SignInInstructions />
        </div>
        <div>
          <h3 className="mb-3 text-lg font-black text-slate-900">工作原理</h3>
          <TechnicalOverview />
        </div>
      </TitledComponent>
    </div>
  );
};

export default Userguide;
