const passport = require('passport')
const LocalStrategy = require('passport-local')
const { User } = require('../models')
const bcrypt = require('bcryptjs')

passport.use(new LocalStrategy((username, password, cb) => {
  User.findOne({ where: { email: username } })
    .then(user => {
      if (!user) cb(null, false)
      bcrypt.compare(password, user.password).then(match => {
        if (!match) cb(null, false)
        return cb(null, user)
      })
    })
    .catch(err => cb(err))
}))

module.exports = passport
