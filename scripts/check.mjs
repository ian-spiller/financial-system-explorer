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

// A single hypothetical neutral baseline feeds all cards, not live market data.
{
 const m=run('ratesHubModel()'),c=run('marketRateCurve()'),g=run('systemGovernmentModel()'),s=run('companySurplusValueModel()'),v=run('companyProjectValuation(companyValueViewModel(),0)');
 near(m.rStar,1);near(m.realPolicy,1);near(m.policy,3);near(m.expectedInflation,2);near(m.quantity,75);near(m.investment,65);near(m.stance,0);
 near(c.overnight,3.1);near(c.marketBase,3.5);near(g.marketYield,3.9);near(g.nextInterest,6.2);
 near(s.wacc,6.6);near(s.surplus,8.4);near(s.npv,34.813698511233305);near(v.value,134.8136985112333);near(v.debt,40);near(v.equityValue,94.8136985112333);
 near(run('householdWaitingModel().offered'),1);near(run('householdWaitingModel().required'),1);near(run('householdMRSModel().balance'),0);near(run('householdMRSModel().optimumNow'),10000);near(run('householdMRSModel().optimumLater'),10000);near(run('systemFundModel().gross'),11);near(run('systemFundModel().benchmark'),8);
 assert.ok(html.includes('Teaching example · not current market rates'));
 for(const id of ['households','banks','cb','state','firms','funds','equities','bonds'])assert.ok(views[id].includes('Teaching example · not current market rates'),id);
 const panel=run('ratesHubPanel()');assert.ok(panel.includes('Teaching example · not current market rates'));assert.ok(panel.includes('ECB 3% · neutral'));
}
assert.equal(run('nodes.length'),6);
assert.ok(run('flows.every(f=>Object.hasOwn(N,f.a)&&Object.hasOwn(N,f.b)&&(f.refs||[]).every(k=>sources[k]))'));
assert.ok(run('flows.every(f=>{const r=connectionRoute(f);return r.blocked===0&&r.points.every(Number.isFinite)})'));
near(run('bankDualPricingModel().fundingBase'),3.2);
near(run("bankContractPricing(bankDualPricingModel(),'variable').fundingTotal"),6);
near(run("bankContractPricing(bankDualPricingModel(),'fixed').fundingTotal"),6.32);
for(const year of [0,1,2,3]){run('systemLesson.companyYear='+year);const v=run('companyProjectValuation()');near(v.value,v.capital+v.npv);near(v.value,v.debt+v.equityValue);near(v.debt,v.capital*.4);near(v.equityInvested,v.capital*.6);near(v.equityValue,v.equityInvested+v.npv);assert.ok(v.projects.slice(1).every(p=>p.npv===0));views['firm-year-'+year]=run("essentialContent('firms')")}

