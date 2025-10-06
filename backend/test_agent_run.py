import sys
import json
import traceback

print('PYTHONPATH (first 10 entries):')
for p in sys.path[:10]:
	print(' -', p)

try:
	from LuxorAI.luxor_agent import LuxorAgent
except Exception as e:
	print('Import failed:')
	traceback.print_exc()
	raise

print('Instantiating agent...')
agent = LuxorAgent()
print('llm_available =', agent.llm_available)

q = 'lux in bagumbayan'
print('Asking:', q)
resp = agent.answer(q, limit=5, use_llm=True)
print('\n--- RESPONSE SUMMARY ---')
print('question:', resp.get('question'))
print('\nanswer:\n', resp.get('answer'))
print('\nmodel:', resp.get('model'))
print('used_llm:', resp.get('used_llm'))
print('llm_available:', resp.get('llm_available'))
ctx = resp.get('context') or {}
print('context counts: illumination=', len(ctx.get('illumination', [])), 'barangays=', len(ctx.get('barangays', [])), 'streets=', len(ctx.get('streets', [])))

print('\nJSON dump preview:')
print(json.dumps(resp, ensure_ascii=False, indent=2))
