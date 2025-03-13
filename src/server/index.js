require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const path = require('path')

const app = express()
const port = 3000
const API_KEY = process.env.API_KEY
console.log('API_KEY', API_KEY);

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/', express.static(path.join(__dirname, '../public')))

require('dotenv').config();

const base = 'https://api.nasa.gov';

app.get('/apod', async (req, res) => {
    try {
        let image = await fetch(`${base}/planetary/apod?api_key=${API_KEY}`)
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
        let photos = await fetch(`${base}/mars-photos/api/v1/rovers/${req.params.name}/latest_photos?api_key=${API_KEY}`)
            .then(res => res.json());
        res.send({ image });
    } catch (err) {
        console.log('error', err);
    }
})


// app.get('/manifests/:rover', async (req, res) => {
//     const rover = req.params.rover;
//     const apiUrl = `https://api.nasa.gov/mars-photos/api/v1/manifests/${rover}?api_key=${API_KEY}`;
//     console.log('Fetching manifest data from:', apiUrl);
//     try {
//         const response = await fetch(apiUrl);
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         const data = await response.json();
//         console.log('Received data:', data); // Log the received data
//         const launch_date = data.photo_manifest.launch_date;
//         const landing_date = data.photo_manifest.landing_date;
//         const status = data.photo_manifest.status;
//         res.send({ rover, launch_date, landing_date, status });
//     } catch (err) {
//         console.log('get manifest error:', err);
//         res.status(500).send('Error fetching rover data');
//     }
// });

app.listen(port, () => console.log(`Mars Dasboard listening on port ${port}!`))
