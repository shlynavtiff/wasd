 // Firebase configuration
 const firebaseConfig = {
    // Your Firebase configuration here
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;
let bookData = null;
let relatedBooks = [];

// Check authentication state
auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
        fetchUserData();
    }
    renderBookActions();
});

// Fetch user data from Firestore
async function fetchUserData() {
    try {
        const querySnapshot = await db.collection('userCollectionOfSave').where('Uid', '==', currentUser.uid).get();
        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            // Process user data as needed
        }
    } catch (error) {
        console.error("Error fetching user data: ", error);
    }
}

// Fetch book data
async function fetchBookData() {
    const bookId = new URLSearchParams(window.location.search).get('id');
    if (!bookId) {
        console.error("No book ID provided");
        return;
    }

    const headers = {
        "x-apihub-key": "K1rKPUJ4N7xguMsHd6qCqyM7k5gJNo6ytuw6vTmwFQmt44YaM6",
        "x-apihub-host": "Ebook-Metadata-API.allthingsdev.co",
        "x-apihub-endpoint": "b6b8c575-3f0d-43cd-8924-26b2cf72e37d"
    };

    try {
        const response = await axios.get(`https://Ebook-Metadata-API.proxy-production.allthingsdev.co/books/?ids=${bookId}`, { headers });
        bookData = response.data.results[0];
        renderBookContent();
        fetchRelatedBooks();
    } catch (error) {
        console.error("Error fetching book data:", error);
    }
}

// Fetch related books
async function fetchRelatedBooks() {
    const bookQuery = new URLSearchParams(window.location.search).get('bookQuery');
    if (!bookQuery) return;

    const headers = {
        "x-apihub-key": "K1rKPUJ4N7xguMsHd6qCqyM7k5gJNo6ytuw6vTmwFQmt44YaM6",
        "x-apihub-host": "Ebook-Metadata-API.allthingsdev.co",
        "x-apihub-endpoint": "b6b8c575-3f0d-43cd-8924-26b2cf72e37d"
    };

    try {
        const response = await axios.get(`https://Ebook-Metadata-API.proxy-production.allthingsdev.co/books/?search=${bookQuery}&page=1`, { headers });
        relatedBooks = response.data.results.filter(book => book.title !== bookData.title);
        renderRelatedBooks();
    } catch (error) {
        console.error("Error fetching related books:", error);
    }
}

