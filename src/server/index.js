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

// TODO: get rover photos
app.get('/mars-photos', async (req, res) => {
    const rover = req.query.rover;
    const earth_date = new Date().toISOString().split('T')[0];
    console.log('EARTH DATE:', earth_date);
    const apiUrl = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?earth_date=${earth_date}&page=2&api_key=${API_KEY}`;
    console.log('Fetching rover photos from:', apiUrl);

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('DATA RESPONSE:', data);
        const imgSrc = data.photos.length > 0 ? data.photos[0].img_src : null;
        res.send({ imgSrc });
    } catch (err) {
        console.log('get photo error:', err);
        res.status(500).send('Error fetching rover photos');
    }
});
 


app.get('/manifests/:rover', async (req, res) => {
    const rover = req.params.rover;
    const apiUrl = `https://api.nasa.gov/mars-photos/api/v1/manifests/${rover}?api_key=${API_KEY}`;
    console.log('Fetching manifest data from:', apiUrl);
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Received data:', data); // Log the received data
        const launch_date = data.photo_manifest.launch_date;
        const landing_date = data.photo_manifest.landing_date;
        const status = data.photo_manifest.status;
        res.send({ rover, launch_date, landing_date, status });
    } catch (err) {
        console.log('get manifest error:', err);
        res.status(500).send('Error fetching rover data');
    }
});

app.get('/insight_weather', async (req, res) => {
    try {
        const response = await fetch(`${base}/insight_weather/?${process.env.API_KEY}&feedtype=json&ver=1.0`);
        const data = await response.json();
        res.send({ weather: data });
    } catch (err) {
        console.log('error:', err);
        res.status(500).send('Error fetching weather data');
    }
});


// https://api.nasa.gov/mars-photos/api/v1/manifests/curiosity?api_key=rNX5HjiNAau4P2yU0KQyGnHF1nqF7DZc2rtgQ1Y9

// https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?earth_date=2015-6-3&api_key=gNxAEMgoTXepdJgTthIoeAjbnnb7qGG4aAjC0A0I

app.listen(port, () => console.log(`Mars Dasboard app listening on port ${port}!`))