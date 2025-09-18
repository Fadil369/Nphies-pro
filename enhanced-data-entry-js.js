// Enhanced Data Entry JavaScript

let currentStep = 1;
let formData = {};

// Step Navigation
function nextStep(step) {
    if (validateCurrentStep()) {
        saveCurrentStepData();
        showStep(step);
        updateProgress();
    }
}

function prevStep(step) {
    saveCurrentStepData();
    showStep(step);
    updateProgress();
}

function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    
    // Show current step
    document.getElementById(`step-${step}`).classList.add('active');
    document.querySelector(`[data-step="${step}"]`).classList.add('active');
    
    currentStep = step;
    
    // Update review section if on step 4
    if (step === 4) {
        updateReviewSections();
    }
}

function updateProgress() {
    const progress = (currentStep / 4) * 100;
    document.getElementById('formProgress').style.width = `${progress}%`;
    
    // Mark completed steps
    for (let i = 1; i < currentStep; i++) {
        document.querySelector(`[data-step="${i}"]`).classList.add('completed');
    }
}

// Form Validation
function validateCurrentStep() {
    const currentStepElement = document.getElementById(`step-${currentStep}`);
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#dc3545';
            isValid = false;
            
            // Show error message
            showFieldError(field, 'This field is required');
        } else {
            field.style.borderColor = '#28a745';
            hideFieldError(field);
        }
    });
    
    // Additional validation based on step
    switch (currentStep) {
        case 1:
            isValid = validatePatientInfo() && isValid;
            break;
        case 2:
            isValid = validateMedicalInfo() && isValid;
            break;
        case 3:
            isValid = validateInsuranceInfo() && isValid;
            break;
    }
    
    if (!isValid) {
        showNotification('Please fill in all required fields correctly', 'error');
    }
    
    return isValid;
}

function validatePatientInfo() {
    const nationalId = document.getElementById('nationalId').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    
    // Validate National ID (10 digits)
    if (nationalId && !/^\d{10}$/.test(nationalId)) {
        showFieldError(document.getElementById('nationalId'), 'National ID must be 10 digits');
        return false;
    }
    
    // Validate Saudi phone number
    if (phone && !/^\+966[0-9]{9}$/.test(phone)) {
        showFieldError(document.getElementById('phone'), 'Enter valid Saudi phone number (+966XXXXXXXXX)');
        return false;
    }
    
    // Validate email
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFieldError(document.getElementById('email'), 'Enter valid email address');
        return false;
    }
    
    return true;
}

function validateMedicalInfo() {
    const diagnosisCode = document.getElementById('diagnosisCode').value;
    const serviceDate = document.getElementById('serviceDate').value;
    
    // Validate ICD-10 code format
    if (diagnosisCode && !/^[A-Z]\d{2}(\.\d{1,2})?$/.test(diagnosisCode)) {
        showFieldError(document.getElementById('diagnosisCode'), 'Enter valid ICD-10 code (e.g., A01.1)');
        return false;
    }
    
    // Validate service date is not in future
    if (serviceDate && new Date(serviceDate) > new Date()) {
        showFieldError(document.getElementById('serviceDate'), 'Service date cannot be in the future');
        return false;
    }
    
    return true;
}

function validateInsuranceInfo() {
    const policyNumber = document.getElementById('policyNumber').value;
    const policyStartDate = document.getElementById('policyStartDate').value;
    const policyEndDate = document.getElementById('policyEndDate').value;
    
    // Validate policy dates
    if (policyStartDate && policyEndDate && new Date(policyStartDate) >= new Date(policyEndDate)) {
        showFieldError(document.getElementById('policyEndDate'), 'End date must be after start date');
        return false;
    }
    
    return true;
}

// Field Error Handling
function showFieldError(field, message) {
    hideFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.cssText = 'color: #dc3545; font-size: 0.8rem; margin-top: 0.25rem;';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function hideFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Data Management
function saveCurrentStepData() {
    const currentStepElement = document.getElementById(`step-${currentStep}`);
    const inputs = currentStepElement.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            formData[input.id] = input.checked;
        } else {
            formData[input.id] = input.value;
        }
    });
    
    // Save procedures data
    if (currentStep === 2) {
        formData.procedures = getProceduresData();
    }
}

