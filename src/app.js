const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const path = require('path');
const { SwaggerBuilder } = require('swagger')


const createApp = () => {
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use(cors())
  app.use(express.json())
  app.use(hpp())
  // app.use(helmet())

  const swaggerBuilder = new SwaggerBuilder()

  swaggerBuilder.info({
    title: 'Swagger App',
    description: 'Express boilerplate',
    version: '1.0'
  }).applyBearerAuthentication()
  require('routes')(app, swaggerBuilder)

  app.listen(process.env.port || 3000)
}

module.exports = {
  createApp
}