// Initial financing is 40 debt + 60 contributed equity; NPV belongs to equity.
{const v=run('companyProjectValuation(companyValueViewModel(),0)');near(v.debt,40);near(v.equityInvested,60);near(v.equityValue,60+v.npv);const view=run("essentialContent('firms')");assert.ok(view.includes('Assume constant target D/E (market values) and business risk.'));assert.ok(!view.includes('data-sys-key="companyYear"'));assert.ok(!view.includes('cl-terminal'))}
for(const contract of ['variable','fixed'])for(const beta of [.5,1,1.5]){run('bankLoanContract.type='+JSON.stringify(contract)+';systemLesson.equityBeta='+beta);for(const year of [0,1,2,3]){const v=run('companyProjectValuation(companyValueViewModel(),'+year+')');near(v.debt,.4*v.capital);near(v.equityInvested,.6*v.capital);near(v.value,v.debt+v.equityValue);near(v.equityValue,v.equityInvested+v.npv);assert.ok(v.projects.slice(1).every(p=>p.npv===0))}}
run('bankLoanContract.type="variable";systemLesson.equityBeta=1');
const q=run('companyEndValueModel()');
const pv=[1,2,3,4,5].reduce((s,y)=>s+(15+(y===5?100:0))/(1+q.wacc/100)**y,0);
near(q.classicNPV,pv-100);near(q.excess,q.classicNPV*q.compoundFactor);
const g=run('systemGovernmentModel()');near(g.issuance,g.deficit+g.maturing);near(g.closingDebt,g.openingDebt-g.maturing+g.issuance);
for(const required of [0,1,2])for(const offered of [0,1,2,3]){run('householdPreviousRates=householdWaitingModel()');run('Object.assign(systemLesson,'+JSON.stringify({householdRequiredReturn:required,householdRealRate:offered})+')');const h=run('householdWaitingModel()');near(h.requiredFuture,h.amount*(1+required/100));near(h.offeredFuture,h.amount*(1+offered/100));near(h.mrs,1+required/100);assert.equal(h.choice,offered>required?'wait':offered<required?'now':'equal');const view=run("essentialContent('households')");assert.ok(!/undefined|NaN|Infinity/.test(view));assert.equal((view.match(/<details/g)||[]).length,0);assert.ok(!view.includes('Why not borrow more?'));assert.ok(view.includes('hhw-mrs-title'));const g=run('householdMRSModel()');near(g.currentMRS,h.mrs);near(g.balanceMRS,g.gross);assert.ok(g.optimumNow>0&&g.optimumNow<g.axisMax&&g.optimumLater>0&&g.optimumLater<g.axisMax);near(g.optimumLater+g.gross*g.optimumNow,g.budgetLater);near(g.optimumLater/(g.beta*g.optimumNow),g.gross);assert.ok(g.curve.every(p=>p.now>0&&p.now<=g.axisMax&&p.later>0&&p.later<=g.axisMax));for(const p of g.curve)near(Math.log(p.now)+g.beta*Math.log(p.later),g.utility);if(h.choice==='wait')assert.ok(g.balance>0);if(h.choice==='now')assert.ok(g.balance<0);if(h.choice==='equal')near(g.balance,0);views['household-'+required+'-'+offered]=view}
{const h=run('householdWaitingModel({householdRequiredReturn:15,householdRealRate:0})'),g=run('householdMRSModel(householdWaitingModel({householdRequiredReturn:15,householdRealRate:0}))');near(h.incomeNow,10000);near(h.incomeLater,10000);near(h.amount,1);near(g.budgetNow,20000);near(-g.balance,697.674418604651);near(g.optimumNow,10697.674418604652);near(g.optimumLater,9302.325581395348);assert.ok(-g.balance<h.incomeLater/g.gross)}
near(run('bondTeachingPrice(3,5).price'),1000);assert.ok(run('bondTeachingPrice(5,5).price<bondTeachingPrice(2,5).price'));
for(const implementation of ['active','passive'])for(const benchmark of ['market','style'])for(const mix of ['value','valueSize'])for(const model of ['capm','marketValue','ff3','ff5']){run('Object.assign(systemLesson,'+JSON.stringify({fundEquityImplementation:implementation,fundBenchmark:benchmark,fundFactorMix:mix,fundModel:model})+')');const m=run('systemFundModel()'),a=run('fundsBenchmarkAttribution()');near(a.explainedActive,m.active);if(implementation==='passive')near(m.gross,m.benchmark);views['fund-'+implementation+'-'+benchmark+'-'+mix+'-'+model]=run("essentialContent('funds')")}
for(const route of ['banks','cb','funds','bonds','firms','households','state','equities'])assert.equal(run('publicationRoute('+JSON.stringify('#'+route)+').kind'),'node');
for(const route of ['#toString','#constructor','#flow/constructor','#story/0','#story/1','#story/9','#story/10','#%E0%A4%A','#unknown'])assert.equal(run('publicationRoute('+JSON.stringify(route)+').kind'),'invalid');
assert.equal(run("publicationRoute('#flow/loanH').id"),'loanH');
assert.equal(run("publicationRoute('#rates').kind"),'rates');assert.ok(!/onmouseenter|onmouseleave/.test(run('initRatesHub.toString()')));assert.ok(run('ratesMapTile()').includes('Interest rates'));

