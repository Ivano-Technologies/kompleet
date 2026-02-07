import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Verification failed', {
      status: 400,
    });
  }

  // Get the event type
  const eventType = evt.type;

  console.log(`Webhook received: ${eventType}`);

  // Handle user.created and user.updated events
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const {
      id,
      email_addresses,
      first_name,
      last_name,
      image_url,
      last_sign_in_at,
    } = evt.data;

    const email = email_addresses[0]?.email_address || '';
    const full_name = [first_name, last_name].filter(Boolean).join(' ');

    console.log(`Syncing user ${id} to Supabase...`);

    // Upsert user in clerk_users table
    const { error } = await supabaseAdmin.from('clerk_users').upsert(
      {
        clerk_user_id: id,
        email,
        full_name,
        profile_image_url: image_url,
        last_sign_in_at: last_sign_in_at
          ? new Date(last_sign_in_at).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'clerk_user_id',
      }
    );

    if (error) {
      console.error('Error syncing user to Supabase:', error);
      return new Response('Error: Failed to sync user', {
        status: 500,
      });
    }

    console.log(`User ${eventType}: ${id} synced to Supabase successfully`);

    // Also create/update profile record for backward compatibility
    const { data: clerkUser } = await supabaseAdmin
      .from('clerk_users')
      .select('id')
      .eq('clerk_user_id', id)
      .single();

    if (clerkUser) {
      await supabaseAdmin.from('profiles').upsert(
        {
          id: clerkUser.id,
          clerk_user_id: id,
          email,
          full_name,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'clerk_user_id',
        }
      );
    }
  }

  // Handle user.deleted event
  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    console.log(`Deleting user ${id} from Supabase...`);

    // Delete user from clerk_users table
    const { error } = await supabaseAdmin
      .from('clerk_users')
      .delete()
      .eq('clerk_user_id', id);

    if (error) {
      console.error('Error deleting user from Supabase:', error);
      return new Response('Error: Failed to delete user', {
        status: 500,
      });
    }

    console.log(`User deleted: ${id} removed from Supabase successfully`);
  }

  return new Response('Webhook processed successfully', { status: 200 });
}
