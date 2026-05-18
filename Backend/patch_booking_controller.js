const fs = require('fs');
const path = require('path');

const filePath = 'd:/Zaha/Backend/src/controllers/booking.controller.js';
let content = fs.readFileSync(filePath, 'utf8');

const smartJIT = `            if (!booking.fromCity || booking.fromCity === 'Unknown' || booking.fromCity === '') {
                // Recover from flightDetails (Smart Dictionary-Aware Parsing)
                let segments = booking.flightDetails;
                let flattened = [];

                if (segments) {
                    if (Array.isArray(segments)) {
                        const first = segments[0];
                        if (first?.Onward || first?.Return) {
                            if (first.Onward) Object.keys(first.Onward).filter(k => !isNaN(k)).sort((a, b) => a - b).forEach(k => flattened.push(first.Onward[k]));
                            if (first.Return) Object.keys(first.Return).filter(k => !isNaN(k)).sort((a, b) => a - b).forEach(k => flattened.push(first.Return[k]));
                        } else {
                            flattened = segments;
                        }
                    } else if (typeof segments === 'object') {
                        if (segments.Onward) Object.keys(segments.Onward).filter(k => !isNaN(k)).sort((a, b) => a - b).forEach(k => flattened.push(segments.Onward[k]));
                        if (segments.Return) Object.keys(segments.Return).filter(k => !isNaN(k)).sort((a, b) => a - b).forEach(k => flattened.push(segments.Return[k]));
                    }
                }

                if (flattened.length > 0) {
                    const first = flattened[0];
                    const last = flattened[flattened.length - 1];
                    booking.fromCity = first.depCName || first.depCode || 'Sector';
                    booking.toCity = last.arrCName || last.arrCode || 'Destination';
                    booking.airline = first.airName || first.airline || 'Flight';
                } else {
                    booking.fromCity = booking.serviceType.charAt(0).toUpperCase() + booking.serviceType.slice(1).toLowerCase();
                    booking.toCity = 'Booking';
                }
            }`;

// Regular expression to find the existing JIT blocks and replace them
const jitRegex = /if \(!booking\.fromCity \|\| booking\.fromCity === 'Unknown' \|\| booking\.fromCity === ''\) \{[\s\S]*?\/\/ Recover from flightDetails if available[\s\S]*?\}\s*else \{[\s\S]*?\}\s*\}/g;

const newContent = content.replace(jitRegex, smartJIT);

if (content === newContent) {
    console.error('❌ Could not find the JIT pattern to replace!');
    process.exit(1);
}

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('✅ booking.controller.js successfully patched with Smart JIT!');
