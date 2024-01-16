const passport = require('../config/passport')

const checkLocalSignin = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user) => {
    if (err || !user) return res.status(401).json({ success: false, message: 'Username or password is invalid' })

    req.user = user
    next()
  })(req, res, next)
}

module.exports = {
  checkLocalSignin
}
