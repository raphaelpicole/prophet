# Guia: Stripe + Prophet — Integração de Pagamentos

## 📋 Visão Geral

Este guia cobre:
1. Criar conta no Stripe
2. Configurar produtos e preços
3. Integrar backend (Node.js/Vercel)
4. Integrar frontend (Flutter Web)
5. Webhooks para confirmação de pagamento

---

## 1️⃣ Criar Conta no Stripe

### Passo a passo:

1. Acesse: https://dashboard.stripe.com/register
2. Crie uma conta (email + senha)
3. Complete o perfil da empresa:
   - Tipo de negócio: SaaS / Assinatura
   - Dados bancários para recebimento
   - Documentos de verificação (CNPJ ou CPF)
4. Ative modo "Teste" primeiro (ambiente sandbox)

### ⚠️ Importante para Brasil:
- Stripe aceita PIX e cartões internacionais
- Para receber no Brasil, você precisa de conta bancária compatível
- Taxas: ~3.99% + R$0.50 por transação (PIX é mais barato)

---

## 2️⃣ Configurar Produtos e Preços

### No Dashboard Stripe:

1. Vá em **Product Catalog > Products**
2. Clique em **+ Add Product**
3. Configure:
   ```
   Nome: Prophet Premium
   Descrição: Acesso completo às previsões geopolíticas
   ```
4. Adicione um preço:
   ```
   Pricing model: Standard pricing
   Price: R$ 29,90
   Billing period: Monthly (assinatura)
   ```
5. Anote o **Price ID** (ex: `price_1ABC123...`)

### Criar Checkout Session:

O Stripe recomenda usar **Checkout Session** para Flutter Web:
- Seguro (Stripe hospeda o formulário)
- Suporta cartão, PIX, boleto
- Redireciona de volta ao seu app

---

## 3️⃣ Backend — Configuração Node.js

### 3.1 Instalar dependências

```bash
cd /Users/ti/.openclaw/workspace/prophet/server
npm install stripe
npm install --save-dev @types/stripe
```

### 3.2 Configurar variáveis de ambiente

Adicione ao `.env`:
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_1ABC123...
STRIPE_SUCCESS_URL=https://prophet-olive.vercel.app/payment/success
STRIPE_CANCEL_URL=https://prophet-olive.vercel.app/payment/cancel
```

### 3.3 Criar API Endpoints

#### `api/stripe/checkout.ts` — Criar sessão de checkout

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { withSentry } from '../../src/middleware/sentry.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, email } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: process.env.STRIPE_SUCCESS_URL!,
      cancel_url: process.env.STRIPE_CANCEL_URL!,
      metadata: {
        userId,
      },
      customer_email: email,
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}

export default withSentry(handler);
```

#### `api/stripe/webhook.ts` — Receber eventos do Stripe

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ⚠️ IMPORTANTE: Webhook NÃO usar withSentry (precisa do raw body)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  
  let event;

  try {
    // ⚠️ Precisa do raw body, não do parsed JSON
    // No Vercel, use um middleware ou configuração especial
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Processar eventos
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      // Atualizar Supabase
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: 'active',
          plan: 'premium',
          updated_at: new Date().toISOString(),
        });

      break;
    }

    case 'invoice.payment_failed': {
      const subscription = event.data.object;
      
      await supabase
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.subscription);

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      
      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      break;
    }
  }

  return res.status(200).json({ received: true });
}
```

---

## 4️⃣ Frontend Flutter — Integração

### 4.1 Adicionar dependência

```bash
flutter pub add stripe_checkout
# OU
flutter pub add flutter_stripe
```

Para **Flutter Web**, a maneira mais simples é redirecionar para URL do Stripe Checkout.

### 4.2 Criar tela de Assinatura

#### `lib/presentation/screens/paywall_screen.dart` (atualizar)

```dart
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:html' as html;
import '../../core/theme/app_theme.dart';

class PaywallScreen extends StatelessWidget {
  const PaywallScreen({super.key});

  Future<void> _startCheckout(BuildContext context) async {
    try {
      final response = await http.post(
        Uri.parse('https://prophet-olive.vercel.app/api/stripe/checkout'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': 'user_id_aqui', // Pegar do auth
          'email': 'user@email.com', // Pegar do auth
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final checkoutUrl = data['url'];
        
        // Flutter Web: redirecionar para Stripe
        html.window.location.href = checkoutUrl;
      } else {
        throw Exception('Failed to create checkout session');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.fundo,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Assinar Prophet Premium'),
      ),
      body: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 400),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Ícone
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.workspace_premium,
                  size: 48,
                  color: AppTheme.primary,
                ),
              ),
              const SizedBox(height: 24),
              
