import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(source);
const ctx=vm.createContext({matchMedia:()=>({matches:false})});
vm.runInContext(source.replace(/\ninit\(\);\ninitPublication\(\);\s*$/,''),ctx);
const run=s=>vm.runInContext(s,ctx);
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t, a+' != '+b);
const views={};
for(const id of ['households','banks','cb','state','firms','funds','equities','bonds']){views[id]=run('essentialContent('+JSON.stringify(id)+')');assert.ok(!/undefined|NaN|Infinity/.test(views[id]),id)}
assert.equal(run('nodes.length'),6);
assert.ok(run('flows.every(f=>Object.hasOwn(N,f.a)&&Object.hasOwn(N,f.b)&&(f.refs||[]).every(k=>sources[k]))'));
assert.ok(run('flows.every(f=>{const r=connectionRoute(f);return r.blocked===0&&r.points.every(Number.isFinite)})'));
near(run('bankDualPricingModel().fundingBase'),2.6);
near(run("bankContractPricing(bankDualPricingModel(),'variable').fundingTotal"),5.4);
near(run("bankContractPricing(bankDualPricingModel(),'fixed').fundingTotal"),7.32);
for(const year of [0,1,2,3]){run('systemLesson.companyYear='+year);const v=run('companyProjectValuation()');near(v.value,v.capital+v.npv);near(v.value,v.debt+v.equityValue);near(v.debt,v.capital*.4);near(v.equityInvested,v.capital*.6);near(v.equityValue,v.equityInvested+v.npv);assert.ok(v.projects.slice(1).every(p=>p.npv===0));views['firm-year-'+year]=run("essentialContent('firms')")}

