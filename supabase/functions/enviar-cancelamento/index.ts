import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

Deno.serve(async (req: Request) => {
  try {
    const { email, nome, empresa } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ erro: 'Email obrigatorio' }), { status: 400 })
    }

    const primeiroNome = (nome ?? 'cliente').split(' ')[0]

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Assinatura cancelada — Proposta Exata</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0f0e17;padding:32px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:12px;">
              <div style="width:40px;height:40px;background:linear-gradient(135deg,#f97316,#c2410c);border-radius:8px;"></div>
              <span style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">Proposta <span style="color:#f97316;">Exata</span></span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#0f0e17;">Assinatura cancelada</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Olá, ${primeiroNome}. Confirmamos o cancelamento da sua assinatura Pro${empresa ? ` da empresa <strong>${empresa}</strong>` : ''}.</p>
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#dc2626;">O que mudou na sua conta:</p>
              <ul style="margin:0;padding-left:20px;">
                <li style="font-size:14px;color:#374151;margin-bottom:6px;">Voltou para o Plano Free (5 orçamentos/mês)</li>
                <li style="font-size:14px;color:#374151;margin-bottom:6px;">Acesso a Equipe, Estoque e Relatórios suspenso</li>
                <li style="font-size:14px;color:#374151;">Seus dados permanecem salvos</li>
              </ul>
            </div>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;">Sentimos sua falta. Se quiser voltar ao Pro a qualquer momento:</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="https://propostaexata.com.br/fundadores" style="background:#f97316;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block;">Reativar minha assinatura →</a>
            </div>
            <p style="margin:0;font-size:14px;color:#6b7280;">Dúvidas? Fale conosco pelo WhatsApp: <a href="https://wa.me/5516991169184" style="color:#f97316;">(16) 99116-9184</a></p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Proposta Exata · CDD Tech Solutions · <a href="https://propostaexata.com.br" style="color:#9ca3af;">propostaexata.com.br</a></p>
            <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">Ribeirão Preto, SP · Brasil</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Proposta Exata <noreply@propostaexata.com.br>',
        to: [email],
        subject: 'Assinatura cancelada — Proposta Exata',
        html,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      return new Response(JSON.stringify({ erro: 'Erro ao enviar email', detalhes: data }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true, id: data.id }), { status: 200 })

  } catch (err) {
    return new Response(JSON.stringify({ erro: 'Erro interno' }), { status: 500 })
  }
})
