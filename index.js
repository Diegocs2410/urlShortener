require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const shortId = require('shortid');
const validUrl = require('valid-url');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
    res.json({greeting: 'hello API'});
});

app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});

const uri = process.env.MONGO_URI;
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
})

const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'Connection error:'));
connection.once('open', () => {
    console.log('MongoDB database connection established successfully.')
})

const Schema = mongoose.Schema;
const urlSchema = new Schema(
    {
        original_url: String,
        short_url: String
    }
)

const URL = mongoose.model(
    "URL", urlSchema
)

app.post('/api/shorturl/new', async function (req, res) {
    const url = req.body.url_input;
    const urlCode = shortId.generate()

    if (!validUrl.isWebUri(url)) {
        res.status(401).json({
            error: 'invalid URL'
        })
    } else {
        try {
            let findOne = await URL.findOne({
                original_url: url
            })
            const {original_url, short_url} = findOne;
            if (findOne) {
                res.json({
                    original_url,
                    short_url
                })
            } else {
                findOne = new URL({
                    original_url: url,
                    short_url: urlCode
                })
                const {original_url, short_url} = findOne;
                await findOne.save()
                res.json({
                    original_url,
                    short_url
                })
            }
        } catch (e) {
            console.error(e)
            res.status(500).json('Server error....')
        }
    }
})

app.get('/api/shorturl/:shorturl?', async function(req,res){
    try {
        const urlParams = await URL.findOne({
            short_url: req.params.short_url
        })
        if(urlParams) return res.redirect(urlParams.original_url)
        else res.status(400).json('No URL found')
    }catch (e){
    console.error(e)
        res.status(500).json('Server error')
    }
})