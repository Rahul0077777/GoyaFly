const { generatePDFTicket } = require('./src/utils/ticketGenerator');

async function testGenerate() {
    const bookingData = {
        pnr: "EMT57755748",
        status: "CONFIRMED",
        createdAt: new Date(),
        totalCost: 8126.00,
        netfare: 7684.00,
        fareType: 'A',
        passengerDetails: [
            { fName: "Prakash chand", lName: "Sharma", title: "Mr", pType: "A", ticketNo: "2282049700375" }
        ],
        flightDetails: [
            {
                Onward: {
                    "0": {
                        depCode: "DEL",
                        depCityName: "Delhi",
                        arrCode: "BLR",
                        arrCityName: "Bangalore",
                        depDate: "2026-05-02T16:05",
                        arrDate: "2026-05-02T18:50",
                        airName: "Vistara",
                        airCode: "UK",
                        flightNo: "817",
                        depTerm: "Terminal 3",
                        arrTerm: "Terminal 1",
                        duration: "2h 45m"
                    }
                }
            }
        ]
    };

    console.log('Generating ticket...');
    const resultPath = await generatePDFTicket(bookingData);
    console.log('Ticket generated at:', resultPath);
}

testGenerate().catch(err => console.error('Error testing ticket:', err));
