import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { action } = await req.json()

    // Action: Check if any admin exists
    if (action === 'check') {
      const { data: existingAdmins, error: checkError } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)

      if (checkError) {
        console.error('Error checking admins:', checkError)
        return new Response(
          JSON.stringify({ error: 'Erro ao verificar administradores' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const hasAdmins = existingAdmins && existingAdmins.length > 0
      console.log('Has admins:', hasAdmins)

      return new Response(
        JSON.stringify({ hasAdmins }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Action: Create first admin (bootstrap)
    if (action === 'bootstrap') {
      // First, check if any admin already exists
      const { data: existingAdmins, error: checkError } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)

      if (checkError) {
        console.error('Error checking existing admins:', checkError)
        return new Response(
          JSON.stringify({ error: 'Erro ao verificar administradores existentes' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (existingAdmins && existingAdmins.length > 0) {
        console.log('Admin already exists, bootstrap not allowed')
        return new Response(
          JSON.stringify({ error: 'Sistema já inicializado. Use o login normal.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get admin credentials from environment variables (SECURE)
      const adminEmail = Deno.env.get('BOOTSTRAP_ADMIN_EMAIL')
      const adminPassword = Deno.env.get('BOOTSTRAP_ADMIN_PASSWORD')

      if (!adminEmail || !adminPassword) {
        console.error('Bootstrap credentials not configured in environment')
        return new Response(
          JSON.stringify({ error: 'Credenciais de bootstrap não configuradas. Configure BOOTSTRAP_ADMIN_EMAIL e BOOTSTRAP_ADMIN_PASSWORD.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Creating first admin user:', adminEmail)

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true
      })

      if (createError) {
        console.error('Error creating admin user:', createError)
        return new Response(
          JSON.stringify({ error: `Erro ao criar usuário: ${createError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!newUser.user) {
        return new Response(
          JSON.stringify({ error: 'Erro ao criar usuário: usuário não retornado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Assign admin role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: 'admin'
        })

      if (roleError) {
        console.error('Error assigning admin role:', roleError)
        // Try to clean up the user if role assignment failed
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
        return new Response(
          JSON.stringify({ error: `Erro ao atribuir role: ${roleError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('First admin created successfully:', adminEmail)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin master criado com sucesso!',
          email: adminEmail
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
