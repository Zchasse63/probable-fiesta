const TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6Ijk2YzVlZWYyLTdlOTctNGUyNC1hYWU4LTA0Njc5NzEzNmM2YyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2xjdHNrdWVlY3B2YWJkam9hZnBwLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI2MTM5OTUwNC1mOGRiLTQ3YWQtYjUwYy1mY2EwMmM5MGU2OWMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY4NTc4NTU5LCJpYXQiOjE3Njg1NzQ5NTksImVtYWlsIjoidGVzdGFkbWluQGZyb3plbi5sb2NhbCIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWV9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzY4NTc0OTU5fV0sInNlc3Npb25faWQiOiI3MDdjMTNlNy0xZGQ5LTQzNmYtOTg1MS0wNWFkNzdlZTE5NDMiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.CHAzB9Pxd_aN2fMqMdY0FgWyyyrK0ENB4DqxZtB4xHFDiDX96MWFvWUIxUgLotwYTEs-F-GSIoNhVUwV8ByWgw";

console.log('\nTesting products API...');
const productsResponse = await fetch('http://localhost:3001/api/products', {
  headers: {
    'Authorization': `Bearer ${TOKEN}`
  }
});
console.log('Products status:', productsResponse.status);
console.log('Products response:', await productsResponse.text());

console.log('\nTesting AI categorize API...');
const categorizeResponse = await fetch('http://localhost:3001/api/ai/categorize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`
  },
  body: JSON.stringify({ description: 'Frozen Chicken Breast' })
});
console.log('Categorize status:', categorizeResponse.status);
console.log('Categorize response:', await categorizeResponse.text());
