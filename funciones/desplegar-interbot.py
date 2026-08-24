# -*- coding: utf-8 -*-
"""
Despliega InterBot y el chat en el proyecto de Supabase, sin instalar nada.

Uso (PowerShell):
  $env:SUPABASE_ACCESS_TOKEN = "sbp_..."     # token personal de supabase.com/dashboard/account/tokens
  $env:GEMINI_API_KEY        = "AIza..."     # clave de aistudio.google.com (gratuita)
  python funciones\\desplegar-interbot.py

Opcionales:
  $env:GROQ_API_KEY          = "gsk_..."     # proveedor alternativo
  $env:INTERBOT_PROVEEDOR    = "gemini"      # o "groq"
  $env:INTERBOT_MODELOS      = "gemini-3.6-flash,gemini-3.5-flash,gemini-3.5-flash-lite"
  $env:PROJECT_REF           = "akdzvhnxkajwbrfyqqmt"

Pasos que ejecuta:
  1. Corre INSTALACION-INTERBOT-Y-CHAT.sql (tablas, políticas, bucket, sala general).
  2. Guarda las claves como secretos del proyecto (nunca en el sitio público).
  3. Crea o actualiza la función "interbot" con el código de funciones/interbot/index.ts.
  4. Hace una llamada de prueba real con la credencial IM-0001.
"""
import io, json, os, subprocess, sys, tempfile

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
REF = os.environ.get('PROJECT_REF', 'akdzvhnxkajwbrfyqqmt')
TOKEN = os.environ.get('SUPABASE_ACCESS_TOKEN', '')
API = 'https://api.supabase.com/v1/projects/%s' % REF

def fallar(msg):
    print('ERROR:', msg); sys.exit(1)

def curl(metodo, url, cuerpo=None, cabeceras=None, esperar=(200, 201)):
    """curl en vez de urllib: Cloudflare bloquea el agente de usuario de Python."""
    args = ['curl', '-s', '--max-time', '120', '-X', metodo, url,
            '-H', 'Authorization: Bearer ' + TOKEN,
            '-H', 'Content-Type: application/json',
            '-w', '\n%{http_code}']
    for k, v in (cabeceras or {}).items():
        args += ['-H', '%s: %s' % (k, v)]
    tmp = None
    if cuerpo is not None:
        tmp = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8')
        tmp.write(json.dumps(cuerpo)); tmp.close()
        args += ['--data-binary', '@' + tmp.name]
    out = subprocess.run(args, capture_output=True, text=True, encoding='utf-8').stdout
    if tmp: os.unlink(tmp.name)
    cuerpo_resp, _, codigo = out.rpartition('\n')
    try: datos = json.loads(cuerpo_resp) if cuerpo_resp.strip() else None
    except ValueError: datos = cuerpo_resp
    return int(codigo or 0), datos

if not TOKEN:
    fallar('falta SUPABASE_ACCESS_TOKEN')

# ---------------------------------------------------------------- 1. SQL
print('1. Instalando tablas, políticas y bucket del chat...')
sql = io.open(os.path.join(RAIZ, 'INSTALACION-INTERBOT-Y-CHAT.sql'), encoding='utf-8').read()
cod, datos = curl('POST', API + '/database/query', {'query': sql})
if cod not in (200, 201):
    fallar('SQL devolvió %s: %s' % (cod, str(datos)[:400]))
print('   listo')

# ---------------------------------------------------------------- 2. Secretos
print('2. Guardando secretos del proyecto...')
secretos = []
for nombre in ('GEMINI_API_KEY', 'GROQ_API_KEY', 'INTERBOT_PROVEEDOR', 'INTERBOT_MODELOS',
               'LIMITE_CODIGO_DIA', 'LIMITE_CODIGO_MINUTO', 'LIMITE_GLOBAL_DIA', 'ORIGENES_PERMITIDOS'):
    v = os.environ.get(nombre)
    if v: secretos.append({'name': nombre, 'value': v})
if not any(s['name'] in ('GEMINI_API_KEY', 'GROQ_API_KEY') for s in secretos):
    fallar('falta GEMINI_API_KEY (o GROQ_API_KEY)')
cod, datos = curl('POST', API + '/secrets', secretos)
if cod not in (200, 201):
    fallar('secretos devolvió %s: %s' % (cod, str(datos)[:400]))
print('   guardados:', ', '.join(s['name'] for s in secretos))

# ---------------------------------------------------------------- 3. Función
print('3. Desplegando la función interbot...')
fuente = io.open(os.path.join(AQUI, 'interbot', 'index.ts'), encoding='utf-8').read()
cuerpo = {'slug': 'interbot', 'name': 'InterBot', 'verify_jwt': False, 'body': fuente}
cod, datos = curl('POST', API + '/functions', cuerpo)
if cod in (200, 201):
    print('   función creada')
else:
    cod2, datos2 = curl('PATCH', API + '/functions/interbot', {'name': 'InterBot', 'verify_jwt': False, 'body': fuente})
    if cod2 in (200, 201):
        print('   función actualizada')
    else:
        fallar('crear devolvió %s (%s); actualizar devolvió %s (%s)' % (cod, str(datos)[:200], cod2, str(datos2)[:300]))

# ---------------------------------------------------------------- 4. Prueba
print('4. Prueba real con la credencial IM-0001...')
cfg = io.open(os.path.join(RAIZ, 'js', 'config.js'), encoding='utf-8').read()
import re
anon = re.search(r"SUPABASE_ANON:\s*'([^']+)'", cfg).group(1)
url_fn = 'https://%s.supabase.co/functions/v1/interbot' % REF
import time
time.sleep(4)
args = ['curl', '-s', '--max-time', '90', '-X', 'POST', url_fn,
        '-H', 'apikey: ' + anon, '-H', 'Authorization: Bearer ' + anon,
        '-H', 'Content-Type: application/json',
        '-H', 'Origin: https://bookcubers2-ux.github.io',
        '-d', json.dumps({'codigo': 'IM-0001', 'mensajes': [{'rol': 'usuario', 'texto': 'Cómo propongo un caucus moderado?'}]})]
salida = subprocess.run(args, capture_output=True, text=True, encoding='utf-8').stdout
print('   respuesta:', salida[:600])
print('\nListo. Si la respuesta de arriba trae "respuesta": "...", InterBot está funcionando.')
