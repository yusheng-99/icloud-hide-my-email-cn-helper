import React, { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

export const Spinner = () => {
  return (
    <div className="flex min-h-[120px] items-center justify-center text-center">
      <div className="rounded-2xl border border-sky-100 bg-white/80 px-5 py-4 shadow-sm">
        <FontAwesomeIcon
          icon={faSpinner}
          spin={true}
          className="text-3xl text-sky-500"
        />
        <p className="mt-2 text-sm font-medium text-slate-500">加载中...</p>
      </div>
    </div>
  );
};

export const LoadingButton = (
  props: {
    loading: boolean;
  } & DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
) => {
  const { loading, disabled, className, ...btnHtmlAttrs } = props;

  const enabledClassName =
    'inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm shadow-sky-200 transition hover:-translate-y-0.5 hover:from-sky-600 hover:to-cyan-500 hover:shadow-md focus:outline-hidden focus:ring-4 focus:ring-sky-200';

  const disabledClassName =
    'inline-flex w-full items-center justify-center rounded-xl bg-slate-300 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-none';

  const btnClassName = `${disabled ? disabledClassName : enabledClassName} ${className || ''}`;

  return (
    <button
      type="submit"
      className={btnClassName}
      disabled={loading || disabled}
      {...btnHtmlAttrs}
    >
      {loading && !disabled && (
        <FontAwesomeIcon icon={faSpinner} spin={true} className="mr-2" />
      )}
      {props.children}
    </button>
  );
};

export const ErrorMessage = (props: { children?: React.ReactNode }) => {
  return (
    <div
      className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-700"
      role="alert"
    >
      {props.children}
    </div>
  );
};

export const TitledComponent = (props: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) => {
  const children =
    props.children instanceof Array ? props.children : [props.children];

  return (
    <div className="space-y-4 text-base text-slate-900">
      <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-cyan-50 px-5 py-5 text-center shadow-sm">
        <div className="absolute -right-8 -top-8 size-24 rounded-full bg-sky-200/40 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 size-28 rounded-full bg-cyan-200/40 blur-2xl" />
        <div className="relative">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">
            iCloud HME
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            {props.title}
          </h1>
          <h2 className="mt-1 text-sm font-medium text-slate-500">
            {props.subtitle}
          </h2>
        </div>
      </div>
      {children?.map((child, key) => {
        return (
          child && (
            <section
              key={key}
              className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm shadow-slate-200/60"
            >
              {child}
            </section>
          )
        );
      })}
    </div>
  );
};

export const Link = (
  props: React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >
) => {
  // https://github.com/jsx-eslint/eslint-plugin-react/issues/3284
  // eslint-disable-next-line react/prop-types
  const { className, children, ...restProps } = props;
  return (
    <a
      className={`font-semibold text-sky-600 underline decoration-sky-200 underline-offset-4 transition hover:text-sky-700 ${className}`}
      target="_blank"
      rel="noreferrer"
      {...restProps}
    >
      {children}
    </a>
  );
};
