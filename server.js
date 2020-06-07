const express = require('express')
const morgan = require('morgan')
const bodyparser = require('body-parser')
const cors = require('cors')
const connectDB = require('./config/db')
const server = express()

//Config .env to config/config.env
require('dotenv').config({
    path: './config/config.env'
})

//Connect to Database
connectDB()

// Use body-parser
server.use(bodyparser.json())

server.use(cors())
// Config for only development 
if (process.env.Node_ENV === 'development') {
    server.use(cors({
        origin:process.env.CLIENT_URL
    }))

    server.use(morgan('dev'))
    //Morgan give information about each request
    //Cors it's allow to deal with react for localhost at port 3000
}

//Load all routes
const authRouter = require('./routes/auth.route')
const taskRouter = require('./routes/task.route')


//Use Routes
server.use('/api/', authRouter)
server.use('/task/', taskRouter)

server.use((req, res, next) => {
    res.status(400).json({
        success: false,
        message: "Page Not Founded"
    })
})


const PORT = process.env.PORT

server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
})