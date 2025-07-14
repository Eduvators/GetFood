document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.getElementById('add-button');
    const micButton = document.getElementById('mic-button');
    const itemInput = document.getElementById('item-input');
    const listContainer = document.getElementById('list-container');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        micButton.addEventListener('click', () => {
            recognition.start();
            micButton.classList.add('listening');
        });

        recognition.onresult = (event) => {
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

            if (foundItems.length > 0 || event.results[0][0].transcript.trim().length > 0) {
                saveList();
            }

            itemInput.value = '';
        };

        recognition.onspeechend = () => {
            recognition.stop();
            micButton.classList.remove('listening');
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            micButton.classList.remove('listening');
        };

    } else {
        micButton.style.display = 'none';
        console.log('Speech recognition not supported in this browser.');
    }

    const categories = {
        produce: ['apple', 'banana', 'lettuce', 'spinach', 'avocado', 'broccoli', 'carrots', 'onions', 'garlic', 'peppers', 'tomatoes', 'potatoes', 'salad'],
        breakfast: ['cereal', 'oatmeal', 'granola', 'eggs', 'pancake mix', 'waffles'],
        frozen: ['pizza', 'ice cream', 'burrito', 'dumplings', 'gnocchi', 'veggie burger'],
        snacks: ['chips', 'crackers', 'pretzels', 'nuts', 'popcorn', 'cookies', 'chocolate', 'bars'],
        dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream cheese', 'sour cream'],
        meat: ['chicken', 'beef', 'pork', 'sausage', 'bacon', 'fish', 'salmon', 'ground turkey'],
        bakery: ['bread', 'bagels', 'croissants', 'muffins', 'cake'],
        condiments: ['ketchup', 'mustard', 'mayo', 'relish', 'hot sauce', 'soy sauce', 'salsa'],
        'pantry-staples': ['pasta', 'rice', 'flour', 'sugar', 'oil', 'spices', 'vinegar'],
        beverages: ['juice', 'soda', 'coffee', 'tea', 'wine', 'water'],
        household: ['paper towels', 'soap', 'cleaner', 'trash bags', 'sponges'],
        'canned-goods': ['beans', 'soup', 'tuna', 'canned tomatoes', 'canned corn']
    };

    function getCategory(item) {
        const lowerCaseItem = item.toLowerCase();
        for (const category in categories) {
            if (categories[category].some(keyword => lowerCaseItem.includes(keyword))) {
                return category;
            }
        }
        return 'produce'; // Default category
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
            for (const category in savedLists) {
                const listId = `${category}-list`;
                const ul = document.getElementById(listId);
                if (ul) {
                    // Clear existing items before loading
                    ul.innerHTML = '';
                    savedLists[category].forEach(item => {
                        addItemToList(item.text, item.checked);
                    });
                }
            }
        }
    }

    function addItemToList(itemName, isChecked = false) {
        if (itemName.trim() === '') return;

        const category = getCategory(itemName);
        const listId = `${category}-list`;
        const list = document.getElementById(listId) || document.getElementById('produce-list');

        const listItem = document.createElement('li');
        if (isChecked) {
            listItem.classList.add('checked');
        }

        const itemText = document.createElement('span');
        itemText.className = 'item-text';
        itemText.textContent = itemName;

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
        listItem.appendChild(deleteButton);
        list.appendChild(listItem);
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

    loadList();
});
