let store = {
    user: { name: "Chris" },
    apod: null,
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
    isLoading: false,
    hasImageoFTheDay: false

}

// add our markup to the page
const root = document.getElementById('root')
const container = document.getElementById('container');

const updateStore = (newState) => {
    console.log('updateStore()', newState);
    Object.assign(store, newState); // Update the global store
    render(root, store); // Re-render the app
};

const render = async (root, state) => {
    root.innerHTML = App(state);
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
const ImageOfTheDay = (state) => {
    const { apod, isLoading } = state;
    if (isLoading) {
        return `<div>Loading...</div>`;
    }
    if (apod === null) {
        return `<div>No image of the day available</div>`
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

const roverContainer = async (rover) => {
    if (rover) {
        const roverPhotos = await getRoverInformation(rover);

        if (roverPhotos && roverPhotos.length > 0) {
            // Generate HTML for each photo
            const htmlOutput = roverPhotos.map(photo => `
                <div class="rover-card" data-name="${photo.rover_name.toLowerCase().replace(/\s/g, '-')}" data-status="${photo.status.toLowerCase()}">
                    <div class="rover-img-container">
                        <img src="${photo.img_src}" alt="Photo taken by ${photo.camera}">
                    </div>
                    <header class="rover-header">${photo.rover_name}</header>
                    <p><span>Launch Date: </span>${photo.launch_date}</p>
                    <p><span>Landing Date: </span>${photo.landing_date}</p>
                    <p><span>Status: </span>${photo.status}</p>
                    <p><span>Earth Date: </span>${photo.earth_date}</p>
                    <p><span>Camera: </span>${photo.camera}</p>
                </div>
            `).join(''); // Join the array of HTML strings into a single string

            // Render the HTML to the DOM
            document.getElementById('rover-info').innerHTML = htmlOutput;

            return htmlOutput; // Optionally return the HTML string
        } else {
            return `<p>No photos available for the selected rover.</p>`;
        }
    }
};

// ------------------------------------------------------  API CALLS

// causing a loop because of rednder in update store
// isLoadingApod: false
// if im not ^ set indicator to true -> make call -> when loading finishes set store w data and set isLoading back
// apod should start as null - in store now


const getImageOfTheDay = (state) => {
    updateStore(state, { isLoading: true });

    fetch(`/apod`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json(); // Parse JSON directly
        })
        .then(apod => {
            updateStore(store, { apod, isLoading: false });
        })
        .catch(err => {
            console.error('Error fetching Image of the Day:', err);
            updateStore(store, { isLoading: false });
        });
};


const getRoverInformation = (rover) => {
    if (typeof rover !== 'string') {
        throw new Error('Invalid rover name. Expected a string.');
    }
    if (store.rovers[rover] && store.rovers[rover].latest_photos) {
        updateStore(store, { selectedRover: store.rovers[rover].latest_photos });
        return Promise.resolve(store.rovers[rover].latest_photos);
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
        .catch(err => {
            console.error('Error fetching rover latest photos:', err);
            updateStore(store, { isLoading: false });
        });
};

// create content
const App = (state) => {
    let { apod, isLoading } = state;

    if (apod === null && !isLoading) {
        getImageOfTheDay(state);
    }

    let imageOfTheDayHtml = ImageOfTheDay(state);

    // Return the HTML structure
    return `
        <header></header>
        <main>
            ${Greeting(store.user.name)}
            <section>
                <h3 class="title">Mars Rover Dashboard</h3>
                <p>
                 Imaage of the Day from NASA's Astronomy Picture of the Day (APOD) API.e
                </p>
                ${imageOfTheDayHtml}
            </section>
            
            <section id="photos">
                <div id="rover-container" align="center">
                    <h3 class="title">NASA's Mars Rovers</h3>
                    <p>View each rover's photos by clicking on them.</p>
                    <p>
                        The Mars Rover Photos API provides access to images taken by the Mars rovers. The API allows users to retrieve
                        images from specific dates, cameras, and rovers. It also provides information about the rovers and their missions.
                    </p>
                    <button id="curiosity">Curiosity</button>
                    <button id="opportunity">Opportunity</button>
                    <button id="spirit">Spirit</button>
                </div>
                <div id="rover-info">
                </div>
            </section>
        </main>
        <footer>
        </footer>
    `;
};

// Attach event listeners after rendering
const attachRoverButtonListeners = () => {
    document.getElementById('curiosity').addEventListener('click', () => roverContainer('curiosity'));
    document.getElementById('opportunity').addEventListener('click', () => roverContainer('opportunity'));
    document.getElementById('spirit').addEventListener('click', () => roverContainer('spirit'));
};

// ------------------------------------------------------  EVENT LISTENERS
window.addEventListener('load', () => {
    getImageOfTheDay(store); // Fetch the image of the day
    render(root, store); // Render the app
});

document.getElementById('rover-info').innerHTML = htmlOutput;

// Event listener for APOD
document.getElementById('apod').addEventListener('click', () => {
    getImageOfTheDay(store)
})
