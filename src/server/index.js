require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const path = require('path')

const app = express()
const port = 3000
const API_KEY = process.env.API_KEY

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/', express.static(path.join(__dirname, '../public')))

require('dotenv').config();

const apiUrlBase = 'https://api.nasa.gov';

app.get('/apod', async (req, res) => {
    try {
        let image = await fetch(`${apiUrlBase}/planetary/apod?api_key=${API_KEY}`)
            .then(res => res.json());
        res.send({ image });
    } catch (err) {
        console.log('get apod error:', err);
        res.status(500).send('Internal Server Error');
    }
});

// https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?earth_date=2015-6-3&api_key=gNxAEMgoTXepdJgTthIoeAjbnnb7qGG4aAjC0A0I

app.get('/rovers/:name', async (req, res) => {
    try {
        let data = await fetch(`${apiUrlBase}/mars-photos/api/v1/rovers/${req.params.name}/latest_photos?api_key=${API_KEY}`)
            .then(res => res.json());
        const limitedData = data.latest_photos ? data.latest_photos.slice(0, 5) : [];
        res.send({ data: limitedData });
    } catch (err) {
        console.error('Error fetching rover data:', err); 
        res.status(500).send('Internal Server Error');
    }
});
app.listen(port, () => console.log(`Dasboard listening on port ${port}`))
