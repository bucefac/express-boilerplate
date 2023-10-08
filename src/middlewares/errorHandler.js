const log = getLogger('errorHandler')

function errorHandler (err, req, res, next) {
  let status = 500
  if (err.code === 'SCHEMA_VALIDATION_FAILED') {
    status = 400
  }
  log.debug(err)
  res.status(status).send({ error: err.message })
}

module.exports = errorHandler
