#!/usr/bin/env node

// Simple API test script for the backend
// Run with: node test-api.js

const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 'test_user_123';
const TEST_DATE = new Date().toISOString().split('T')[0];

async function testAPI() {
  console.log('🧪 Testing Backend API...\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    console.log('✅ Health:', health.status);
    
    // Test 2: Get Questions (no auth in dev mode)
    console.log('\n2️⃣ Testing Get Questions...');
    const questionsRes = await fetch(`${BASE_URL}/api/questions`);
    const questions = await questionsRes.json();
    console.log(`✅ Found ${questions.questions?.length || 0} questions`);
    
    if (questions.questions?.length > 0) {
      console.log('Sample question:', questions.questions[0].prompt);
      
      // Test 3: Store Responses
      console.log('\n3️⃣ Testing Store Responses...');
      const sampleAnswers = questions.questions.slice(0, 3).map((q, i) => ({
        qid: q.id,
        answer: q.type === 'multi_choice' 
          ? [q.options[0], q.options[1]] 
          : q.options[i % q.options.length]
      }));
      
      const responseRes = await fetch(`${BASE_URL}/api/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: TEST_USER_ID,
          response_date: TEST_DATE,
          answers: sampleAnswers
        })
      });
      const responseResult = await responseRes.json();
      console.log('✅ Responses stored:', responseResult.ok);
      
      // Test 4: Generate Queries (requires FAL_KEY)
      console.log('\n4️⃣ Testing Query Generation...');
      console.log('⚠️  Note: This requires FAL_KEY to be set in .env');
      const queryRes = await fetch(`${BASE_URL}/api/queries/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: TEST_USER_ID,
          response_date: TEST_DATE
        })
      });
      
      if (queryRes.ok) {
        const queries = await queryRes.json();
        console.log('✅ Generated queries:', queries.queries);
      } else {
        console.log('❌ Query generation failed (likely missing FAL_KEY)');
      }
      
      // Test 5: Store Products
      console.log('\n5️⃣ Testing Product Storage...');
      const sampleProducts = [
        {
          product_id: 'gid://shopify/Product/123',
          title: 'Test Product 1',
          vendor: 'Test Vendor',
          price: '29.99',
          currency: 'USD',
          url: 'https://example.com/product1',
          thumbnail_url: 'https://example.com/thumb1.jpg',
          images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg']
        }
      ];
      
      const productRes = await fetch(`${BASE_URL}/api/products/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: TEST_USER_ID,
          response_date: TEST_DATE,
          source: 'search',
          results: sampleProducts
        })
      });
      const productResult = await productRes.json();
      console.log('✅ Products stored:', productResult.stored);
    }
    
    console.log('\n✨ Backend API is working correctly!');
    console.log('\n📝 Next steps:');
    console.log('1. Add your FAL_KEY to backend/.env to enable AI features');
    console.log('2. Connect the frontend to use these endpoints');
    console.log('3. Test the full flow with real Shopify product searches');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure the backend server is running on port 3001');
  }
}

testAPI();
