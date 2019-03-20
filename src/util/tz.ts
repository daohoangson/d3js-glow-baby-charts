import { utcFormat } from 'd3-time-format'

export default ({ tzOffset }) => {
  const formatters = {}
  const format = (ms: number, specifier: string): string => {
    if (typeof formatters[specifier] === 'undefined') {
      formatters[specifier] = utcFormat(specifier)
    }

    return formatters[specifier](new Date(ms - tzOffset))
  }

  const formatDate = (ms: number): string => format(ms, '%b %e')

  const formatDayOfMonth = (ms: number): string => format(ms, '%d')

  const formatTime = (ms: number): string => format(ms, '%b %e %H:%M')

  return {
    format,
    formatDate,
    formatDayOfMonth,
    formatTime
  }
}
