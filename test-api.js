const axios = require('axios');
const fs    = require('fs');

const API_URL = 'http://localhost:5000/api';
let passed = 0, failed = 0;
let adminToken = '', customerToken = '', customerId = '', productId = '', orderId = '';
const lines = [];

const log  = (s) => { lines.push(s); console.log(s); };
const ok   = (label, detail = '') => { passed++; log(`  [PASS] ${label}${detail ? ' (' + detail + ')' : ''}`); };
const fail = (label, e)           => { failed++; log(`  [FAIL] ${label}  =>  ${e?.response?.data?.message || e?.message || String(e)}`); };
const sec  = (title)              => log(`\n=== ${title} ===`);

async function run() {
    log('\n========================================');
    log('  SmartStore API Test Suite');
    log('========================================');

    // ── 1. AUTH ───────────────────────────────
    sec('1. AUTH');
    try {
        const { data } = await axios.post(`${API_URL}/auth/login`, { email: 'admin@smartstore.com', password: 'Admin@123' });
        adminToken = data.token;
        ok('Admin login', `role=${data.role}`);
    } catch (e) { fail('Admin login', e); }

    const email = `tester_${Date.now()}@test.com`;
    try {
        const { data } = await axios.post(`${API_URL}/auth/register`, { name: 'Test Customer', email, password: 'Test@1234', role: 'customer' });
        customerToken = data.token; customerId = data._id;
        ok('Customer register', `id=${customerId}`);
    } catch (e) { fail('Customer register', e); }

    try {
        await axios.post(`${API_URL}/auth/login`, { email, password: 'wrongpass' });
        fail('Wrong password should return 401');
    } catch (e) {
        if (e.response?.status === 401) ok('Wrong password -> 401');
        else fail('Wrong password check', e);
    }

    // ── 2. PRODUCTS ───────────────────────────
    sec('2. PRODUCTS');
    const adminCfg = { headers: { Authorization: `Bearer ${adminToken}` } };

    try {
        const { data } = await axios.get(`${API_URL}/products`);
        ok('List all products', `count=${data.length}`);
        if (data.length > 0) productId = data[0]._id;
    } catch (e) { fail('List products', e); }

    try {
        const { data } = await axios.post(`${API_URL}/products`, {
            productName: `TestItem_${Date.now()}`, description: 'API test product',
            price: 999, category: 'Electronics', stock: 50, images: []
        }, adminCfg);
        productId = data._id;
        ok('Create product (admin)', `id=${productId}`);
    } catch (e) { fail('Create product (admin)', e); }

    try {
        const custCfg2 = { headers: { Authorization: `Bearer ${customerToken}` } };
        await axios.post(`${API_URL}/products`, { productName: 'Hack', description: 'x', price: 1, category: 'x', stock: 1 }, custCfg2);
        fail('Customer create product should be 403');
    } catch (e) {
        if (e.response?.status === 403) ok('Customer cannot create product -> 403');
        else fail('Role guard on product create', e);
    }

    // ── 3. ORDERS ─────────────────────────────
    sec('3. ORDERS');
    const custCfg = { headers: { Authorization: `Bearer ${customerToken}` } };

    try {
        await axios.post(`${API_URL}/orders`, {
            products: [{ productId, quantity: 1 }], totalPrice: 999, paymentMethod: 'Cash on Delivery'
        }, custCfg);
        fail('Order without shipping address should be rejected');
    } catch (e) {
        if (e.response?.status >= 400) ok('Order missing address -> rejected', `status=${e.response.status}`);
        else fail('Address validation', e);
    }

    try {
        const { data } = await axios.post(`${API_URL}/orders`, {
            products: [{ productId, quantity: 2 }], totalPrice: 1998, paymentMethod: 'Cash on Delivery',
            shippingAddress: { address: '12 MG Road', city: 'Bangalore', pincode: '560001', phone: '9876543210', state: 'Karnataka' }
        }, custCfg);
        orderId = data._id;
        ok('Create order', `id=${orderId} status=${data.orderStatus}`);
    } catch (e) { fail('Create order', e); }

    try {
        const { data } = await axios.get(`${API_URL}/orders`, custCfg);
        const found = data.find(o => o._id === orderId);
        ok('Fetch my orders', `count=${data.length} found=${!!found}`);
    } catch (e) { fail('Fetch orders', e); }

    try {
        const { data } = await axios.get(`${API_URL}/orders/${orderId}`, adminCfg);
        ok('Get order by ID', `status=${data.orderStatus}`);
    } catch (e) { fail('Get order by ID', e); }

    try {
        const { data } = await axios.put(`${API_URL}/orders/${orderId}`, { status: 'Delivered', message: 'Delivered.' }, adminCfg);
        ok('Admin updates order to Delivered', `status=${data.orderStatus}`);
    } catch (e) { fail('Update order status', e); }

    // ── 4. REVIEWS ────────────────────────────
    sec('4. REVIEWS & RATINGS (post-delivery)');

    // Basic review (no orderId)
    try {
        const { data } = await axios.post(`${API_URL}/products/${productId}/reviews`, {
            rating: 4, comment: 'Good product!', userName: 'Test Customer'
        }, custCfg);
        ok('Review without orderId', data.message);
    } catch (e) { fail('Basic review (no orderId)', e); }

    // Full flow: new user, delivered order, review
    try {
        const eRev2 = `rev2_${Date.now()}@test.com`;
        const reg2  = await axios.post(`${API_URL}/auth/register`, { name: 'Reviewer Two', email: eRev2, password: 'Test@1234', role: 'customer' });
        const tok2  = reg2.data.token;
        const cfg2  = { headers: { Authorization: `Bearer ${tok2}` } };

        // Create + deliver order
        const ord2 = await axios.post(`${API_URL}/orders`, {
            products: [{ productId, quantity: 1 }], totalPrice: 999, paymentMethod: 'Cash on Delivery',
            shippingAddress: { address: '5 Park St', city: 'Chennai', pincode: '600001', phone: '9000000001', state: 'Tamil Nadu' }
        }, cfg2);
        const oid2 = ord2.data._id;
        await axios.put(`${API_URL}/orders/${oid2}`, { status: 'Delivered', message: 'Done.' }, adminCfg);

        // First review with orderId — must succeed
        const rv = await axios.post(`${API_URL}/products/${productId}/reviews`, {
            rating: 5, comment: 'Excellent! Exactly as described.', orderId: oid2
        }, cfg2);
        ok('Review with orderId (delivered order)', rv.data.message);

        // Duplicate review same order -> must be 400
        try {
            const dupRes = await axios.post(`${API_URL}/products/${productId}/reviews`, { rating: 3, comment: 'Again', orderId: oid2 }, cfg2);
            fail('Duplicate review in same order should be blocked — got 2xx: ' + dupRes.status);
        } catch (de) {
            const st  = de.response?.status;
            const msg = de.response?.data?.message;
            if (st === 400) ok('Duplicate review blocked -> 400', msg);
            else fail('Duplicate review check', { message: `Expected 400, got ${st}: ${msg}` });
        }

        // Undelivered order -> must be 400
        const ord3 = await axios.post(`${API_URL}/orders`, {
            products: [{ productId, quantity: 1 }], totalPrice: 999, paymentMethod: 'Cash on Delivery',
            shippingAddress: { address: '1 Anna Nagar', city: 'Salem', pincode: '636001', phone: '9111111111', state: 'Tamil Nadu' }
        }, cfg2);
        try {
            const earlyRes = await axios.post(`${API_URL}/products/${productId}/reviews`, { rating: 4, comment: 'Too early!', orderId: ord3.data._id }, cfg2);
            fail('Review on undelivered order should be blocked — got 2xx: ' + earlyRes.status);
        } catch (ne) {
            const st  = ne.response?.status;
            const msg = ne.response?.data?.message;
            if (st === 400) ok('Undelivered order review blocked -> 400', msg);
            else fail('Undelivered order review check', { message: `Expected 400, got ${st}: ${msg}` });
        }
    } catch (e) { fail('Review with orderId full flow', e); }


    // Verify product rating updated
    try {
        const { data } = await axios.get(`${API_URL}/products`);
        const p = data.find(x => x._id === productId);
        if (p) ok('Product avg rating updated', `rating=${p.rating?.toFixed(2)} numReviews=${p.numReviews}`);
        else fail('Product not found after review');
    } catch (e) { fail('Product rating check', e); }

    // ── 5. SETTINGS ───────────────────────────
    sec('5. SETTINGS');
    try {
        const { data } = await axios.get(`${API_URL}/settings`);
        ok('Fetch settings', `gst=${data.gst} deliveryCharge=${data.deliveryCharge}`);
    } catch (e) { fail('Fetch settings', e); }

    // ── 6. AUTH GUARDS ────────────────────────
    sec('6. AUTH GUARDS');
    try {
        await axios.get(`${API_URL}/orders`);
        fail('No token should return 401');
    } catch (e) {
        if (e.response?.status === 401) ok('No token -> 401');
        else fail('No-token guard', e);
    }

    try {
        await axios.get(`${API_URL}/orders`, { headers: { Authorization: 'Bearer invalidtoken_xyz' } });
        fail('Bad token should return 401');
    } catch (e) {
        if (e.response?.status === 401) ok('Invalid token -> 401');
        else fail('Invalid token guard', e);
    }

    // ── SUMMARY ───────────────────────────────
    const total = passed + failed;
    const pct   = Math.round((passed / total) * 100);
    log('\n========================================');
    log(`  RESULTS: ${passed} passed, ${failed} failed / ${total} total (${pct}%)`);
    log(failed === 0 ? '  ALL TESTS PASSED!' : `  ${failed} test(s) need attention.`);
    log('========================================\n');

    fs.writeFileSync('test-results.txt', lines.join('\n'), 'utf8');
    process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('Fatal: ' + e.message); process.exit(1); });
