const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

const airportCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 }); // 24-hour cache
const AIRPORT_DATA_URL = 'https://raw.githubusercontent.com/mwgg/Airports/master/airports.json';

let globalAirports = [];

const INDIAN_AIRPORTS = [
    'DEL', 'BOM', 'BLR', 'HYD', 'MAA', 'CCU', 'AMD', 'PNQ', 'COK', 'LKO', 
    'GOI', 'ATQ', 'SXR', 'IXC', 'IXJ', 'BBI', 'IXE', 'NAG', 'IMF', 'IXL', 
    'IXB', 'TRV', 'PAT', 'IXR', 'GAU', 'VNS', 'BHO', 'IDR', 'RPR', 'JAI', 
    'VTZ', 'TRZ', 'CJB', 'IXM', 'IXB', 'DIB', 'DMU', 'IMF', 'AJL', 'GAU',
    'SHL', 'TEZ', 'DBR', 'BOM', 'CNN', 'TIR', 'VGA', 'IXZ', 'VNS', 'BDQ'
];

/**
 * Loads airport data from a reliable public source
 */
const loadAirports = async () => {
    try {
        if (globalAirports.length > 0) return globalAirports;

        logger.info('Downloading global airport database...');
        const response = await axios.get(AIRPORT_DATA_URL);

        if (response.data) {
            globalAirports = Object.values(response.data)
                .filter(a => a.iata && a.iata.length === 3)
                .map(a => ({
                    code: a.iata,
                    city: a.city || a.name,
                    label: `${a.name} (${a.iata})`,
                    country: a.country
                }));
            logger.info(`Loaded ${globalAirports.length} airports into memory.`);
            return globalAirports;
        }
        return [];
    } catch (error) {
        logger.error('Failed to load airport database: ' + error.message);
        return [];
    }
};

// Start loading immediately
loadAirports();

/**
 * Searches for airports using the in-memory global dataset
 */
    const searchAirports = async (query) => {
    try {
        if (!query || query.length < 2) return [];

        const airports = await loadAirports();
        const searchTerm = query.toLowerCase();

        const results = airports.filter(a =>
            a.code.toLowerCase().includes(searchTerm) ||
            a.city.toLowerCase().includes(searchTerm) ||
            a.label.toLowerCase().includes(searchTerm)
        );

        results.sort((a, b) => {
            const aCodeExact = a.code.toLowerCase() === searchTerm;
            const bCodeExact = b.code.toLowerCase() === searchTerm;
            if (aCodeExact && !bCodeExact) return -1;
            if (!aCodeExact && bCodeExact) return 1;
            
            const aCityExact = a.city.toLowerCase() === searchTerm;
            const bCityExact = b.city.toLowerCase() === searchTerm;
            if (aCityExact && !bCityExact) return -1;
            if (!aCityExact && bCityExact) return 1;

            const aCodeStarts = a.code.toLowerCase().startsWith(searchTerm);
            const bCodeStarts = b.code.toLowerCase().startsWith(searchTerm);
            if (aCodeStarts && !bCodeStarts) return -1;
            if (!aCodeStarts && bCodeStarts) return 1;

            const aCityStarts = a.city.toLowerCase().startsWith(searchTerm);
            const bCityStarts = b.city.toLowerCase().startsWith(searchTerm);
            if (aCityStarts && !bCityStarts) return -1;
            if (!aCityStarts && bCityStarts) return 1;
            
            return 0;
        });

        return results.slice(0, 15);
    } catch (error) {
        logger.error('Airport Search Error: ' + error.message);
        return [];
    }
};

/**
 * Check if a route is international
 */
const isInternationalRoute = (from, to) => {
    return !INDIAN_AIRPORTS.includes(from?.toUpperCase()) || !INDIAN_AIRPORTS.includes(to?.toUpperCase());
};

module.exports = { searchAirports, loadAirports, isInternationalRoute, INDIAN_AIRPORTS };
