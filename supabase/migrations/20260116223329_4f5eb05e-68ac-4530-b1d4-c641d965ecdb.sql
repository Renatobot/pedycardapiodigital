-- Atribuir role de admin ao usuário admin@pedy.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@pedy.com'
ON CONFLICT (user_id, role) DO NOTHING;