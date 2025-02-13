const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const DbConnect = require('./Config/Db.config')
const UserRoutes = require('./Routers/User.routes')
const setupSocket = require('./WebSocket/Socket')
dotenv.config()
const app = express()
const http = require('http');
const server = http.createServer(app);
const io = setupSocket(server);

app.use(express.json());

app.use(cors({
    origin: "*",
    methods: ["GET", "POST"]
}));


const PORT = process.env.PORT || 5000
app.use('/api/user', UserRoutes)

app.get("/", (req, res) => {
    res.send("WebSocket Server is Running!");
});

const startServer = async () => {
    try {
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
        await DbConnect()
    } catch (error) {
        console.log(error, "error in starting server")
    }
}

startServer()


