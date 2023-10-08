const fs = require('fs')
const path = require('path')
const AbstractServicesAwareService = require('./lib/AbstractServicesAwareService')

const files = fs.readdirSync(path.resolve(__dirname, 'lib'))

const services = {}

files.forEach((item) => {
  const serviceName = path.parse(item).name
  if (serviceName !== 'AbstractServicesAwareService') {
    const Service = require(path.resolve(__dirname, 'lib', serviceName))
    const instanceName = serviceName.charAt(0).toLowerCase() + serviceName.slice(1)
    services[instanceName] = new Service()
  }
})

for (const i in services) {
  if (services[i] instanceof AbstractServicesAwareService) {
    services[i].inject(services)
  }
}

module.exports = services