for(const scenario of ['base','saving','investment','deficit'])for(const policy of [1,3,5]){run('Object.assign(ratesHubState,'+JSON.stringify({scenario,policy})+')');const m=run('ratesHubModel()');near(m.privateSaving,m.investment+m.deficit);near((m.quantity-50-m.savingShift)/25,m.rStar);near((90+m.investmentShift+m.deficit-m.quantity)/25,m.rStar);near(m.realPolicy,m.policy-m.expectedInflation);const v=run('ratesHubPanel()');assert.ok(!/undefined|NaN|Infinity/.test(v));assert.equal((v.match(/class="rh-chart"/g)||[]).length,1);assert.equal((v.match(/data-rates-node=/g)||[]).length,6);assert.ok(!/class="rh-actor|class="rh-flow/.test(v));for(const id of ['households','firms','state','cb','banks','funds'])assert.ok(v.includes('data-rates-node="'+id+'"'));assert.ok(v.includes('Saving supply</text>')&&v.includes('Financing demand</text>'));assert.equal(v.includes('class="rh-policy-gap"'),Math.abs(m.stance)>.001);views['rates-'+scenario+'-'+policy]=v}
{const a=run("ratesHubModel({scenario:'base',policy:3})"),s=run("ratesHubModel({scenario:'saving',policy:3})"),i=run("ratesHubModel({scenario:'investment',policy:3})"),g=run("ratesHubModel({scenario:'deficit',policy:3})");assert.ok(s.rStar<a.rStar&&i.rStar>a.rStar&&g.rStar>a.rStar&&g.investment<a.investment)}
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

run('Object.assign(ratesHubState,{scenario:"base",policy:3,expectedShort:3});bankLoanContract.type="fixed";systemLesson.equityBeta=1;systemLesson.bondCorporateSpread=1.5;systemLesson.bondGovernmentSpread=.4;systemLesson.companyDebtSource="bond"');

// Present value of annual economic surplus equals the standard project NPV.
for(const contract of ['variable','fixed'])for(const beta of [.5,1,1.5]){run('bankLoanContract.type='+JSON.stringify(contract)+';systemLesson.equityBeta='+beta);const s=run('companySurplusValueModel()'),base=run('companyEndValueModel()');near(s.charge,s.investment*s.wacc/100);near(s.cash,s.charge+s.surplus);near(s.npv,s.rows.reduce((sum,y)=>sum+y.pv,0));near(s.npv,base.classicNPV);near(s.value,s.investment+s.npv);assert.equal(s.rows.length,5);for(const y of s.rows){near(y.pv,y.surplus*y.factor);near(y.factor,(1+s.wacc/100)**(-y.year))}}
run('Object.assign(ratesHubState,{scenario:"base",policy:3,expectedShort:3});bankLoanContract.type="fixed";systemLesson.equityBeta=1;systemLesson.bondCorporateSpread=1.5;systemLesson.bondGovernmentSpread=.4;systemLesson.companyDebtSource="bond"');
{const s=run('companySurplusValueModel()');near(s.investment,100);near(s.wacc,6.6);near(s.charge,6.6);near(s.surplus,8.4);near(s.npv,34.813698511233305)}

