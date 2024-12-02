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

// Check authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        fetchData();
    } else {
        window.location.href = '/login'; // Redirect to login page
    }
});

// Fetch data from Firestore
async function fetchData() {
    try {
        const querySnapshot = await db.collection('userCollectionOfSave').get();
        currentData = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(item => item.Uid === currentUser.uid);
        renderContent('article');
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Render content based on tab
function renderContent(tab) {
    const contentDiv = document.getElementById(`${tab}Content`);
    contentDiv.innerHTML = '';

    if (currentData.length === 0) {
        contentDiv.innerHTML = '<div class="text-center h-full m-3">No data available</div>';
        return;
    }

    currentData.forEach(item => {
        let html = '';
        if (tab === 'article' && item.MyCollection) {
            html = renderArticles(item.MyCollection);
        } else if (tab === 'books' && item.MyBook) {
            html = renderBooks(item.MyBook);
        } else if (tab === 'computation' && item.MyComputationArr) {
            html = renderComputations(item.MyComputationArr);
        }
        contentDiv.innerHTML += html;
    });
}

// Render articles
function renderArticles(articles) {
    return `
        <div class="grid grid-cols-1 p-5 gap-3 lg:grid-cols-3 md:grid-cols-2 overflow-auto">
            ${articles.reverse().map(article => `
                <div class="cursor-pointer flex items-start flex-col bg-[#3d3d3d] text-white p-3 rounded-lg">
                    <div class="font-semibold">${article.Title}</div>
                    <div class="text-blue-300 break-words whitespace-normal break-all">${article.Link}</div>
                    <div class="text-gray-400">Publisher: ${article.Publisher}, ${article.Year}</div>
                    <div class="text-gray-400">Updated: ${article.Updated}</div>
                    <div class="mt-auto h-[50px] flex items-end">
                        <div class="flex gap-3">
                            <div class="bg-red-500 py-1 px-3 rounded-lg" onclick="deleteArticle('${article.Link}')">Delete</div>
                            <div class="bg-green-500 py-1 px-3 rounded-lg" onclick="citeArticle(${JSON.stringify(article)})">Cite</div>
                            <div class="bg-blue-500 py-1 px-3 rounded-lg" onclick="window.open('${article.Link}', '_blank')">Visit</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Render books
function renderBooks(books) {
    return `
        <div class="grid grid-cols-1 p-5 gap-3 lg:grid-cols-3 md:grid-cols-2 overflow-auto">
            ${books.reverse().map(book => `
                <div class="cursor-pointer flex flex-col items-start gap-3 bg-[#383636] text-white p-3 rounded-lg">
                    <div class="flex gap-3 p-3">
                        <div class="h-[250px] w-[200px] flex items-start bg-red-300 overflow-hidden rounded-lg">
                            <img class="object-cover w-full h-full" src="${book.formats['image/jpeg']}" alt="">
                        </div>
                        <div class="flex flex-col gap-2 w-[50%] break-all break-words">
                            <div class="font-semibold">${book.title.length > 20 ? book.title.slice(0, 20) + '...' : book.title}</div>
                            <div class="text-[13px] text-gray-300">Downloads: <span>${book.download_count}</span></div>
                            <div class="flex flex-wrap gap-2 text-[13px] text-gray-300">
                                <div>Language:</div>
                                ${book.languages.map(lang => `<div>${lang}</div>`).join('')}
                            </div>
                            <div class="flex flex-wrap gap-2 text-[13px] text-gray-300">
                                <div>Subjects</div>
                                ${book.subjects.slice(0, 1).map(subject => `<div>${subject}</div>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="px-3">
                        <div class="flex gap-3 flex-wrap">
                            <div class="bg-red-500 py-1 px-3 rounded-lg" onclick="deleteBook(${book.id})">Delete</div>
                            <div class="bg-green-500 py-1 px-3 rounded-lg" onclick="readBook(${book.id})">Read</div>
                            <div class="bg-blue-500 py-1 px-3 rounded-lg" onclick="window.open('${book.formats['text/html']}', '_blank')">Visit</div>
                            <div class="bg-gray-500 py-1 px-3 rounded-lg" onclick="downloadBook(${book.id})">Download</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Render computations
function renderComputations(computations) {
    return `
        <div class="grid grid-cols-1 p-5 gap-3 lg:grid-cols-3 md:grid-cols-2 overflow-auto">
            ${computations.reverse().map(computation => `
                <div class="cursor-pointer flex flex-col items-start gap-3 bg-[#383636] text-white p-3 rounded-lg">
                    <div class="font-xl font-bold">
                        ${getInputStringFromComputation(computation.resultItem)}
                    </div>
                    <div class="mt-auto pt-3 flex gap-3 items-center justify-start">
                        <div class="bg-red-500 py-1 px-3 rounded-lg" onclick="deleteComputation('${computation.docID}')">Delete</div>
                        <div class="bg-green-500 py-1 px-3 rounded-lg" onclick="viewComputation('${computation.resultItem}')">View</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Helper function to parse computation result
function getInputStringFromComputation(params) {
    const parser = new DOMParser();
    const toXml = parser.parseFromString(params, 'application/xhtml+xml');
    const queryResultEls = toXml.getElementsByTagName('queryresult');
    const inputString = queryResultEls.length > 0
        ? queryResultEls[0]?.getAttribute('inputstring')
        : '';

    const pods = toXml.getElementsByTagName('pod');
    let imageCount = 0;
    let secondImageUrl = null;

    for (const pod of pods) {
        const subpods = pod.getElementsByTagName('subpod');
        for (const subpod of subpods) {
            const imgEl = subpod.getElementsByTagName('img')[0];
            if (imgEl) {
                imageCount++;
                if (imageCount === 1) {
                    secondImageUrl = imgEl.getAttribute('src');
                    break;
                }
            }
        }
        if (secondImageUrl) break;
    }

    return `
        <div>
            ${inputString ? `<div>Input: ${inputString}</div>` : ''}
            ${secondImageUrl ? `
                <div class='w-full h-full rounded-md overflow-hidden'>
                    <img class='w-full h-auto object-contain' src="${secondImageUrl}" alt="Result image">
                </div>
            ` : ''}
        </div>
    `;
}

// Delete functions
async function deleteArticle(link) {
    try {
        const userDoc = currentData.find(doc => doc.Uid === currentUser.uid);
        if (userDoc) {
            const updatedCollection = userDoc.MyCollection.filter(item => item.Link !== link);
            await db.collection('userCollectionOfSave').doc(userDoc.id).update({
                MyCollection: updatedCollection
            });
            await fetchData();
            showToast('Item successfully deleted!');
        }
    } catch (error) {
        console.error("Error deleting article: ", error);
    }
}

async function deleteBook(id) {
    try {
        const userDoc = currentData.find(doc => doc.Uid === currentUser.uid);
        if (userDoc) {
            const updatedBooks = userDoc.MyBook.filter(item => item.id !== id);
            await db.collection('userCollectionOfSave').doc(userDoc.id).update({
                MyBook: updatedBooks
            });
            await fetchData();
            showToast('Item successfully deleted!');
        }
    } catch (error) {
        console.error("Error deleting book: ", error);
    }
}

async function deleteComputation(docID) {
    try {
        const userDoc = currentData.find(doc => doc.Uid === currentUser.uid);
        if (userDoc) {
            const updatedComputations = userDoc.MyComputationArr.filter(item => item.docID !== docID);
            await db.collection('userCollectionOfSave').doc(userDoc.id).update({
                MyComputationArr: updatedComputations
            });
            await fetchData();
            showToast('Item successfully deleted!');
        }
    } catch (error) {
        console.error("Error deleting computation: ", error);
    }
}

// Other functions (cite, read, download, view) would be implemented here
function citeArticle(article) {
    // Implement citation functionality
    console.log('Citing article:', article);
}

function readBook(id) {
    // Implement book reading functionality
    console.log('Reading book:', id);
}

function downloadBook(id) {
    // Implement book download functionality
    console.log('Downloading book:', id);
}

function viewComputation(resultItem) {
    // Implement computation view functionality
    console.log('Viewing computation:', resultItem);
}

// Toast notification
function showToast(message) {
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "bottom",
        position: 'right',
        backgroundColor: "#28a745",
        stopOnFocus: true,
    }).showToast();
}

// Tab switching
document.getElementById('articleTab').addEventListener('click', () => switchTab('article'));
document.getElementById('booksTab').addEventListener('click', () => switchTab('books'));
document.getElementById('computationTab').addEventListener('click', () => switchTab('computation'));

function switchTab(tab) {
    ['article', 'books', 'computation'].forEach(t => {
        document.getElementById(`${t}Tab`).classList.remove('border-b-[3px]', 'font-semibold', 'border-black');
        document.getElementById(`${t}Content`).classList.add('hidden');
    });
    document.getElementById(`${tab}Tab`).classList.add('border-b-[3px]', 'font-semibold', 'border-black');
    document.getElementById(`${tab}Content`).classList.remove('hidden');
    renderContent(tab);
}

// Initial render
renderContent('article');