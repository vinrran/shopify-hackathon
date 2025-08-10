#!/usr/bin/env node

/**
 * Full Integration Test for Shop Mini Backend
 * Tests the complete flow with Fal.ai integration
 */

const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = `test_user_${Date.now()}`;
const TEST_DATE = new Date().toISOString().split('T')[0];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAPI() {
  log('\n🧪 SHOP MINI BACKEND INTEGRATION TEST\n', 'cyan');
  log(`User ID: ${TEST_USER_ID}`, 'blue');
  log(`Date: ${TEST_DATE}\n`, 'blue');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Test 1: Health Check
    log('1️⃣  Testing Health Check...', 'yellow');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    if (health.status === 'healthy') {
      log('✅ Health check passed\n', 'green');
      testsPassed++;
    } else {
      throw new Error('Health check failed');
    }
    
    // Test 2: Get Questions
    log('2️⃣  Testing Get Questions...', 'yellow');
    const questionsRes = await fetch(`${BASE_URL}/api/questions`);
    const questions = await questionsRes.json();
    
    if (questions.questions && questions.questions.length > 0) {
      log(`✅ Retrieved ${questions.questions.length} questions`, 'green');
      log(`   Sample: "${questions.questions[0].prompt}"\n`, 'blue');
      testsPassed++;
    } else {
      throw new Error('No questions retrieved');
    }
    
    // Test 3: Submit Responses
    log('3️⃣  Testing Submit Responses...', 'yellow');
    const sampleAnswers = questions.questions.slice(0, 3).map((q, i) => ({
      qid: q.id,
      answer: q.type === 'multi_choice' 
        ? [q.options[0], q.options[1]] 
        : q.options[i % q.options.length]
    }));
    
    log(`   Submitting answers for ${sampleAnswers.length} questions...`, 'blue');
    
    const responseRes = await fetch(`${BASE_URL}/api/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: TEST_USER_ID,
        response_date: TEST_DATE,
        answers: sampleAnswers
      })
    });
    
    if (responseRes.ok) {
      const responseResult = await responseRes.json();
      log('✅ Responses stored successfully\n', 'green');
      testsPassed++;
    } else {
      throw new Error('Failed to store responses');
    }
    
    // Test 4: Generate Queries (Fal.ai)
    log('4️⃣  Testing Query Generation (Fal.ai)...', 'yellow');
    log('   ⚠️  This requires FAL_KEY to be set in backend/.env', 'blue');
    
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
      log(`✅ Generated ${queries.queries.length} search queries:`, 'green');
      queries.queries.forEach(q => log(`   • "${q}"`, 'blue'));
      log('', 'reset');
      testsPassed++;
      
      // Test 5: Store Sample Products
      log('5️⃣  Testing Product Storage...', 'yellow');
      const sampleProducts = [
        {
          product_id: `gid://shopify/Product/${Date.now()}`,
          title: 'Blue Cozy Hoodie',
          vendor: 'Test Brand',
          price: '59.99',
          currency: 'USD',
          url: 'https://example.com/product1',
          thumbnail_url: 'https://via.placeholder.com/300',
          images: ['https://via.placeholder.com/300', 'https://via.placeholder.com/400']
        },
        {
          product_id: `gid://shopify/Product/${Date.now() + 1}`,
          title: 'Black Streetwear Sneakers',
          vendor: 'Urban Style',
          price: '89.99',
          currency: 'USD',
          url: 'https://example.com/product2',
          thumbnail_url: 'https://via.placeholder.com/300',
          images: ['https://via.placeholder.com/300']
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
      
      if (productRes.ok) {
        const productResult = await productRes.json();
        log(`✅ Stored ${productResult.stored} products\n`, 'green');
        testsPassed++;
        
        // Test 6: Build Ranking (Fal.ai)
        log('6️⃣  Testing Ranking Build (Fal.ai)...', 'yellow');
        log('   Processing with AI ranking model...', 'blue');
        
        const rankingRes = await fetch(`${BASE_URL}/api/ranking/build`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: TEST_USER_ID,
            response_date: TEST_DATE,
            past_days: 5
          })
        });
        
        if (rankingRes.ok) {
          log('✅ Ranking built successfully\n', 'green');
          testsPassed++;
          
          // Test 7: Fetch Ranking
          log('7️⃣  Testing Fetch Ranking...', 'yellow');
          const getRankingRes = await fetch(
            `${BASE_URL}/api/ranking?user_id=${TEST_USER_ID}&response_date=${TEST_DATE}&limit=20&offset=0`
          );
          
          if (getRankingRes.ok) {
            const ranking = await getRankingRes.json();
            log(`✅ Retrieved ${ranking.top.length} ranked products`, 'green');
            if (ranking.top.length > 0) {
              log(`   Top product: "${ranking.top[0].title}" (Score: ${ranking.top[0].score})`, 'blue');
            }
            log(`   Has more: ${ranking.has_more}\n`, 'blue');
            testsPassed++;
            
            // Test 8: Vision Processing (Optional)
            log('8️⃣  Testing Vision Processing (Fal.ai)...', 'yellow');
            log('   Processing product images with Vision AI...', 'blue');
            
            const visionRes = await fetch(`${BASE_URL}/api/vision/run`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: TEST_USER_ID,
                response_date: TEST_DATE
              })
            });
            
            if (visionRes.ok) {
              const visionResult = await visionRes.json();
              log(`✅ Vision processing initiated: ${visionResult.message}\n`, 'green');
              testsPassed++;
            }
          }
        }
      }
    } else {
      log('❌ Query generation failed - FAL_KEY may not be configured', 'red');
      log('   Add FAL_KEY to backend/.env to enable AI features\n', 'yellow');
      testsFailed++;
    }
    
  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    testsFailed++;
  }
  
  // Summary
  log('\n' + '='.repeat(50), 'cyan');
  log('📊 TEST SUMMARY', 'cyan');
  log('='.repeat(50), 'cyan');
  log(`✅ Passed: ${testsPassed} tests`, 'green');
  if (testsFailed > 0) {
    log(`❌ Failed: ${testsFailed} tests`, 'red');
  }
  
  if (testsPassed >= 3 && testsFailed === 0) {
    log('\n🎉 All core features working!', 'green');
  } else if (testsPassed >= 3) {
    log('\n✨ Core features working! AI features require FAL_KEY', 'yellow');
  }
  
  log('\n📝 Next Steps:', 'cyan');
  log('1. Ensure FAL_KEY is set in backend/.env for AI features', 'blue');
  log('2. Connect the React frontend to test the full flow', 'blue');
  log('3. Use real Shopify product search in the frontend', 'blue');
  log('4. Deploy when ready for production', 'blue');
}

// Run the tests
testAPI().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
