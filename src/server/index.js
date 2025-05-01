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
        res.status(500).send('Internal Server Error');
    }
});

app.get('/rovers/:name', async (req, res) => {
    try {
        let data = await fetch(`${apiUrlBase}/mars-photos/api/v1/rovers/${req.params.name}/latest_photos?api_key=${API_KEY}`)
            .then(res => res.json());
        const limitedData = data.latest_photos ? data.latest_photos.slice(0, 4) : [];
        res.send({ data: limitedData });
    } catch (err) {
        console.error('Error fetching rover data:', err); 
        res.status(500).send('Internal Server Error');
    }
});

app.get('rovers/manifest/:rover', async (req, res) => {
    const roverName = req.params.name;
    const apiUrl = `${apiUrlBase}/rovers/manifest/${roverName}/latest_photos?api_key=${API_KEY}`;
    console.log('Fetching rover data from:', apiUrl);
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Received data:', data);
        res.send(data);
    } catch (err) {
        console.error('Error fetching rover data:', err);
        res.status(500).send('Error fetching rover data');
    }
});
app.listen(port, () => console.log(`Dasboard listening on port ${port}`))
