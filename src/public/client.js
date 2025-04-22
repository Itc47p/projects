let store = {
    user: { name: "Chris" },
    apod: null,
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
    isLoading: false,
    hasImageoFTheDay: false
}
let htmlOutput = '';

// add our markup to the page
const root = document.getElementById('root')
// const container = document.getElementById('container');

const updateStore = (newState) => {
    console.log('updateStore()', newState);
    Object.assign(store, newState); // Update the global store
    render(root, store); // Re-render the app
};

const render = async (root, state) => {
    if (!root) {
        console.error('Root element is null or undefined!');
        return;
    }
    root.innerHTML = App(state);
    attachRoverButtonListeners();
    root.roverDiv = await roverDiv(state.selectedRover);
    // root.imageOfTheDay = ImageOfTheDay(state);
};

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
// const ImageOfTheDay = (state) => {
//     const { apod, isLoading } = state;
//     if (isLoading) {
//         return `<div>Loading...</div>`;
//     }
//     if (apod === null) {
//         return `<div>No image of the day available</div>`
//     }
//     // check if the photo of the day is actually type video!
//     if (apod.media_type === "video") {
//         return (`
//                 <p>See today's featured video <a href="${apod.url}">here</a></p>
//                 <p>${apod.title}</p>
//                 <p>${apod.explanation}</p>
//             `)
//     } else {
//         return (`
//                 <img src="${apod.image.url}" height="350px" width="100%" />
//                 <p>${apod.image.explanation}</p>
//             `)
//     }
// }

const roverDiv = async (rover) => {
    const roverResponse = await getRoverResponse(rover);
    console.log(roverResponse, 'ROVER RESPONSE:');
    console.log('roverDiv() called with rover:', rover);

    if (roverResponse && roverResponse.length > 0) {
        console.log('Rover response:', roverResponse);
        const htmlOutput = roverResponse.map(data => `
            <div class="rover-card" data-name="${data.rover.name}">
                <img src="${data.img_src}" alt="Photo taken by ${data.camera.full_name}">
                <header class="rover-header">${data.rover.name}</header>
                <p><span>Launch Date: </span>${data.rover.launch_date}</p>
                <p><span>Landing Date: </span>${data.rover.landing_date}</p>
                <p><span>Status: </span>${data.rover.status}</p>
            </div>
        `).join('');

           const roverDivInfo = document.getElementById('rover-info');
           if(roverDivInfo) {
                roverDivInfo.innerHTML = htmlOutput;
           } else {
                console.error('rover-info element not found in the DOM!');
            }
            return htmlOutput; 
        } else {
            return `<p>No photos available for the selected rover.</p>`;
        }
};

// ------------------------------------------------------  API CALLS

// const getImageOfTheDay = (state) => {
//     updateStore(state, { isLoading: true });

//     fetch(`/apod`)
//         .then(res => {
//             if (!res.ok) {
//                 throw new Error(`HTTP error! status: ${res.status}`);
//             }
//             return res.json(); // Parse JSON directly
//         })
//         .then(apod => {
//             updateStore(store, { apod, isLoading: false });
//         })
//         .catch(err => {
//             console.error('Error fetching Image of the Day:', err);
//             updateStore(store, { isLoading: false });
//         });
// };


const getRoverResponse = (rover) => {
    console.log('getRoverResponse() called with rover:', rover);
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

const App = (state) => {
    const appHTML = `
        <header></header>
        <main>
            ${Greeting(store.user.name)}
                <h3 class="title">Mars Rover Dashboard</h3>
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
                    <div id="rover-info"></div>
                </div>
            </section>
        </main>
        <footer>
        </footer>
    `;

    return appHTML;
};;

// Attach event listeners after rendering
const attachRoverButtonListeners = () => {
    console.log('attachRoverButtonListeners() called');
    const curiosityButton = document.getElementById('curiosity');
    const opportunityButton = document.getElementById('opportunity');
    const spiritButton = document.getElementById('spirit');

    if (!curiosityButton || !opportunityButton || !spiritButton) {
        console.error('Rover buttons not found in the DOM!');
        return;
    }

    curiosityButton.addEventListener('click', () => roverDiv('Curiosity'));
    opportunityButton.addEventListener('click', () => roverDiv('Opportunity'));
    spiritButton.addEventListener('click', () => roverDiv('Spirit'));
};

// ------------------------------------------------------  EVENT LISTENERS
window.addEventListener('load', () => {
    // getImageOfTheDay(store);
    render(root, store);
    attachRoverButtonListeners();
});

// Event listener for APOD
// document.getElementById('apod').addEventListener('click', () => {
//     getImageOfTheDay(store)
// })
