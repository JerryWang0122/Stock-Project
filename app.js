const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const apiRouter = require('./routes')

app.use(express.json())

app.use('/api', apiRouter)

app.use('/', (req, res) => res.json({ success: false, message: 'wrong route' }))

app.listen(port, () => {
  console.log(`express server is running on http://localhost:${port}`)
})
