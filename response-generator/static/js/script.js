document.addEventListener('DOMContentLoaded', function() {
    let currentFormId = null;
    const formFieldsContainer = document.getElementById('form-fields');
    const previewFieldsContainer = document.getElementById('preview-fields');
    const addTextBtn = document.getElementById('add-text');
    const addNumberBtn = document.getElementById('add-number');
    const addRadioBtn = document.getElementById('add-radio');
    const addCheckboxBtn = document.getElementById('add-checkbox');
    const addDropdownBtn = document.getElementById('add-dropdown');
    const saveFormBtn = document.getElementById('save-form');
    const generateBtn = document.getElementById('generate-btn');
    const exportCsvBtn = document.getElementById('export-csv');
    const numResponsesInput = document.getElementById('num-responses');
    const responsesDisplay = document.getElementById('responses-display');
    const copyResponsesBtn = document.getElementById('copy-responses');
    
    // Field counter for unique IDs
    let fieldCounter = 0;
    
    // Add field buttons event listeners
    addTextBtn.addEventListener('click', () => addField('text'));
    addNumberBtn.addEventListener('click', () => addField('number'));
    addRadioBtn.addEventListener('click', () => addField('radio'));
    addCheckboxBtn.addEventListener('click', () => addField('checkbox'));
    addDropdownBtn.addEventListener('click', () => addField('dropdown'));
    
    saveFormBtn.addEventListener('click', saveForm);
    generateBtn.addEventListener('click', generateResponses);
    exportCsvBtn.addEventListener('click', exportToCsv);
    copyResponsesBtn.addEventListener('click', copyResponses);
    
    function addField(type) {
        const fieldId = `field-${fieldCounter++}`;
        let fieldHtml = '';
        
        // Common field elements
        fieldHtml += `
            <div class="field-item" id="${fieldId}">
                <button class="remove-field" onclick="removeField('${fieldId}')">×</button>
                <div class="form-group">
                    <label for="${fieldId}-label">Field Label:</label>
                    <input type="text" id="${fieldId}-label" placeholder="Enter field label">
                </div>
                <div class="form-group">
                    <label for="${fieldId}-required">Required:</label>
                    <input type="checkbox" id="${fieldId}-required">
                </div>
        `;
        
        // Type-specific elements
        switch(type) {
            case 'text':
                fieldHtml += `
                    <input type="hidden" id="${fieldId}-type" value="text">
                `;
                break;
                
            case 'number':
                fieldHtml += `
                    <input type="hidden" id="${fieldId}-type" value="number">
                `;
                break;
                
            case 'radio':
                fieldHtml += `
                    <input type="hidden" id="${fieldId}-type" value="radio">
                    <div class="form-group">
                        <label>Options:</label>
                        <div id="${fieldId}-options">
                            <div class="option-item">
                                <input type="text" placeholder="Option 1">
                                <button onclick="removeOption(this)">Remove</button>
                            </div>
                            <div class="option-item">
                                <input type="text" placeholder="Option 2">
                                <button onclick="removeOption(this)">Remove</button>
                            </div>
                        </div>
                        <button onclick="addOption('${fieldId}')">Add Option</button>
                    </div>
                `;
                break;
                
            case 'checkbox':
                fieldHtml += `
                    <input type="hidden" id="${fieldId}-type" value="checkbox">
                    <div class="form-group">
                        <label>Options:</label>
                        <div id="${fieldId}-options">
                            <div class="option-item">
                                <input type="text" placeholder="Option 1">
                                <button onclick="removeOption(this)">Remove</button>
                            </div>
                            <div class="option-item">
                                <input type="text" placeholder="Option 2">
                                <button onclick="removeOption(this)">Remove</button>
                            </div>
                        </div>
                        <button onclick="addOption('${fieldId}')">Add Option</button>
                    </div>
                `;
                break;
                
            case 'dropdown':
                fieldHtml += `
                    <input type="hidden" id="${fieldId}-type" value="dropdown">
                    <div class="form-group">
                        <label>Options:</label>
                        <div id="${fieldId}-options">
                            <div class="option-item">
                                <input type="text" placeholder="Option 1">
                                <button onclick="removeOption(this)">Remove</button>
                            </div>
                            <div class="option-item">
                                <input type="text" placeholder="Option 2">
                                <button onclick="removeOption(this)">Remove</button>
                            </div>
                        </div>
                        <button onclick="addOption('${fieldId}')">Add Option</button>
                    </div>
                `;
                break;
        }
        
        fieldHtml += `</div>`;
        formFieldsContainer.insertAdjacentHTML('beforeend', fieldHtml);
    }
    
    function saveForm() {
        const fields = [];
        const fieldItems = document.querySelectorAll('.field-item');
        
        fieldItems.forEach(fieldItem => {
            const fieldId = fieldItem.id;
            const type = document.getElementById(`${fieldId}-type`).value;
            const label = document.getElementById(`${fieldId}-label`).value;
            const required = document.getElementById(`${fieldId}-required`).checked;
            
            const fieldData = {
                type,
                label,
                required
            };
            
            if (type === 'radio' || type === 'checkbox' || type === 'dropdown') {
                const options = [];
                const optionInputs = document.querySelectorAll(`#${fieldId}-options input[type="text"]`);
                optionInputs.forEach(input => {
                    if (input.value.trim() !== '') {
                        options.push(input.value.trim());
                    }
                });
                
                fieldData.options = options;
            }
            
            fields.push(fieldData);
        });
        
        if (fields.length === 0) {
            alert('Please add at least one field to the form');
            return;
        }
        
        fetch('/create_form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fields })
        })
        .then(response => response.json())
        .then(data => {
            currentFormId = data.form_id;
            document.getElementById('current-form-id').textContent = currentFormId;
            updateFormPreview(fields);
            alert('Form saved successfully!');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error saving form');
        });
    }
    
    function updateFormPreview(fields) {
        previewFieldsContainer.innerHTML = '';
        
        fields.forEach(field => {
            let fieldHtml = '';
            const requiredMark = field.required ? '<span style="color: red;">*</span>' : '';
            
            fieldHtml += `
                <div class="form-group">
                    <label>${field.label} ${requiredMark}</label>
            `;
            
            switch(field.type) {
                case 'text':
                    fieldHtml += `<input type="text" placeholder="Text answer">`;
                    break;
                    
                case 'number':
                    fieldHtml += `<input type="number" placeholder="Number answer">`;
                    break;
                    
                case 'radio':
                    field.options.forEach(option => {
                        fieldHtml += `
                            <div>
                                <input type="radio" name="${field.label}" id="${field.label}-${option}">
                                <label for="${field.label}-${option}">${option}</label>
                            </div>
                        `;
                    });
                    break;
                    
                case 'checkbox':
                    field.options.forEach(option => {
                        fieldHtml += `
                            <div>
                                <input type="checkbox" name="${field.label}" id="${field.label}-${option}">
                                <label for="${field.label}-${option}">${option}</label>
                            </div>
                        `;
                    });
                    break;
                    
                case 'dropdown':
                    fieldHtml += `<select>`;
                    field.options.forEach(option => {
                        fieldHtml += `<option value="${option}">${option}</option>`;
                    });
                    fieldHtml += `</select>`;
                    break;
            }
            
            fieldHtml += `</div>`;
            previewFieldsContainer.insertAdjacentHTML('beforeend', fieldHtml);
        });
    }
    
    function generateResponses() {
        if (!currentFormId) {
            alert('Please create and save a form first');
            return;
        }
        
        const numResponses = numResponsesInput.value;
        
        if (!numResponses || numResponses < 1) {
            alert('Please enter a valid number of responses');
            return;
        }
        
        fetch('/generate_responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                form_id: currentFormId,
                num_responses: numResponses
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            
            displayResponses(data.responses);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error generating responses');
        });
    }
    
    function displayResponses(responses) {
        responsesDisplay.innerHTML = '';
        
        responses.forEach((response, index) => {
            const responseItem = document.createElement('div');
            responseItem.className = 'response-item';
            
            let responseText = `Response ${index + 1}:\n`;
            for (const [key, value] of Object.entries(response)) {
                responseText += `${key}: ${value}\n`;
            }
            
            responseItem.textContent = responseText;
            responsesDisplay.appendChild(responseItem);
        });
    }
    
    function exportToCsv() {
        if (!currentFormId) {
            alert('No form selected');
            return;
        }
        
        window.location.href = `/export_csv/${currentFormId}`;
    }
    
    function copyResponses() {
        if (responsesDisplay.textContent.trim() === '') {
            alert('No responses to copy');
            return;
        }
        
        navigator.clipboard.writeText(responsesDisplay.textContent)
            .then(() => alert('Responses copied to clipboard!'))
            .catch(err => alert('Failed to copy responses: ' + err));
    }
});

// Helper functions that need to be in global scope
function removeField(fieldId) {
    document.getElementById(fieldId).remove();
}

function addOption(fieldId) {
    const optionsContainer = document.getElementById(`${fieldId}-options`);
    const newOption = document.createElement('div');
    newOption.className = 'option-item';
    newOption.innerHTML = `
        <input type="text" placeholder="New option">
        <button onclick="removeOption(this)">Remove</button>
    `;
    optionsContainer.appendChild(newOption);
}

function removeOption(button) {
    button.parentElement.remove();
}