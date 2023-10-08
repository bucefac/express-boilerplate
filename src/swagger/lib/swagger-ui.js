const _ = require('lodash')
const fs = require('fs')
const parseurl = require('parseurl')
const path = require('path')
const serveStatic = require('serve-static')
const swaggerUiPath = require('swagger-ui-dist').absolutePath()
const getInitScript = require('./getInitScript')

const defaultOptions = {
  apiDocs: '/api-docs',
  swaggerUi: '/api-ui'
}
const staticOptions = {}

/**
 * Middleware for serving the Swagger documents and Swagger UI.
 *
 * @param {object} rlOrSO - The Resource Listing (Swagger 1.2) or Swagger Object (Swagger 2.0)
 * @param {object[]} apiDeclarations - The array of API Declarations (Swagger 1.2)
 * @param {object} [options] - The configuration options
 * @param {string=/api-docs} [options.apiDocs] - The relative path to serve your Swagger documents from
 * @param {string=/docs} [options.swaggerUi] - The relative path to serve Swagger UI from
 * @param {string} [options.swaggerUiDir] - The filesystem path to your custom swagger-ui deployment to serve
 *
 * @returns the middleware function
 */
exports = module.exports = function (rlOrSO, apiDeclarations, options) {
  const apiDocsCache = {} // Swagger document endpoints cache
  let apiDocsPaths = []
  let staticMiddleware
  let swaggerApiDocsURL

  // Set the defaults
  options = _.defaults(options || {}, defaultOptions)

  var indexHtml = fs.readFileSync(path.join(swaggerUiPath, 'index.html'), 'utf-8').replace(
    '<script src="./swagger-initializer.js" charset="UTF-8"> </script>',
    getInitScript(options.apiDocs)
  )
  
  if (_.isUndefined(rlOrSO)) {
    throw new Error('rlOrSO is required')
  } else if (!_.isPlainObject(rlOrSO)) {
    throw new TypeError('rlOrSO must be an object')
  }

  if (options.swaggerUiDir) {
    if (!fs.existsSync(swaggerUiPath)) {
      throw new Error('options.swaggerUiDir path does not exist: ' + swaggerUiPath)
    } else if (!fs.statSync(swaggerUiPath).isDirectory()) {
      throw new Error('options.swaggerUiDir path is not a directory: ' + swaggerUiPath)
    }
  }

  staticMiddleware = serveStatic(swaggerUiPath, staticOptions)

  // Sanitize values
  if (options.apiDocs.charAt(options.apiDocs.length - 1) === '/') {
    options.apiDocs = options.apiDocs.substring(0, options.apiDocs.length - 1)
  }

  if (options.swaggerUi.charAt(options.swaggerUi.length - 1) === '/') {
    options.swaggerUi = options.swaggerUi.substring(0, options.swaggerUi.length - 1)
  }

  // Add the Resource Listing or SwaggerObject to the response cache
  apiDocsCache[options.apiDocs] = JSON.stringify(rlOrSO, null, 2)

  // Add API Declarations to the response cache
  _.each(apiDeclarations, function (resource, resourcePath) {
    var adPath = options.apiDocs + resourcePath

    // Respond with pretty JSON (Configurable?)
    apiDocsCache[adPath] = JSON.stringify(resource, null, 2)
  })

  apiDocsPaths = Object.keys(apiDocsCache)

  return function swaggerUI (req, res, next) {
    var path = parseurl(req).pathname
    var isApiDocsPath = apiDocsPaths.indexOf(path) > -1 || path === options.apiDocsPath
    var isSwaggerUiPath = path === options.swaggerUi || path.indexOf(options.swaggerUi + '/') === 0
    if (_.isUndefined(swaggerApiDocsURL)) {
      // Start with the original path
      swaggerApiDocsURL = parseurl.original(req).pathname

      // Remove the part after the mount point
      swaggerApiDocsURL = swaggerApiDocsURL.substring(0, swaggerApiDocsURL.indexOf(req.url))
      // Add the API docs path and remove any double dashes
      swaggerApiDocsURL = ((options.swaggerUiPrefix ? options.swaggerUiPrefix : '') + swaggerApiDocsURL + options.apiDocs).replace(/\/\//g, '/')
    }

    if (isApiDocsPath) {
      res.setHeader('Content-Type', 'application/json')

      return res.end(apiDocsCache[path])
    } else if (isSwaggerUiPath) {
      if (path === options.swaggerUi) { // No trailing slash
        return res.redirect(`${options.swaggerUi}/`)
      }
      res.setHeader('Swagger-API-Docs-URL', swaggerApiDocsURL)

      if (path === options.swaggerUi || path === options.swaggerUi + '/') {
        req.url = '/'
        res.setHeader('content-type', 'text/html')
        return res.end(indexHtml)
      } else {
        req.url = req.url.substring(options.swaggerUi.length)
        return staticMiddleware(req, res, next)
      }
    }

    return next()
  }
}
