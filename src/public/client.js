//TODO: Use Immutable js on data that should not be modified

let store = Immutable.Map({
    user: Immutable.Map({ name: "Chris" }),
    apod: '',
    rovers: Immutable.List(['Curiosity', 'Opportunity', 'Spirit']),
    selectedRover: 'none'
})

// add our markup to the page
const root = document.getElementById('root')

const updateStore = (state, newState) => {
    store = store.merge(newState)
    console.log('store:', store)
    render(root, store)
}

const render = async (root, state) => {
    root.innerHTML = App(state)
}

const App = (state) => {
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
        </main>
        <footer>
        </footer>
    `;
};

window.addEventListener('load', () => {
    // Render the initial state of the app
    render(root, store)
    // Fetch the APOD data on load
    getImageOfTheDay(store)
})

const createContainer = (state) => {
    return `<ul class="rover-container">${createContainerState(state)}</ul>`
}

const createContainerState = (state) => {
    return Array.from(state.get('rovers')).map(rover => 
        `<li id=${rover} class="rover" onclick="clickHandler(event)">
            <a href="#">${rover}</a>
        </li>`
    ).join('')
}

const renderRoverContainer = (state) => {
    return Array.from(state.get('rovers')).map(rover => 
        `<li id=${rover} class="rover" onclick="clickHandler(event)">
            <a href="#">${rover}</a>
        </li>`
    ).join('')
}

const roverImages = (state) => {
    const roverToDisplay = state.get('selectedRover');

    if (!roverToDisplay.latest_photos) {
        return `<p>No photos available for the selected rover.</p>`;
    }

    return Array.from(roverToDisplay.latest_photos).map(photo => 
        `<div class="rover-wrapper">
            <img src="${photo.img_src}" alt="Rover Photo" />
            <div class="rover-info">
                <p><span>Image Earth Date:</span> ${photo.earth_date}</p>
                <p><span>Rover:</span> ${photo.rover.name}</p>
                <p><span>Launch Date:</span> ${photo.rover.launch_date}</p>
                <p><span>Landing Date:</span> ${photo.rover.landing_date}</p>
                <p><span>Status:</span> ${photo.rover.status}</p>
            </div>
        </div>`
    ).slice(0, 50).join('')
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

const getRoverData = async (rover) => {
    try {
        let response = await fetch(`/rovers/${rover}`);
        let data = await response.json();
        updateStore(store, { selectedRover: data });
    } catch (err) {
        console.log('error:', err);
    }
};

// ------------------------------------------------------  EVENT LISTENERS
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
})
