const { WebError } = require('errors')

async function bearerAuthentication (req, authOrSecDef, scopesOrApiKey, next) {
  req.headers.authorization ? next() : next(new WebError('Unauthorize error', 403))
}

module.exports = bearerAuthentication
