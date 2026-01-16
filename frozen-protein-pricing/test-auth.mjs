import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lctskueecpvabdjoafpp.supabase.co',
  'sb_publishable_oLA4KofGAQ3txYzo1pAUKA_13_It3dc'
);

// Sign in to get auth token
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'testuser@frozen-protein.com',
  password: 'TestPass123!@#'
});

if (error) {
  console.log('Auth failed, trying to create user...');
  const { data: newUser, error: createError } = await supabase.auth.signUp({
    email: 'testuser@frozen-protein.com',
    password: 'TestPass123!@#'
  });

  if (createError) {
    console.error('Create error:', createError.message);
  } else if (!newUser.session) {
    console.log('User created but email confirmation required. Check docs.');
  } else {
    console.log('User created. Session:', newUser.session?.access_token?.slice(0, 30) + '...');
  }
} else {
  console.log('Token:', data.session?.access_token?.slice(0, 30) + '...');
}
