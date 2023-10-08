const { assign, omitBy, isEmpty, keys, merge } = require('lodash')
const pathToRegexp = require('path-to-regexp')
const j2s = require('joi-to-swagger')

const INFO_DEFAULT = {
  description: 'Test Swagger Application description',
  version: '1.0',
  title: 'Test Swagger Application',
  contact: {
    email: 'test@example.com'
  }
}
const DEFAULT_SCHEMES = [
  'http',
  'https'
]
const PARAM_DEFAULT = {
  in: 'query',
  type: 'string'
}

function capitalize (string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
}

function getScheme (constructor) {
  const schemes = []
  const getSchemeRecursive = constructorFunc => {
    if (constructorFunc.schema) {
      schemes.push(constructorFunc.schema)
    }
    if (Object.getPrototypeOf(constructorFunc)) {
      getSchemeRecursive(Object.getPrototypeOf(constructorFunc))
    }
  }
  getSchemeRecursive(constructor)
  return Object.assign({}, ...schemes.reverse())
}

function flattenQueryObjectParam (properties) {
  const params = []
  const getParamsRecursive = (props, basePath = '') => {
    for (let i in props) {
      if (props[i].type === 'object') {
        getParamsRecursive(props[i].properties, basePath + i + '.')
      } else {
        params.push({
          name: basePath + i,
          ...props[i]
        })
      }
    }
  }
  getParamsRecursive(properties)
  return params
}

function generateDefinitionName ({ meta, path, kind, method }) {
  if (meta.operationId) {
    return `${meta.operationId}${kind}`
  } else {
    let name = capitalize(method)
    const tokens = pathToRegexp.parse(path)
    for (let token of tokens) {
      if (typeof token === 'string') {
        const parts = token.split('/').filter(t => t !== '')
        for (let part of parts) {
          name += capitalize(part)
        }
      } else if (typeof token === 'object') {
        name += `By${capitalize(token.name)}`
      }
    }
    name += kind
    return name
  }
}

function getDefinition ({ type, meta, definitions, path, method, kind }) {
  let schema
  let name
  if (typeof type === 'function') {
    schema = getScheme(type)
    name = type.name
  } else if (typeof type === 'object') {
    schema = type
    name = type.name ? type.name : generateDefinitionName({ meta, path, kind, method })
  } else {
    throw new Error(`type must be class or object. Error in path "${path}" method "${method}"`)
  }
  if (definitions[name] == null) {
    schema = typeof schema === 'function' ? schema() : schema
    const { swagger } = j2s(schema)
    definitions[name] = swagger
  }
  return name
}

