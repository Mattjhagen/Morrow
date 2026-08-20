import { spawn } from 'child_process'

const PORT = 3025
const BASE_URL = `http://localhost:${PORT}`

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.status < 500) return true
    } catch {
      // ignore
    }
    await delay(500)
  }
  return false
}

async function runVelourPaymentTests() {
  console.log('=================================================================')
  console.log('✦ Testing Velour.live Payment Routes, Checkouts & Emails E2E')
  console.log('=================================================================\n')

  let passed = 0
  let failed = 0

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ''}`)
      failed++
    }
  }

  const testCustomer = {
    name: 'Eleanor Vance',
    email: 'eleanor.vance@velourtest.com',
    storeId: 'velour-flagship',
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Homepage & Storefront Load
    // -------------------------------------------------------------------------
    console.log('\n--- Step 1: Velour.live Storefront Verification ---')
    const homeRes = await fetch(`${BASE_URL}/`)
    const homeHtml = await homeRes.text()
    assert('Storefront homepage returns HTTP 200', homeRes.status === 200)
    assert('Velour branding present', homeHtml.includes('Velour') || homeHtml.includes('velour'))

    // -------------------------------------------------------------------------
    // TEST 2: Stripe Payment Intent Route (/api/stripe/create-intent)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Stripe Payment Intent Route ---')
    const stripeIntentRes = await fetch(`${BASE_URL}/api/stripe/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountCents: 18500, // $185.00
        currency: 'usd',
        customerEmail: testCustomer.email,
        customerName: testCustomer.name,
        storeId: testCustomer.storeId,
        metadata: {
          itemCount: '2',
          discountCode: 'WELCOME10',
        },
      }),
    })
    const stripeIntentData = await stripeIntentRes.json()
    assert('Stripe create-intent returns HTTP 200', stripeIntentRes.status === 200)
    assert('Stripe create-intent returns success: true', stripeIntentData.success === true)
    assert('Payment Intent ID generated', typeof stripeIntentData.paymentIntentId === 'string' && stripeIntentData.paymentIntentId.length > 0)
    assert('Client Secret returned for Stripe Elements', typeof stripeIntentData.clientSecret === 'string' && stripeIntentData.clientSecret.length > 0)
    assert('Correct amount cents recorded (18500)', stripeIntentData.amountCents === 18500)
    console.log(`  👉 Intent ID: ${stripeIntentData.paymentIntentId}`)

    // -------------------------------------------------------------------------
    // TEST 3: Stripe Intent Validation & Error Handling
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Stripe Intent Input Validation ---')
    const invalidStripeRes = await fetch(`${BASE_URL}/api/stripe/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountCents: 0,
        customerEmail: '',
      }),
    })
    assert('Invalid Stripe payload returns HTTP 400', invalidStripeRes.status === 400)

    // -------------------------------------------------------------------------
    // TEST 4: Lemon Squeezy Checkout Creation (/api/lemonsqueezy/create-checkout)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: Lemon Squeezy Checkout Route ---')
    const lsCheckoutRes = await fetch(`${BASE_URL}/api/lemonsqueezy/create-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountCents: 24000, // $240.00
        currency: 'USD',
        customerEmail: testCustomer.email,
        customerName: testCustomer.name,
        storeId: testCustomer.storeId,
        orderNumber: 1042,
        itemsSummary: '2x Handcrafted Ceramic Vessel & Linen Throw',
        metadata: {
          discountCode: 'SLOWCRAFT',
        },
      }),
    })
    const lsCheckoutData = await lsCheckoutRes.json()
    assert('Lemon Squeezy checkout returns HTTP 200', lsCheckoutRes.status === 200)
    assert('Lemon Squeezy checkout returns success: true', lsCheckoutData.success === true)
    assert('Lemon Squeezy checkout URL generated', typeof lsCheckoutData.checkoutUrl === 'string' && lsCheckoutData.checkoutUrl.length > 0)
    assert('Lemon Squeezy checkout ID generated', typeof lsCheckoutData.checkoutId === 'string' && lsCheckoutData.checkoutId.length > 0)
    console.log(`  👉 Lemon Squeezy Checkout URL: ${lsCheckoutData.checkoutUrl}`)

    // -------------------------------------------------------------------------
    // TEST 5: Lemon Squeezy Webhook Processing (/api/lemonsqueezy/webhook)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: Lemon Squeezy Webhook Processing ---')
    const lsWebhookRes = await fetch(`${BASE_URL}/api/lemonsqueezy/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': 'simulated_test_sig',
      },
      body: JSON.stringify({
        meta: {
          event_name: 'order_created',
          custom_data: {
            order_id: 'ord_98427',
            order_number: '1042',
            store_id: testCustomer.storeId,
          },
        },
        data: {
          attributes: {
            user_email: testCustomer.email,
            user_name: testCustomer.name,
            total: 24000,
          },
        },
      }),
    })
    const lsWebhookData = await lsWebhookRes.json()
    assert('Lemon Squeezy webhook returns HTTP 200', lsWebhookRes.status === 200)
    assert('Webhook event processed (received: true)', lsWebhookData.received === true)

    // -------------------------------------------------------------------------
    // TEST 6: Order Receipt Confirmation Email (/api/email/send)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Order Receipt Confirmation Email ---')
    const receiptEmailRes = await fetch(`${BASE_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order_confirmation',
        storeName: 'Velour',
        order: {
          order_number: 1042,
          customer_name: testCustomer.name,
          customer_email: testCustomer.email,
          subtotal_cents: 24000,
          discount_cents: 2400,
          discount_code: 'SLOWCRAFT',
          shipping_cents: 0,
          total_cents: 21600,
          order_items: [
            { name: 'Ceramic Vessel No. 4', quantity: 1, unit_price_cents: 14000 },
            { name: 'Handwoven Linen Throw', quantity: 1, unit_price_cents: 10000 },
          ],
          shipping_address: {
            street: '742 Evergreen Terrace',
            city: 'Portland',
            state: 'OR',
            zip: '97201',
          },
        },
      }),
    })
    const receiptEmailData = await receiptEmailRes.json()
    assert('Receipt email dispatch returns HTTP 200', receiptEmailRes.status === 200)
    assert('Receipt email returns success: true', receiptEmailData.success === true)
    assert('Message ID returned', typeof receiptEmailData.messageId === 'string' && receiptEmailData.messageId.length > 0)
    console.log(`  👉 Message ID: ${receiptEmailData.messageId}`)

    // -------------------------------------------------------------------------
    // TEST 7: Shipping Notification Email (/api/email/send)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 7: Shipping Notification Email ---')
    const shippingEmailRes = await fetch(`${BASE_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'shipping_notification',
        storeName: 'Velour',
        order: {
          order_number: 1042,
          customer_name: testCustomer.name,
          customer_email: testCustomer.email,
          carrier: 'USPS Priority Carbon-Neutral',
          tracking_number: '9400111899223192083112',
        },
      }),
    })
    const shippingEmailData = await shippingEmailRes.json()
    assert('Shipping email dispatch returns HTTP 200', shippingEmailRes.status === 200)
    // -------------------------------------------------------------------------
    // TEST 8: Media Upload Route (/api/upload)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 8: Media Upload Route ---')
    const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        filename: 'vessel-photo.png',
      }),
    })
    const uploadData = await uploadRes.json()
    assert('Upload endpoint returns HTTP 200', uploadRes.status === 200)
    assert('Upload returns success: true', uploadData.success === true)

    // -------------------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------------------
    console.log('\n=================================================================')
    console.log(`📊 Velour.live Payment & Route Audit Results: ${passed} Passed, ${failed} Failed`)
    console.log('=================================================================\n')

    return failed === 0
  } catch (error) {
    console.error('Fatal test error:', error)
    return false
  }
}

async function main() {
  console.log('Starting Velour production server on port', PORT, '...')
  const server = spawn('npm', ['run', 'start', '--', '--port', String(PORT)], {
    cwd: '/Users/matt/.gemini/antigravity/scratch/Morrow',
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'inherit',
  })

  try {
    const ready = await waitForServer(`${BASE_URL}/`)
    if (!ready) {
      console.error('Failed to start server within timeout.')
      process.exit(1)
    }

    const success = await runVelourPaymentTests()
    server.kill()
    process.exit(success ? 0 : 1)
  } catch (err) {
    console.error(err)
    server.kill()
    process.exit(1)
  }
}

main()
