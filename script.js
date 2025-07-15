document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.getElementById('add-button');
    const micButton = document.getElementById('mic-button');
    const itemInput = document.getElementById('item-input');
    const listContainer = document.getElementById('list-container');
    const clearButton = document.getElementById('clear-button');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let recognitionTimeout;
    let isListening = false;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        function stopRecognition() {
            if (!isListening) return;
            console.log('Stopping recognition and cleaning up.');
            isListening = false;
            clearTimeout(recognitionTimeout);
            recognition.abort(); // Use abort() for a forceful stop
            micButton.classList.remove('listening');
        }

        micButton.addEventListener('click', () => {
            if (isListening) return;
            console.log('Microphone button clicked, starting recognition...');
            isListening = true;
            recognition.start();
            micButton.classList.add('listening');

            // Automatically stop recognition after 10 seconds
            recognitionTimeout = setTimeout(stopRecognition, 10000);
        });

        recognition.onresult = (event) => {
            console.log('Speech recognition result received:', event.results[0][0].transcript);
            let transcript = event.results[0][0].transcript.toLowerCase();
            const allKeywords = [].concat.apply([], Object.values(categories));
            const foundItems = [];

            // Prioritize multi-word items
            allKeywords.sort((a, b) => b.split(' ').length - a.split(' ').length);

            allKeywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                if (regex.test(transcript)) {
                    const formattedItem = keyword.charAt(0).toUpperCase() + keyword.slice(1);
                    foundItems.push(formattedItem);
                    transcript = transcript.replace(regex, '');
                }
            });

            // Add remaining words as individual items
            const remainingWords = transcript.trim().split(/\s+/).filter(w => w.length > 0);
            remainingWords.forEach(word => {
                const formattedWord = word.charAt(0).toUpperCase() + word.slice(1);
                foundItems.push(formattedWord);
            });

            if (foundItems.length > 0) {
                foundItems.forEach(item => addItemToList(item));
            } else if (event.results[0][0].transcript.trim().length > 0) {
                // Fallback for single, unrecognized item
                const formattedTranscript = event.results[0][0].transcript.charAt(0).toUpperCase() + event.results[0][0].transcript.slice(1);
                addItemToList(formattedTranscript);
            }
            saveList();

            itemInput.value = '';
            stopRecognition(); // Stop after processing result
        };



        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                alert('Microphone access was denied. Please allow microphone access in your browser settings.');
            }
            stopRecognition(); // Stop on error
        };



    } else {
        micButton.style.display = 'none';
        console.log('Speech recognition not supported in this browser.');
    }

    const categories = {
        'fresh-produce': ['apple', 'banana', 'lettuce', 'spinach', 'avocado', 'broccoli', 'carrots', 'onions', 'garlic', 'peppers', 'tomatoes', 'potatoes', 'salad', 'chicken', 'beef', 'pork', 'sausage', 'bacon', 'fish', 'salmon', 'ground turkey', 'bread', 'bagels', 'croissants', 'muffins', 'cake'],
        'dairy-refrigerated-items': ['milk', 'cheese', 'yogurt', 'butter', 'cream cheese', 'sour cream', 'eggs'],
        'pantry-dry-goods': ['cereal', 'oatmeal', 'granola', 'pancake mix', 'waffles', 'chips', 'crackers', 'pretzels', 'nuts', 'popcorn', 'cookies', 'chocolate', 'bars', 'ketchup', 'mustard', 'mayo', 'relish', 'hot sauce', 'soy sauce', 'salsa', 'pasta', 'rice', 'flour', 'sugar', 'oil', 'spices', 'vinegar', 'beans', 'soup', 'tuna', 'canned tomatoes', 'canned corn'],
        'frozen-foods': ['pizza', 'ice cream', 'burrito', 'dumplings', 'gnocchi', 'veggie burger'],
        'beverages-miscellaneous': ['juice', 'soda', 'coffee', 'tea', 'wine', 'water', 'paper towels', 'soap', 'cleaner', 'trash bags', 'sponges']
    };

    function getCategory(item) {
        const lowerCaseItem = item.toLowerCase();
        for (const category in categories) {
            if (categories[category].some(keyword => lowerCaseItem.includes(keyword))) {
                return category;
            }
        }
        return 'fresh-produce'; // Default category
    }

    function saveList() {
        const lists = {};
        document.querySelectorAll('#list-container ul').forEach(ul => {
            const category = ul.id.replace('-list', '');
            lists[category] = [];
            ul.querySelectorAll('li').forEach(li => {
                lists[category].push({
                    text: li.querySelector('.item-text').textContent,
                    checked: li.classList.contains('checked')
                });
            });
        });
        localStorage.setItem('shoppingList', JSON.stringify(lists));
    }

    function loadList() {
        const savedLists = JSON.parse(localStorage.getItem('shoppingList'));
        if (savedLists) {
            // Clear all lists before loading
            document.querySelectorAll('#list-container ul').forEach(ul => {
                ul.innerHTML = '';
            });

            for (const category in savedLists) {
                savedLists[category].forEach(item => {
                    addItemToList(item.text, item.checked, false); // Don't save while loading
                });
            }
        }
    }

    function addItemToList(itemName, isChecked = false, shouldSave = true) {
        if (itemName.trim() === '') return;

        let currentCategory = getCategory(itemName);
        const listId = `${currentCategory}-list`;
        const list = document.getElementById(listId) || document.getElementById('fresh-produce-list');

        const listItem = document.createElement('li');
        if (isChecked) {
            listItem.classList.add('checked');
        }

        const itemText = document.createElement('span');
        itemText.className = 'item-text';
        itemText.textContent = itemName;

        const categorySelector = document.createElement('select');
        categorySelector.className = 'category-selector';
        for (const categoryName in categories) {
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = categoryName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (categoryName === currentCategory) {
                option.selected = true;
            }
            categorySelector.appendChild(option);
        }

        categorySelector.addEventListener('change', (e) => {
            const newCategory = e.target.value;
            const newCategoryList = document.getElementById(`${newCategory}-list`);
            if (newCategoryList) {
                newCategoryList.appendChild(listItem);
                saveList();
            }
        });

        categorySelector.addEventListener('click', (e) => e.stopPropagation());

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = '&times;';

        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            listItem.remove();
            saveList();
        });

        listItem.addEventListener('click', () => {
            listItem.classList.toggle('checked');
            saveList();
        });

        listItem.appendChild(itemText);
        listItem.appendChild(categorySelector);
        listItem.appendChild(deleteButton);
        list.appendChild(listItem);

        if (shouldSave) {
            saveList();
        }
    }

    addButton.addEventListener('click', () => {
        addItemToList(itemInput.value);
        itemInput.value = '';
        itemInput.focus();
        saveList();
    });

    itemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addButton.click();
        }
    });

    function clearList() {
        document.querySelectorAll('#list-container ul').forEach(ul => {
            ul.innerHTML = '';
        });
        localStorage.removeItem('shoppingList');
    }

    clearButton.addEventListener('click', clearList);

    loadList();
});
