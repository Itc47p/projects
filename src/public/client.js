let store = {
    user: { name: "Chris" },
    apod: '',
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
}

// add our markup to the page
const root = document.getElementById('root')

const updateStore = (store, newState) => {
    store = { ...store, ...newState };
    render(root, store);
}

const render = async (root, state) => {
    root.innerHTML = App(state)
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

    //If image does not already exist, or it is not from today -- request it again
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

const RoverInfo = (roverData) => {
    if (!roverData || !roverData.img_src || !roverData.rover) {
        return `<p>No data available for the selected rover.</p>`;
    }
    const { img_src, rover } = roverData;

    return (`
        <div class="rover-info-container">
            <div class="rover-photo">
                <img src="${img_src}" alt="Rover Photo" />
            </div>
            <div class="rover-manifest">
                <h2>${rover.name}</h2>
                <p><strong>Launch Date:</strong> ${rover.launch_date}</p>
                <p><strong>Landing Date:</strong> ${rover.landing_date}</p>
                <p><strong>Status:</strong> ${rover.status}</p>
            </div>
        </div>
    `);
}

// ------------------------------------------------------  API CALLS
const getImageOfTheDay = (state) => {
    let { apod } = state
    fetch(`/apod`)x
        .then(res => res.text())
        .then(text => {
            return JSON.parse(text);
        })
        .then(apod => updateStore(store, { apod }))
        .catch(err => console.log('error:', err));

    return apod
}

const getRoverInformation = (rover) => {
    if (typeof rover !== 'string') {
        throw new Error('Invalid rover name. Expected a string.');
    }
    if (store.rovers[rover] && store.rovers[rover].photos) {
        updateStore(store, { selectedRover: store.rovers[rover].photos });
        document.getElementById('rover-info').innerHTML = RoverInfo(store.rovers[rover].photos);
        return Promise.resolve(store.rovers[rover].photos);
    }

    return fetch(`/rovers/${rover}`)
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
            console.log('Rover photos data:', data);
            if (!store.rovers[rover]) {
                store.rovers[rover] = {};
            }
            store.rovers[rover].photos = data;
            updateStore(store, { selectedRover: data });
            document.getElementById('rover-info').innerHTML = RoverInfo(data);
            return data;
        })
        .catch(err => {
            console.error('Error fetching rover photos:', err);
            return null;
        });
};


// create content
const App = (state) => {
    let { rovers, apod, selectedRover } = state;

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
            
            <section id="photos">
                <div id="rover-photos" align="center">
                     <h3 class="title">NASA's Mars Rovers</h3>
                    <p>View each rover's photos by clicking on them.</p>
                    <p>
                        The Mars Rover Photos API provides access to images taken by the Mars rovers. The API allows users to retrieve
                        images from specific dates, cameras, and rovers. It also provides information about the rovers and their missions.
                    </p>
                    <button id="curiosity" onclick="getRoverInformation('curiosity')">Curiosity</button>
                    <button id="opportunity" onclick="getRoverInformation('opportunity')">Opportunity</button>
                    <button id="spirit" onclick="getRoverInformation('spirit')">Spirit</button>
                </div>
                <div id="rover-info">
                    ${RoverInfo(selectedRover)}
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

// Event listeners for rover  buttons
document.getElementById('curiosity').addEventListener('click', () => {
    getRoverInformation('curiosity').then(() => renderCuriosityContainer('curiosity'));
})
document.getElementById('opportunity').addEventListener('click', () => {
    getRoverInformation('opportunity').then(() => renderOpportunityContainer('opportunity'));
})
document.getElementById('spirit').addEventListener('click', () => {
    getRoverInformation('spirit').then(() => renderSpiritContainer('spirit'));
})
// Event listener for APOD
document.getElementById('apod').addEventListener('click', () => {
    getImageOfTheDay(store)
})

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