function getProceduresData() {
    const procedures = [];
    const procedureRows = document.querySelectorAll('.procedure-row');
    
    procedureRows.forEach(row => {
        const code = row.querySelector('.procedure-code').value;
        const desc = row.querySelector('.procedure-desc').value;
        const qty = row.querySelector('.procedure-qty').value;
        const amount = row.querySelector('.procedure-amount').value;
        
        if (code || desc) {
            procedures.push({ code, desc, qty, amount });
        }
    });
    
    return procedures;
}

// Procedures Management
function addProcedure() {
    const container = document.getElementById('proceduresContainer');
    const newRow = document.createElement('div');
    newRow.className = 'procedure-row';
    newRow.innerHTML = `
        <input type="text" placeholder="CPT Code" class="procedure-code">
        <input type="text" placeholder="Procedure description" class="procedure-desc">
        <input type="number" placeholder="Quantity" class="procedure-qty" value="1" min="1">
        <input type="number" placeholder="Amount (SAR)" class="procedure-amount" step="0.01">
        <button type="button" class="btn btn-danger btn-sm" onclick="removeProcedure(this)">×</button>
    `;
    container.appendChild(newRow);
}

function removeProcedure(button) {
    button.parentElement.remove();
}

// Search Functions
function searchDiagnosis() {
    const searchTerm = document.getElementById('diagnosisCode').value;
    
    // Mock diagnosis search
    const diagnoses = [
        { code: 'A01.1', desc: 'Paratyphoid fever A' },
        { code: 'B01.9', desc: 'Varicella without complication' },
        { code: 'C78.1', desc: 'Secondary malignant neoplasm of mediastinum' },
        { code: 'D50.9', desc: 'Iron deficiency anaemia, unspecified' },
        { code: 'E11.9', desc: 'Type 2 diabetes mellitus without complications' }
    ];
    
    const matches = diagnoses.filter(d => 
        d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.desc.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (matches.length > 0) {
        showDiagnosisResults(matches);
    } else {
        showNotification('No matching diagnoses found', 'warning');
    }
}

function showDiagnosisResults(matches) {
    // Create modal or dropdown with results
    const modal = document.createElement('div');
    modal.className = 'diagnosis-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); z-index: 1000;
        display: flex; align-items: center; justify-content: center;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white; padding: 2rem; border-radius: 12px;
        max-width: 500px; width: 90%; max-height: 400px; overflow-y: auto;
    `;
    
    content.innerHTML = `
        <h3>Select Diagnosis</h3>
        <div class="diagnosis-list">
            ${matches.map(d => `
                <div class="diagnosis-item" onclick="selectDiagnosis('${d.code}', '${d.desc}')" 
                     style="padding: 0.75rem; border: 1px solid #dee2e6; margin-bottom: 0.5rem; cursor: pointer; border-radius: 6px;">
                    <strong>${d.code}</strong> - ${d.desc}
                </div>
            `).join('')}
        </div>
        <button onclick="closeDiagnosisModal()" class="btn btn-secondary" style="margin-top: 1rem;">Close</button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    window.currentDiagnosisModal = modal;
}

function selectDiagnosis(code, desc) {
    document.getElementById('diagnosisCode').value = code;
    document.getElementById('diagnosisDesc').value = desc;
    closeDiagnosisModal();
}

function closeDiagnosisModal() {
    if (window.currentDiagnosisModal) {
        document.body.removeChild(window.currentDiagnosisModal);
        window.currentDiagnosisModal = null;
    }
}

// Insurance Functions
function updatePolicyInfo() {
    const company = document.getElementById('insuranceCompany').value;
    // Auto-populate some fields based on insurance company
    // This would typically call an API
}

function verifyPolicy() {
    const policyNumber = document.getElementById('policyNumber').value;
    const company = document.getElementById('insuranceCompany').value;
    
    if (!policyNumber || !company) {
        showNotification('Please select insurance company and enter policy number', 'warning');
        return;
    }
    
    // Mock policy verification
    showNotification('Policy verified successfully ✓', 'success');
    
    // Auto-populate verified data
    document.getElementById('memberId').value = 'MEM' + Math.random().toString().substr(2, 6);
    document.getElementById('coverageType').value = 'Comprehensive';
    document.getElementById('policyStartDate').value = '2024-01-01';
    document.getElementById('policyEndDate').value = '2024-12-31';
}

// Review Functions
function updateReviewSections() {
    updateReviewPatient();
    updateReviewMedical();
    updateReviewInsurance();
    updateReviewFinancial();
}

function updateReviewPatient() {
    const content = document.getElementById('reviewPatient');
    content.innerHTML = `
        <div class="review-item">
            <span class="review-label">Name:</span>
            <span class="review-value">${formData.patientName || 'Not provided'}</span>
        </div>
        <div class="review-item">
            <span class="review-label">National ID:</span>
            <span class="review-value">${formData.nationalId || 'Not provided'}</span>
        </div>
        <div class="review-item">
            <span class="review-label">Date of Birth:</span>
            <span class="review-value">${formData.dateOfBirth || 'Not provided'}</span>
        </div>
        <div class="review-item">
            <span class="review-label">Gender:</span>
            <span class="review-value">${formData.gender || 'Not provided'}</span>
        </div>
        <div class="review-item">
            <span class="review-label">Phone:</span>
            <span class="review-value">${formData.phone || 'Not provided'}</span>
        </div>
        <div class="review-item">
            <span class="review-label">City:</span>
            <span class="review-value">${formData.city || 'Not provided'}</span>
        </div>
    `;
}

function updateReviewMedical() {
    const content = document.getElementById('reviewMedical');
    const procedures = formData.procedures || [];
    
    content.innerHTML = `
        <div class="review-item">
            <span class="review-label">Primary Diagnosis:</span>
            <span class="review-value">${formData.diagnosisCode || 'Not provided'} - ${formData.diagnosisDesc || ''}</span>
        </div>
        <div class="review-item">
            <span class="review-label">Provider:</span>
            <span class="review-value">${formData.provider || 'Not provided'}</span>
        </div>
        <div class="review-item">
            <span class="review-label">Department:</span>
            <span class="review-value">${formData.department || 'Not provided'}</span>
        </div>
        <div class="review-item">
            <span class="review-label">Service Date:</span>
            <span class="review-value">${formData.serviceDate || 'Not provided'}</span>
        </div>
        <div class="review-item">
            <span class="review-label">Visit Type:</span>
            <span class="review-value">${formData.visitType || 'Not provided'}</span>
        </div>
        <div class="review-item">
            <span class="review-label">Procedures:</span>
            <span class="review-value">${procedures.length} procedure(s)</span>
        </div>
    `;
}

function updateReviewInsurance() {
    const content = document.getElementById('reviewInsurance');
    content.innerHTML = `
        <div class="review-item">
            <span class="review-label">Insurance Company:</span>
            <span class="review-value">${formData.insuranceCompany || 'Not provided'}</span>
        </div>
        <div class="review-item">
            <span class="review-label">Policy Number:</span>
            <span class="review-value">${formData.policyNumber || 'Not provided'}</span>
        </div>
        <div class="review-item">
            <span class="review-label">Member ID:</span>
            <span class="review-value">${formData.memberId || 'Not provided'}</span>
        </div>
        <div class="review-item">
            <span class="review-label">Coverage Type:</span>
            <span class="review-value">${formData.coverageType || 'Not provided'}</span>
        </div>
        <div class="review-item">
            <span class="review-label">Policy Period:</span>
            <span class="review-value">${formData.policyStartDate || 'N/A'} to ${formData.policyEndDate || 'N/A'}</span>
        </div>
    `;
}

function updateReviewFinancial() {
    const content = document.getElementById('reviewFinancial');
    const procedures = formData.procedures || [];
    const totalAmount = procedures.reduce((sum, proc) => sum + (parseFloat(proc.amount) || 0), 0);
    const copay = parseFloat(formData.copayAmount) || 0;
    const deductible = parseFloat(formData.deductible) || 0;
    
    content.innerHTML = `
        <div class="review-item">
            <span class="review-label">Total Claim Amount:</span>
            <span class="review-value">${totalAmount.toFixed(2)} SAR</span>
        </div>
        <div class="review-item">
            <span class="review-label">Copay:</span>
            <span class="review-value">${copay.toFixed(2)} SAR</span>
        </div>
        <div class="review-item">
            <span class="review-label">Deductible:</span>
            <span class="review-value">${deductible.toFixed(2)} SAR</span>
        </div>
        <div class="review-item">
            <span class="review-label">Expected Coverage:</span>
            <span class="review-value">${(totalAmount - copay - deductible).toFixed(2)} SAR</span>
        </div>
    `;
}

// Utility Functions
function saveDraft() {
    saveCurrentStepData();
    localStorage.setItem('claimDraft', JSON.stringify(formData));
    showNotification('Draft saved successfully', 'success');
}

function loadDraft() {
    const draft = localStorage.getItem('claimDraft');
    if (draft) {
        formData = JSON.parse(draft);
        populateFormFromData();
        showNotification('Draft loaded successfully', 'success');
    }
}

function populateFormFromData() {
    Object.keys(formData).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = formData[key];
            } else {
                element.value = formData[key];
            }
        }
    });
}

