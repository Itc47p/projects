let store = {
    user: { name: "Chris" },
    apod: '',
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
}

// add our markup to the page
const root = document.getElementById('root')

const updateStore = (store, newState) => {
    store = Object.assign(store, newState)
    render(root, store)
}

const render = async (root, state) => {
    root.innerHTML = await App(state)
}

const Greeting = (name) => {
    if (name) {
        return `
            <h1>Welcome, ${name}!</h1>
        `
    }

    return `
        <h1>Hello!</h1>
    `
}

// # region Pure functions
// Example of a pure function that renders infomation requested from the backend
const ImageOfTheDay = (apod) => {

    // If image does not already exist, or it is not from today -- request it again
    const today = new Date()
    const photodate = new Date(apod.date)

    if (!apod || apod.date === today) {
        getImageOfTheDay(store)
    }

    // check if the photo of the day is actually type video!
    if (apod.media_type === "video") {
        return (`
            <p>See today's featured video <a href="${apod.url}">here</a></p>
            <p>${apod.title}</p>
            <p>${apod.explanation}</p>
        `)
    } else {
        return (`
            <img src="${apod.image.url}" height="350px" width="100%" />
            <p>${apod.image.explanation}</p>
        `)
    }
}

const Manifest = async (roverName) => {
    const rover = await getRoverManifest(roverName);
    if (!rover) {
        return '<p>Error fetching rover manifest data.</p>';
    }
    console.log('Generating HTML for rover:', rover);
    return `
        <h1>${rover.name}</h1>
        <p>Launch Date: ${rover.launch_date}</p>
        <p>Landing Date: ${rover.landing_date}</p>
        <p>Status: ${rover.status}</p>
    `;
}

// ------------------------------------------------------  API CALLS
const getImageOfTheDay = (state) => {
    let { apod } = state
    fetch(`/apod`)
        .then(res => res.text())
        .then(text => {
            return JSON.parse(text);
        })
        .then(apod => updateStore(store, { apod }))
        .catch(err => console.log('error:', err));

    return apod
}

const getRoverManifest = (rover) => {

    if (typeof rover !== 'string') {
        throw new Error('Invalid rover name. Expected a string.');
    }
    // is the chosen rover is already in the store?
    if (store.rovers[rover]) {
        updateStore(store, { rover });
        return Promise.resolve(store.rovers[rover]);
    }

    return fetch(`/manifests/${rover}`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return res.json();
            } else {
                return res.text().then(text => {
                    throw new Error(`Expected JSON, got: ${text}`);
                });
            }
        })
        .then(data => {
            console.log('Manifest data:', data);
            store.rovers[rover] = data;
            updateStore(store, { rover });
            return data;
        })
        .catch(err => {
            console.error('Error fetching rover manifest:', err);
            return null;
        });
};

const getRoverPhotos = (rover) => {
    // Check if the data for the chosen rover is already in the store
    if (store.rovers[rover]) {
        console.log('Using cached data for rover:', rover);
        updateStore(store, { rover });
        return Promise.resolve(store.rovers[rover]);
    }

    return fetch(`/mars-photos/rover/${rover}`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return res.json();
            } else {
                return res.text().then(text => {
                    throw new Error(`Expected JSON, got: ${text}`);
                });
            }
        })
        .then(data => {
            console.log('Rover photos:', data);
            store.rovers[rover] = data;
            updateStore(store, { rover });
            return data;
        })
        .catch(err => {
            console.error('Error fetching rover photos:', err);
            return null;
        });
};

// ------------------------------------------------------  High Order Functions

// Define the createHTMLElement function
function createHTMLElement(tag, attributes, ...children) {
    const element = document.createElement(tag);
    for (let key in attributes) {
        element.setAttribute(key, attributes[key]);
    }
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });
    return element;
}

// const createManifestHtml = async (state) => {
//     let { rovers } = store;
//     if (!rovers || rovers.length === 0) {
//         return '<p>No rovers available.</p>';
//     }
//     // Generate HTML for each rover
//     const roverHtmlPromises = rovers.map(async rover => {
//         return await displayRoverManifest(rover);
//     });

//     // Wait for all promises to resolve
//     const roverHtml = await Promise.all(roverHtmlPromises);

//     // Combine rover HTML into a single string
//     return (`
//         <section id="Manifest">
//             <div align="center">
//                 <h3 class="title">Mars Rover Manifest</h3>
//                 <p>View each rover's manifest</p>
//                 <p>
//                     The Mars Rover Photos API provides access to images taken by the Mars rovers. The API allows users to retrieve
//                     images from specific dates, cameras, and rovers. It also provides information about the rovers and their missions.
//                 </p>
//                 <div id="rover-manifest-data">
//                     <p>Click on a rover to view its manifest</p>
//                     <button id="curiosity-manifest" onclick="displayRoverManifest('curiosity')">Curiosity</button>
//                     <button id="opportunity-manifest" onclick="displayRoverManifest('opportunity')">Opportunity</button>
//                     <button id="spirit-manifest" onclick="displayRoverManifest('spirit')">Spirit</button>
//                 </div>
//             </div>
//         </section>
//     `);
// };

