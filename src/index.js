require('dotenv').config()
const log = require('logger')()
const { createApp, stopApp } = require('app')

process.on('uncaughtException', (error) => {
  console.log(error);
});

process.on('SIGINT', async () => {
  try {
    // await stopApp()
  } catch (e) {
    log.error(e)
  } finally {
    log.info('Bye')
    process.exit(0)
  }
})

createApp()