// Initial financing is 40 debt + 60 contributed equity; NPV belongs to equity.
{const v=run('companyProjectValuation(companyValueViewModel(),0)');near(v.debt,40);near(v.equityInvested,60);near(v.equityValue,60+v.npv);const view=run("essentialContent('firms')");assert.ok(view.includes('Assume constant target D/E (market values) and business risk.'));assert.ok(!view.includes('data-sys-key="companyYear"'));assert.ok(!view.includes('cl-terminal'))}
for(const contract of ['variable','fixed'])for(const beta of [.5,1,1.5]){run('bankLoanContract.type='+JSON.stringify(contract)+';systemLesson.equityBeta='+beta);for(const year of [0,1,2,3]){const v=run('companyProjectValuation(companyValueViewModel(),'+year+')');near(v.debt,.4*v.capital);near(v.equityInvested,.6*v.capital);near(v.value,v.debt+v.equityValue);near(v.equityValue,v.equityInvested+v.npv);assert.ok(v.projects.slice(1).every(p=>p.npv===0))}}
run('bankLoanContract.type="variable";systemLesson.equityBeta=1');
const q=run('companyEndValueModel()');
const pv=[1,2,3,4,5].reduce((s,y)=>s+(15+(y===5?100:0))/(1+q.wacc/100)**y,0);
near(q.classicNPV,pv-100);near(q.excess,q.classicNPV*q.compoundFactor);
const g=run('systemGovernmentModel()');near(g.issuance,g.deficit+g.maturing);near(g.closingDebt,g.openingDebt-g.maturing+g.issuance);
for(const required of [2,15,30])for(const offered of [0,3,15,30]){run('householdPreviousRates=householdWaitingModel()');run('Object.assign(systemLesson,'+JSON.stringify({householdRequiredReturn:required,householdRealRate:offered})+')');const h=run('householdWaitingModel()');near(h.requiredFuture,h.amount*(1+required/100));near(h.offeredFuture,h.amount*(1+offered/100));near(h.mrs,1+required/100);assert.equal(h.choice,offered>required?'wait':offered<required?'now':'equal');const view=run("essentialContent('households')");assert.ok(!/undefined|NaN|Infinity/.test(view));assert.equal((view.match(/<details/g)||[]).length,0);assert.ok(!view.includes('Why not borrow more?'));assert.ok(view.includes('hhw-mrs-title'));const g=run('householdMRSModel()');near(g.currentMRS,h.mrs);near(g.balanceMRS,g.gross);assert.ok(g.optimumNow>0&&g.optimumNow<250&&g.optimumLater>0&&g.optimumLater<250);near(g.optimumLater+g.gross*g.optimumNow,g.budgetLater);near(g.optimumLater/(g.beta*g.optimumNow),g.gross);assert.ok(g.curve.every(p=>p.now>0&&p.now<=250&&p.later>0&&p.later<=250));for(const p of g.curve)near(Math.log(p.now)+g.beta*Math.log(p.later),g.utility);if(h.choice==='wait')assert.ok(g.balance>0);if(h.choice==='now')assert.ok(g.balance<0);if(h.choice==='equal')near(g.balance,0);views['household-'+required+'-'+offered]=view}
{const h=run('householdWaitingModel({householdRequiredReturn:15,householdRealRate:0})'),g=run('householdMRSModel(householdWaitingModel({householdRequiredReturn:15,householdRealRate:0}))');near(h.incomeNow,100);near(h.incomeLater,100);near(h.amount,1);near(g.budgetNow,200);near(-g.balance,6.97674418604651);near(g.optimumNow,106.97674418604652);near(g.optimumLater,93.02325581395348);assert.ok(-g.balance<h.incomeLater/g.gross)}
near(run('bondTeachingPrice(3,5).price'),1000);assert.ok(run('bondTeachingPrice(5,5).price<bondTeachingPrice(2,5).price'));
for(const implementation of ['active','passive'])for(const benchmark of ['market','style'])for(const mix of ['value','valueSize'])for(const model of ['capm','marketValue','ff3','ff5']){run('Object.assign(systemLesson,'+JSON.stringify({fundEquityImplementation:implementation,fundBenchmark:benchmark,fundFactorMix:mix,fundModel:model})+')');const m=run('systemFundModel()'),a=run('fundsBenchmarkAttribution()');near(a.explainedActive,m.active);if(implementation==='passive')near(m.gross,m.benchmark);views['fund-'+implementation+'-'+benchmark+'-'+mix+'-'+model]=run("essentialContent('funds')")}
for(const route of ['banks','cb','funds','bonds','firms','households','state','equities'])assert.equal(run('publicationRoute('+JSON.stringify('#'+route)+').kind'),'node');
for(const route of ['#toString','#constructor','#flow/constructor','#story/0','#story/1','#story/9','#story/10','#%E0%A4%A','#unknown'])assert.equal(run('publicationRoute('+JSON.stringify(route)+').kind'),'invalid');
assert.equal(run("publicationRoute('#flow/loanH').id"),'loanH');
assert.equal(run("publicationRoute('#rates').kind"),'rates');assert.ok(!/onmouseenter|onmouseleave/.test(run('initRatesHub.toString()')));assert.ok(run('ratesMapTile()').includes('Interest rates'));

