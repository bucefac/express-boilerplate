const { initializeSwaggerMiddleware } = require('swagger')
const bearerAuthentication = require('middlewares/bearerAuthentication')
const errorHandler = require('middlewares/errorHandler')

const log = getLogger('router')

const routes = {
  '/api/v1/users': require('./users').tag('Users', 'Users API'),
}

module.exports = (app, swaggerBuilder) => {
  swaggerBuilder.routes(routes)
  const swaggerDoc = swaggerBuilder.build()
  const middleware = initializeSwaggerMiddleware(swaggerDoc)

  swaggerBuilder.enableSwaggerForPrivateAPI()
  app.use(middleware.swaggerMetadata())
  app.use(middleware.swaggerUi())
  app.use(middleware.swaggerSecurity({
    Bearer: bearerAuthentication,
  }))

  app.set('json spaces', 2)

  for (let i in routes) {
    app.use(i, routes[i])
  }
  app.all('*', (req, res, next) => {
    res.status(404)
      next()
    });

  app.use(errorHandler)
}
