const TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6Ijk2YzVlZWYyLTdlOTctNGUyNC1hYWU4LTA0Njc5NzEzNmM2YyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2xjdHNrdWVlY3B2YWJkam9hZnBwLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI2MTM5OTUwNC1mOGRiLTQ3YWQtYjUwYy1mY2EwMmM5MGU2OWMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY4NTc4NTA0LCJpYXQiOjE3Njg1NzQ5MDQsImVtYWlsIjoidGVzdGFkbWluQGZyb3plbi5sb2NhbCIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWV9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzY4NTc0OTA0fV0sInNlc3Npb25faWQiOiIzOWZjMGE1Zi00MDBjLTRhYzAtOTljOC1jMjIzMDYzOTA1NDYiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.VRTt1BDoBt1bd-yXgWP8oXG70Hg4ZSd8ZCIk4PBNPCJSSFgQUWTCgczjIF2wNJZ4RD-LY3pyglL34Mqp_PbH2Q";

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lctskueecpvabdjoafpp.supabase.co',
  'sb_publishable_oLA4KofGAQ3txYzo1pAUKA_13_It3dc'
);

// Use service role for auth
const { data: sessionData } = await supabase.auth.signInWithPassword({
  email: 'testadmin@frozen.local',
  password: 'AdminPass123!'
});

const token = sessionData?.session?.access_token || TOKEN;

const tests = [
  {
    name: 'Categorize frozen chicken',
    path: '/api/ai/categorize',
    body: { description: 'Frozen Chicken Breast Boneless Skinless' }
  },
  {
    name: 'Parse deal email',
    path: '/api/ai/parse-deal',
    body: { content: 'Deal on frozen beef ribeye, $4.99/lb, 10000 lbs available, expires 2026-03-01' }
  },
  {
    name: 'Normalize address',
    path: '/api/ai/normalize-address',
    body: { address: '123 main st nyc 10001' }
  },
  {
    name: 'Parse pack size',
    path: '/api/ai/parse-pack-size',
    body: { packSize: '2 dozen 8oz pkgs', description: 'chicken tenders' }
  },
  {
    name: 'Search query',
    path: '/api/ai/search',
    body: { query: 'frozen chicken under $3/lb' }
  }
];

for (const test of tests) {
  try {
    const response = await fetch(`http://localhost:3001${test.path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(test.body)
    });

    const data = await response.json();
    console.log(`\n${test.name}:`);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`\n${test.name}: ERROR`);
    console.log(error.message);
  }
}