function validateClaim() {
    saveCurrentStepData();
    
    // Comprehensive validation
    const requiredFields = ['patientName', 'nationalId', 'dateOfBirth', 'gender', 'diagnosisCode', 'provider', 'serviceDate', 'insuranceCompany', 'policyNumber'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
        showNotification(`Missing required fields: ${missingFields.join(', ')}`, 'error');
        return false;
    }
    
    showNotification('Claim validation successful ✓', 'success');
    return true;
}

function submitClaim() {
    if (!validateClaim()) return;
    
    const confirmAccuracy = document.getElementById('confirmAccuracy').checked;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    if (!confirmAccuracy || !agreeTerms) {
        showNotification('Please confirm accuracy and agree to terms', 'warning');
        return;
    }
    
    // Show submission progress
    showSubmissionProgress();
}

function showSubmissionProgress() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8); z-index: 1000;
        display: flex; align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 12px; text-align: center; max-width: 400px;">
            <h3>🚀 Submitting to NPHIES</h3>
            <div style="margin: 2rem 0;">
                <div class="progress-bar" style="height: 8px; background: #e9ecef; border-radius: 4px;">
                    <div id="submissionProgress" style="height: 100%; background: #28a745; width: 0%; transition: width 0.3s;"></div>
                </div>
            </div>
            <p id="submissionStatus">Preparing claim data...</p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Simulate submission progress
    const steps = [
        { text: 'Validating claim data...', progress: 20 },
        { text: 'Converting to FHIR format...', progress: 40 },
        { text: 'Connecting to NPHIES...', progress: 60 },
        { text: 'Submitting claim...', progress: 80 },
        { text: 'Claim submitted successfully!', progress: 100 }
    ];
    
    let currentStepIndex = 0;
    const interval = setInterval(() => {
        if (currentStepIndex < steps.length) {
            const step = steps[currentStepIndex];
            document.getElementById('submissionProgress').style.width = step.progress + '%';
            document.getElementById('submissionStatus').textContent = step.text;
            currentStepIndex++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                document.body.removeChild(modal);
                showSuccessMessage();
            }, 1000);
        }
    }, 1500);
}

function showSuccessMessage() {
    const claimId = 'CLM' + Date.now().toString().substr(-8);
    showNotification(`Claim submitted successfully! Claim ID: ${claimId}`, 'success');
    
    // Clear form
    formData = {};
    document.querySelectorAll('input, select, textarea').forEach(field => {
        if (field.type === 'checkbox') {
            field.checked = false;
        } else {
            field.value = '';
        }
    });
    
    // Reset to first step
    showStep(1);
    updateProgress();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 1001;
        padding: 1rem 1.5rem; border-radius: 8px; color: white;
        font-weight: 600; max-width: 300px; animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load draft if exists
    loadDraft();
    
    // Set up auto-save
    setInterval(saveDraft, 30000); // Auto-save every 30 seconds
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});