for(const scenario of ['base','saving','investment','deficit'])for(const policy of [2,4,6]){run('Object.assign(ratesHubState,'+JSON.stringify({scenario,policy})+')');const m=run('ratesHubModel()');near(m.privateSaving,m.investment+m.deficit);near((m.quantity-25-m.savingShift)/25,m.rStar);near((115+m.investmentShift+m.deficit-m.quantity)/25,m.rStar);near(m.realPolicy,m.policy-m.expectedInflation);const v=run('ratesHubPanel()');assert.ok(!/undefined|NaN|Infinity/.test(v));assert.equal((v.match(/class="rh-chart"/g)||[]).length,1);assert.equal((v.match(/data-rates-node=/g)||[]).length,6);assert.ok(!/class="rh-actor|class="rh-flow/.test(v));for(const id of ['households','firms','state','cb','banks','funds'])assert.ok(v.includes('data-rates-node="'+id+'"'));assert.ok(v.includes('Saving supply</text>')&&v.includes('Financing demand</text>'));assert.equal(v.includes('class="rh-policy-gap"'),Math.abs(m.stance)>.001);views['rates-'+scenario+'-'+policy]=v}
{const a=run("ratesHubModel({scenario:'base',policy:4})"),s=run("ratesHubModel({scenario:'saving',policy:4})"),i=run("ratesHubModel({scenario:'investment',policy:4})"),g=run("ratesHubModel({scenario:'deficit',policy:4})");assert.ok(s.rStar<a.rStar&&i.rStar>a.rStar&&g.rStar>a.rStar&&g.investment<a.investment)}
run('ratesHubState.open=true;state.selected=null;state.flow=null');views.ratesMapBridge=run('ratesMapBridge()');run('ratesHubState.open=false;state.selected=null;state.flow=null');views.ratesMapClosed=run('ratesMapBridge()');assert.equal((views.ratesMapClosed.match(/data-rates-relation=/g)||[]).length,6);views.ratesMapTile=run('ratesMapTile()');assert.ok(views.ratesMapTile.includes('rh-center-body'));assert.ok(views.ratesMapBridge.includes('Not payment flows'));
for(const id of ['cb'])assert.ok(run('essentialContent('+JSON.stringify(id)+')').includes('data-rates-open'));
views.compactMap=run('publicationCompactMap()');assert.equal((views.compactMap.match(/data-compact-node=/g)||[]).length,6);

// Grouping must retain every flow, its direction and its category.
for(const actor of run('nodes.map(n=>n.id)')){
 run('state.selected='+JSON.stringify(actor)+';state.flow=null');
 const expected=run('flows.filter(f=>f.a===state.selected||f.b===state.selected).map(f=>f.id).sort()');
 const groups=run('mapFocusedGroups()'),actual=groups.flatMap(g=>g.flows.map(f=>f.id)).sort();
 assert.deepEqual(Array.from(actual),Array.from(expected));
 for(const g of groups)assert.ok(g.flows.every(f=>f.a===g.a&&f.b===g.b&&f.type===g.type));
 const layout=run('mapFocusedLayout()');
 const frame=run('mapFrameBounds()');for(const p of Object.values(layout.positions))assert.ok(p.x-100>=frame.x&&p.x+100<=frame.x+frame.width&&p.y-32>=frame.y&&p.y+32<=frame.y+frame.height);
 assert.ok(groups.every(g=>layout.routes[g.key]&&!/NaN|undefined|Infinity/.test(layout.routes[g.key].path)));
}
for(const flow of run('flows')){
 run('state.selected=null;state.flow='+JSON.stringify(flow.id));
 const groups=run('mapFocusedGroups()');assert.equal(groups.length,1);assert.equal(groups[0].flows.length,1);
 assert.equal(run('mapFocusedLabel(mapFocusedGroups()[0])'),flow.label);
}
run('state.selected=null;state.flow=null');


for(const id of ['households','banks','cb','state','firms','funds','equities','bonds']){const v=run('essentialContent('+JSON.stringify(id)+')');assert.ok(!/Explore further|essentialMore/.test(v));for(const m of v.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/g))assert.equal(m[1].replace(/<[^>]+>/g,'').trim(),'Sources')}

for(const key of ['og:title','og:description','og:image','og:url'])assert.ok(html.includes('property="'+key+'"'));
assert.ok(!/C:\\Users|C:\/Users|OneDrive|\.codex/i.test(html));
assert.ok(!/<script[^>]+src=/i.test(html));
if(process.argv.includes('--views'))process.stdout.write(JSON.stringify(views));else console.log('PASS: financial identities, scenarios, routing, links and publication metadata.');

{const v=run("essentialContent('households')");assert.ok(!/hhw-choice-note|hhw-route-links|hhw-caption|rates-card-bridge/.test(v));}

run('Object.assign(ratesHubState,{scenario:"base",policy:2,expectedShort:4});bankLoanContract.type="fixed";systemLesson.equityBeta=1;systemLesson.bondCorporateSpread=1.5;systemLesson.bondGovernmentSpread=.4;systemLesson.companyDebtSource="bond"');

