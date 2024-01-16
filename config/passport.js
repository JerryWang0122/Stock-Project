const passport = require('passport')
const LocalStrategy = require('passport-local')
const { User } = require('../models')
const bcrypt = require('bcryptjs')
const passportJWT = require('passport-jwt')

const JWTStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt

// local strategy
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

// jwt strategy
const jwtOptions = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}

passport.use(new JWTStrategy(jwtOptions, (jwtPayload, cb) => {
  User.findByPk(jwtPayload.id)
    .then(user => cb(null, user))
    .catch(err => cb(err))
}))

module.exports = passport
