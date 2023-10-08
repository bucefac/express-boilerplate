const log = require('log4js')

log.configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: process.env.LOG_LEVEL || 'debug' } },
  replaceConsole: true
})

module.exports =
global.getLogger =
function getLogger (name) {
  return log.getLogger(name)
}
