class WebError extends Error {
  constructor (message, status, reason) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.status = status || 500
    this.reason = reason || message
  }
};

module.exports = WebError
