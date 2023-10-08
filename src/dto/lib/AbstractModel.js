const Joi = require('joi')
const SchemaValidationError = require('./SchemaValidationError')
const log = getLogger('AbstractModel')

class AbstractModel {
  constructor (props, { stripUnknown = true } = {}) {
    try {
      const schemes = []
      const getScheme = constructorFunc => {
        if (constructorFunc.schema) {
          schemes.push(constructorFunc.schema)
        }
        if (Object.getPrototypeOf(constructorFunc)) {
          getScheme(Object.getPrototypeOf(constructorFunc))
        }
      }
      getScheme(this.constructor)

      const schema = Joi.object(Object.assign({}, ...schemes.reverse()))
      const { error, value } = schema.validate(props || {}, { stripUnknown })
      if (error) {
        throw new SchemaValidationError(`[${this.constructor.name}].${error}`)
      }
      Object.assign(this, value)
    } catch (e) {
      log.warn(e.message, props)
      throw e
    }
  }
}

module.exports = AbstractModel
