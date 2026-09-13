from pathlib import Path

src = Path('styles.css')
bak = Path('styles.css.bak2')
bak.write_bytes(src.read_bytes())

lines = src.read_text(encoding='utf-8').splitlines(keepends=True)
marker = '/* ===== CONSISTENCY FIXES ===== */'
cut = next(i for i, line in enumerate(lines) if marker in line)

src.write_text(''.join(lines[:cut]), encoding='utf-8')
print(f'Backup: {bak}')
print(f'Truncated from line {cut}, kept {len(lines[:cut])} lines')
