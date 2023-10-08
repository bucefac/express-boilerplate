const Joi = require('joi')
const AbstractModel = require('./AbstractModel')
const Job = require('./Job')

class User extends AbstractModel {
  static get schema () {
    return {
      id: Joi.string().required().description('User id'),
      email: Joi.string().required().description('User email'),
      jobs: Joi.array().items(Job.schema),
    }
  }
  constructor (data) {
    super(data)
    Object.freeze(this)
  }
}

module.exports = User
