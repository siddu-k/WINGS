// Appwrite Config
const client = new Appwrite.Client();
client.setEndpoint('https://sgp.cloud.appwrite.io/v1').setProject('69aace7f002dc7981fc6');
const databases = new Appwrite.Databases(client);
const DATABASE_ID = '69aacf420003152c50f2';
const COLLECTION_ID = '69aae492003d1d3dfdba';

let html5QrcodeScanner;
let currentDocId = null;

function onScanSuccess(decodedText, decodedResult) {
    // Stop scanning temporarily to show results
    html5QrcodeScanner.clear();
    
    // Fetch details from Appwrite
    fetchDetails(decodedText);
}

function onScanFailure(error) {
    // handle scan failure, usually better to ignore and keep scanning.
    console.warn(`QR code scan failed: ${error}`);
}

async function fetchDetails(docId) {
    const detailsDiv = document.getElementById('participantDetails');
    const resultCard = document.getElementById('resultCard');
    const verifyBtn = document.getElementById('verifyBtn');
    
    resultCard.style.display = 'block';
    detailsDiv.innerHTML = '<p>Loading details...</p>';
    currentDocId = docId;

    try {
        const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, docId);
        
        let eventsDisplay = doc.events;
        try {
            const parsed = JSON.parse(doc.events);
            if (Array.isArray(parsed)) eventsDisplay = parsed.map(e => e.replace(/-/g, ' ').toUpperCase()).join(', ');
        } catch (e) {}

        let statusColor = doc.verification_status === 'Verified' ? '#4ade80' : '#facc15';

        detailsDiv.innerHTML = `
            <p style="margin-bottom: 8px;"><strong>Name:</strong> ${doc.name}</p>
            <p style="margin-bottom: 8px;"><strong>College:</strong> ${doc.college}</p>
            <p style="margin-bottom: 8px;"><strong>ID:</strong> <span style="font-family: monospace; color: #aaa;">${doc.$id}</span></p>
            <p style="margin-bottom: 8px;"><strong>Events:</strong> ${eventsDisplay}</p>
            <p style="margin-bottom: 8px;"><strong>Payment Ref:</strong> ${doc.paymentReference}</p>
            <p style="margin-top: 15px; font-size: 1.2rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;"><strong>Status:</strong> <span id="statusDisplay" style="color: ${statusColor}; font-weight: bold;">${doc.verification_status}</span></p>
        `;

        if (doc.verification_status === 'Verified') {
            verifyBtn.textContent = 'Already Verified';
            verifyBtn.disabled = true;
            verifyBtn.style.opacity = '0.5';
        } else {
            verifyBtn.textContent = 'Verify Entry';
            verifyBtn.disabled = false;
            verifyBtn.style.opacity = '1';
        }

    } catch (error) {
        console.error(error);
        detailsDiv.innerHTML = '<p style="color: #ef4444;">Error fetching details. Invalid QR or Network Error.</p>';
        verifyBtn.style.display = 'none';
    }
}

async function verifyParticipant() {
    if (!currentDocId) return;
    const verifyBtn = document.getElementById('verifyBtn');
    verifyBtn.textContent = 'Verifying...';
    
    try {
        await databases.updateDocument(DATABASE_ID, COLLECTION_ID, currentDocId, {
            verification_status: 'Verified'
        });
        document.getElementById('statusDisplay').textContent = 'Verified';
        document.getElementById('statusDisplay').style.color = '#4ade80';
        verifyBtn.textContent = 'Verified Successfully';
        verifyBtn.disabled = true;
    } catch (error) {
        alert('Failed to verify: ' + error.message);
        verifyBtn.textContent = 'Verify Entry';
    }
}

function resetScanner() {
    document.getElementById('resultCard').style.display = 'none';
    startScanner();
}

function startScanner() {
    const scannerMessage = document.getElementById('scannerMessage');
    if (location.protocol !== 'https:') {
        scannerMessage.innerText = 'CAMERA ERROR: This app must be run on a secure server (HTTPS) to access the camera.';
        scannerMessage.style.display = 'block';
        scannerMessage.style.color = '#ef4444';
        return;
    }

    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: {width: 250, height: 250} },
        /* verbose= */ false);
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

document.addEventListener('DOMContentLoaded', startScanner);