              // Título
              Text(
                'Prophet Premium',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: AppTheme.texto,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Acesso ilimitado a todas as previsões geopolíticas',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppTheme.textoSec),
              ),
              const SizedBox(height: 32),
              
              // Preço
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'R\$ 29,90',
                      style: TextStyle(
                        color: AppTheme.primary,
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '/mês',
                      style: TextStyle(
                        color: AppTheme.textoSec,
                        fontSize: 18,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              
              // Benefícios
              _buildFeature('✅ Previsões em tempo real'),
              _buildFeature('✅ Alertas de conflitos'),
              _buildFeature('✅ Análises exclusivas'),
              _buildFeature('✅ Histórico completo'),
              const SizedBox(height: 32),
              
              // Botão
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _startCheckout(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Assinar Agora',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Pagamento seguro via Stripe',
                style: TextStyle(
                  color: AppTheme.textoSec,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeature(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: TextStyle(
          color: AppTheme.texto.withOpacity(0.8),
          fontSize: 14,
        ),
      ),
    );
  }
}
```

---

## 5️⃣ Supabase — Schema de Subscrições

Execute no SQL Editor do Supabase:

```sql
-- Tabela de assinaturas
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive', -- inactive, active, past_due, cancelled
  plan TEXT NOT NULL DEFAULT 'free', -- free, premium
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Índices
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 6️⃣ Configurar Webhook no Stripe

### 6.1 Obter webhook secret:

1. No Dashboard Stripe: **Developers > Webhooks**
2. Clique em **+ Add endpoint**
3. URL: `https://prophet-olive.vercel.app/api/stripe/webhook`
4. Selecione eventos:
   - `checkout.session.completed`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copie o **Signing secret** (whsec_...)
6. Adicione ao `.env` como `STRIPE_WEBHOOK_SECRET`

### 6.2 ⚠️ Problema com raw body no Vercel

O Stripe webhook precisa do **raw body** para verificar a assinatura. No Vercel, você precisa desativar o parsing automático:

Crie `vercel.json` (se não existir):
```json
{
  "functions": {
    "api/stripe/webhook.ts": {
      "maxDuration": 30
    }
  }
}
```

E no webhook handler, você precisa acessar `req.rawBody` ou buffer. No Vercel Node.js, use:

```typescript
// No início do handler webhook
const buf = await buffer(req);
const rawBody = buf.toString('utf8');

event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
```

---

## 7️⃣ Fluxo Completo

```
Usuário clica "Assinar"
  ↓
App chama POST /api/stripe/checkout
  ↓
Backend cria Stripe Checkout Session
  ↓
Retorna URL do Stripe
  ↓
App redireciona para Stripe (página de pagamento)
  ↓
Usuário paga no Stripe
  ↓
Stripe redireciona de volta (success/cancel)
  ↓
Stripe envia webhook para /api/stripe/webhook
  ↓
Backend atualiza Supabase (status: active)
  ↓
Usuário tem acesso Premium! 🎉
```

---

## 8️⃣ Verificar Status da Assinatura

### API para frontend verificar:

```typescript
// api/stripe/status.ts
import { withSentry } from '../../src/middleware/sentry.js';

async function handler(req, res) {
  const { userId } = req.query;
  
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  return res.status(200).json({
    isPremium: subscription?.status === 'active',
    plan: subscription?.plan || 'free',
    status: subscription?.status || 'inactive',
  });
}
```

---

## 🎯 Resumo

| Componente | O que fazer |
|------------|-------------|
| **Stripe** | Criar conta, configurar produto (R$29,90/mês), obter API keys |
| **Backend** | Instalar `stripe`, criar endpoints checkout/webhook, conectar Supabase |
| **Frontend** | Tela de paywall, redirecionar para Stripe Checkout |
| **Supabase** | Criar tabela `subscriptions`, campos para status |
| **Webhook** | Configurar URL no Stripe dashboard, tratar eventos |

---

## ⚡ Próximos Passos

Quer que eu implemente isso no Prophet?

Posso:
1. ✅ Instalar dependências no backend
2. ✅ Criar endpoints da API
3. ✅ Atualizar tela de paywall
4. ✅ Criar schema no Supabase
5. ✅ Fazer deploy

É só confirmar! 🚀
