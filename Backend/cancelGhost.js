const dotenv = require('dotenv');
dotenv.config();

const ftdFlightService = require('./src/services/ftdFlightService');

async function cancelGhost() {
    try {
        console.log("Cancelling ghost booking FTD4JGWIAVVE3B4 at FTD to clear the duplicate lock...");
        const cancelResult = await ftdFlightService.cancelFlight({
            refID: "FTD4JGWIAVVE3B4",
            paxId: "693796",
            paxIdr: "",
            canMode: 5,
            canRemarks: "Cancel ghost booking to clear duplicate lock"
        });
        console.log("Cancel Result:", cancelResult);
    } catch (e) {
        console.error("Failed to cancel:", e.message);
    }
}
cancelGhost();
