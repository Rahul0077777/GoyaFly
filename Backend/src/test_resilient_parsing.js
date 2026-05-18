const { cleanFtdJson } = require('./services/ftdFlightService');

const malformedResponse = `<div style="border:1px solid #990000;padding-left:20px;margin:0 0 10px 0;">

<h4>A PHP Error was encountered</h4>

<p>Severity: Warning</p>
<p>Message:  Attempt to read property "agentid" on string</p>
<p>Filename: controllers/api.php</p>
<p>Line Number: 2344</p>

</div>{"code":"error","error_msg":"Booking Id does not exists"}`;

console.log('Testing resilient JSON parsing...');
console.log('Input:', malformedResponse);

try {
    const cleaned = cleanFtdJson(malformedResponse);
    console.log('--- CLEANED RESULT ---');
    console.log(JSON.stringify(cleaned, null, 2));
    
    if (cleaned.code === 'error' && cleaned.error_msg === 'Booking Id does not exists') {
        console.log('\n✅ SUCCESS: Logical error correctly extracted from malformed HTML!');
    } else {
        console.log('\n❌ FAILED: Extraction logic did not find the correct JSON object.');
    }
} catch (e) {
    console.log('\n❌ CRASHED: Parser threw an exception:', e.message);
}