// One curve feeds every nominal pricing lesson, including fixed/variable bank loans.
for(const policy of [1,3,5])for(const expected of [2,3,4])for(const source of ['bond','bank'])for(const contract of ['variable','fixed'])for(const beta of [.5,1,1.5]){
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
run('Object.assign(ratesHubState,{scenario:"base",policy:3,expectedShort:3});bankLoanContract.type="fixed";systemLesson.equityBeta=1;systemLesson.bondCorporateSpread=1.5;systemLesson.bondGovernmentSpread=.4;systemLesson.companyDebtSource="bond"');

// The simple example starts neutral, then adds each component once.
run('Object.assign(ratesHubState,{scenario:"base",policy:3,shortNominal:3});systemLesson.equityBeta=1;systemLesson.bondCorporateSpread=1.5');
{const r=run('ratesHubModel()'),c=run('marketRateCurve()'),e=run('fundsReturnPathExample()');near(r.realPolicy,r.rStar);near(c.ecbNominal,r.rStar+r.expectedInflation);near(c.realBase,1);near(c.shortNominal,3);near(c.marketBase,3.5);near(e.bondYield,5);near(e.equityReturn,8.5);near(c.marketBase,c.realBase+c.expectedInflation+c.termPremium);near(e.bondYield,c.marketBase+e.bondCredit+e.bondLiquidity);near(e.equityReturn,c.marketBase+e.equityMarket+e.equityValue+e.equitySize);const view=run('ratesHubPanel()');assert.ok(view.includes('ECB 3% · neutral'));assert.ok(!/rrp-average|rrp-path|rpm-bridge|Recovery|Expected annual|average|data-path-year/i.test(view));assert.equal((view.match(/data-rate-block=/g)||[]).length,6);assert.equal((view.match(/class="rrb-box/g)||[]).length,6);for(const id of ['cb','firms','bonds','equities'])assert.ok(view.includes('data-sys-node="'+id+'"'));}
for(const policy of [1,3,5]){run('ratesHubState.policy='+policy+';ratesHubState.shortNominal='+policy);const c=run('marketRateCurve()');near(c.realBase,policy-2);near(c.marketBase,policy+.5);near(run('systemEquityModel().riskFree'),c.marketBase);near(run('systemBondModel().reference'),c.marketBase);near(run('bankRateQuotes.fixed'),c.marketBase);assert.ok(!/undefined|NaN|Infinity/.test(run('ratesHubPanel()')));}
run('Object.assign(ratesHubState,{scenario:"base",policy:3,shortNominal:3})');

// Shared household benchmark follows the real curve; custom model inputs remain supported.
run('systemLesson.householdRealRateMode="shared"');
for(const policy of [1,3,5]){run('ratesHubState.policy='+policy+';ratesHubState.shortNominal='+policy);const c=run('marketRateCurve()'),h=run('householdWaitingModel()');near(h.offered,c.realBase);near(h.offeredFuture,1+c.realBase/100)}
run('systemLesson.householdRealRate=15;ratesHubState.policy=3;ratesHubState.shortNominal=3');near(run('householdWaitingModel().offered'),15);assert.equal(run('systemLesson.householdRealRateMode'),'custom');
run('systemLesson.householdRealRateMode="shared"');near(run('householdWaitingModel().offered'),1);

// Expected sleeve returns use chosen exposures, while realized attribution uses its own observed period.
for(const implementation of ['active','passive'])for(const benchmark of ['market','style'])for(const mix of ['value','valueSize'])for(const issuer of ['government','corporate']){
 run('Object.assign(systemLesson,'+JSON.stringify({fundEquityImplementation:implementation,fundBenchmark:benchmark,fundFactorMix:mix,bondIssuer:issuer})+')');
 const f=run('systemFundModel()'),p=run('fundsPricingModel()'),c=run('marketRateCurve()'),b=run('systemBondModel()');
 near(p.equityRequired,c.marketBase+f.marketBeta*4+f.valueBeta+f.sizeBeta);near(p.bondRequired,c.marketBase+p.bondSpread);near(p.bondRequired,b.yield);assert.equal(p.issuer,issuer);
 const before=f.gross;run('ratesHubState.shortNominal=5');near(run('systemFundModel().gross'),before);near(run('fundsPricingModel().equityRequired'),p.equityRequired+2);run('ratesHubState.shortNominal=3');
}
run('Object.assign(systemLesson,{fundEquityImplementation:"active",fundBenchmark:"market",fundFactorMix:"valueSize",bondIssuer:"corporate",householdRequiredReturn:1});systemLesson.householdRealRateMode="shared"');
near(run('fundsPricingModel().equityRequired'),8.5);near(run('fundsPricingModel().bondRequired'),5);
// Each main participant exposes a relevant numeric mechanism within its own card.
for(const id of ['households','banks','cb','state','firms','funds']){const view=run('essentialContent('+JSON.stringify(id)+')');assert.ok(!/undefined|NaN|Infinity/.test(view),id);assert.ok(view.includes('data-rates-open'),id)}
{const s=run("essentialContent('state')"),c=run("essentialContent('firms')");assert.ok(s.includes('data-bond-issuer="government"'));assert.ok(c.includes('data-bond-issuer="corporate"'))}

// Cross-card consistency across every macro scenario and financing choice.
let crossCardCases=0;
for(const scenario of ['base','saving','investment','deficit'])for(const gap of [-2,0,2])for(const source of ['bond','bank'])for(const contract of ['variable','fixed'])for(const beta of [.5,1,1.5])for(const spread of [.5,1.5,3]){
 run('ratesHubState.scenario='+JSON.stringify(scenario));const neutral=run('ratesHubModel().rStar+ratesHubModel().expectedInflation'),policy=neutral+gap;
 run('Object.assign(ratesHubState,'+JSON.stringify({policy,shortNominal:policy})+');Object.assign(systemLesson,'+JSON.stringify({companyDebtSource:source,equityBeta:beta,bondCorporateSpread:spread})+');bankLoanContract.type='+JSON.stringify(contract));
 const curve=run('marketRateCurve()'),bank=run('bankContractPricing()'),company=run('systemCompanyModel()'),build=run('companyCostBuildUpModel()'),bond=run('systemBondModel()'),gov=run('systemGovernmentModel()'),project=run('companySurplusValueModel()');
 near(curve.realBase+curve.expectedInflation+curve.termPremium,curve.marketBase);near(company.debtRate,source==='bond'?bond.corporate:bank.fundingTotal);near(build.debtBuilt,company.debtRate);near(build.equityBuilt,run('systemEquityModel().required'));near(company.wacc,.4*company.debtRate*.75+.6*build.equityBuilt);
 near(project.charge,company.wacc);near(project.cash,project.charge+project.surplus);near(project.npv,[1,2,3,4,5].reduce((sum,t)=>sum+(15+(t===5?100:0))/(1+company.wacc/100)**t,0)-100);near(project.value,100+project.npv);
 near(gov.marketYield,bond.government);near(gov.nextInterest,(gov.openingDebt-gov.maturing)*gov.oldRate/100+gov.issuance*gov.marketYield/100);
 const v=run("essentialContent('firms')");assert.ok(v.includes('>'+run('sysN('+company.wacc+',3)')+'%<'));assert.ok(!/undefined|NaN|Infinity|\+−|\+ -/.test(v));crossCardCases++;
}
run('Object.assign(ratesHubState,{scenario:"base",policy:3,shortNominal:3});Object.assign(systemLesson,{companyDebtSource:"bond",equityBeta:1,bondCorporateSpread:1.5,bondGovernmentSpread:.4,fundScenario:"tilt",fundFee:0});bankLoanContract.type="fixed"');
for(const implementation of ['active','passive'])for(const benchmark of ['market','style'])for(const mix of ['value','valueSize']){
 run('Object.assign(systemLesson,'+JSON.stringify({fundEquityImplementation:implementation,fundBenchmark:benchmark,fundFactorMix:mix})+')');
 const f=run('fundsPricingModel()'),v=run("equityValuationModel(systemLesson,'funds')"),c=run("equityValuationModel(systemLesson,'firms')");near(v.required,f.equityRequired);near(v.factors.value,f.value);near(v.factors.size,f.size);near(v.value,v.dividend/((v.required-v.growth)/100));near(c.required,run('systemEquityModel().required'));
 assert.ok(v.required>v.growth);
}
run('Object.assign(systemLesson,{fundEquityImplementation:"active",fundBenchmark:"market",fundFactorMix:"valueSize"});essentialView.marketOrigin="rates"');
{const view=run('ecbPolicyRateChannel()');assert.ok(view.includes('data-open-bank-contract="variable"'));near(run("bankContractPricing(bankDualPricingModel(),'variable').fundingTotal"),6)}
if(!process.argv.includes('--views'))console.log('PASS: '+crossCardCases+' cross-card pricing scenarios, funding identities, valuation contexts and NPV calculations.');

// Negative real-policy rates stay inside the chart's plotting area.
for(const state of [{scenario:'saving',policy:1.2},{scenario:'base',policy:3},{scenario:'investment',policy:6.8}]){const chart=run('ratesHubChart(ratesHubModel('+JSON.stringify(state)+'))'),policy=chart.match(/<path class="rh-policy" d="M[\d.]+ ([\d.-]+) H/);assert.ok(policy);assert.ok(Number(policy[1])>=40&&Number(policy[1])<=250);if(state.policy<2)assert.ok(/>[-−]2<\/text>/.test(chart))}

// Named policy scenarios are shared by Interest rates and the ECB calculation.
for(const scenario of ['base','saving','investment'])for(const [mode,gap] of [['neutral',0],['cooling',.9],['supporting',-.9]]){
 run('ratesHubState.scenario='+JSON.stringify(scenario)+';setPolicyStance('+JSON.stringify(mode)+')');
 const m=run('ecbPolicyChannelModel()'),cycle=run('systemCycleModel()'),panel=run('ratesHubPanel()'),cb=run("essentialContent('cb')"),channel=run('ecbPolicyRateChannel()');
 assert.equal(m.mode,mode);near(m.realPolicy,m.rStar+gap);near(m.policy,m.realPolicy+m.expectedInflation);near(m.curve.ecbNominal,m.policy);near(m.curve.overnight,m.policy+.1);near(m.loan,m.fundingBase+m.charges);near(m.loan,run("bankContractPricing(bankDualPricingModel(),'variable').fundingTotal"));
 assert.equal(cycle.hot,mode==='cooling');assert.equal(cycle.cold,mode==='supporting');assert.equal(cycle.neutral,mode==='neutral');near(cycle.output,mode==='cooling'?105:mode==='supporting'?95:100);
 for(const view of [panel,cb]){assert.equal((view.match(/data-policy-stance=/g)||[]).length,3);assert.ok(view.includes('data-policy-stance="'+mode+'" aria-pressed="true"'));assert.ok(!/undefined|NaN|Infinity/.test(view));}
 assert.ok(!/More saving|More investment|rh-ecb-path|rh-ecb-transmission/.test(panel));assert.equal((panel.match(/data-rates-key="scenario"/g)||[]).length,0);assert.ok(!panel.includes('data-rates-key="policy"'));
 assert.ok(channel.indexOf('Real policy rate')<channel.indexOf('Expected inflation'));assert.ok(channel.indexOf('Expected inflation')<channel.indexOf('Nominal ECB rate'));assert.ok(channel.indexOf('Nominal ECB rate')<channel.indexOf('Overnight market'));assert.ok(channel.indexOf('Overnight market')<channel.indexOf('Variable bank loan'));assert.equal((channel.match(/class="sr-step"/g)||[]).length,5);assert.ok(channel.includes('data-open-bank-contract="variable"'));
 if(mode==='cooling')assert.ok(channel.includes('↑ '+run('sysN('+m.policy+')')+'%'));if(mode==='supporting')assert.ok(channel.includes('↓ '+run('sysN('+m.policy+')')+'%'));
}
run('ratesHubState.scenario="base";setPolicyStance("neutral")');
{const m=run('ecbPolicyChannelModel()');near(m.realPolicy,1);near(m.policy,3);near(m.curve.overnight,3.1);near(m.loan,6);}

// Event binding also tolerates a view with no matching controls.
ctx.document={querySelectorAll:()=>[],querySelector:()=>null};
run("bindSystemLesson()");delete ctx.document;

// Gap-closing graphics show a schematic target and policy normalization, not a forecast.
for(const [mode,start] of [['neutral',0],['cooling',5],['supporting',-5]]){
 run('ratesHubState.scenario="base";setPolicyStance('+JSON.stringify(mode)+')');const m=run('ecbGapAdjustmentModel()'),view=run('ecbGapAdjustmentGraphic()'),cb=run("essentialContent('cb')");
 near(m.initialGap,start);near(m.targetGap,0);near(m.natural,mode==='cooling'?1.1:mode==='supporting'?.9:1);near(m.returnReal,m.natural);near(m.responseReal,run('ratesHubModel().realPolicy'));
 assert.ok(view.includes('data-gap-start="'+start+'"'));assert.ok(view.includes('data-gap-target="0"'));assert.ok(view.includes('Illustrative adjustment'));assert.ok(view.includes('not a calibrated forecast or fixed timeline'));assert.ok(!/undefined|NaN|Infinity/.test(view));
 assert.ok(cb.indexOf('ecbs-shock-chain')<cb.indexOf('ecbs-output-gap'));assert.ok(cb.indexOf('ecbs-output-gap')<cb.indexOf('sr-ecb-channel'));assert.ok(cb.indexOf('sr-ecb-channel')<cb.indexOf('ecbs-gap-adjustment'));assert.ok(cb.indexOf('ecbs-gap-adjustment')<cb.indexOf('QE → newly created reserves'));
}
run('setPolicyStance("neutral")');

// Demand shifts change the flexible-price natural rate before the ECB response.
for(const [mode,natural,real,nominal,loan] of [['neutral',1,1,3,6],['cooling',1.1,2,4,7],['supporting',.9,0,2,5]]){
 run('ratesHubState.scenario="base";setPolicyStance('+JSON.stringify(mode)+')');
 const m=run('policyStanceModel()'),c=run('marketRateCurve()'),g=run('ecbGapAdjustmentModel()'),b=run('ecbPolicyChannelModel()');
 near(m.preShockNatural,1);near(m.beforeReal,1);near(m.beforeNominal,3);near(m.rStar,natural);near(m.realPolicy,real);near(m.policy,nominal);near(b.loan,loan);near(g.returnReal,natural);
 near(m.privateSaving,m.investment+m.deficit);near(c.marketBase,nominal+.5);
 if(mode==='cooling'){assert.ok(m.beforeReal<m.rStar);assert.ok(m.realPolicy>m.rStar)}
 if(mode==='supporting'){assert.ok(m.beforeReal>m.rStar);assert.ok(m.realPolicy<m.rStar)}
 for(const card of ['banks','firms','state','funds','households','cb'])assert.ok(!/undefined|NaN|Infinity/.test(run('essentialContent('+JSON.stringify(card)+')')),card);
 const company=run('systemCompanyModel()'),cost=run('companyCostBuildUpModel()');near(company.debtRate,c.marketBase+1.5);near(company.wacc,.4*company.debtRate*.75+.6*cost.equityBuilt);
 const markup=run('ecbPolicyRateChannel()');assert.ok(run('ecbNaturalRateContext()').includes('Before ECB reacts'));assert.ok(!markup.includes('Unchanged across all three scenarios'));
}
run('ratesHubState.scenario="base";setPolicyStance("neutral")');

// Household market controls choose the same global policy scenario while preferences stay personal.
for(const required of [0,1,2])for(const mode of ['neutral','cooling','supporting']){
 run('systemLesson.householdRequiredReturn='+required+';setHouseholdPolicyScenario('+JSON.stringify(mode)+')');
 const m=run('householdWaitingModel()'),g=run('householdMRSModel()'),curve=run('marketRateCurve()'),v=run("essentialContent('households')");
 assert.equal(run('systemLesson.householdRealRateMode'),'shared');near(m.required,required);near(m.offered,curve.realBase);near(g.balanceMRS,g.gross);near(g.optimumLater+g.gross*g.optimumNow,g.budgetLater);
 assert.equal((v.match(/data-policy-stance=/g)||[]).length,3);assert.ok(v.includes('data-policy-stance="'+mode+'" aria-pressed="true"'));assert.ok(!v.includes('data-sys-key="householdRealRate"'));assert.ok(!/15%|30%|NaN|undefined|Infinity/.test(v));
 if(m.offered===required)near(g.balance,0);else assert.equal(Math.sign(g.balance),Math.sign(m.offered-required));
}
run('systemLesson.householdRequiredReturn=1;setHouseholdPolicyScenario("neutral");householdPreviousRates=null');

// The consumption graphic uses actual model amounts and a fixed neutral comparison.
for(const required of [0,1,2])for(const mode of ['neutral','cooling','supporting']){
 run('systemLesson.householdRequiredReturn='+required+';setHouseholdPolicyScenario('+JSON.stringify(mode)+')');
 const m=run('householdWaitingModel()'),s=run('householdConsumptionShiftModel()'),view=run("essentialContent('households')");
 near(m.incomeNow,10000);near(m.incomeLater,10000);near(s.referenceRate,1);near(s.scale,100);
 near(s.rows[0].current,s.current.optimumNow);near(s.rows[1].current,s.current.optimumLater);
 for(const row of s.rows){near(row.delta,row.current-row.reference);assert.ok(Math.abs(row.delta)<=s.scale);assert.ok(view.includes('data-consumption-delta="'+row.delta+'"'))}
 if(mode==='neutral')for(const row of s.rows)near(row.delta,0);
 if(mode==='cooling'){assert.ok(s.rows[0].delta<0);assert.ok(s.rows[1].delta>0)}
 if(mode==='supporting'){assert.ok(s.rows[0].delta>0);assert.ok(s.rows[1].delta<0)}
 near(s.current.optimumLater+s.current.gross*s.current.optimumNow,s.current.budgetLater);assert.ok(!/NaN|undefined|Infinity/.test(view));
}
run('systemLesson.householdRequiredReturn=1;setHouseholdPolicyScenario("neutral");householdPreviousRates=null');

// Every participant and market detail can reach a valid destination in Interest rates.
{
 const panel=run('ratesHubPanel()'),classes=new Set([...panel.matchAll(/class="([^"]*)"/g)].flatMap(m=>m[1].split(/\s+/)));
 for(const id of ['households','banks','cb','state','firms','funds','bonds','equities']){
  const view=run('essentialContent('+JSON.stringify(id)+')'),links=view.match(/<[^>]*data-rates-open[^>]*>/g)||[];assert.ok(links.length,id);
  for(const tag of links){const a=Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]])),anchor=a['data-rates-anchor'];if(anchor?.startsWith('.'))assert.ok(classes.has(anchor.slice(1)),id+' '+anchor)}
  for(const m of view.matchAll(/data-(?:sys|rates)-node="([^"]*)"/g))assert.ok(run('Object.hasOwn(N,'+JSON.stringify(m[1])+')'),id+' -> '+m[1]);
 }
}
