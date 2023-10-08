class AbstractServicesAwareService {
  constructor (services) {
    this.__services = services || []
  }

  inject (services) {
    this.__services.forEach(name => {
      if (services[name] == null) {
        throw new Error(`${this.constructor.name} requires service ${name} but it was not found`)
      }
      this[name] = services[name]
    })
  }
}

module.exports = AbstractServicesAwareService
