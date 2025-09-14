// Function to fetch and display CSV data as a table
async function loadCSVData(url, tableId) {
    try {
        const response = await fetch(url);
        const csvData = await response.text();
        const rows = csvData.split('\n');

        const table = document.getElementById(tableId);
        table.innerHTML = '';

        if (rows.length === 0) return;

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        rows[0].split(',').forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);


        const tbody = document.createElement('tbody');
        for (let i = 1; i < Math.min(rows.length, 100); i++) {
            if (!rows[i]) continue;
            const row = document.createElement('tr');
            rows[i].split(',').forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                row.appendChild(td);
            });
            tbody.appendChild(row);
        }
        table.appendChild(tbody);

        const rowCount = rows.length - 1;
        const infoDiv = document.createElement('div');
        infoDiv.className = 'text-sm text-gray-500 mt-2';
        infoDiv.textContent = `${rowCount} total rows (showing first ${Math.min(rowCount, 100)})`;
        table.parentNode.insertBefore(infoDiv, table.nextSibling);

    } catch (error) {
        console.error('Error loading CSV:', error);
        document.getElementById(tableId).innerHTML = '<tr><td>Error loading data. Please try again later.</td></tr>';
    }
}

// Function to train models by calling the Python script
async function trainModels() {
    const trainButton = document.getElementById('trainButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const statusMessage = document.getElementById('statusMessage');

    trainButton.disabled = true;
    loadingIndicator.classList.remove('hidden');
    statusMessage.style.display = 'none';

    try {
        const response = await fetch('/train_models', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (result.status === 'success') {
            statusMessage.textContent = result.message || 'Models trained successfully!';
            statusMessage.className = 'status-message success';
        } else {
            statusMessage.textContent = result.message || 'Model training failed!';
            statusMessage.className = 'status-message error';
        }

        statusMessage.style.display = 'block';

    } catch (error) {
        console.error('Error training models:', error);
        statusMessage.textContent = 'Error training models: ' + error.message;
        statusMessage.className = 'status-message error';
        statusMessage.style.display = 'block';
    } finally {
        trainButton.disabled = false;
        loadingIndicator.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCSVData('agri_crop_price_augmented_improved.csv', 'trainingDataTable');
    loadCSVData('actual_market_data_log.csv', 'actualDataTable');
    document.getElementById('trainButton').addEventListener('click', trainModels);
});