function processRoutes (routes, securityTypes, isSwaggerForPrivateAPIEnabled = false) {
  const authorizationTypes = keys(securityTypes)
  const paths = {}
  const definitions = {}
  const tags = {}
  for (let i in routes) {
    const route = routes[i]
    if (route.private && !isSwaggerForPrivateAPIEnabled) {
      continue
    }
    let routeTags = []
    if (route._tags != null) {
      for (let k in route._tags) {
        tags[k] = route._tags[k]
        routeTags.push(k)
      }
    }
    const basePath = i.replace(/\/$/, '') // remove trailing slash
    for (let k in route.meta) {
      const partPath = k.replace(/^\/|\/$/, '') // remove trailing and leading slashes
      const path = partPath !== '' ? basePath + '/' + partPath : basePath
      const keys = [] // path parameters
      const options = []
      pathToRegexp(path, keys, options)
      let swaggerPath = path
      for (let key of keys) {
        swaggerPath = swaggerPath.replace(new RegExp(`:${key.name}`), `{${key.name}}`)
      }
      // TODO: handle expressions like ':foo-:bar'
      const methods = route.meta[k]
      const pathDefinition = {}
      for (const j in methods) {
        const pathMeta = methods[j]
        const parameters = []
        for (let key of keys) {
          parameters.push({
            name: key.name,
            in: 'path',
            type: 'string', // TODO: add ability to change type
            required: true
          })
        }
        if (pathMeta.consumes != null) {
          const definitionName = getDefinition({
            type: pathMeta.consumes,
            meta: pathMeta,
            definitions,
            path,
            method: j,
            kind: 'Request'
          })
          parameters.push({
            in: 'body',
            name: 'body',
            required: true,
            schema: {
              $ref: `#/definitions/${definitionName}`
            }
          })
        }
        if (pathMeta.parameters != null) {
          for (const pi in pathMeta.parameters) {
            const param = parameters.find(p => p.name === pi)
            if (param != null) {
              merge(param, pathMeta.parameters[pi])
            } else {
              if (typeof pathMeta.parameters[pi] === 'object') {
                parameters.push(merge({ name: pi }, PARAM_DEFAULT, pathMeta.parameters[pi]))
              } else if (typeof pathMeta.parameters[pi] === 'function') {
                const { swagger } = j2s(getScheme(pathMeta.parameters[pi]))
                const objectProperties = flattenQueryObjectParam(swagger.properties)
                for (const prop of objectProperties) {
                  if (parameters.find(p => p.name === prop.name) != null) {
                    throw new Error(`Duplicate parameter name "${prop.name}" in path "${path}" method "${j}"`)
                  }
                  parameters.push(merge({ in: 'query' }, prop))
                }
              }
            }
          }
        }

        const responses = {} // TODO: handle additional responses
        if (pathMeta.produces != null) {
          const definitionName = getDefinition({
            type: pathMeta.produces,
            meta: pathMeta,
            definitions,
            path,
            method: j,
            kind: 'Response'
          })
          responses[200] = {
            description: 'OK',
            schema: {
              $ref: `#/definitions/${definitionName}`
            }
          }
        } else {
          responses[200] = {
            description: 'OK'
          }
        }

        const requiredAuth = pathMeta.route.isAuthenticationRequired() || route.isAuthenticationRequired()
        let security = null
        if (requiredAuth === true) {
          if (authorizationTypes.length !== 1) {
            throw new Error('When route requires any authorization swagger must have single security definition')
          }
          security = [{
            [authorizationTypes[0]]: []
          }]
        } else if (requiredAuth) {
          if (securityTypes[requiredAuth] == null) {
            throw new Error(`Specified security ${requiredAuth} not found. Available types: ${authorizationTypes}`)
          }
          security = [{
            [requiredAuth]: []
          }]
        }
        const pathMethod = {
          responses,
          parameters,
          tags: routeTags,
          summary: pathMeta.summary,
          description: pathMeta.description,
          security
        }
        pathDefinition[j] = omitBy(pathMethod, isEmpty)
      }
      paths[swaggerPath] = pathDefinition
    }
  }
  return { tags, paths, definitions }
}

class SwaggerBuilder {
  constructor () {
    this._info = INFO_DEFAULT
    this._basePath = ''
    this._schemes = DEFAULT_SCHEMES
    this._tags = []
    this._routes = []
    this._security = {}
    this.isSwaggerForPrivateAPIEnabled = false
  }
  info (info) {
    this._info = info
    return this
  }
  basePath (basePath) {
    this._basePath = basePath
    return this
  }
  schemes (schemes) {
    this._schemes = schemes
    return this
  }
  // object where key represents name and the value represents description
  tags (tags) {
    this._tags = tags
    return this
  }
  routes (routes) {
    this._routes = routes
    return this
  }
  enableSwaggerForPrivateAPI () {
    this.isSwaggerForPrivateAPIEnabled = true
  }
  applyBearerAuthentication (header = 'Authorization') {
    this._security.Bearer = {
      type: 'apiKey',
      name: header,
      in: 'header'
    }
    return this
  }
  applyBasicAuthentication () {
    this._security.Basic = {
      type: 'basic'
    }
    return this
  }
  build () {
    const { tags, paths, definitions } = processRoutes(this._routes, this._security, this.isSwaggerForPrivateAPIEnabled)
    const allTags = []
    const tagsMap = assign(this._tags, tags)
    for (let i in tagsMap) {
      allTags.push({
        name: i,
        description: tagsMap[i]
      })
    }
    return omitBy({
      swagger: '2.0',
      info: this._info,
      basePath: this._basePath,
      tags: allTags,
      schemes: this._schemes,
      paths,
      securityDefinitions: this._security,
      definitions
    }, isEmpty)
  }
}

module.exports = SwaggerBuilder
