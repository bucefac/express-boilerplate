const Joi = require('joi')
const AbstractModel = require('./AbstractModel')

class Job extends AbstractModel {
  static get schema () {
    return {
      id: Joi.string().required().description('Job id'),
      name: Joi.string().required().description('Job title'),
    }
  }
  constructor (data) {
    super(data)
    Object.freeze(this)
  }
}

module.exports = Job
