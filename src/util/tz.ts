import { utcFormat } from "d3";

type Formatter = (date: Date) => string;

interface Formatters {
  [specifier: string]: Formatter;
}

interface TzOptions {
  tzOffset: number;
}

export default (options: TzOptions) => {
  const { tzOffset } = options;
  const formatters: Formatters = {};
  const format = (ms: number, specifier: string) => {
    if (typeof formatters[specifier] === "undefined") {
      formatters[specifier] = utcFormat(specifier);
    }

    const f = formatters[specifier];

    return f(new Date(ms - tzOffset));
  };

  const formatDate = (ms: number) => format(ms, "%b %e");

  const formatDayOfMonth = (ms: number) => format(ms, "%d");

  const formatTime = (ms: number) => format(ms, "%b %e %H:%M");

  return {
    format,
    formatDate,
    formatDayOfMonth,
    formatTime
  };
};
