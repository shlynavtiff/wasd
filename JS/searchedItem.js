   // Firebase configuration
   const firebaseConfig = {
    // Your Firebase configuration here
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;
let currentData = [];
let dataObject = [];
let totalPages = 1;
let currentPage = 1;
let params = new URLSearchParams(window.location.search);

// Check authentication state
auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
        fetchData();
    }
});

// Fetch data from Firestore
async function fetchData() {
    try {
        const querySnapshot = await db.collection('userCollectionOfSave').get();
        currentData = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(item => item.Uid === currentUser.uid);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Fetch search results
async function fetchSearchResults(query, page = 1) {
    const baseURL = 'https://api.unpaywall.org/v2/search';
    const pageSize = 50;
    const email = 'unpaywall_01@gmail.com';

    try {
        const response = await axios.get(baseURL, {
            params: {
                query: query,
                email: email,
                page: page,
                pageSize: pageSize
            }
        });

        const { results, total_results } = response.data;
        dataObject = results;
        totalPages = Math.ceil(total_results / pageSize);
        currentPage = page;

        localStorage.setItem('savedObject', JSON.stringify(results));
        renderSearchResults();
        updatePagination();
    } catch (error) {
        console.error('Error fetching search results:', error);
    }
}

// Render search results
function renderSearchResults() {
    const searchResultsDiv = document.getElementById('searchResults');
    searchResultsDiv.innerHTML = '';

    if (dataObject.length === 0) {
        searchResultsDiv.innerHTML = '<div>No Results, try searching other words</div>';
        return;
    }

    dataObject.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'flex flex-col justify-start items-start border-b-[.1px] border-b-[#e6e6e6] pb-3 w-full max-w-[800px] overflow-hidden';
        itemDiv.innerHTML = `
            <div class="font-semibold text-left cursor-pointer">${item.response.title}</div>
            <div class="text-blue-400 text-[14px] break-words underline-offset-2 underline">${item.response.doi_url}</div>
            <div class="w-full flex gap-1 pt-2 items-center">
                <span class="text-[#888] text-left text-[12px]">
                    publisher: ${item.response.publisher},
                    <span class="font-semibold text-[13px] pl-1">${item.response.year}</span>
                </span>
            </div>
            <div class="text-[#888] text-left text-[12px]">genre: ${item.response.genre}</div>
            <div class="text-[#888] text-left text-[12px]">updated on: ${item.response.updated}</div>
            ${renderAuthors(item.response)}
            <div class="flex gap-1 text-[13px] mt-2">
                <div class="bg-gray-700 text-[13px] px-1 rounded-md text-white cursor-pointer" onclick="openCiteModal(${index})">Cite</div>
                <div class="bg-gray-700 text-[13px] px-1 rounded-md text-white cursor-pointer" onclick="saveItem(${index})">Save</div>
            </div>
        `;
        itemDiv.addEventListener('click', () => window.open(item.response.doi_url, "_blank"));
        searchResultsDiv.appendChild(itemDiv);
    });

    document.getElementById('resultsInfo').textContent = `${dataObject.length} results for "${params.get('query')}"`;
}

// Render authors
function renderAuthors(response) {
    if (!response.z_authors) return '';

    const authors = response.z_authors.slice(0, 5).map(author => 
        `<div class="bg-gray-200 text-[13px] px-1 rounded-md w-auto overflow-hidden items-center flex">${author.family}</div>`
    ).join('');

    return `
        <div class="pt-3 flex gap-1 overflow-hidden">
            <div class="text-gray-800 text-left text-[12px] font-semibold flex items-start justify-center">authors:</div>
            <div class="flex flex-wrap gap-1">
                ${authors}
                ${response.z_authors.length > 5 ? 
                    `<div class="bg-gray-700 text-[13px] px-1 rounded-md text-white cursor-pointer" onclick="showAllAuthors(event, ${response.doi_url})">see all</div>` : 
                    ''}
            </div>
        </div>
    `;
}

// Show all authors
function showAllAuthors(event, doiUrl) {
    event.stopPropagation();
    // Implementation for showing all authors
}

// Update pagination
function updatePagination() {
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'flex gap-2';
    paginationDiv.innerHTML = `
        <div class="h-[30px] text-gray-700 text-3xl flex items-center justify-center hover:text-gray-950 cursor-pointer" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
            <i class="fas fa-arrow-circle-up"></i>
        </div>
        ${currentPage > 1 ? `
            <div class="bg-gray-700 text-[15px] px-3 py-1 rounded-md text-white cursor-pointer mb-5 hover:bg-gray-950" onclick="changePage(${currentPage - 1})">
                (${currentPage - 1}) prev page
            </div>
        ` : ''}
        ${currentPage < totalPages ? `
            <div class="bg-gray-700 text-[15px] px-3 py-1 rounded-md text-white cursor-pointer mb-5 hover:bg-gray-950" onclick="changePage(${currentPage + 1})">
                next page (${currentPage + 1})
            </div>
        ` : ''}
    `;
    document.getElementById('searchResults').appendChild(paginationDiv);
}

// Change page
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    params.set('page', page);
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    fetchSearchResults(params.get('query'), page);
    window.scrollTo(0, 0);
}

// Filter by year
document.getElementById('yearFilter').addEventListener('change', (e) => {
    handleYearSelection(e.target.value);
});

function handleYearSelection(year) {
    const savedData = JSON.parse(localStorage.getItem('savedObject')) || dataObject;
    if (year !== 'Any Time') {
        const startYear = 2020;
        const endYear = parseInt(year, 10);
        const filteredData = savedData.filter(item => {
            const itemYear = item.response.year;
            const updatedYear = new Date(item.response.updated).getFullYear();
            return (itemYear >= startYear && itemYear <= endYear) ||
                   (updatedYear >= startYear && updatedYear <= endYear);
        });
        dataObject = filteredData;
    } else {
        dataObject = savedData;
    }
    renderSearchResults();
}

// Open cite modal
function openCiteModal(index) {
    // Implementation for opening cite modal
}

// Save item
function saveItem(index) {
    if (!currentUser) {
        openLoginModal();
        return;
    }
    // Implementation for saving item
}

// Open login modal
function openLoginModal() {
    // Implementation for opening login modal
}

// Initial fetch
fetchSearchResults(params.get('query'), parseInt(params.get('page')) || 1);