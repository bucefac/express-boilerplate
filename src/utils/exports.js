const fs = require('fs')
const path = require('path')

function getExports (dir) {
  var files = fs.readdirSync(path.resolve(dir, 'lib'))

  const members = {}
  files.forEach((item) => {
    const memberName = path.parse(item).name
    const member = require(path.resolve(dir, 'lib', memberName))
    members[memberName] = member
  })

  return members
}

module.exports = getExports
