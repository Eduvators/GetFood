document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.getElementById('add-button');
    const itemInput = document.getElementById('item-input');
    const listContainer = document.getElementById('list-container');
    const clearButton = document.getElementById('clear-button');

    const categories = {
        'fresh-produce': ['apple', 'banana', 'lettuce', 'spinach', 'avocado', 'broccoli', 'carrots', 'onions', 'garlic', 'peppers', 'tomatoes', 'potatoes', 'salad'],
        'bakery': ['bread', 'bagels', 'croissants', 'muffins', 'cake'],
        'meat': ['chicken', 'beef', 'pork', 'sausage', 'bacon', 'fish', 'salmon', 'ground turkey'],
        'dairy-refrigerated-items': ['milk', 'cheese', 'yogurt', 'butter', 'cream cheese', 'sour cream', 'eggs'],
        'pantry-dry-goods': ['cereal', 'oatmeal', 'granola', 'pancake mix', 'waffles', 'chips', 'crackers', 'pretzels', 'nuts', 'popcorn', 'cookies', 'chocolate', 'bars', 'ketchup', 'mustard', 'mayo', 'relish', 'hot sauce', 'soy sauce', 'salsa', 'pasta', 'rice', 'flour', 'sugar', 'oil', 'spices', 'vinegar', 'beans', 'soup', 'tuna', 'canned tomatoes', 'canned corn'],
        'frozen-foods': ['pizza', 'ice cream', 'burrito', 'dumplings', 'gnocchi', 'veggie burger'],
        'beverages': ['juice', 'soda', 'coffee', 'tea', 'wine', 'water'],
        'other': ['paper towels', 'soap', 'cleaner', 'trash bags', 'sponges']
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
