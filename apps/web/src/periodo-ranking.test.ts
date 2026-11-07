import {it} from 'node:test';
import assert from 'node:assert/strict';
import {renovarPeriodoRanking} from './periodo-ranking';
it('ranking acompanha virada mensal e anual sem abandonar uma consulta histórica',()=>{
 assert.equal(renovarPeriodoRanking('2026-10','2026-10','2026-11'),'2026-11');
 assert.equal(renovarPeriodoRanking('2026-09','2026-10','2026-11'),'2026-09');
 assert.equal(renovarPeriodoRanking('2026-12','2026-12','2027-01'),'2027-01');
 assert.equal(renovarPeriodoRanking('2026','2026','2027'),'2027');
 assert.equal(renovarPeriodoRanking('2025','2026','2027'),'2025');
});
