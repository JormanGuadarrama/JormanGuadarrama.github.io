import express from 'express';
import solarSystem from 'npm-solarsystem';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const app = express();
app.set('view engine', 'ejs');
app.set('views', fileURLToPath(new URL('./views/', import.meta.url)));
app.use(express.static(fileURLToPath(new URL('./public/', import.meta.url))));
app.use((req, res, next) => {
    res.locals.activePath = req.path;
    next();
});

const planetNames = [...solarSystem.getPlanets(), 'Pluto'];
// These three image URLs in npm-solarsystem no longer work.
const replacementImages = { Mars: 'PIA00407', Jupiter: 'PIA22946', Uranus: 'PIA18182' };
app.locals.planets = planetNames;
app.locals.studentName = 'Jorman Guadarrama';

app.get('/', async (req, res) => {
    let images = [];
    let error = null;

    try {
        const url = new URL('https://pixabay.com/api/');
        url.search = new URLSearchParams({
            key: process.env.PIXABAY_API_KEY || '20426927-497d14db9c234faf7d0df8317',
            per_page: '50',
            orientation: 'horizontal',
            q: 'solar system',
            image_type: 'photo',
            safesearch: 'true'
        });
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error(`Pixabay returned HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.hits)) throw new Error('Invalid Pixabay response');
        const available = data.hits.filter(hit => hit.webformatURL && hit.pageURL);
        if (available.length < 4) throw new Error('Pixabay returned fewer than four images');

        // Sample four different pictures without changing the API response.
        for (let i = 0; i < 4; i++) {
            const index = Math.floor(Math.random() * available.length);
            images.push(available.splice(index, 1)[0]);
        }
    } catch (err) {
        console.error('Unable to load Pixabay images:', err.message);
        error = 'could not request random images';
    }

    res.render('home', { title: 'Explore the Solar System', activePlanet: null, images, error });
});

app.get('/planet/:name', (req, res) => {
    const name = planetNames.find(planet => planet.toLowerCase() === req.params.name.toLowerCase());
    if (!name) {
        return res.status(404).render('not-found', { title: 'Planet not found', activePlanet: null });
    }
    const planet = solarSystem[`get${name}`]();
    const replacement = replacementImages[name];
    res.render('planet', {
        title: name, activePlanet: name, name, planet,
        imageUrl: replacement ? `/images/${name.toLowerCase()}.jpg` : planet.image,
        imageSource: replacement ? `https://images.nasa.gov/details/${replacement}` : planet.image
    });
});

const smallBodies = {
    asteroids: { name: 'Asteroids', getData: () => solarSystem.getAsteroids() },
    comets: { name: 'Comets', getData: () => solarSystem.getComets() }
};
for (const [path, body] of Object.entries(smallBodies)) {
    app.get(`/${path}`, (req, res) => {
        res.render('small-body', {
            title: body.name, activePlanet: null, name: body.name, body: body.getData()
        });
    });
}

app.get('/nasa-pod', async (req, res) => {
    let picture = null;
    let error = null;
    try {
        const url = new URL('https://api.nasa.gov/planetary/apod');
        // NASA defaults to today's entry when date is omitted.
        url.search = new URLSearchParams({
            api_key: process.env.NASA_API_KEY || '9mUzIkhlZCZaOoMfspg7jMmwZCZ4LiRHtkgkambD'
        });
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error(`NASA returned HTTP ${response.status}`);
        const data = await response.json();
        if (!data.url || !data.title || !data.date || !data.explanation || !['image', 'video'].includes(data.media_type)) {
            throw new Error('Invalid NASA picture response');
        }
        picture = data;
    } catch (err) {
        console.error('Unable to load NASA POD:', err.message);
        error = "could not request NASA's picture of the day";
    }
    res.render('nasa-pod', { title: 'NASA POD', activePlanet: null, picture, error });
});

app.use((req, res) => {
    res.status(404).render('not-found', { title: 'Page not found', activePlanet: null });
});

// Exporting the app also lets route checks run without starting a second server.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Solar System app: http://localhost:${port}`));
}
