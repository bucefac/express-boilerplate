const AbstractServicesAwareService = require('./AbstractServicesAwareService')

class UserService extends AbstractServicesAwareService {
  constructor () {
    super(['jobService'])
  }

  getUser () {
    const job = this.jobService.getJob()
    return {
      id: 2,
      name: 'John Smith',
      jobs: [job]
    }
  }

  createUser () {}
}

module.exports = UserService
