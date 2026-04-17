import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../config/database.js';
import { LoginSchema, RegisterSchema, ForgotPasswordSchema } from '../types/index.js';
import { createHash } from 'crypto';

// ============================================================
// ROUTES: Auth
// ============================================================

export async function authRoutes(fastify: FastifyInstance) {

  // ---- POST /api/auth/register ----
  fastify.post('/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = RegisterSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: parsed.error.errors[0].message,
      });
    }

    const { name, email, password } = parsed.data;

    try {
      // Cria usuário no Supabase Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: { name },
        email_confirm: true,
      });

      if (authError) {
        if (authError.message.includes('already')) {
          return reply.status(409).send({
            success: false,
            error: 'Este email já está cadastrado',
          });
        }
        return reply.status(400).send({ success: false, error: authError.message });
      }

      // Insere na tabela users (se não existir via trigger)
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.user!.id,
          email,
          name,
          plan: 'free',
          analyses_count: 0,
        });

      if (dbError) {
        console.error('[Auth] Erro ao inserir user no DB:', dbError);
      }

      return reply.status(201).send({
        success: true,
        user: {
          id: authUser.user!.id,
          email: authUser.user!.email,
          name,
          plan: 'free',
        },
      });
    } catch (err: any) {
      console.error('[Auth/Register] Erro:', err);
      return reply.status(500).send({ success: false, error: 'Erro interno' });
    }
  });

  // ---- POST /api/auth/login ----
  fastify.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = LoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: parsed.error.errors[0].message,
      });
    }

    const { email, password } = parsed.data;

    try {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return reply.status(401).send({
          success: false,
          error: 'Email ou senha incorretos',
        });
      }

      // Busca dados do usuário no banco
      const { data: dbUser } = await supabaseAdmin
        .from('users')
        .select('id, name, plan, analyses_count')
        .eq('id', data.user.id)
        .single();

      return reply.send({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: dbUser?.name || data.user.user_metadata?.name,
          plan: dbUser?.plan || 'free',
          analyses_count: dbUser?.analyses_count || 0,
        },
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
      });
    } catch (err: any) {
      console.error('[Auth/Login] Erro:', err);
      return reply.status(500).send({ success: false, error: 'Erro interno' });
    }
  });

  // ---- POST /api/auth/forgot-password ----
  fastify.post('/auth/forgot-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = ForgotPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: parsed.error.errors[0].message,
      });
    }

    const { email } = parsed.data;

    try {
      const { error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
      });

      // Sempre retorna sucesso (mesmo se email não existir — segurança)
      return reply.send({
        success: true,
        message: 'Se o email existir, um link de recuperação foi enviado.',
      });
    } catch (err: any) {
      console.error('[Auth/ForgotPassword] Erro:', err);
      return reply.status(500).send({ success: false, error: 'Erro interno' });
    }
  });

  // ---- GET /api/auth/me ----
  fastify.get('/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const token = authHeader.slice(7);

    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) {
        return reply.status(401).send({ success: false, error: 'Token inválido' });
      }

      const { data: dbUser } = await supabaseAdmin
        .from('users')
        .select('id, name, plan, analyses_count, created_at')
        .eq('id', user.id)
        .single();

      return reply.send({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: dbUser?.name || user.user_metadata?.name,
          plan: dbUser?.plan || 'free',
          analyses_count: dbUser?.analyses_count || 0,
          created_at: dbUser?.created_at,
        },
      });
    } catch (err: any) {
      console.error('[Auth/Me] Erro:', err);
      return reply.status(500).send({ success: false, error: 'Erro interno' });
    }
  });

  // ---- POST /api/auth/logout ----
  fastify.post('/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ success: true });
  });
}