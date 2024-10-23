document.addEventListener('DOMContentLoaded', () => {
  const expenseName = document.getElementById('expense-name');
  const expenseAmount = document.getElementById('expense-amount');
  const expenseDate = document.getElementById('expense-date');
  const expenseCategory = document.getElementById('expense-category');
  const addExpenseButton = document.getElementById('add-expense');
  const expenseList = document.getElementById('expense-list');
  const totalAmountDisplay = document.getElementById('total-amount');
  const filterCategory = document.getElementById('filter-category'); // Filter dropdown

  let totalAmount = 0;
  let currentEditingId = null;
  let allExpenses = []; // Store all expenses for filtering and updates

  // Fetch expenses from JSON Server and render them
  function fetchExpenses() {
    fetch('http://localhost:3003/expenses')
      .then(response => response.json())
      .then(expenses => {
        allExpenses = expenses; // Store all expenses for filtering and updating
        renderExpenses(expenses);
      })
      .catch(error => console.error('Error fetching expenses:', error));
  }

  // Function to render expenses
  function renderExpenses(expenses) {
    expenseList.innerHTML = ''; // Clear the table first
    totalAmount = 0; // Reset total amount before recalculating

    expenses.forEach(expense => {
      addExpenseToTable(expense.name, expense.amount, expense.date, expense.category, expense.id, false);
      totalAmount += expense.amount; // Add to totalAmount here
    });

    updateTotal(); // Update the displayed total
  }

  // Function to filter expenses by category
  function filterExpenses() {
    const selectedCategory = filterCategory.value;
    let filteredExpenses = allExpenses;

    if (selectedCategory !== 'all') {
      filteredExpenses = allExpenses.filter(expense => expense.category === selectedCategory);
    }

    renderExpenses(filteredExpenses);
  }

  // Add event listener to filter dropdown
  filterCategory.addEventListener('change', filterExpenses);

  // Function to add a new expense (POST to JSON Server)
  function addExpense(name, amount, date, category) {
    const expense = { name, amount, date, category };

    fetch('http://localhost:3003/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expense),
    })
      .then(response => response.json())
      .then(newExpense => {
        allExpenses.push(newExpense); // Add new expense to allExpenses
        renderExpenses(allExpenses); // Re-render with new expense
      })
      .catch(error => console.error('Error adding expense:', error));
  }

  // Function to load an existing expense into the form for editing
  function loadExpenseToForm(name, amount, date, category, id) {
    
    expenseName.value = name;
    expenseAmount.value = amount;
    expenseDate.value = date;
    expenseCategory.value = category;

    currentEditingId = id; // Set the current editing ID

    // Change "Add Expense" button text to "Update Expense"
    addExpenseButton.textContent = "Update Expense";
    addExpenseButton.disabled = false;
  }

  // Function to update an existing expense (PUT request to JSON Server)
  function updateExpense(id, name, amount, date, category) {
    const updatedExpense = { name, amount, date, category };

    fetch(`http://localhost:3003/expenses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedExpense),
    })
      .then(response => response.json())
      .then(updatedExpense => {
        // Update the local data (allExpenses) to reflect the changes
        const index = allExpenses.findIndex(expense => expense.id === id);
        if (index !== -1) {
          allExpenses[index] = updatedExpense; // Update the expense in the local array
        }

        // Re-render the expenses
        renderExpenses(allExpenses);

        // Clear form and reset button
        clearForm();
      })
      .catch(error => console.error('Error updating expense:', error));
  }

  // Function to clear the form and reset the button after update
  function clearForm() {
    expenseName.value = '';
    expenseAmount.value = '';
    expenseDate.value = '';
    expenseCategory.value = '';

    // Reset the button text to "Add Expense"
    addExpenseButton.textContent = "Add Expense";
    currentEditingId = null; // Reset the editing ID
  }

  // Function to add the expense to the table
  function addExpenseToTable(name, amount, date, category, id, updateStorage = true) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-category', category);
    tr.setAttribute('data-id', id);

    tr.innerHTML = `
      <td>${name}</td>
      <td>Ksh ${amount.toFixed(2)}</td>
      <td>${date}</td>
      <td>${category}</td>
      <td>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </td>
    `;

    // Delete button functionality
    tr.querySelector('.delete-btn').addEventListener('click', () => {
      deleteExpense(id);
      totalAmount -= amount; // Adjust the total when an expense is deleted
      updateTotal();
      tr.remove();
    });

    // Edit button functionality
    tr.querySelector('.edit-btn').addEventListener('click', () => {
      loadExpenseToForm(name, amount, date, category, id);
    });

    expenseList.appendChild(tr);

    if (updateStorage) {
      totalAmount += amount;
      updateTotal();
    }
  }

  // Function to delete an expense (DELETE request to JSON Server)
  function deleteExpense(id) {
    fetch(`http://localhost:3003/expenses/${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        // Remove the expense from the local allExpenses array
        allExpenses = allExpenses.filter(expense => expense.id !== id);

        // Re-render the expenses
        renderExpenses(allExpenses);
      })
      .catch(error => console.error('Error deleting expense:', error));
  }

  // Function to update total amount display
  function updateTotal() {
    totalAmountDisplay.textContent = `Ksh ${totalAmount.toFixed(2)}`;
  }

  // Event listener for adding or updating an expense
  addExpenseButton.addEventListener('click', () => {
    const name = expenseName.value;
    const amount = parseFloat(expenseAmount.value);
    const date = expenseDate.value;
    const category = expenseCategory.value;

    if (name && !isNaN(amount) && amount > 0 && date) {
      if (currentEditingId) {
        // Update existing expense
        updateExpense(currentEditingId, name, amount, date, category);
      } else {
        // Add new expense
        addExpense(name, amount, date, category);
      }
    } else {
      alert('Please enter a valid name, amount, and date.');
    }
  });

  // Load and render expenses from JSON Server when the page loads
  fetchExpenses();
});
