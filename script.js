/**
 * PRODUCTION-READY script.js
 * Optimized for Vercel Static Deployment & Supabase Browser SDK
 */

// --- Supabase Configuration ---
const SUPABASE_URL = "https://zjrdzexqwbormxiypexm.supabase.co"; // Replace with YOUR_PROJECT_ID if changed
const SUPABASE_ANON_KEY = "sb_publishable_O_mO9jNerh5HB2KTh-TNhA_bNQ6wmKX"; // Replace with YOUR_ANON_KEY

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    const submitBtn = document.getElementById('submit-btn');

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
        const file = e.target.files[0];
        if (file) {
            fileNameDisplay.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            fileNameDisplay.style.color = "var(--primary)";
        } else {
            fileNameDisplay.textContent = 'No file selected';
            fileNameDisplay.style.color = "inherit";
        }
    });

    // --- Submit Logic ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Capture Values
        const payload = {
            full_name: document.getElementById("full_name").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            date_of_birth: document.getElementById("date_of_birth").value,
            gender: document.getElementById("gender").value,
            address: document.getElementById("address").value.trim()
        };
        const file = fileInput.files[0];

        // 2. UX: Disable button & show "Processing..."
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        try {
            // 3. File Upload to Supabase Storage (Bucket: 'documents')
            console.log("Uploading file...");
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const filePath = `uploads/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) {
                console.error("Upload Error:", uploadError);
                alert(`Upload failed: ${uploadError.message}. Make sure 'documents' bucket exists and is public.`);
                throw uploadError;
            }

            // 4. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            const file_url = publicUrl;
            console.log("File uploaded successfully. URL:", file_url);

            // 5. Insert into Database (Table: 'submissions')
            const finalPayload = { ...payload, file_url };
            console.log("Insert payload:", finalPayload);

            const { data: insertData, error: insertError } = await supabase
                .from('submissions')
                .insert([finalPayload]);

            if (insertError) {
                console.error("Database Insert Error:", insertError);
                alert(`Insert failed: ${insertError.message}`);
                throw insertError;
            }

            // 6. Success Handling
            console.log("Submission successful!");
            alert("Success! Your application has been submitted.");
            
            form.reset();
            fileNameDisplay.textContent = 'No file selected';
            showPreview(finalPayload);

        } catch (err) {
            console.error("CRITICAL FLOW ERROR:", err);
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
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
            file_url: 'Uploaded Document'
        };

        Object.keys(labels).forEach(key => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            const value = key === 'file_url' 
                ? `<a href="${data[key]}" target="_blank" class="view-link">View Document <i data-lucide="external-link" style="width:14px"></i></a>` 
                : data[key];
            
            item.innerHTML = `
                <span class="preview-label">${labels[key]}</span>
                <span class="preview-value">${value}</span>
            `;
            previewDataContainer.appendChild(item);
        });

        // Re-initialize icons for the injected HTML
        lucide.createIcons();

        formCard.style.display = 'none';
        previewCard.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    editBtn.addEventListener('click', () => {
        previewCard.style.display = 'none';
        formCard.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
