const { User } = require('../models')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

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
  },
  login: (req, cb) => {
    try {
      const userData = req.user.toJSON()
      delete userData.password

      const authToken = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '30d' })
      cb(null, {
        authToken,
        username: userData.name,
        email: userData.email
      })
    } catch (error) {
      cb(error)
    }
  }
}

module.exports = userServices