// Render book content
function renderBookContent() {
    const bookContentDiv = document.getElementById('bookContent');
    bookContentDiv.innerHTML = `
        <div class="gap-8 w-full h-full flex flex-col max-w-[1200px] mx-auto md:flex-row bg-gray-300 p-5 rounded-lg text-black">
            <div class="book rounded-lg w-full max-w-[200px] h-[100%] max-h-[600px] overflow-hidden md:max-w-[300px]">
                <img class="h-full w-full object-contain" src="${bookData.formats['image/jpeg']}" alt="${bookData.title}">
            </div>
            <div class="flex flex-col w-full items-start">
                <div class="text-xl font-bold">${bookData.title}</div>
                <div class="pt-2">
                    <div class="flex flex-wrap w-full max-w-[500px] gap-1" id="subjectTags">
                        ${renderSubjects(bookData.subjects)}
                    </div>
                    <div class="flex gap-2 flex-wrap mt-5">
                        <div>Download as:</div>
                        ${renderDownloadOptions(bookData.formats)}
                    </div>
                </div>
                ${renderAuthors(bookData.authors)}
                <div class="flex w-full gap-3 items-center mt-auto justify-between pt-3">
                    <div class="flex items-center gap-1">
                        Copyright: <span class="flex items-center bg-[#292929] py-[1px] px-2 text-white rounded-lg gap-1">
                            ${bookData.copyright ? "True" : "False"}
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        Downloads:
                        <span class="flex items-center bg-[#292929] py-[1px] px-2 text-white rounded-lg gap-1">
                            <i class="fas fa-download pb-[1px]"></i>${bookData.download_count}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render subjects
function renderSubjects(subjects) {
    const maxSubjects = 5;
    let subjectsHtml = subjects.slice(0, maxSubjects).map(subject => 
        `<div class="text-[12px] bg-[#292929] py-1 px-2 text-white rounded-lg">${subject}</div>`
    ).join('');
    
    if (subjects.length > maxSubjects) {
        subjectsHtml += `
            <div id="seeAllSubjects" class="text-[12px] bg-gray-700 cursor-pointer py-1 px-2 text-white rounded-lg">
                See All
            </div>
        `;
    }
    
    return subjectsHtml;
}

// Render download options
function renderDownloadOptions(formats) {
    return `
        <div onclick="window.open('${formats['application/epub+zip']}')" class="cursor-pointer">
            <span class="bg-gray-400 py-1 px-2 rounded-lg text-white">EPUB</span>
        </div>
        <div onclick="window.open('${formats['application/octet-stream']}')" class="cursor-pointer">
            <span class="bg-gray-400 py-1 px-2 rounded-lg text-white">ZIP</span>
        </div>
        <div onclick="window.open('${formats['application/x-mobipocket-ebook']}')" class="cursor-pointer">
            <span class="bg-gray-400 py-1 px-2 rounded-lg text-white">MOBI</span>
        </div>
    `;
}

// Render authors
function renderAuthors(authors) {
    if (!authors || authors.length === 0) return '';
    
    return `
        <div class="mt-3 flex gap-2">
            <div class="font-semibold">
                ${authors.length > 1 ? 'Authors:' : 'Author:'}
            </div>
            <div class="flex flex-wrap gap-2">
                ${authors.map(author => `<div>${author.name}</div>`).join('')}
            </div>
        </div>
    `;
}

// Render book actions
function renderBookActions() {
    const bookActionsDiv = document.getElementById('bookActions');
    bookActionsDiv.innerHTML = `
        <div class="w-full max-w-[1200px] mx-auto flex gap-3 md:px-0">
            <button onclick="readBook()" class="py-1 px-2 bg-slate-500 rounded-lg text-white">
                Read Book
            </button>
            ${currentUser ? `
                <button onclick="saveBook()" class="py-1 px-2 bg-slate-500 rounded-lg text-white">
                    Save Book
                </button>
            ` : ''}
        </div>
    `;
}

// Render related books
function renderRelatedBooks() {
    const relatedBooksDiv = document.getElementById('relatedBooks');
    relatedBooksDiv.innerHTML = `
        <div class="w-full max-w-[1200px] mx-auto text-xl font-bold px-4 py-2">
            You might also like
        </div>
        <div class="w-full h-full max-w-[1200px] text-black p-2 grid grid-cols-2 mx-auto sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5">
            ${relatedBooks.map(book => `
                <div onclick="visitBook(${book.id})" class="flex flex-col h-full m-h-[500px] items-center justify-center cursor-pointer">
                    <div class="w-[90%] h-full rounded-lg overflow-hidden flex items-center justify-center book">
                        <img src="${book.formats['image/jpeg']}" alt="${book.title} cover" class="w-full h-full object-contain mb-2">
                    </div>
                    <h2 class="text-sm mt-2 font-bold text-center w-full md:text-md">
                        ${book.title.length > 30 ? book.title.slice(0, 30) + '...' : book.title}
                    </h2>
                </div>
            `).join('')}
        </div>
        <div class="flex gap-2 w-full max-w-[1200px] mx-auto py-4 px-5">
            <div onclick="window.scrollTo({top: 0, behavior: 'smooth'})" class="h-[30px] text-gray-700 text-3xl flex items-center justify-center hover:text-gray-950 cursor-pointer">
                <i class="fas fa-arrow-circle-up"></i>
            </div>
        </div>
    `;
}

// Read book
function readBook() {
    const readBookModal = document.createElement('div');
    readBookModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    readBookModal.innerHTML = `
        <div class="bg-white p-4 rounded-lg w-full max-w-4xl h-[80vh] relative">
            <button onclick="closeReadBookModal()" class="absolute top-2 right-2 text-black">&times;</button>
            <iframe src="${bookData.formats['text/html']?.replace('http://', 'https://')}" class="w-full h-full"></iframe>
        </div>
    `;
    document.body.appendChild(readBookModal);
}

// Close read book modal
function closeReadBookModal() {
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) modal.remove();
}

// Save book
function saveBook() {
    // Implement save book functionality
    console.log("Saving book:", bookData.title);
}

// Visit book
function visitBook(bookId) {
    const bookQuery = new URLSearchParams(window.location.search).get('bookQuery');
    const encodedBookQuery = encodeURIComponent(bookQuery);
    window.open(`/searched-book/${bookId}?bookQuery=${encodedBookQuery}`, '_blank');
}

// Initialize
fetchBookData();