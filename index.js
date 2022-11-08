const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');//require('crypto').randomBytes(64).toString ('hex')

const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectID } = require('bson');
require('dotenv').config()

const app = express();


//middle wares
app.use(cors());
app.use(express.json());

const dbUsername = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

//token verfiation
const verifyToken = (req, res, next) => {
    // console.log(req.headers.authorization);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1]
    // console.log(token);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next();
    })
}


const uri = `mongodb+srv://${dbUsername}:${dbPassword}@cluster0.bmwcolr.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);// for checking
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const serviceCollection = client.db('geniusCarDatabase').collection('services')
        const ordersCollection = client.db('geniusCarDatabase').collection('orders')

        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectID(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })

        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        })

        //email diye data neyar somoy jwtToken verification kora hocche
        app.get('/orders', verifyToken, async (req, res) => {

            const decoded = req.decoded;//decoded info

            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: "Forbidden Access" })
            }

            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = ordersCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        })

        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectID(id) };
            const result = await ordersCollection.deleteOne(query)
            res.send(result)
        })

        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body.status;
            const query = { _id: ObjectID(id) };
            const updateDoc = {
                $set: {
                    status: status
                }
            }
            const result = await ordersCollection.updateOne(query, updateDoc);
            res.send(result);
        })

        //DB er sathe kono connection nai, server nije ekta token send kortese
        app.post('/jwt', (req, res) => {
            const user = req.body;// current user er info object akare ekhane recv hocche
            // console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })// user erjonno token toriri kora hocche
            res.send({ token })// token jehetu client side a JSON akare recv hobe tai object kore pathano hocche

        })
    }
    finally {

    }

}
run().catch(console.dir)



app.get('/', (req, res) => {
    res.send('Genius Card Server is Running');
})

app.listen(port, () => {
    console.log(`Genius car is running on port ${port}`)
})