import { Router, Request, Response } from 'express';
const router = Router();

function makeWorkbook(kind: 'requests'|'vendors'|'inventory') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const XLSX = require('xlsx');
  const wb = XLSX.utils.book_new();
  let header = [] as string[];
  if (kind === 'requests') header = ['orderNo','department','vendor','requiredDate','itemCode','itemName','qty','unit','warehouse','machine','requester'];
  else if (kind === 'vendors') header = ['code','name','status','categories','regions'];
  else header = ['code','name','category','qty','unit','minLevel','warehouse','supplierRisk','expiry'];
  const ws = XLSX.utils.aoa_to_sheet([header]);
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

router.get('/:kind', (req: Request, res: Response) => {
  try {
    let k = String(req.params.kind || '').toLowerCase();
    if (k.endsWith('.xlsx')) k = k.replace(/\.xlsx$/, '');
    if (['requests','vendors','inventory'].indexOf(k) === -1) {
      return res.status(404).json({ error: 'template_not_found' });
    }
    const buf = makeWorkbook(k as any);
    const filename = k + '_template.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.send(buf);
  } catch (e) {
    res.status(500).json({ error: 'template_generate_failed' });
  }
});

export default router;