async function displayRoverManifest(roverName) {
    try {
        const response = await fetch(`/manifests/${roverName}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
    } catch (err) {
        console.error('Error fetching rover manifest:', err);
        return null
    }
    const manifestData = data.photo_manifest;
    const manifestElement = createHTMLElement('div', { class: 'rover-manifest-data' },
        createHTMLElement('h2', {}, `Rover: ${manifestData.name}`),
        createHTMLElement('p', {}, `Landing Date: ${manifestData.landing_date}`),
        createHTMLElement('p', {}, `Launch Date: ${manifestData.launch_date}`),
        createHTMLElement('p', {}, `Status: ${manifestData.status}`),
        createHTMLElement('p', {}, `Total Photos: ${manifestData.total_photos}`)
    );
    const manifestContainer = document.getElementById('rover-manifest-data');
    manifestContainer.innerHTML = '';
    manifestContainer.appendChild(manifestElement);
}

async function displayRoverPhotos(roverName) {
    const data = await getRoverPhotos(roverName);
    const photos = data.photos;
    const photoElements = photos.map(photo => createHTMLElement('img', { src: photo.img_src, alt: 'Rover Photo', class: 'rover-photo' }));
    const photosContainer = document.getElementById('rover-photos');
    photosContainer.innerHTML = '';
    photoElements.forEach(photoElement => {
        photosContainer.appendChild(photoElement);
    });
}

// create content
const App = async (state) => {
    let { rovers, apod } = state;

    return `
        <header></header>
        <main>
            ${Greeting(store.user.name)}
            <section>
                <h3 class="title">Mars Rover Dashboard</h3>
                <p>Here is an example section.</p>
                <p>
                    One of the most popular websites at NASA is the Astronomy Picture of the Day. In fact, this website is one of
                    the most popular websites across all federal agencies. It has the popular appeal of a Justin Bieber video.
                    This endpoint structures the APOD imagery and associated metadata so that it can be repurposed for other
                    applications. In addition, if the concept_tags parameter is set to True, then keywords derived from the image
                    explanation are returned. These keywords could be used as auto-generated hashtags for twitter or instagram feeds;
                    but generally help with discoverability of relevant imagery.
                </p>
                ${ImageOfTheDay(apod)}
            </section>

            <section id="Manifest">
                <div align="center">
                    <h3 class="title">Mars Rover Manifest</h3>
                    <p>View each rover's manifest</p>
                    <p>
                        The Mars Rover Photos API provides access to images taken by the Mars rovers. The API allows users to retrieve
                        images from specific dates, cameras, and rovers. It also provides information about the rovers and their missions.
                    </p>
                    <div id="rover-manifest-data">
                        <p>Click on a rover to view its manifest</p>
                        <button id="curiosity-manifest" onclick="displayRoverManifest('curiosity')">Curiosity</button>
                        <button id="opportunity-manifest" onclick="displayRoverManifest('opportunity')">Opportunity</button>
                        <button id="spirit-manifest" onclick="displayRoverManifest('Spirit')">Opportunity</button>
                    </div>
                </div>
            </section>
            
            <section id="photos">
                <div id="rover-photos" align="center">
                     <h3 class="title">Mars Rover Photos</h3>
                    <p>View each rover's photos by clicking on them.</p>
                    <p>
                        The Mars Rover Photos API provides access to images taken by the Mars rovers. The API allows users to retrieve
                        images from specific dates, cameras, and rovers. It also provides information about the rovers and their missions.
                    </p>
                    <button id="curiosity-photos" onclick="getRoverPhotos('curiosity')">Curiosity</button>
                    <button id="opportunity-photos" onclick="getRoverPhotos('opportunity')">Opportunity</button>
                    <button id="spirit-photos" onclick="getRoverPhotos('spirit')">Spirit</button>
                </div>
            </section>
        </main>
        <footer>
        </footer>
    `;
};

// ------------------------------------------------------  EVENT LISTENERS
window.addEventListener('load', () => {
    render(root, store)
})

// Event listener for APOD
document.getElementById('apod').addEventListener('click', () => {
    getImageOfTheDay(store)
})
// Event listener for manifest
document.getElementById('curisoity-manifest').addEventListener('click', () => {
    createManifestHtml(store)
})
document.getElementById('opportunity-manifest').addEventListener('click', () => {
    createManifestHtml(store)
})
document.getElementById('spirit-manifest').addEventListener('click', () => {
    createManifestHtml(store)
})
// Event listener for photos


document.addEventListener('DOMContentLoaded', () => {
    fetch('/apod')
        .then(res => res.json())
        .then(data => {
            if (data.image && !data.image.error) {
                updateStore(store, { apod: data.image });
            } else {
                console.error('Error fetching APOD:', data.image.error);
            }
        })
        .catch(err => console.log('error:', err));
});
