// Appwrite Config
const client = new Appwrite.Client();
client.setEndpoint('https://sgp.cloud.appwrite.io/v1').setProject('69aace7f002dc7981fc6');
const databases = new Appwrite.Databases(client);
const DATABASE_ID = '69aacf420003152c50f2';
const COLLECTION_ID = '69aae492003d1d3dfdba';

// Supabase Config (Failover)
const SUPABASE_URL = 'https://miflxuibznwljdqddvso.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZmx4dWliem53bGpkcWRkdnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTM2MzYsImV4cCI6MjA4ODM4OTYzNn0._iK-yrsoTgmI_T0I8M5wzFx-oDOkDAFoZh1b9h6_K8g';
const supabaseClient = typeof supabase !== 'undefined' ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let html5QrCode;
let currentDocId = null;

function onScanSuccess(decodedText, decodedResult) {
    // Stop scanning temporarily to show results
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            fetchDetails(decodedText);
        }).catch(err => console.error("Failed to stop scanner", err));
    }
}

function onScanFailure(error) {
    // handle scan failure, usually better to ignore and keep scanning.
    console.warn(`QR code scan failed: ${error}`);
}

async function fetchDetails(docId) {
    const detailsDiv = document.getElementById('participantDetails');
    const resultCard = document.getElementById('resultCard');
    const attendBtn = document.getElementById('attendBtn');
    
    resultCard.style.display = 'block';
    detailsDiv.innerHTML = '<p>Loading details...</p>';
    currentDocId = docId;
    let doc = null;

    try {
        // 1. Try Appwrite first
        try {
            doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, docId);
        } catch (appwriteError) {
            console.warn("Appwrite fetch failed, trying Supabase...", appwriteError);
            
            // 2. Failover to Supabase
            if (!supabaseClient) throw appwriteError;
            
            const { data, error } = await supabaseClient
                .from('registrations')
                .select('*')
                .eq('id', docId)
                .single();
            
            if (error) throw error;
            doc = data;
            doc.$id = doc.id; // Normalize ID for display
        }
        
        let eventsDisplay = doc.events;
        try {
            const parsed = JSON.parse(doc.events);
            if (Array.isArray(parsed)) eventsDisplay = parsed.map(e => e.replace(/-/g, ' ').toUpperCase()).join(', ');
        } catch (e) {}

        let statusColor = doc.verification_status === 'Verified' ? '#4ade80' : '#facc15';
        let attendedColor = doc.attended ? '#4ade80' : '#ef4444';
        let attendedText = doc.attended ? 'Yes' : 'No';

        detailsDiv.innerHTML = `
            <p style="margin-bottom: 8px;"><strong>Name:</strong> ${doc.name}</p>
            <p style="margin-bottom: 8px;"><strong>Short ID:</strong> <span style="font-size: 1.2rem; color: var(--gold); font-weight: bold;">${doc.shortId || 'N/A'}</span></p>
            <p style="margin-bottom: 8px;"><strong>College:</strong> ${doc.college}</p>
            <p style="margin-bottom: 8px;"><strong>ID:</strong> <span style="font-family: monospace; color: #aaa;">${doc.$id}</span></p>
            <p style="margin-bottom: 8px;"><strong>Events:</strong> ${eventsDisplay}</p>
            <p style="margin-bottom: 8px;"><strong>Payment Ref:</strong> ${doc.paymentReference}</p>
            <p style="margin-top: 15px; font-size: 1rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;"><strong>Payment:</strong> <span style="color: ${statusColor}; font-weight: bold;">${doc.verification_status}</span></p>
            <p style="margin-top: 5px; font-size: 1rem;"><strong>Attended:</strong> <span id="attendedDisplay" style="color: ${attendedColor}; font-weight: bold;">${attendedText}</span></p>
        `;

        if (doc.attended) {
            attendBtn.textContent = 'Already Marked Present';
            attendBtn.disabled = true;
            attendBtn.style.opacity = '0.5';
        } else {
            attendBtn.textContent = 'Mark as Attended';
            attendBtn.disabled = false;
            attendBtn.style.opacity = '1';
        }

    } catch (error) {
        console.error(error);
        detailsDiv.innerHTML = '<p style="color: #ef4444;">Error fetching details. Not found in either database.</p>';
        if(attendBtn) attendBtn.style.display = 'none';
    }
}

async function markAttendance() {
    if (!currentDocId) return;
    const attendBtn = document.getElementById('attendBtn');
    attendBtn.textContent = 'Updating...';
    
    try {
        // Try to update both databases in parallel
        const updates = [
            databases.updateDocument(DATABASE_ID, COLLECTION_ID, currentDocId, { attended: true })
        ];
        
        if (supabaseClient) {
            updates.push(supabaseClient.from('registrations').update({ attended: true }).eq('id', currentDocId));
        }

        await Promise.allSettled(updates);

        document.getElementById('attendedDisplay').textContent = 'Yes';
        document.getElementById('attendedDisplay').style.color = '#4ade80';
        attendBtn.textContent = 'Marked Present';
        attendBtn.disabled = true;
    } catch (error) {
        alert('Failed to update attendance: ' + error.message);
        attendBtn.textContent = 'Mark as Attended';
    }
}

function resetScanner() {
    document.getElementById('resultCard').style.display = 'none';
    startScanner();
}

function startScanner() {
    const scannerMessage = document.getElementById('scannerMessage');
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        scannerMessage.innerText = 'CAMERA ERROR: This app must be run on a secure server (HTTPS) to access the camera.';
        scannerMessage.style.display = 'block';
        scannerMessage.style.color = '#ef4444';
        return;
    }

    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: {width: 250, height: 250} },
        onScanSuccess,
        onScanFailure
    ).catch(err => {
        console.error("Error starting scanner", err);
        scannerMessage.innerText = `Camera Error: ${err}`;
        scannerMessage.style.display = 'block';
    });
}

document.addEventListener('DOMContentLoaded', startScanner);