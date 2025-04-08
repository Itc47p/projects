let store = {
    user: { name: "Chris" },
    apod: null,
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
    // isLoading: false
    
}

// add our markup to the page
const root = document.getElementById('root')
const container = document.getElementById('container');

const updateStore = (store, newState) => {
    console.log('did we update?');
    store = { ...store, ...newState };
    render(root, store);
}

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
const ImageOfTheDay = (apod) => 
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
     if (apod === null && !isLoading) {
        store.isLoading = true;
          return fetch(`/apod`)
        .then(res => res.text())
        .then(text => {
            return JSON.parse(text);
        })
        .then(apod => {
            updateStore(store, { apod });
            return apod;
        })
        .catch(err => {
            console.log('error:', err);
            return null;
        });
     }
    
}

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
        .then(data => {
            console.log('Rover latest photos data:', data);

            // Extract the nested fields you need from latest_photos
            const processedData = data.latest_photos.map(photo => ({
                id: photo.id,
                img_src: photo.img_src,
                earth_date: photo.earth_date,
                camera: photo.camera.full_name,
                rover_name: photo.rover.name,
                landing_date: photo.rover.landing_date,
                launch_date: photo.rover.launch_date,
                status: photo.rover.status,
            }));

            console.log('DATA RETURNED', processedData);

            if (!store.rovers[rover]) {
                store.rovers[rover] = {};
            }
            store.rovers[rover].latest_photos = processedData;

            // Update the store with the processed data
            updateStore(store, { selectedRover: processedData });

            // Map through the processed data to perform additional operations
            const htmlOutput = processedData.map(photo => {
                return `
                    <div class="photo-card">
                        <h3>${photo.rover_name}</h3>
                        <p>Camera: ${photo.camera}</p>
                        <p>Earth Date: ${photo.earth_date}</p>
                        <img src="${photo.img_src}" alt="Photo taken by ${photo.camera}">
                    </div>
                `;
            }).join(''); // Join the array of HTML strings into a single string

            // Optionally, render the HTML to the DOM
            document.getElementById('rover-container').innerHTML = htmlOutput;

            return processedData;
        })
        .catch(err => {
            console.error('Error fetching rover latest photos:', err);
            return null;
        });
};

// create content
const App = (state) => {
    let { apod } = state;

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
                <div id="rover-container" align="center">
                     <h3 class="title">NASA's Mars Rovers</h3>
                    <p>View each rover's photos by clicking on them.</p>
                    <p>
                        The Mars Rover Photos API provides access to images taken by the Mars rovers. The API allows users to retrieve
                        images from specific dates, cameras, and rovers. It also provides information about the rovers and their missions.
                    </p>
                    <button id="curiosity" onclick="roverContainer('curiosity')">Curiosity</button>
                    <button id="opportunity" onclick="roverContainer('opportunity')">Opportunity</button>
                    <button id="spirit" onclick="roverContainer('spirit')">Spirit</button>
                </div>
                <div id="rover-info">
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

document.getElementById('rover-info').innerHTML = htmlOutput;

// Event listeners for rover buttons
// document.getElementById('curiosity').addEventListener('click', () => {
//     getRoverInformation('curiosity').then(roverContainer('curiosity'));
// })
// document.getElementById('opportunity').addEventListener('click', () => {
//     getRoverInformation('opportunity').then(roverContainer('opportunity'));
// })
// document.getElementById('spirit').addEventListener('click', () => {
//     getRoverInformation('spirit').then(roverContainer('spirit'));
// })
// Event listener for APOD
document.getElementById('apod').addEventListener('click', () => {
    getImageOfTheDay(store)
})
