const BASE_URL = 'https://hw18-backend-c3a6eweff7hahfb7.canadacentral-01.azurewebsites.net/computerstore';
const API_URL = `${BASE_URL}/customers`;
let currentCustomers = [];

function switchTab(tabId, event) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event) {
        event.target.classList.add('active');
    } else {
        document.querySelector(`.tab-btn[onclick*="${tabId}"]`).classList.add('active');
    }

    document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(tabId + '-section').classList.add('active');
    if (tabId === 'view') {
        fetchCustomers();
    }
}

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
};

async function fetchTotalMoney() {
    try {
        const response = await fetch(`${BASE_URL}/customers/totalMoneySpent`);
        if (!response.ok) throw new Error('Failed to fetch total');
        
        const data = await response.json();
        const formattedTotal = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(data.totalEarned);
        
        document.getElementById('total-display').textContent = formattedTotal;
    } catch (error) {
        console.error('Error fetching total money spent:', error);
    }
}

async function fetchCustomers() {
    const tableBody = document.getElementById('tableBody');

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        currentCustomers = data;

        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="empty-state">No customers found. Add some!</td></tr>`;
        } else {
            data.forEach(customer => {
                const tr = document.createElement('tr');
                const spent = parseFloat(customer.moneySpent) || 0;

                tr.innerHTML = `
                    <td>${customer.id}</td>
                    <td>${customer.name}</td>
                    <td>${customer.age}</td>
                    <td>${formatCurrency(spent)}</td>
                    <td>
                        <button class="action-btn edit-btn" onclick="editCustomer('${customer._id}')">✏️ Edit</button>
                        <button class="action-btn delete-btn" onclick="openDeleteModal('${customer._id}')">🗑️ Delete</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        }

    } catch (error) {
        console.error('Error fetching customers:', error);
        tableBody.innerHTML = `<tr><td colspan="5" class="empty-state" style="color: var(--error-color);">Error loading data. Is the Azure backend online?</td></tr>`;
    }
}

function showAlert(message, isError = false, elementId = 'formAlert') {
    const alertBox = document.getElementById(elementId);
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = 'alert show ' + (isError ? 'alert-error' : 'alert-success');

    setTimeout(() => {
        alertBox.classList.remove('show');
    }, 3000);
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.textContent = 'Registering...';
    submitBtn.disabled = true;

    const customerData = {
        id: document.getElementById('id').value,
        name: document.getElementById('name').value,
        age: document.getElementById('age').value,
        moneySpent: document.getElementById('money').value
    };

    try {
        const response = await fetch(`${BASE_URL}/customer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerData)
        });

        if (!response.ok) {
            throw new Error('Failed to register customer');
        }

        showAlert('Customer registered successfully!');
        document.getElementById('addForm').reset();
        fetchTotalMoney();

    } catch (error) {
        console.error('Error adding customer:', error);
        showAlert('Error adding customer. Please try again.', true);
    } finally {
        submitBtn.textContent = 'Register Customer';
        submitBtn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchCustomers();
    fetchTotalMoney();
});

let customerToDelete = null;

const addForm = document.getElementById('addForm');
if (addForm) {
    addForm.addEventListener('submit', handleFormSubmit);
}

function editCustomer(id) {
    const customer = currentCustomers.find(c => c._id === id);
    if (!customer) return;

    document.getElementById('edit-_id').value = customer._id;
    document.getElementById('edit-id').value = customer.id;
    document.getElementById('edit-name').value = customer.name;
    document.getElementById('edit-age').value = customer.age;
    document.getElementById('edit-money').value = customer.moneySpent;

    document.getElementById('editModal').classList.add('show');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
}

async function handleEditSubmit(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    const updatedData = {
        _id: document.getElementById('edit-_id').value,
        id: document.getElementById('edit-id').value,
        name: document.getElementById('edit-name').value,
        age: document.getElementById('edit-age').value,
        moneySpent: document.getElementById('edit-money').value
    };

    try {
        const response = await fetch(`${BASE_URL}/customer/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            throw new Error('Failed to update customer');
        }

        closeEditModal();
        fetchCustomers();
        fetchTotalMoney();
        showAlert('Customer updated successfully!', false, 'viewAlert');

    } catch (error) {
        console.error('Error updating customer:', error);
        showAlert('Error updating customer. Please try again.', true, 'editAlert');
    } finally {
        submitBtn.textContent = 'Save Changes';
        submitBtn.disabled = false;
    }
}

const editForm = document.getElementById('editForm');
if (editForm) {
    editForm.addEventListener('submit', handleEditSubmit);
}

function openDeleteModal(id) {
    customerToDelete = id;
    document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
    customerToDelete = null;
    document.getElementById('deleteModal').classList.remove('show');
}

async function confirmDelete() {
    if (!customerToDelete) return;
    
    try {
        const response = await fetch(`${BASE_URL}/customer/${customerToDelete}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete customer');
        }

        closeDeleteModal();
        fetchCustomers();
        fetchTotalMoney();
        showAlert('Customer deleted successfully!', false, 'viewAlert');
    } catch (error) {
        console.error('Error deleting customer:', error);
        closeDeleteModal();
        showAlert('Error deleting customer. Please try again.', true, 'viewAlert');
    }
}