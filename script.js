class UniversityFinder {
constructor() {
    this.apiUrl = "https://universities.hipolabs.com/search"; // ✅ HTTPS
    this.universities = [];
    this.filteredUniversities = [];
    this.currentFilter = 'all';
    
    this.initializeElements();
    this.bindEvents();
}

    initializeElements() {
        this.countryInput = document.getElementById('countryInput');
        this.stateSelect = document.getElementById('stateSelect');
        this.searchBtn = document.getElementById('searchBtn');
        this.filtersContainer = document.getElementById('filtersContainer');
        this.resultsCount = document.getElementById('resultsCount');
        this.loadingContainer = document.getElementById('loadingContainer');
        this.errorContainer = document.getElementById('errorContainer');
        this.universityGrid = document.getElementById('universityGrid');
        this.noResults = document.getElementById('noResults');
    }

    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.countryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // Filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                this.handleFilterClick(e.target);
            }
        });

        // State filter
        this.stateSelect.addEventListener('change', () => {
            if (this.universities.length > 0) {
                this.applyFilters();
            }
        });

        // Add input animation
        this.countryInput.addEventListener('input', (e) => {
            if (e.target.value.length > 0) {
                e.target.style.transform = 'scale(1.02)';
            } else {
                e.target.style.transform = 'scale(1)';
            }
        });
    }

    clearStateFilter() {
        this.stateSelect.innerHTML = '<option value="">All States/Provinces</option>';
    }

    async handleSearch() {
        const country = this.countryInput.value.trim();
        if (!country) {
            this.showError('Please enter a country name');
            this.animateSearchButton('error');
            return;
        }

        this.showLoading(true);
        this.clearError();
        this.clearStateFilter();
        this.animateSearchButton('loading');
        
        try {
            const universities = await this.fetchUniversities(country);
            if (universities.length === 0) {
                this.showError(`No universities found for "${country}". Please check the country name and try again.`);
                this.filtersContainer.style.display = 'none';
                this.animateSearchButton('error');
                return;
            }
            
            this.universities = universities;
            this.populateStateFilter(universities);
            this.applyFilters();
            this.filtersContainer.style.display = 'flex';
            this.animateSearchButton('success');
            
            // Add success message
            this.showSuccessMessage(`Found ${universities.length} universities in ${country}!`);
            
        } catch (error) {
            console.error('Search error:', error);
            this.animateSearchButton('error');
            
            if (error.response?.status === 404) {
                this.showError(`No universities found for "${country}". Please check the country name.`);
            } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
                this.showError('Please check your internet connection and try again.');
            } else {
                this.showError('Unable to fetch universities. The service might be temporarily unavailable. Please try again later.');
            }
            this.filtersContainer.style.display = 'none';
        } finally {
            this.showLoading(false);
        }
    }

    animateSearchButton(type) {
        const btn = this.searchBtn;
        btn.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            if (type === 'success') {
                btn.style.background = 'linear-gradient(135deg, #00b894, #00a085)';
                btn.innerHTML = '✅ Success!';
            } else if (type === 'error') {
                btn.style.background = 'linear-gradient(135deg, #e17055, #d63031)';
                btn.innerHTML = '❌ Error';
            } else if (type === 'loading') {
                btn.style.background = 'linear-gradient(135deg, #fdcb6e, #e17055)';
                btn.innerHTML = '🔄 Searching...';
            }
            
            btn.style.transform = 'scale(1)';
            
            if (type !== 'loading') {
                setTimeout(() => {
                    btn.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
                    btn.innerHTML = '🔍 Search';
                }, 2000);
            }
        }, 100);
    }

    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            background: rgba(0, 184, 148, 0.2);
            border: 1px solid rgba(0, 184, 148, 0.3);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
            animation: slideIn 0.5s ease;
        `;
        successDiv.innerHTML = `✅ ${message}`;
        
        this.errorContainer.appendChild(successDiv);
        this.errorContainer.style.display = 'block';
        
        setTimeout(() => {
            successDiv.remove();
            if (!this.errorContainer.children.length) {
                this.errorContainer.style.display = 'none';
            }
        }, 3000);
    }

    async fetchUniversities(country) {
        try {
            // Try with country parameter first
            const response = await axios.get(this.apiUrl, {
                params: { country: country },
                timeout: 10000
            });
            
            if (response.data && response.data.length > 0) {
                return response.data;
            }
            
            // If no results with country, try with name parameter
            const nameResponse = await axios.get(this.apiUrl, {
                params: { name: country },
                timeout: 10000
            });
            
            return nameResponse.data || [];
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    populateStateFilter(universities) {
        this.clearStateFilter();

        const states = [...new Set(universities
            .map(uni => uni['state-province'])
            .filter(state => state && state.trim() !== '')
            .sort()
        )];

        console.log(`Found ${states.length} unique states/provinces:`, states);

        if (states.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No state data available';
            option.disabled = true;
            this.stateSelect.appendChild(option);
            return;
        }

        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            this.stateSelect.appendChild(option);
        });

        const defaultOption = this.stateSelect.querySelector('option[value=""]');
        defaultOption.textContent = `All States/Provinces (${states.length} available)`;
        
        // Add animation to state selector
        this.stateSelect.style.animation = 'slideIn 0.5s ease';
    }

    applyFilters() {
        let filtered = [...this.universities];
        
        // Apply state filter
        const selectedState = this.stateSelect.value;
        if (selectedState) {
            filtered = filtered.filter(uni => 
                uni['state-province'] && 
                uni['state-province'].toLowerCase().includes(selectedState.toLowerCase())
            );
        }

        // Apply type filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(uni => {
                const name = uni.name.toLowerCase();
                if (this.currentFilter === 'public') {
                    return name.includes('state') || name.includes('public') || 
                           name.includes('national') || name.includes('government');
                } else if (this.currentFilter === 'private') {
                    return !name.includes('state') && !name.includes('public') && 
                           !name.includes('national') && !name.includes('government');
                }
            });
        }

        this.filteredUniversities = filtered;
        this.displayUniversities(filtered);
        this.updateResultsCount(filtered.length, this.universities.length);
    }

    handleFilterClick(filterBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => 
            btn.classList.remove('active')
        );
        
        filterBtn.classList.add('active');
        this.currentFilter = filterBtn.dataset.filter;
        
        // Add click animation
        filterBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            filterBtn.style.transform = 'scale(1)';
        }, 150);
        
        this.applyFilters();
    }

    displayUniversities(universities) {
        this.universityGrid.innerHTML = '';
        this.noResults.style.display = 'none';

        if (universities.length === 0) {
            this.noResults.style.display = 'block';
            return;
        }

        universities.forEach((university, index) => {
            const card = this.createUniversityCard(university);
            card.style.animationDelay = `${index * 0.1}s`;
            card.style.animation = 'slideUp 0.6s ease forwards';
            this.universityGrid.appendChild(card);
        });
    }

    createUniversityCard(university) {
        const card = document.createElement('div');
        card.className = 'university-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';

        const websiteUrl = university.web_pages && university.web_pages[0] 
            ? university.web_pages[0] 
            : '#';

        card.innerHTML = `
            <div class="university-name">${university.name}</div>
            <div class="university-details">
                <div class="detail-item">
                    <span class="detail-icon">🌍</span>
                    <span><strong>Country:</strong> ${university.country || 'Not specified'}</span>
                </div>
                ${university['state-province'] ? `
                    <div class="detail-item">
                        <span class="detail-icon">📍</span>
                        <span><strong>State/Province:</strong> ${university['state-province']}</span>
                    </div>
                ` : ''}
                ${university.domains && university.domains[0] ? `
                    <div class="detail-item">
                        <span class="detail-icon">🌐</span>
                        <span><strong>Domain:</strong> ${university.domains[0]}</span>
                    </div>
                ` : ''}
            </div>
            ${websiteUrl !== '#' ? `
                <a href="${websiteUrl}" target="_blank" class="website-link">
                    Visit Website 🔗
                </a>
            ` : ''}
        `;

        // Add hover effects
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });

        return card;
    }

    showLoading(show) {
        this.loadingContainer.style.display = show ? 'block' : 'none';
        this.universityGrid.style.display = show ? 'none' : 'grid';
        this.noResults.style.display = 'none';
        
        if (show) {
            // Add loading animation to spinner
            const spinner = this.loadingContainer.querySelector('.spinner');
            spinner.style.animation = 'spin 1s linear infinite, pulse 2s ease-in-out infinite alternate';
        }
    }

    showError(message) {
        this.errorContainer.innerHTML = `
            <div class="error-message">
                ⚠️ ${message}
            </div>
        `;
        this.errorContainer.style.display = 'block';
        
        // Add shake animation to error
        const errorMsg = this.errorContainer.querySelector('.error-message');
        errorMsg.style.animation = 'shake 0.5s ease-in-out';
    }

    clearError() {
        this.errorContainer.style.display = 'none';
    }

    updateResultsCount(filtered, total) {
        const countElement = this.resultsCount;
        
        if (total === 0) {
            countElement.textContent = 'Ready to search universities worldwide';
            countElement.style.color = 'rgba(255, 255, 255, 0.7)';
        } else if (filtered === total) {
            countElement.textContent = `Found ${total} universities`;
            countElement.style.color = '#00b894';
            countElement.style.fontWeight = '700';
        } else {
            countElement.textContent = `Showing ${filtered} of ${total} universities`;
            countElement.style.color = '#fdcb6e';
            countElement.style.fontWeight = '600';
        }
        
        // Add count animation
        countElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            countElement.style.transform = 'scale(1)';
        }, 200);
    }

    // Method to add dynamic university type detection
    detectUniversityType(universityName) {
        const name = universityName.toLowerCase();
        const publicKeywords = ['state', 'public', 'national', 'government', 'municipal', 'federal'];
        const privateKeywords = ['private', 'institute', 'college', 'academy'];
        
        const isPublic = publicKeywords.some(keyword => name.includes(keyword));
        const isPrivate = privateKeywords.some(keyword => name.includes(keyword));
        
        if (isPublic) return 'public';
        if (isPrivate) return 'private';
        return 'unknown';
    }

    // Method to add search suggestions
    addSearchSuggestions() {
        const suggestions = [
            'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
            'Germany', 'France', 'Japan', 'China', 'Brazil', 'South Africa',
            'Pakistan', 'Bangladesh', 'Nepal', 'Sri Lanka', 'Netherlands',
            'Sweden', 'Norway', 'Denmark', 'Switzerland'
        ];
        
        this.countryInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            const matchingSuggestions = suggestions.filter(country => 
                country.toLowerCase().includes(value) && value.length > 0
            );
            
            // You can extend this to show dropdown suggestions
            console.log('Suggestions:', matchingSuggestions);
        });
    }

    // Initialize additional features
    init() {
        this.addSearchSuggestions();
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            
            @keyframes pulse {
                0% { opacity: 0.7; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const finder = new UniversityFinder();
    finder.init();
    
    // Add some fun Easter eggs
    console.log('🎓 University Finder loaded successfully!');
    console.log('💡 Tip: Try searching for countries like "India", "United States", or "Canada"');
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('countryInput').focus();
        console.log('🔍 Quick search activated!');
    }
});

// Add performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
            console.log(`⚡ Page loaded in ${entry.loadEventEnd - entry.loadEventStart}ms`);
        }
    }
});

performanceObserver.observe({entryTypes: ['navigation']});