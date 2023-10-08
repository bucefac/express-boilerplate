const AbstractServicesAwareService = require('./AbstractServicesAwareService')

class JobService extends AbstractServicesAwareService {
  getJob () {
    return {
      id: '1',
      name: 'Job Name',
    }
  }
}

module.exports = JobService
