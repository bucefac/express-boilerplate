const { isPlainObject, isUndefined, cloneDeepWith } = require('lodash')

function removeNullable (value) {
  if (value && typeof value === 'object' && value.hasOwnProperty('nullable')) {
    delete value['nullable']
  }
}

function initializeMiddleware (swaggerDefinition) {
  if (isUndefined(swaggerDefinition)) {
    throw new Error('rlOrSO is required')
  } else if (!isPlainObject(swaggerDefinition)) {
    throw new TypeError('rlOrSO must be an object')
  }

  return {
    // Create a wrapper to avoid having to pass the non-optional arguments back to the swaggerMetadata middleware
    swaggerMetadata: function () {
      var swaggerMetadata = require('swagger-tools/middleware/swagger-metadata')
      var smArgs = [cloneDeepWith(swaggerDefinition, removeNullable)]
      return swaggerMetadata.apply(undefined, smArgs)
    },
    swaggerRouter: require('swagger-tools/middleware/swagger-router'),
    swaggerSecurity: require('swagger-tools/middleware/swagger-security'),
    // Create a wrapper to avoid having to pass the non-optional arguments back to the swaggerUi middleware
    swaggerUi: function (options) {
      var swaggerUi = require('./swagger-ui')
      var suArgs = [swaggerDefinition]
      suArgs.push(options || {})
      return swaggerUi.apply(undefined, suArgs)
    },
    swaggerValidator: require('swagger-tools/middleware/swagger-validator')
  }
};

module.exports = initializeMiddleware
