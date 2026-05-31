import * as vite from "vite"

/** Generate a custom logger, that does not warn when `plinth` is installed. */
export function customLogger() {
  const customLogger = vite.createLogger()
  const loggerWarn = customLogger.warn
  customLogger.warn = (msg, options) => {
    if (msg.includes("import_")) return
    loggerWarn(msg, options)
  }
  return customLogger
}
