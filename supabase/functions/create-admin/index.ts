import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateReferralCode(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .substring(0, 6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}${random}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { action } = body;

    // ========== ADMIN ACTIONS ==========
    if (action === 'list') {
      const { data: admins } = await supabaseAdmin.from('user_roles').select('user_id, role, created_at').eq('role', 'admin');
      const adminDetails = await Promise.all(
        (admins || []).map(async (admin) => {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(admin.user_id);
          return { user_id: admin.user_id, email: userData?.user?.email || 'Email não disponível', created_at: admin.created_at, is_current_user: admin.user_id === user.id };
        })
      );
      return new Response(JSON.stringify({ admins: adminDetails }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create') {
      const { email, password } = body;
      if (!email || !password || password.length < 6) {
        return new Response(JSON.stringify({ error: 'Email e senha (mín 6 chars) obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      await supabaseAdmin.from('user_roles').insert({ user_id: newUser.user.id, role: 'admin' });
      return new Response(JSON.stringify({ success: true, admin: { user_id: newUser.user.id, email } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'remove') {
      const { user_id: targetUserId } = body;
      if (targetUserId === user.id) {
        return new Response(JSON.stringify({ error: 'Não pode remover a si mesmo' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      await supabaseAdmin.from('user_roles').delete().eq('user_id', targetUserId).eq('role', 'admin');
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ========== RESELLER ACTIONS ==========
    if (action === 'list_resellers') {
      const { data: resellers, error } = await supabaseAdmin.from('resellers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ resellers: resellers || [] }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create_reseller') {
      const { name, email, password, whatsapp, access_type, pricing_mode, price_basic, price_pro, price_pro_plus, commission_percentage, referral_code } = body;
      
      if (!name || !email || !password || password.length < 6) {
        return new Response(JSON.stringify({ error: 'Nome, email e senha obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Create auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Assign reseller role
      await supabaseAdmin.from('user_roles').insert({ user_id: newUser.user.id, role: 'reseller' });

      // Create reseller record
      const finalReferralCode = referral_code || generateReferralCode(name);
      const { data: reseller, error: resellerError } = await supabaseAdmin.from('resellers').insert({
        user_id: newUser.user.id,
        name,
        email,
        whatsapp: whatsapp || null,
        access_type: access_type || 'own_only',
        pricing_mode: pricing_mode || 'commission',
        price_basic: price_basic || 37,
        price_pro: price_pro || 59.90,
        price_pro_plus: price_pro_plus || 79.90,
        commission_percentage: commission_percentage || 10,
        referral_code: finalReferralCode,
      }).select().single();

      if (resellerError) {
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        return new Response(JSON.stringify({ error: resellerError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ success: true, reseller }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_reseller') {
      const { reseller_id, ...updates } = body;
      const { data, error } = await supabaseAdmin.from('resellers').update(updates).eq('id', reseller_id).select().maybeSingle();
      if (error) throw error;
      if (!data) {
        return new Response(JSON.stringify({ error: 'Revendedor não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ success: true, reseller: data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get_reseller_stats') {
      const { reseller_id } = body;
      
      const { data: reseller } = await supabaseAdmin.from('resellers').select('*').eq('id', reseller_id).single();
      const { data: establishments } = await supabaseAdmin.from('establishments').select('*').eq('reseller_id', reseller_id);
      const { data: activations } = await supabaseAdmin.from('reseller_activations').select('*').eq('reseller_id', reseller_id).order('activated_at', { ascending: false });

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const pendingActivations = (activations || []).filter(a => a.commission_status === 'pending');
      const paidActivations = (activations || []).filter(a => a.commission_status === 'paid');
      const thisMonthActivations = (activations || []).filter(a => new Date(a.activated_at) >= monthStart);

      return new Response(JSON.stringify({
        reseller,
        establishments: establishments || [],
        activations: activations || [],
        pendingCommission: pendingActivations.reduce((sum, a) => sum + (a.commission_value || 0), 0),
        paidCommission: paidActivations.reduce((sum, a) => sum + (a.commission_value || 0), 0),
        totalCommission: (activations || []).reduce((sum, a) => sum + (a.commission_value || 0), 0),
        thisMonthActivations: thisMonthActivations.length,
        thisMonthCommission: thisMonthActivations.reduce((sum, a) => sum + (a.commission_value || 0), 0),
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'mark_commission_paid') {
      const { activation_ids } = body;
      const { error } = await supabaseAdmin.from('reseller_activations')
        .update({ commission_status: 'paid', commission_paid_at: new Date().toISOString() })
        .in('id', activation_ids);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'register_activation') {
      const { establishment_id, plan_type, plan_price, days } = body;
      
      // Check if establishment has a reseller
      const { data: establishment } = await supabaseAdmin.from('establishments').select('reseller_id, name').eq('id', establishment_id).single();
      
      if (!establishment?.reseller_id) {
        return new Response(JSON.stringify({ commission_registered: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Get reseller info
      const { data: reseller } = await supabaseAdmin.from('resellers').select('*').eq('id', establishment.reseller_id).single();
      
      if (!reseller || reseller.pricing_mode !== 'commission') {
        return new Response(JSON.stringify({ commission_registered: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Calculate and register commission
      const commissionValue = (plan_price * reseller.commission_percentage) / 100;
      
      await supabaseAdmin.from('reseller_activations').insert({
        reseller_id: reseller.id,
        establishment_id,
        establishment_name: establishment.name,
        plan_type,
        plan_price,
        days_activated: days,
        commission_percentage: reseller.commission_percentage,
        commission_value: commissionValue,
      });

      // Update reseller stats
      await supabaseAdmin.from('resellers').update({
        total_activations: reseller.total_activations + 1,
        last_activity_at: new Date().toISOString(),
      }).eq('id', reseller.id);

      return new Response(JSON.stringify({ 
        commission_registered: true, 
        commission_value: commissionValue,
        reseller_name: reseller.name 
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});