document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const form = document.getElementById('registration-form');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    const fileInput = document.getElementById('file');
    const fileNameDisplay = document.getElementById('file-name');
    const formCard = document.getElementById('form-card');
    const previewCard = document.getElementById('preview-card');
    const previewDataContainer = document.getElementById('preview-data');
    const editBtn = document.getElementById('edit-btn');
    const resetBtn = document.getElementById('reset-btn');
    const submitBtn = document.getElementById('submit-btn');

    // --- Supabase Configuration (Using Existing Config) ---
    const SUPABASE_URL = 'https://zjrdzexqwbormxiypexm.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_O_mO9jNerh5HB2KTh-TNhA_bNQ6wmKX';
    
    // Initialize Supabase Client
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // --- Theme Logic ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = body.classList.contains('light-mode') ? 'light' : 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    });

    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.replace('light-mode', 'dark-mode');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            body.classList.replace('dark-mode', 'light-mode');
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
        localStorage.setItem('theme', theme);
    }

    // --- File Input Display ---
    fileInput.addEventListener('change', (e) => {
        const fileName = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
        fileNameDisplay.textContent = fileName;
    });

    // --- Validation Logic ---
    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    };

    const validateForm = (data, file) => {
        if (!data.full_name || !data.email || !data.phone || !data.date_of_birth || !data.gender || !data.address || !file) {
            alert("All fields are required. Please fill everything and upload a file.");
            return false;
        }
        if (!validateEmail(data.email)) {
            alert("Please enter a valid email address.");
            return false;
        }
        return true;
    };

    // --- Submit Logic (MODIFIED) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Capture Values
        const formData = {
            full_name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            date_of_birth: document.getElementById("date_of_birth").value,
            gender: document.getElementById("gender").value,
            address: document.getElementById("address").value.trim()
        };
        const file = fileInput.files[0];

        // 2. Validate Inputs
        if (!validateForm(formData, file)) return;

        // 3. UI Improvements: Show "Submitting..." and Disable button
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        try {
            // 4. Upload File to Supabase Storage
            const filePath = `public/${Date.now()}_${file.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) {
                console.error("UPLOAD ERROR:", uploadError);
                alert("Upload failed: " + uploadError.message);
                return; // Stop execution if upload fails
            }

            // 5. Get Public URL (Requirement)
            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);

            // 6. Insert Form Data into Supabase Table
            const { data: insertData, error: insertError } = await supabase
                .from('submissions')
                .insert([{
                    ...formData,
                    file_url: publicUrl
                }]);

            if (insertError) {
                console.error("INSERT ERROR:", insertError);
                alert("Insert failed: " + insertError.message);
                return; // Stop if insert fails
            }

            // 7. UX Improvements: Success message and Reset form
            alert("Success! Your application has been submitted.");
            form.reset();
            fileNameDisplay.textContent = 'No file chosen';
            
            // Optional: Show preview or success state
            showPreview({ ...formData, file_url: publicUrl });

        } catch (err) {
            console.error("UNEXPECTED ERROR:", err);
            alert("An unexpected error occurred. Check console for details.");
        } finally {
            // Re-enable button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    function showPreview(data) {
        previewDataContainer.innerHTML = '';
        const labels = {
            full_name: 'Full Name',
            email: 'Email',
            phone: 'Phone Number',
            date_of_birth: 'Date of Birth',
            gender: 'Gender',
            address: 'Address',
            file_url: 'Document'
        };

        Object.keys(labels).forEach(key => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            const value = key === 'file_url' ? `<a href="${data[key]}" target="_blank" class="view-link">View Uploaded File</a>` : data[key];
            item.innerHTML = `
                <span class="preview-label">${labels[key]}</span>
                <span class="preview-value">${value}</span>
            `;
            previewDataContainer.appendChild(item);
        });

        formCard.style.display = 'none';
        previewCard.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    editBtn.addEventListener('click', () => {
        previewCard.style.display = 'none';
        formCard.style.display = 'block';
    });

    // --- Reset Logic ---
    resetBtn.addEventListener('click', () => {
        fileNameDisplay.textContent = 'No file chosen';
        const errors = document.querySelectorAll('.error-msg');
        errors.forEach(e => e.textContent = '');
    });
});
