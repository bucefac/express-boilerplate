const wrap = require('express-async-wrap')
const { Router } = require('swagger')
const { userService } = require('services')
const { User } = require('dto')

const router = new Router().authenticationRequired()

router.get('/:id', {
  summary: 'Returns user by id',
  parameters: {
    id: {
      description: 'User id'
    }
  },
  produces: User
}, wrap(async (req, res) => {
  const result = await userService.getUser(req.params.id)
  res.json(result)
}))

router.post('/', {
  summary: 'Creates a new user',
  consumes: User
}, wrap(async (req, res) => {
  await userService.createUser(new User(req.body))
  res.json({ status: 'ok' })
}))

module.exports = router
