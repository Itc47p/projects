const { Map } = Immutable; // Import Immutable.js

// Initialize the store as an Immutable Map
let store = Map({
    user: Map({ name: "User" }),
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
    selectedRover: null,
    roverData: Map(),
    isLoading: false,
    roverManifestData: Map()
});

console.log('Store:', store.toJS());

const root = document.getElementById('root');

// Update the store immutably
const updateStore = (newState) => {
    store = store.merge(newState); // Merge new state into the existing store
    render(root, store);
};

const render = async (root, state) => {
    if (!root) {
        console.error('Root element is null or undefined!');
        return;
    }
    root.innerHTML = App(state);
    attachRoverButtonListeners();
};

const Greeting = (name) => {
    if (name) {
        return `
            <h1>Welcome, ${name}!</h1>
        `;
    }
    return `
        <h1>Hello!</h1>
    `;
};

const roverDiv = async (rover) => {
    // Update the selected rover in the store
    updateStore({ selectedRover: rover });

    // Get the rover data, conditionally
    const roverResponse = await getRoverResponse(rover);

    if (!roverResponse || roverResponse.length === 0) {
        console.warn(`No data found for rover: ${rover}`);
        return `<p>No photos available for the selected rover.</p>`;
    }

    // Generate HTML
    const generateRoverCard = (data) => {
        const roverName = data.rover?.name || 'Unknown Rover';
        const imgSrc = data.img_src || 'placeholder.jpg';
        const cameraName = data.camera?.full_name || 'Unknown Camera';
        const launchDate = data.rover?.launch_date || 'N/A';
        const landingDate = data.rover?.landing_date || 'N/A';
        const status = data.rover?.status || 'Unknown';

        return `
            <figure class="rover-card" data-name="${roverName}">
                <img src="${imgSrc}" alt="Photo taken by ${cameraName}">
                <header class="rover-header">${roverName}</header>
                <figcaption>Launch Date: ${launchDate}</figcaption>
                <figcaption>Landing Date: ${landingDate}</figcaption>
                <figcaption>Status: ${status}</figcaption>
            </figure>
        `;
    };

    const htmlOutput = roverResponse.map(generateRoverCard).join('');

    // Insert the HTML
    const roverContainer = document.getElementById('rover-info');
    if (roverContainer) {
        roverContainer.innerHTML = htmlOutput;
    } else {
        console.error('Rover container not found in the DOM.');
    }

    return htmlOutput;
};

 const  generateRoverManifest = async (rover) => {
    updateStore({ selectedRover: rover });
    const response = await getRoverManifest(rover);
    if(!response || response.length === 0) {
        console.warn(`No manifest data found for rover: ${rover}`);
        return `<p>No manifest available for the selected rover.</p>`;
    }
    const generateLatestPhoto = (data) => {
        const latestPhotoDat = data.max_date ?? 'N/A';

        return `
        <div class="rover-manifest">
        <h3>Latest Photo Date: ${latestPhotoDat}</h3>
        </div>
        `;
    };
    const htmlOutput = response.map(generateLatestPhoto).join('');
    const roverContainer = document.getElementById('rover-manifest');
    if (roverContainer) {
        roverContainer.innerHTML = htmlOutput;
    } else {
        console.error('Rover manifest container not found in the DOM.');
    }
    return htmlOutput;

}


    // ------------------------------------------------------  API CALLS

    const getRoverResponse = (rover) => {
        const roverData = store.getIn(['roverData', rover]);

        if (roverData && roverData.length > 0) {
            return Promise.resolve(roverData);
        }

        return fetch(`/rovers/${rover}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log('Fetched rover data:', data);
                // Cache the data
                const roverPhotos = data.data || [];
                updateStore({ roverData: store.get('roverData').set(rover, roverPhotos) });
                return roverPhotos;
            })
            .catch(err => {
                console.error('Error fetching rover latest photos:', err);
                return [];
            });
    };

    const getRoverManifest = (rover) => {
        const manifestData = store.getIn(['roverManifestData', rover]);
        if (manifestData && manifestData.length > 0) {
            return Promise.resolve(manifestData); // Return cached data if available
        }

        return fetch(`rovers/manifest/${rover}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log('Fetched rover manifest data:', data);
                const roverManifest = data.data || [];
                updateStore({
                    roverManifestData: store.get('roverManifestData').set(rover, roverManifest)
                });
                return roverManifest;
            })
            .catch(err => {
                console.error('Error fetching rover manifest:', err);
                return [];
            });
    };


    const App = (state) => {
        const userName = state.getIn(['user', 'name']);
        const appHTML = `
        <header></header>
        <main>
            <div class="app-greeting">${Greeting(userName)}</div>
                <h3 class="title">Mars Rover Dashboard</h3>
            <section id="photos">
                <div id="rover-container" align="center">
                    <h3 class="title">NASA's Mars Rovers</h3>
                    <p>View each rover's photos by clicking on them.</p>
                    <p>
                        The Mars Rover Photos API provides access to images taken by the Mars rovers. The API allows users to retrieve
                        images from specific dates, cameras, and rovers. It also provides information about the rovers and their missions.
                    </p>
                    <button id="curiosity" class="rover-button">Curiosity</button>
                    <button id="opportunity" class="rover-button">Opportunity</button>
                    <button id="spirit" class="rover-button">Spirit</button>
                    <div id="rover-info"></div>
                    <button id="manifest-button" class="rover-button">Latest Photo Date?</button>
                    <div id="rover-manifest"></div>
                </div>
            </section>
        </main>
        <footer>
        </footer>
    `;

        return appHTML;
    };

    // ------------------------------------------------------  EVENT LISTENERS

    window.addEventListener('load', () => {
        render(root, store);
        attachRoverButtonListeners();
    });

    const attachRoverButtonListeners = () => {
        const curiosityButton = document.getElementById('curiosity');
        const opportunityButton = document.getElementById('opportunity');
        const spiritButton = document.getElementById('spirit');
        const manifestButton = document.getElementById('manifest-button');

        if (!curiosityButton || !opportunityButton || !spiritButton) {
            console.error('Rover buttons not found in the DOM!');
            return;
        }

        curiosityButton.addEventListener('click', () => roverDiv('Curiosity'));
        opportunityButton.addEventListener('click', () => roverDiv('Opportunity'));
        spiritButton.addEventListener('click', () => roverDiv('Spirit'));
        manifestButton.addEventListener('click', () => {
            const selectedRover = store.get('selectedRover');
            if (selectedRover) {
                generateRoverManifest(selectedRover);
            } else {
                console.warn('No rover selected for manifest generation.');
            }
        });
    };
