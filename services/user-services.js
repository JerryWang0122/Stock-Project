const { User } = require('../models')
const bcrypt = require('bcryptjs')

const userServices = {
  register: (req, cb) => {
    const { name, email, password, checkPassword } = req.body
    if (!email || !password) throw new Error('Email & Password should not be empty!')
    if (password !== checkPassword) throw new Error('Passwords do not match!')

    User.findOne({ where: { email } })
      .then(user => {
        if (user) throw new Error('Email has been taken!')
        return bcrypt.hash(password, 10)
      })
      .then(hash => User.create({ name, email, password: hash }))
      .then(user => cb(null, user))
      .catch(err => cb(err))
  }
}

module.exports = userServices