// Present value of annual economic surplus equals the standard project NPV.
for(const contract of ['variable','fixed'])for(const beta of [.5,1,1.5]){run('bankLoanContract.type='+JSON.stringify(contract)+';systemLesson.equityBeta='+beta);const s=run('companySurplusValueModel()'),base=run('companyEndValueModel()');near(s.charge,s.investment*s.wacc/100);near(s.cash,s.charge+s.surplus);near(s.npv,s.rows.reduce((sum,y)=>sum+y.pv,0));near(s.npv,base.classicNPV);near(s.value,s.investment+s.npv);assert.equal(s.rows.length,5);for(const y of s.rows){near(y.pv,y.surplus*y.factor);near(y.factor,(1+s.wacc/100)**(-y.year))}}
run('Object.assign(ratesHubState,{scenario:"base",policy:2,expectedShort:4});bankLoanContract.type="fixed";systemLesson.equityBeta=1;systemLesson.bondCorporateSpread=1.5;systemLesson.bondGovernmentSpread=.4;systemLesson.companyDebtSource="bond"');
{const s=run('companySurplusValueModel()');near(s.investment,100);near(s.wacc,7.5);near(s.charge,7.5);near(s.surplus,7.5);near(s.npv,30.34413676498839)}

// One curve feeds every nominal pricing lesson, including fixed/variable bank loans.
for(const policy of [2,4,6])for(const expected of [3,4,5])for(const source of ['bond','bank'])for(const contract of ['variable','fixed'])for(const beta of [.5,1,1.5]){
 run('systemLesson.companyDebtSource='+JSON.stringify(source)+';ratesHubState.policy='+policy+';ratesHubState.expectedShort='+expected+';bankLoanContract.type='+JSON.stringify(contract)+';systemLesson.equityBeta='+beta);
 const c=run('marketRateCurve()'),b=run('companyCostBuildUpModel()'),e=run('systemEquityModel()'),bank=run('bankContractPricing()'),shared=run('fundsReturnPathExample()'),bond=run('systemBondModel()'),gov=run('systemGovernmentModel()');
 near(c.overnight,policy+.1);near(c.marketBase,expected+.5);near(shared.marketBase,c.marketBase);near(e.riskFree,c.marketBase);near(bond.reference,c.marketBase);near(b.equityBase,c.marketBase);
 near(run('bankPolicyExample.depositRate'),policy);near(run('bankRateQuotes.fixed'),c.marketBase);near(run('bankRateQuotes.short'),c.overnight);near(bank.fixedTotal,c.marketBase+.02+2.8);near(bank.hedgedShare,.8);near(bank.adjustment,contract==='fixed'?.8*(c.marketBase-c.overnight):0);
 near(run('bankDualPricingModel().fundingBase'),.8*policy+.2*(c.marketBase+.5));
 near(b.debtMarket,source==='bond'||contract==='fixed'?c.marketBase:c.overnight);near(b.debtBuilt,source==='bond'?bond.corporate:bank.fundingTotal);near(b.equityBuilt,c.marketBase+beta*4+1);near(b.equityBuilt,shared.equityReturn);near(shared.bondYield,bond.corporate);
 near(b.wacc,b.debtContribution+b.equityContribution);near(b.debtContribution,.4*b.debtBuilt*.75);near(b.equityContribution,.6*e.required);near(gov.marketYield,bond.government);
 const view=run("essentialContent('firms')");assert.ok(!/undefined|NaN|Infinity|\+−|\+ -/.test(view));assert.equal((view.match(/class="ccbu-result"/g)||[]).length,2);
 const project=run('companySurplusValueModel()');near(project.npv,project.classicNPV);
}
run('Object.assign(ratesHubState,{scenario:"base",policy:2,expectedShort:4});bankLoanContract.type="fixed";systemLesson.equityBeta=1;systemLesson.bondCorporateSpread=1.5;systemLesson.bondGovernmentSpread=.4;systemLesson.companyDebtSource="bond"');
