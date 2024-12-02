const API_KEY = 'K1rKPUJ4N7xguMsHd6qCqyM7k5gJNo6ytuw6vTmwFQmt44YaM6';
        const API_HOST = 'Ebook-Metadata-API.allthingsdev.co';
        const API_ENDPOINT = 'b6b8c575-3f0d-43cd-8924-26b2cf72e37d';

        let bookData = null;
        let bestSearch = [];
        let currentPage = 1;
        let bookQuery = '';

        // Parse URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        bookQuery = urlParams.get('bookQuery') || '';
        currentPage = parseInt(urlParams.get('page') || '1');

        // Fetch book data
        async function fetchBookData(query, page, sort = '') {
            showLoading(true);
            const headers = {
                "x-apihub-key": API_KEY,
                "x-apihub-host": API_HOST,
                "x-apihub-endpoint": API_ENDPOINT
            };

            try {
                const response = await axios.get(`https://Ebook-Metadata-API.proxy-production.allthingsdev.co/books/?search=${query}&page=${page}&sort=${sort}`, { headers });
                bookData = response.data;
                updateUI();
            } catch (error) {
                console.error('Error fetching book data:', error);
                showError();
            } finally {
                showLoading(false);
            }
        }

        // Update UI with fetched data
        function updateUI() {
            updateSearchInfo();
            updateBrowseResults();
            updatePagination();
            updateForYouSection();
        }

        // Update search info
        function updateSearchInfo() {
            const searchInfoElement = document.getElementById('searchInfo');
            searchInfoElement.textContent = `${bookData.count} ${bookData.count > 1 ? 'results' : 'result'} for "${bookQuery}"`;
        }

        // Update browse results
        function updateBrowseResults() {
            const browseResultsElement = document.getElementById('browseResults');
            browseResultsElement.innerHTML = bookData.results.map(book => `
                <div onclick="visitBook(${book.id})" class="flex flex-col h-full m-h-[500px] p-4 items-center justify-center cursor-pointer">
                    <div class="w-[90%] h-full rounded-lg overflow-hidden flex items-center justify-center book">
                        <img src="${book.formats['image/jpeg']}" alt="${book.title} cover" class="w-full h-full object-contain mb-2">
                    </div>
                    <h2 class="text-[10px] mt-2 font-bold text-center w-full md:text-md lg:text-lg">
                        ${book.title.length > 30 ? book.title.slice(0, 30) + '...' : book.title}
                    </h2>
                </div>
            `).join('');
        }

        // Update pagination
        function updatePagination() {
            const prevPageElement = document.getElementById('prevPage');
            const nextPageElement = document.getElementById('nextPage');

            prevPageElement.style.display = bookData.previous ? 'block' : 'none';
            nextPageElement.style.display = bookData.next ? 'block' : 'none';

            prevPageElement.textContent = `(${currentPage - 1}) prev page`;
            nextPageElement.textContent = `next page (${currentPage + 1})`;

            prevPageElement.onclick = () => changePage(currentPage - 1);
            nextPageElement.onclick = () => changePage(currentPage + 1);
        }

        // Update For You section
        function updateForYouSection() {
            bestSearch = bookData.results.filter(book => 
                book.title.toLowerCase().includes(bookQuery.toLowerCase())
            ).slice(0, 10);

            const forYouSectionElement = document.getElementById('forYouSection');
            const forYouCarouselElement = document.getElementById('forYouCarousel');

            if (bestSearch.length >= 10) {
                forYouSectionElement.style.display = 'block';
                forYouCarouselElement.querySelector('.embla__container').innerHTML = bestSearch.map(book => `
                    <div onclick="visitBook(${book.id})" class="embla__slide flex gap-3 justify-around bg-gray-300 text-black cursor-pointer">
                        <div class="rounded-xl overflow-hidden h-[100%] w-auto font-bold book">
                            <img src="${book.formats['image/jpeg']}" alt="${book.title} cover" class="w-full h-full object-contain mb-2">
                        </div>
                        <div class="h-[100%] flex flex-col justify-between">
                            <div class="font-bold w-[200px] h-auto flex items-start justify-start text-black">
                                ${book.title.length > 60 ? book.title.slice(0, 60) + '...' : book.title}
                            </div>
                            <div class="flex flex-col text-white">
                                <div class="text-black flex gap-1 justify-between">
                                    Downloads:
                                    <span class="gap-1 flex items-center justify-center bg-gray-700 text-white py-[1px] px-2 rounded-full">
                                        <span class="pb-[1px] text-[12px] flex items-center justify-center"><i class="fas fa-download"></i></span>
                                        ${book.download_count}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');

                // Initialize Embla Carousel
                const emblaNode = document.querySelector('.embla');
                const options = { loop: true };
                const plugins = [EmblaCarouselAutoScroll({ startDelay: 0, stopOnInteraction: false, speed: 1 })];
                const emblaApi = EmblaCarousel(emblaNode, options, plugins);
            } else {
                forYouSectionElement.style.display = 'none';
            }
        }

        // Change page
        function changePage(newPage) {
            currentPage = newPage;
            updateUrlParams();
            fetchBookData(bookQuery, currentPage);
            window.scrollTo(0, 0);
        }

        // Update URL parameters
        function updateUrlParams() {
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('page', currentPage);
            window.history.pushState({}, '', newUrl);
        }

        // Visit book page
        function visitBook(bookId) {
            const encodedBookQuery = encodeURIComponent(bookQuery);
            window.open(`/searched-book/${bookId}?bookQuery=${encodedBookQuery}`, '_blank');
        }

        // Show loading state
        function showLoading(isLoading) {
            const searchResultsElement = document.getElementById('searchResults');
            if (isLoading) {
                searchResultsElement.innerHTML = `
                    <div class="h-[100vh] w-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 44 44" stroke="#000">
                            <g fill="none" fill-rule="evenodd" stroke-width="2">
                                <circle cx="22" cy="22" r="1">
                                    <animate attributeName="r" begin="0s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite" />
                                    <animate attributeName="stroke-opacity" begin="0s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite" />
                                </circle>
                                <circle cx="22" cy="22" r="1">
                                    <animate attributeName="r" begin="-0.9s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite" />
                                    <animate attributeName="stroke-opacity" begin="-0.9s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite" />
                                </circle>
                            </g>
                        </svg>
                    </div>
                `;
            }
        }

        // Show error state
        function showError() {
            const searchResultsElement = document.getElementById('searchResults');
            searchResultsElement.innerHTML = `
                <div class="w-full h-full p-4">
                    <div class="font-bold m-3 text-[#292929] w-full h-[50vh] max-w-[1200px] mx-auto mt-3 rounded-lg px-3 flex items-center justify-center bg-gray-300">
                        An error occurred while fetching results. Please try again.
                    </div>
                </div>
            `;
        }

        // Event listeners
        document.getElementById('scrollToTop').addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        document.getElementById('mobileSortSelect').addEventListener('change', (e) => {
            fetchBookData(bookQuery, currentPage, e.target.value);
        });

        document.getElementById('desktopSortSelect').addEventListener('change', (e) => {
            fetchBookData(bookQuery, currentPage, e.target.value);
        });

        // Initial fetch
        fetchBookData(bookQuery, currentPage);