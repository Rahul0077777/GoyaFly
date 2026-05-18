const dotenv = require('dotenv');
dotenv.config();

const ftdFlightService = require('./src/services/ftdFlightService');

async function testSearchTwice() {
    try {
        console.log("Searching Flights...");
        const params = {
            depCity: "DEL",
            arrCity: "BOM",
            onDate: "05-04-2026",
            adt: 1
        };
        const result1 = await ftdFlightService.searchFlights(params);
        console.log("First Search refID:", result1.refID);
        
        console.log("Searching Flights again instantly...");
        const result2 = await ftdFlightService.searchFlights(params);
        console.log("Second Search refID:", result2.refID);
    } catch (e) {
        console.error("Search failed:", e.message);
    }
}
testSearchTwice();
