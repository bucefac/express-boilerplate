const express = require('express')

const METHODS = [
  'get',
  'post',
  'put',
  'patch',
  'delete'
]

function applyCommonMethods (r) {
  r.tag = function (name, description) {
    this._tags = this._tags || {}
    this._tags[name] = description
    return this
  }
  r.authenticationRequired = function (type = 'Bearer') {
    this._requiredAuthentication = type
    return this
  }
  r.isAuthenticationRequired = function () {
    return this._requiredAuthentication
  }
}

function proxyRoute (route, pathMeta) {
  const originalMethods = {}
  METHODS.forEach(m => {
    originalMethods[m] = route[m]
    route[m] = function () {
      const args = []
      let meta = {}
      for (let i = 0, len = arguments.length; i < len; i++) {
        if (typeof arguments[i] === 'object') {
          meta = arguments[i]
        } else {
          args.push(arguments[i])
        }
      }
      meta.route = this
      pathMeta[m] = meta
      originalMethods[m].apply(route, args)
      return this
    }
  })
  applyCommonMethods(route)
  return route
}

function proxyRouter (router) {
  const originalRoute = router.route
  router.route = function () {
    const route = originalRoute.apply(router, arguments)
    const path = arguments[0]
    if (router.meta[path] == null) {
      router.meta[path] = {}
    }
    return proxyRoute(route, router.meta[path])
  }
  applyCommonMethods(router)
  router.meta = {}
  return router
}

module.exports = function (options) {
  return proxyRouter(express.Router(options))
}
