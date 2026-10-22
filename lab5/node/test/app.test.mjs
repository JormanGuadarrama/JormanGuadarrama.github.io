import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import solarSystem from 'npm-solarsystem';
import { app } from '../index.mjs';

const originalFetch = globalThis.fetch;
let server;
let base;
let mode = 'success';
const apiRequests = [];
const picture = {
    title: 'Today in space', date: '2026-10-22', media_type: 'image',
    url: 'https://example.com/today.jpg', explanation: 'The current daily selection.', copyright: 'NASA'
};
const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&#34;').replace(/'/g, '&#39;');

before(async () => {
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
    globalThis.fetch = async (url, options) => {
        if (String(url).startsWith(base)) return originalFetch(url, options);
        apiRequests.push(new URL(url));
        if (mode === 'offline') throw new Error('Simulated disconnected internet');
        if (mode === 'http') return new Response('Unavailable', { status: 503 });
        if (mode === 'json') return new Response('invalid JSON');
        if (mode === 'empty') return Response.json({ hits: [] });
        if (new URL(url).hostname === 'api.nasa.gov') {
            return Response.json({ ...picture, media_type: mode === 'video' ? 'video' : 'image' });
        }
        return Response.json({ hits: Array.from({ length: 12 }, (_, index) => ({
            webformatURL: `https://example.com/space-${index}.jpg`,
            pageURL: `https://example.com/photo-${index}`, tags: 'Space photo', user: 'Photographer'
        })) });
    };
});

after(() => {
    globalThis.fetch = originalFetch;
    server.closeAllConnections();
    server.close();
});

function checkShared(html) {
    for (const path of [...solarSystem.getPlanets(), 'Pluto'].map(name => `/planet/${name.toLowerCase()}`)
        .concat('/asteroids', '/comets', '/nasa-pod')) {
        assert.ok(html.includes(`href="${path}"`), `Missing navigation: ${path}`);
    }
    assert.ok(html.includes('bootstrap.min.css') && html.includes('/styles.css'));
    assert.ok(html.includes('<footer') && html.includes('/images/csumb-logo-blue.png'));
    assert.ok(html.includes('Jorman Guadarrama'));
}

test('home renders four distinct images without visible tags, instructions, or API credentials', async () => {
    mode = 'success';
    const html = await (await fetch(base)).text();
    checkShared(html);
    assert.equal((html.match(/class="space-image"/g) || []).length, 4);
    assert.equal(new Set([...html.matchAll(/src="(https:\/\/example.com\/space-\d+.jpg)"/g)].map(match => match[1])).size, 4);
    assert.ok(!html.includes('<span>Space photo</span>'));
    assert.ok(!html.includes('Select a planet') && !html.includes('api_key=') && !html.includes('pixabay.com/api/'));
    assert.ok(html.includes('col-md-6'));
});

test('all nine planets display every library field and corresponding images using the shared view', async () => {
    for (const name of [...solarSystem.getPlanets(), 'Pluto']) {
        const response = await fetch(`${base}/planet/${name.toLowerCase()}`);
        assert.equal(response.status, 200);
        const html = await response.text();
        checkShared(html);
        for (const value of Object.values(solarSystem[`get${name}`]())) {
            assert.ok(html.includes(escape(value)), `Missing library field for ${name}: ${value}`);
        }
        assert.ok(html.includes('col-lg-6'));
        const imagePath = html.match(/class="planet-image" src="([^"]+)"/)[1];
        if (imagePath.startsWith('/')) {
            const image = await fetch(`${base}${imagePath}`);
            assert.equal(image.status, 200);
            assert.ok(image.headers.get('content-type').startsWith('image/'));
        }
    }
});

test('Asteroids and Comets display their library data', async () => {
    for (const [path, body] of [['asteroids', solarSystem.getAsteroids()], ['comets', solarSystem.getComets()]]) {
        const response = await fetch(`${base}/${path}`);
        assert.equal(response.status, 200);
        const html = await response.text();
        checkShared(html);
        for (const value of Object.values(body)) assert.ok(html.includes(escape(value)));
        assert.ok(html.includes('col-lg-6'));
    }
});

test('NASA POD uses the API current-day default and handles image and video entries', async () => {
    for (const media of ['success', 'video']) {
        mode = media;
        const html = await (await fetch(`${base}/nasa-pod`)).text();
        checkShared(html);
        assert.ok(html.includes(picture.title) && html.includes(picture.explanation) && html.includes(picture.date));
        assert.ok(html.includes(media === 'video' ? "Watch today's NASA video" : 'class="pod-image"'));
        const request = apiRequests.at(-1);
        assert.equal(request.pathname, '/planetary/apod');
        assert.ok(!request.searchParams.has('date'), 'Do not hard-code a past APOD date');
        assert.ok(!html.includes(request.searchParams.get('api_key')));
    }
});

test('Pixabay and NASA failures preserve navigation, footer, and retry links', async () => {
    for (const failure of ['offline', 'http', 'json', 'empty']) {
        mode = failure;
        for (const path of ['', '/nasa-pod']) {
            const response = await fetch(`${base}${path}`);
            assert.equal(response.status, 200);
            const html = await response.text();
            checkShared(html);
            assert.ok(html.includes('role="alert"') && html.includes('Try again'));
            if (!path) assert.ok(html.includes('<p>could not request random images</p>'));
        }
    }
});

test('404 pages keep shared partials; logo is local and external CSS has at least 10 properties', async () => {
    for (const path of ['/planet/unknown', '/missing']) {
        const response = await fetch(`${base}${path}`);
        assert.equal(response.status, 404);
        checkShared(await response.text());
    }
    const logo = await fetch(`${base}/images/csumb-logo-blue.png`);
    assert.equal(logo.status, 200);
    assert.ok(logo.headers.get('content-type').startsWith('image/'));
    const css = await readFile(new URL('../public/styles.css', import.meta.url), 'utf8');
    const properties = new Set([...css.matchAll(/^\s*([a-z-]+):/gm)].map(match => match[1]));
    assert.ok(properties.size >= 10);
});
