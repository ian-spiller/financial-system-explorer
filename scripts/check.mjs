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

// Market details return to the card that opened them; the bond base uses shared scenarios.
{
 const origin=run('essentialView.marketOrigin');
 for(const [from,label] of [['state','Government'],['firms','Companies'],['rates','Interest rates'],['funds','Funds']]){
  run('essentialView.marketOrigin='+JSON.stringify(from));const v=run("essentialContent('bonds')");
  assert.ok(v.includes('← '+label),from+' bond return');
  if(from==='state')assert.ok(v.includes('data-sys-node="state" data-sys-anchor=".gov-view .sys-block:nth-of-type(3)"'));
  assert.equal((v.match(/data-policy-stance=/g)||[]).length,3);assert.ok(!v.includes('data-sys-key="bondExpected"'));
  views['bond-from-'+from]=v;
 }
 run('essentialView.marketOrigin='+JSON.stringify(origin));
}

// A single hypothetical neutral baseline feeds all cards, not live market data.
{
 const m=run('ratesHubModel()'),c=run('marketRateCurve()'),g=run('systemGovernmentModel()'),s=run('companySurplusValueModel()'),v=run('companyProjectValuation(companyValueViewModel(),0)');
 near(m.rStar,1);near(m.realPolicy,1);near(m.policy,3);near(m.expectedInflation,2);near(m.quantity,75);near(m.investment,65);near(m.stance,0);
 near(c.overnight,3.1);near(c.marketBase,3.5);near(g.marketYield,3.9);near(g.nextInterest,6.2);
 near(s.wacc,6.6);near(s.surplus,8.4);near(s.npv,34.813698511233305);near(v.value,134.8136985112333);near(v.debt,40);near(v.equityValue,94.8136985112333);
 near(run('householdWaitingModel().offered'),1);near(run('householdWaitingModel().required'),1);near(run('householdMRSModel().balance'),0);near(run('householdMRSModel().optimumNow'),10000);near(run('householdMRSModel().optimumLater'),10000);near(run('systemFundModel().gross'),11);near(run('systemFundModel().benchmark'),8);
 assert.ok(html.includes('Teaching example · not current market rates'));
 for(const id of ['households','banks','cb','firms','funds','equities','bonds'])assert.ok(views[id].includes('Teaching example · not current market rates'),id);
 assert.ok(views.state.includes('EU27 · 2024 · general government'));assert.ok(views.state.includes('Teaching example'));
 const panel=run('ratesHubPanel()');assert.ok(panel.includes('Teaching example · not current market rates'));assert.ok(panel.includes('ECB 3% · neutral'));
}

// Observed EU profile: explicit denominators, complete categories and separate borrowing example.
{
 const eu=run('governmentEuBudgetData'),fixture=JSON.parse(fs.readFileSync(path.join(root,'assets/data/eu-government-2024.json'),'utf8'));
 assert.deepEqual(JSON.parse(JSON.stringify(eu)),fixture);assert.equal(eu.year,2024);assert.equal(eu.geography,'EU27_2020');assert.equal(eu.revenue.length,5);assert.equal(eu.spending.length,10);
 near(eu.revenue.reduce((s,r)=>s+r.value,0),eu.totals.revenue,1e-6);near(eu.spending.reduce((s,r)=>s+r.value,0),eu.totals.cofogSpending,1);
 near(eu.totals.spending-eu.totals.revenue,-eu.totals.balance,1e-6);near(eu.coverage.revenue+eu.coverage.deficit,100);near(eu.coverage.revenue,eu.totals.revenue/eu.totals.spending*100);
 for(const r of eu.revenue){near(r.share,r.value/eu.totals.revenue*100);near(r.displayShare,Number(r.share.toFixed(1)));}
 for(const r of eu.spending){near(r.share,r.value/eu.totals.cofogSpending*100);near(r.displayShare,Number(r.share.toFixed(1)));}
 near(eu.revenue.reduce((s,r)=>s+r.displayShare,0),100);near(eu.spending.reduce((s,r)=>s+r.displayShare,0),100);
 assert.equal((views.state.match(/data-eu-category=/g)||[]).length,15);assert.ok(views.state.includes('% of revenue')&&views.state.includes('% of spending'));assert.ok(views.state.includes('€93.6')&&views.state.includes('€6.4'));
 for(const spending of [120,140])for(const maturing of [0,30,60])for(const yieldRate of [3.5,3.9,5.5]){run('Object.assign(systemLesson,'+JSON.stringify({governmentSpending:spending,maturing,governmentYield:yieldRate})+')');const m=run('systemGovernmentModel()');near(m.deficit,spending-100);near(m.issuance,m.deficit+maturing);near(m.nextInterest,(200-maturing)*.025+(m.deficit+maturing)*yieldRate/100);const page=run("essentialContent('state')");assert.ok(!/undefined|NaN|Infinity/.test(page));assert.equal((page.match(/data-eu-category=/g)||[]).length,15);views['eu-government-'+spending+'-'+maturing+'-'+yieldRate]=page;}
 run('Object.assign(systemLesson,{governmentSpending:120,maturing:30,governmentYield:3.9})');
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


// A loan creates matching bank assets/deposits; an interbank payment conserves reserves.
for(const amount of [40,75]){
 const m=run('bankLoanPaymentModel('+amount+')');
 for(const step of [m.creation,m.payment])for(const bank of ['bankA','bankB'])near(step[bank].loans+step[bank].reserves,step[bank].deposits);
 near(m.creationReserveChange,0);near(m.paymentReserveChange,0);
 near(m.creation.bankA.loans+m.payment.bankA.loans,amount);
 near(m.creation.bankA.deposits+m.payment.bankA.deposits+m.payment.bankB.deposits,amount);
 for(const seller of ['fund','bank']){
  const q=run('ecbQESettlementModel('+JSON.stringify(seller)+',100)');
  near(q.bank.reserves+m.creation.bankA.reserves+m.payment.bankA.reserves+m.payment.bankB.reserves,q.eurosystem.liabilities);
  near(q.bank.bonds+q.bank.reserves+m.creation.bankA.loans+m.payment.bankA.reserves,q.bank.deposits+m.creation.bankA.deposits+m.payment.bankA.deposits);
 }
}


// A fund can reinvest QE proceeds without creating more reserves or deposits in aggregate.
for(const [amount,investment] of [[100,40],[250,75]]){
 const m=run('ecbQEReinvestmentModel('+amount+','+investment+')');
 near(m.fund.depositAfter+m.fund.companyBond,amount);near(m.fund.depositChange+m.fund.companyBond,0);
 near(m.company.deposit,m.company.bondDebt);near(m.fund.companyBond,m.company.bondDebt);
 near(m.bankA.reserves,m.bankA.deposits);near(m.bankB.reserves,m.bankB.deposits);
 near(m.bankA.reserves+m.bankB.reserves,0);near(m.reserveChange,0);
 near(m.fund.depositAfter+m.company.deposit,m.totalDepositsAfter);near(m.totalDepositsAfter,amount);
 const q=run('ecbQESettlementModel("fund",'+amount+')');
 near(q.bank.reserves+m.bankA.reserves+m.bankB.reserves,q.eurosystem.liabilities);
 near(q.bank.deposits+m.bankA.deposits+m.bankB.deposits,m.totalDepositsAfter);
}

// QE is a balanced asset exchange; the seller determines deposit creation.
for(const seller of ['fund','bank'])for(const amount of [100,250]){
 const q=run('ecbQESettlementModel('+JSON.stringify(seller)+','+amount+')');
 near(q.eurosystem.assets,q.eurosystem.liabilities);near(q.bank.reserves,q.eurosystem.liabilities);
 near(q.bank.bonds+q.bank.reserves,q.bank.deposits);near(q.eurosystem.assets+q.bank.bonds+(q.seller?.bonds||0),0);
 if(q.fund){near(q.seller.bonds+q.seller.deposit,0);near(q.seller.deposit,q.bank.deposits);near(q.seller.netWorth,0);near(q.bank.deposits,amount)}else{assert.equal(q.seller,null);near(q.bank.deposits,0);near(q.bank.bonds+q.bank.reserves,0)}
}
for(const seller of ['fund','bank'])for(const panel of [null,'balances']){
 run('systemLesson.ecbSeller='+JSON.stringify(seller)+';ecbQeUi.open='+JSON.stringify(panel));
 const view=run("essentialContent('cb')");assert.ok(!/undefined|NaN|Infinity/.test(view));
 assert.ok(!view.includes('data-qe-explain-toggle="reinvestment"'));
 assert.ok(view.includes('Required yields')&&view.includes('New borrowing costs'));
 assert.equal((view.match(/data-qe-explain-toggle="[^"]+"[^>]+aria-expanded="true"/g)||[]).length,panel?1:0);
 views['qe-'+seller+'-'+(panel||'transaction')]=view;
}
run('systemLesson.ecbSeller="fund";ecbQeUi.open=null');


// The comparison is always visible in the first risk block.
{const view=run("essentialContent('banks')");assert.ok(!/undefined|NaN|Infinity/.test(view));assert.ok(view.includes('id="bank-health-panel"'));views['bank-health']=view;}


// Concentration shocks scale with holdings; the chosen common shock does not.
{
 const ten=run('fundsDiversificationModel(10,.6)'),fifty=run('fundsDiversificationModel(50,.6)');near(ten.companyEquity,-5);near(ten.commonEquity,-20);near(ten.companyPortfolio,-3);near(ten.commonPortfolio,-12);near(fifty.companyEquity,-1);near(fifty.commonEquity,ten.commonEquity);
 for(const count of [1,10,50])for(const weight of [0,.3,.6,.8,1]){const m=run('fundsDiversificationModel('+count+','+weight+')');near(m.oneCompanyWeight*count,1);near(m.companyEquity*count,m.companyShock);near(m.commonEquity,m.commonShock);near(m.companyPortfolio,m.companyEquity*weight);near(m.commonPortfolio,m.commonEquity*weight);near(m.equityWeight+m.bondWeight,1);}

}


// Long-only two-asset frontier, analytic minimum variance and maximum Sharpe.
{
 const linked=run('fundsMarkowitzModel(0)');near(linked.stockMean,run("fundsPricingModel({...systemLesson,fundEquityImplementation:'passive',fundBenchmark:'market'}).equityRequired"));near(linked.bondMean,run('fundsPricingModel().bondRequired'));near(linked.riskFree,run('marketRateCurve().shortNominal'));
 const base=run('fundsMarkowitzModel(0,{stockMean:8.5,bondMean:5,riskFree:3,policyWeight:.6,riskFreeFloor:0,volatilityLimit:100})');near(base.stockMean,8.5);near(base.bondMean,5);near(base.riskFree,3);near(base.policy.expected,7.1);near(base.policy.variance,154.24);near(base.minimum.stockWeight,64/464);near(base.tangent.stockWeight,11/36);
 for(const rho of [-.5,0,.8])for(const bondMean of [3.9,5,9])for(const riskFree of [1,3,10]){
  const m=run('fundsMarkowitzModel('+rho+','+JSON.stringify({stockMean:8.5,bondMean,riskFree})+')');
  for(const p of m.points){near(p.stockWeight+p.bondWeight,1);near(p.expected,p.stockWeight*m.stockMean+p.bondWeight*m.bondMean);near(p.variance,p.stockWeight**2*m.stockVol**2+p.bondWeight**2*m.bondVol**2+2*p.stockWeight*p.bondWeight*rho*m.stockVol*m.bondVol);assert.ok(p.variance>=0);assert.ok(p.volatility+1e-8>=m.minimum.volatility);if(m.tangent)assert.ok(p.sharpe<=m.tangent.sharpe+1e-8);}
  for(const p of m.efficient)for(const q of m.points)assert.ok(!(q.expected>p.expected+1e-6&&q.volatility<=p.volatility+1e-9));
  if(Math.max(m.stockMean,m.bondMean)<=m.riskFree)assert.equal(m.tangent,null);else{assert.ok(m.tangent.stockWeight>=0&&m.tangent.stockWeight<=1);near(m.tangent.sharpe,(m.tangent.expected-m.riskFree)/m.tangent.volatility);for(const fraction of [0,.5,1])near(m.riskFree+fraction*(m.tangent.expected-m.riskFree),m.riskFree+fraction*m.tangent.volatility*m.tangent.sharpe);}
 }
 const equal=run('fundsMarkowitzModel(0,{stockMean:6,bondMean:6})');assert.equal(equal.efficient.length,1);near(equal.efficient[0].volatility,equal.minimum.volatility);
 for(const viewName of ['frontier','riskfree'])for(const rho of [-.5,0,.8]){run('Object.assign(fundsMarkowitzUi,'+JSON.stringify({view:viewName,rho})+')');const view=run("essentialContent('funds')");assert.ok(!/undefined|NaN|Infinity/.test(view));assert.equal((view.match(/data-mk-view=/g)||[]).length,0);if(viewName!=='diversify'){assert.equal((view.match(/data-mk-rho=/g)||[]).length,3);assert.ok(view.includes('Risk · annual volatility (%)'));}views['fund-markowitz-'+viewName+'-'+rho]=view;}
 run('Object.assign(fundsMarkowitzUi,{view:"frontier",rho:0})');
}


// Goals describe constraints; willingness is an independent illustrative preference.
{
 const saved=run('({type:systemLesson.fundInvestorType,privateGoal:systemLesson.fundPrivateGoal,institutionGoal:systemLesson.fundInstitutionGoal,view:fundsMarkowitzUi.view,rho:fundsMarkowitzUi.rho,preference:fundsMarkowitzUi.preference})');
 run('fundsMarkowitzUi.view="frontier"');
 for(const type of ['private','institution'])for(const goal of run('fundsGoalCases('+JSON.stringify(type)+')'))for(const rho of [-.5,0,.8])for(const preference of ['stability','balanced','growth']){
  run('Object.assign(systemLesson,{fundInvestorType:'+JSON.stringify(type)+','+(type==='private'?'fundPrivateGoal':'fundInstitutionGoal')+':'+JSON.stringify(goal.id)+'});Object.assign(fundsMarkowitzUi,{rho:'+rho+',preference:'+JSON.stringify(preference)+'})');
  const goals=run('fundsInvestorGoals()'),flow=run('fundsGoalsToAllocation()'),model=run('fundsMarkowitzModel()'),view=run("essentialContent('funds')");
  assert.ok(!/data-fund-(equity|bond)-weight|fund-goal-button-preview|[0-9]+%/.test(goals));assert.equal((flow.match(/data-mk-preference=/g)||[]).length,9);
  assert.equal(run('fundsRiskPreference().id'),preference);assert.ok(goals.includes(goal.title)&&goals.includes(goal.horizon));assert.ok(flow.indexOf('mk-chart')<flow.indexOf('aria-label="Selected allocation"'));
  assert.ok(flow.includes('data-fund-equity-total="'+model.policyWeight+'"'));near(run('fundsPolicyExample().equityWeight'),model.policyWeight);for(const [key,weight] of Object.entries(model.policy.classWeights))if(weight>1e-8)assert.ok(view.includes('data-fund-implementation-weight="'+weight+'" data-fund-implementation-asset="'+key+'"'));
  assert.ok(!/data-mk-budget|mk-risk-excluded|Risk limit/.test(flow));assert.ok(flow.includes('mk-preference-curve'));assert.ok(!/undefined|NaN|Infinity/.test(view));views['fund-goal-preference-'+goal.id+'-'+rho+'-'+preference]=view;
 }
 for(const rho of [-.5,0,.8])for(const riskAversion of [.1,1,3,8,50])for(const pair of [[8.5,5],[4,9],[6,6]]){
  const m=run('fundsMarkowitzModel('+rho+','+JSON.stringify({stockMean:pair[0],bondMean:pair[1],riskAversion,riskFreeFloor:0,volatilityLimit:100})+')');
  near(m.policy.utility,m.policy.expected-riskAversion*m.policy.variance/200);for(const p of m.points)assert.ok(p.utility<=m.policy.utility+1e-8);
  near(m.policy.utility+riskAversion*m.policy.variance/200,m.policy.expected);
  if(Math.abs(pair[0]-pair[1])<1e-10)near(m.riskyPolicy.volatility,m.minimum.volatility);
  if(m.policy.riskFreeWeight<1e-8&&m.policyWeight>1e-6&&m.policyWeight<1-1e-6&&Math.abs(pair[0]-pair[1])>1e-6){const cov=rho*m.stockVol*m.bondVol,a=m.stockVol**2+m.bondVol**2-2*cov,d=cov-m.bondVol**2;near((pair[0]-pair[1])*m.policy.volatility/(a*m.policyWeight+d),riskAversion*m.policy.volatility/100);}
 }
 const cases=[8,3,1].map(riskAversion=>run('fundsMarkowitzModel(0,'+JSON.stringify({stockMean:8.5,bondMean:5,riskAversion,riskFreeFloor:0,volatilityLimit:100})+')'));
 assert.ok(cases[0].policy.volatility<cases[1].policy.volatility&&cases[1].policy.volatility<cases[2].policy.volatility);assert.equal(Math.round(cases[1].policyWeight*100),39);
 run('Object.assign(systemLesson,{fundInvestorType:'+JSON.stringify(saved.type)+',fundPrivateGoal:'+JSON.stringify(saved.privateGoal)+',fundInstitutionGoal:'+JSON.stringify(saved.institutionGoal)+'});Object.assign(fundsMarkowitzUi,{view:'+JSON.stringify(saved.view)+',rho:'+saved.rho+',preference:'+JSON.stringify(saved.preference)+'})');
}


// Curve interpretation, before/after overlays and an explicit equity concentration rule.
{
 const saved=run('({...fundsMarkowitzUi})');
 for(const rho of [-.5,0,.8])for(const [before,now] of [['stability','balanced'],['balanced','growth'],['growth','stability']]){
  run('Object.assign(fundsMarkowitzUi,'+JSON.stringify({view:'frontier',rho,preference:now,previousPreference:before})+')');
  const current=run('fundsMarkowitzModel()'),previous=run('fundsPreviousPreferenceModel()'),view=run("essentialContent('funds')");
  near(previous.riskAversion,run('fundsPreferenceCases().find(p=>p.id==='+JSON.stringify(before)+').aversion'));near(previous.rho,current.rho);
  assert.ok(view.includes('mk-previous-curve'));assert.ok(view.includes('mk-allocation-change'));assert.ok(view.includes('mk-shift-path'));assert.ok(!view.includes('data-mk-view="diversify"'));
  assert.ok(!/undefined|NaN|Infinity/.test(view));views['fund-preference-shift-'+rho+'-'+before+'-'+now]=view;
 }
 run('Object.assign(fundsMarkowitzUi,{view:"frontier",rho:0,preference:"balanced",previousPreference:null})');
 const model=run('fundsMarkowitzModel()'),view=run("essentialContent('funds')");assert.ok(view.includes('Same appeal'));assert.ok(view.includes('Unattainable'));assert.ok(view.includes('P · your choice'));assert.ok(!view.includes('class="mk-concentration"'));assert.ok(!view.includes('fundDiversificationBody'));
 for(const p of model.capacityPoints)if(p.volatility<=model.volatilityLimit+1e-8)assert.ok(p.utility<model.policy.utility+.8);
 for(const cap of [.01,.05,.1,1])for(const weight of [0,.3,.6,1]){const m=run('fundsConcentrationModel('+weight+','+cap+')');near(m.maximumPortfolioStockWeight,weight*cap);if(weight===0)assert.equal(m.minimumStocks,0);else{assert.ok(m.minimumStocks*cap>=1-1e-9);assert.ok((m.minimumStocks-1)*cap<1);}}
 const concentration=run('fundsConcentrationModel(.6,.05)');assert.equal(concentration.minimumStocks,20);near(concentration.maximumPortfolioStockWeight,.03);
 run('Object.assign(fundsMarkowitzUi,'+JSON.stringify(saved)+')');
}


// One graph and a no-borrowing optimum over stocks, bonds and the risk-free asset.
{
 for(const rho of [-.5,0,.8])for(const riskAversion of [.5,3,8,50])for(const pair of [[8.5,5],[4,9],[6,6]])for(const riskFree of [1,3,10]){
  const m=run('fundsMarkowitzModel('+rho+','+JSON.stringify({stockMean:pair[0],bondMean:pair[1],riskAversion,riskFree,riskFreeFloor:0,volatilityLimit:100})+')'),p=m.policy;
  near(p.stockWeight+p.bondWeight+p.riskFreeWeight,1);assert.ok(p.stockWeight>=0&&p.bondWeight>=0&&p.riskFreeWeight>=0);near(p.expected,p.stockWeight*m.stockMean+p.bondWeight*m.bondMean+p.riskFreeWeight*m.riskFree);
  near(p.variance,p.stockWeight**2*m.stockVol**2+p.bondWeight**2*m.bondVol**2+2*p.stockWeight*p.bondWeight*rho*m.stockVol*m.bondVol);
  for(let i=0;i<=30;i++)for(let j=0;j<=30-i;j++){const q=m.completePoint(i/30,j/30);assert.ok(q.utility<=p.utility+1e-8);}
  const r=run('fundsRoundedAllocation('+JSON.stringify({equityWeight:p.stockWeight,bondWeight:p.bondWeight,riskFreeWeight:p.riskFreeWeight})+')');assert.equal(r.equity+r.bond+r.riskFree,100);for(const n of Object.values(r))assert.ok(Number.isInteger(n)&&n>=0&&n<=100);
  if(!m.tangent){near(p.riskFreeWeight,1);near(p.volatility,0);near(p.expected,riskFree);}
  if(m.tangent&&p.riskFreeWeight>1e-7&&p.riskFreeWeight<1-1e-7){const share=1-p.riskFreeWeight;near(p.stockWeight/share,m.tangent.stockWeight);near(p.bondWeight/share,m.tangent.bondWeight);near(p.volatility,share*m.tangent.volatility);near(p.expected,riskFree+share*(m.tangent.expected-riskFree));near(p.sharpe,m.tangent.sharpe);}
 }
 const inputs={stockMean:8.5,bondMean:5,riskFree:3,riskAversion:8,riskFreeFloor:0,volatilityLimit:100},m=run('fundsMarkowitzModel(0,'+JSON.stringify(inputs)+')');near(m.policy.stockWeight,.171875);near(m.policy.bondWeight,.390625);near(m.policy.riskFreeWeight,.4375);near(m.tangent.stockWeight,11/36);
 const before=run('fundsMarkowitzUi.preference');
 for(const preference of ['stability','balanced','growth']){run('fundsMarkowitzUi.preference='+JSON.stringify(preference));const policy=run('fundsPolicyExample()'),view=run("essentialContent('funds')");near(Object.values(policy.classWeights).reduce((a,b)=>a+b,0)+policy.riskFreeWeight,1);assert.ok(view.includes('mk-complete-cal'));assert.ok(view.includes('mk-t-definition'));assert.ok(view.includes('data-fund-riskfree-weight'));assert.ok(!view.includes('data-mk-view='));assert.ok(!/undefined|NaN|Infinity/.test(view));views['fund-complete-'+preference]=view;}
 run('fundsMarkowitzUi.preference='+JSON.stringify(before));
}


// Explicit numeric reserve constraints are tested as model inputs only; qualitative ability does not supply one.
{
 const saved=run('({...fundsMarkowitzUi})');
 for(const riskFreeFloor of [0,.2,.4,.6,.9,1])for(const rho of [-.5,0,.8])for(const riskAversion of [1,3,8]){
  const m=run('fundsMarkowitzModel('+rho+','+JSON.stringify({stockMean:8.5,bondMean:5,riskFree:3,riskAversion,riskFreeFloor,volatilityLimit:100})+')'),p=m.policy,k=1-riskFreeFloor;
  assert.ok(p.riskFreeWeight>=riskFreeFloor-1e-9);assert.ok(p.stockWeight+p.bondWeight<=k+1e-9);near(p.stockWeight+p.bondWeight+p.riskFreeWeight,1);
  for(let i=0;i<=24;i++)for(let j=0;j<=24-i;j++){const q=m.completePoint(k*i/24,k*j/24);assert.ok(q.utility<=p.utility+1e-8);}
  for(const q of m.capacityPoints){assert.ok(q.riskFreeWeight>=riskFreeFloor-1e-9);assert.ok(q.utility<=p.utility+1e-8);}
  if(m.capacityT){near(m.capacityT.stockWeight,k*m.tangent.stockWeight);near(m.capacityT.bondWeight,k*m.tangent.bondWeight);near(m.capacityT.riskFreeWeight,riskFreeFloor);}
 }
 const independent={},savedGoals=run('({fundInvestorType:systemLesson.fundInvestorType,fundPrivateGoal:systemLesson.fundPrivateGoal,fundInstitutionGoal:systemLesson.fundInstitutionGoal})');
 for(const type of ['private','institution'])for(const goal of run('fundsGoalCases('+JSON.stringify(type)+')'))for(const preference of ['stability','balanced','growth']){
  run('Object.assign(systemLesson,{fundInvestorType:'+JSON.stringify(type)+','+(type==='private'?'fundPrivateGoal':'fundInstitutionGoal')+':'+JSON.stringify(goal.id)+'});Object.assign(fundsMarkowitzUi,'+JSON.stringify({preference,rho:0,previousPreference:null})+')');
  const c=run('fundsRiskCapacity()'),m=run('fundsMarkowitzModel()'),view=run("essentialContent('funds')");assert.equal(c.id,goal.ability);assert.equal(c.goalId,goal.id);assert.equal(run('fundsRiskPreference().id'),preference);near(m.riskFreeFloor,0);near(m.volatilityLimit,c.volatilityLimit);assert.ok(m.policy.volatility<=m.volatilityLimit+1e-8);assert.ok(view.includes('Assumed cap: '+c.volatilityLimit+'% vol.'));assert.equal((view.match(/data-mk-ability=/g)||[]).length,9);assert.equal((view.match(/data-mk-cell=/g)||[]).length,9);assert.equal((view.match(/data-mk-willingness=/g)||[]).length,3);assert.equal((view.match(/data-mk-active="true"/g)||[]).length,1);assert.ok(view.includes(goal.capacityHorizon)&&view.includes(goal.cashNeeds)&&view.includes(goal.capacityReason));assert.ok(view.includes('From selected goal'));assert.ok(view.includes('Risk matrix: ability by willingness'));assert.ok(!/protected|100 capital|mk-reserve-split|mk-protected-choices|mk-risk-choice|Beyond ability/.test(view));assert.ok(view.includes('Ability to bear risk'));assert.ok(view.includes('Willingness to take risk'));assert.ok(!/undefined|NaN|Infinity/.test(view));
  if(!independent[preference])independent[preference]=m.riskAversion;else near(m.riskAversion,independent[preference]);
  views['fund-goal-ability-'+goal.id+'-'+preference]=view;
 }
 run('Object.assign(systemLesson,'+JSON.stringify(savedGoals)+')');
 run('Object.assign(fundsMarkowitzUi,'+JSON.stringify(saved)+')');
}


// Ability limits volatility; preference utility is optimized only over feasible portfolios.
for(const volatilityLimit of [0,3,6,10,16,30])for(const rho of [-.5,0,.8])for(const riskAversion of [1,3,8])for(const riskFreeFloor of [0,.4])for(const pair of [[8.5,5],[4,9],[1,2]]){
 const m=run('fundsMarkowitzModel('+rho+','+JSON.stringify({stockMean:pair[0],bondMean:pair[1],riskFree:3,riskAversion,riskFreeFloor,volatilityLimit})+')'),p=m.policy,k=1-riskFreeFloor;
 assert.ok(p.volatility<=volatilityLimit+1e-8);assert.ok(p.stockWeight>=-1e-9&&p.bondWeight>=-1e-9&&p.riskFreeWeight>=riskFreeFloor-1e-9);near(p.stockWeight+p.bondWeight+p.riskFreeWeight,1);assert.ok(p.utility<=m.unrestrictedPolicy.utility+1e-8);
 for(let i=0;i<=16;i++)for(let j=0;j<=16-i;j++){const q=m.completePoint(k*i/16,k*j/16);if(q.volatility<=volatilityLimit+1e-10)assert.ok(q.utility<=p.utility+1e-8);}
}
{const cautious=run('fundsMarkowitzModel(0,{riskAversion:8,volatilityLimit:6})'),willing=run('fundsMarkowitzModel(0,{riskAversion:1,volatilityLimit:6})');assert.ok(cautious.policy.volatility<6);near(willing.policy.volatility,6);assert.ok(willing.riskLimitBinding);}


// Strategic weights are independent of tactical/within-sleeve execution.
// The teaching tilt stays fully invested, long-only and inside ability.
{
 const original=run('JSON.stringify(systemLesson)'),originalPreference=run('JSON.stringify(fundsMarkowitzUi)'),goals=[['private','retirement'],['private','education'],['private','home'],['private','legacy'],['institutional','pension'],['institutional','insurer'],['institutional','endowment']];
 for(const [type,goal] of goals)for(const preference of ['stability','balanced','growth'])for(const rho of [-.5,0,.8])for(const benchmark of ['market','style']){
  run('Object.assign(systemLesson,'+JSON.stringify({fundInvestorType:type,[type==='private'?'fundPrivateGoal':'fundInstitutionGoal']:goal,fundBenchmark:benchmark})+');Object.assign(fundsMarkowitzUi,'+JSON.stringify({preference,rho})+')');
  const before=run('fundsPolicyExample()'),policy=run("fundsAllocationDecisionModel('policy')"),tilt=run("fundsAllocationDecisionModel('tilt')");
  for(const method of ['passive','active']){run('systemLesson.fundEquityImplementation='+JSON.stringify(method));const after=run('fundsPolicyExample()');for(const key of ['equityWeight','bondWeight','riskFreeWeight'])near(after[key],before[key]);}
  for(const model of [policy,tilt]){const weights=model.actual;near(Object.values(weights.classWeights).reduce((a,b)=>a+b,0)+weights.riskFreeWeight,1);assert.ok(Object.values(weights.classWeights).every(w=>w>=-1e-9));assert.ok(model.volatility<=model.volatilityLimit+2e-8);assert.ok(Math.abs(model.delta)<=.05+1e-10);near(weights.riskFreeWeight,before.riskFreeWeight);for(const key of Object.keys(weights.classWeights))near(weights.classWeights[key]-before.classWeights[key],model.mode==='tilt'?(key===model.toId?model.delta:key===model.fromId?-model.delta:0):0);assert.equal(Object.values(run('fundsRoundedAllocation('+JSON.stringify(weights)+')')).reduce((a,b)=>a+b,0),100);}
  near(policy.delta,0);for(const key of ['equityWeight','bondWeight','riskFreeWeight'])near(policy.actual[key],before[key]);
 }
 run('Object.assign(systemLesson,'+original+');Object.assign(fundsMarkowitzUi,'+originalPreference+');fundsAllocationUi.mode="policy"');
 const page=run('essentialFunds()');assert.ok(page.includes('Keep or tilt the allocation'));assert.ok(page.includes('without active management.'));assert.ok(page.includes('Policy benchmark stays unchanged.'));assert.ok(page.includes('Whole-portfolio benchmark'));assert.ok(page.includes('data-portfolio-component="within"'));assert.ok(page.includes('data-portfolio-component="costs"'));assert.ok(page.includes('fund-plan-stage-3 fund-implementation-designed'));assert.ok(page.includes('<span>4</span>'));
}

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
 assert.ok(cb.indexOf('ecbs-shock-chain')<cb.indexOf('ecbs-output-gap'));assert.ok(cb.indexOf('ecbs-output-gap')<cb.indexOf('sr-ecb-channel'));assert.ok(cb.indexOf('sr-ecb-channel')<cb.indexOf('ecbs-gap-adjustment'));assert.ok(cb.indexOf('ecbs-gap-adjustment')<cb.indexOf('ecbq-seller-choice'));
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
 near(s.current.optimumLater+s.current.gross*s.current.optimumNow,s.current.budgetLater);const readBudget=key=>Number((view.match(new RegExp('data-hh-'+key+'="([^"]+)"'))||[])[1]);near(readBudget('saving'),s.current.balance);near(readBudget('consumption-now')+readBudget('saving'),m.incomeNow);near(readBudget('consumption-later'),m.incomeLater+s.current.gross*readBudget('saving'));assert.ok(view.includes('data-sys-node="funds" data-fund-investor="private" data-sys-anchor=".fund-first-designed"'));assert.ok(view.includes('Risky returns are uncertain'));assert.equal((view.match(/class="hhp-portfolio-link"/g)||[]).length,1);assert.ok(!/NaN|undefined|Infinity/.test(view));
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

// ECB reserves are the alternative asset; interbank and swap references remain separate.
for(const mode of ['neutral','cooling','supporting']){
 run('ratesHubState.scenario="base";setPolicyStance('+JSON.stringify(mode)+')');const m=run('bankDualPricingModel()'),c=run('marketRateCurve()'),v=run("essentialContent('banks')");
 near(m.opportunityReference,c.ecbNominal);near(m.market,c.overnight);near(m.fundingAdjustment,m.fundingBase-c.ecbNominal);near(m.fundingAdjustment,.2);near(m.opportunityBase,m.fundingBase);near(m.opportunityReference+m.fundingAdjustment,m.fundingBase);
 near(run('bankRateQuotes.short'),c.overnight);near(run('bankRateQuotes.fixed'),c.marketBase);assert.ok(v.includes('ECB deposit facility'));assert.ok(v.includes('Funding reconciliation'));assert.ok(!v.includes('Overnight loan<br>to another bank'));
 for(const contract of ['variable','fixed']){const p=run('bankContractPricing(bankDualPricingModel(),'+JSON.stringify(contract)+')');near(p.opportunityTotal,p.fundingTotal)}
}
run('setPolicyStance("neutral")');

// Three-class model: covariance identity, long-only optimum and independent grid comparison.
{
 const original=run('JSON.stringify(systemLesson)'),prior=run('JSON.stringify(fundsMarkowitzUi)');
 const assets=run('fundsConcreteAssets()');assert.equal(assets.length,8);assert.equal(assets[0].benchmark,'S&P 500');assert.equal(assets[1].benchmark,'S&P SmallCap 600');
 for(const rho of [-.5,0,.8])for(const riskAversion of [1,3,8])for(const cap of [6,10,16]){
  const m=run('fundsThreeAssetModel('+rho+','+JSON.stringify({riskAversion,volatilityLimit:cap})+')'),p=m.policy,mu=m.assets.map(a=>a.mean),vol=m.assets.map(a=>a.vol),corr=[[1,.8,rho],[.8,1,rho],[rho,rho,1]];
  const calc=w=>{const rf=1-w.reduce((s,v)=>s+v,0),expected=w.reduce((s,v,i)=>s+v*mu[i],rf*m.riskFree),variance=w.reduce((s,v,i)=>s+w.reduce((t,u,j)=>t+v*u*vol[i]*vol[j]*corr[i][j],0),0);return{expected,variance,utility:expected-riskAversion*variance/200};};
  const exact=calc(p.weights);near(p.expected,exact.expected);near(p.variance,exact.variance);near(p.utility,exact.utility);assert.ok(p.weights.every(w=>w>=-1e-9));near(p.weights.reduce((s,v)=>s+v,0)+p.riskFreeWeight,1);assert.ok(p.volatility<=cap+1e-8);
  for(let l=0;l<=20;l++)for(let s=0;s<=20-l;s++)for(let b=0;b<=20-l-s;b++){const q=calc([l/20,s/20,b/20]);if(q.variance<=cap*cap+1e-10)assert.ok(p.utility>=q.utility-1e-8,'Grid beats optimum');}
  for(const q of m.points){near(q.weights.reduce((s,v)=>s+v,0),1);assert.ok(q.volatility>=m.minimum.volatility-1e-8);if(m.tangent)assert.ok(q.sharpe<=m.tangent.sharpe+1e-8);}
  for(const q of m.efficient)for(const r of m.points)assert.ok(!(r.expected>q.expected+1e-7&&r.volatility<q.volatility-1e-7),'Frontier dominated');
  const rounded=run('fundsRoundedAllocation('+JSON.stringify({largeWeight:p.largeWeight,smallWeight:p.smallWeight,equityWeight:p.stockWeight,bondWeight:p.bondWeight,riskFreeWeight:p.riskFreeWeight})+')');assert.equal(rounded.large+rounded.small+rounded.bond+rounded.riskFree,100);
 }
 for(const key of ['fundEquityImplementation','fundSmallImplementation','fundBondImplementation']){
  const baseline=run('JSON.stringify(fundsPolicyExample())');run('systemLesson['+JSON.stringify(key)+']="active"');assert.equal(run('JSON.stringify(fundsPolicyExample())'),baseline);run('systemLesson['+JSON.stringify(key)+']="passive"');assert.equal(run('JSON.stringify(fundsPolicyExample())'),baseline);
 }
 run('Object.assign(systemLesson,'+original+');Object.assign(fundsMarkowitzUi,'+prior+')');
}

// Whole-portfolio benchmark and exact single-period attribution, before rounding.
{
 const saved=run('JSON.stringify({s:systemLesson,ui:fundsMarkowitzUi,u:fundsUniverseUi,a:fundsAllocationUi})');
 const savedObj=JSON.parse(saved),methods=['fundEquityImplementation','fundSmallImplementation','fundEuropeImplementation','fundEmImplementation','fundChinaImplementation','fundBondImplementation','fundCommodityImplementation'];
 const universes=[['large','small','europe','em','china','bond','gold','commodities'],['large','small','bond'],['europe','em','china','bond'],['gold'],['china']];
 let cases=0;
 for(const universe of universes)for(const preference of ['stability','balanced','growth']){
  run('fundsUniverseUi.enabled='+JSON.stringify(universe)+';fundsMarkowitzUi.preference='+JSON.stringify(preference)+';fundsMarkowitzUi.rho=0;fundsAllocationUi.mode="policy"');
  const base=run('fundsPortfolioAttribution()'),weights=JSON.stringify(base.parts.map(r=>[r.id,r.benchmarkWeight]));
  for(const mode of ['policy','tilt'])for(const implementation of ['passive','active','mixed']){
   run('fundsAllocationUi.mode='+JSON.stringify(mode));for(const [i,key] of methods.entries())run('systemLesson['+JSON.stringify(key)+']='+JSON.stringify(implementation==='mixed'?(i%2?'passive':'active'):implementation));
   const m=run('fundsPortfolioAttribution()'),v=run('essentialFunds()');
   near(m.parts.reduce((n,r)=>n+r.benchmarkWeight,0),1);near(m.parts.reduce((n,r)=>n+r.actualWeight,0),1);
   assert.equal(JSON.stringify(m.parts.map(r=>[r.id,r.benchmarkWeight])),weights);near(m.benchmark,base.benchmark);
   near(m.benchmark+m.allocation+m.within-m.costs,m.net);near(m.within,m.selection+m.interaction);near(m.gross-m.costs,m.net);near(m.active,m.allocation+m.within-m.costs);
   near(m.benchmark,m.parts.reduce((n,r)=>n+r.benchmarkWeight*r.indexReturn,0));near(m.net,m.parts.reduce((n,r)=>n+r.actualWeight*(r.grossReturn-r.cost),0));
   assert.ok(m.costs>=0);if(mode==='policy')near(m.allocation,0);if(implementation==='passive'){near(m.within,0);if(mode==='policy')near(m.net,m.benchmark-m.costs);}
   assert.ok(!/NaN|undefined|Infinity/.test(v));assert.equal((v.match(/data-portfolio-component=/g)||[]).length,5);assert.equal((v.match(/fund-plan-stage fund-plan-stage-[123]/g)||[]).length,3);
   for(const r of m.parts){assert.ok(r.benchmarkWeight>=-1e-10&&r.actualWeight>=-1e-10);near(r.withinContribution,r.actualWeight*(r.grossReturn-r.indexReturn));near(r.withinContribution,r.selectionContribution+r.interactionContribution);near(r.allocationContribution,(r.actualWeight-r.benchmarkWeight)*r.indexReturn);near(r.costContribution,r.actualWeight*r.cost);if(r.actualWeight>1e-8||r.benchmarkWeight>1e-8)assert.ok(v.includes('data-within-asset="'+r.id+'"'));}near(m.within,m.parts.reduce((s,r)=>s+r.withinContribution,0));assert.ok(v.includes('Selection + interaction'));assert.ok(v.includes('fund-portfolio-formula'));
   if(universe.length===1&&universe[0]==='china'&&preference==='growth'){assert.ok(m.benchmark<0);assert.ok(m.net<0);}
   cases++;
  }
 }
 // Changing factor model explains the same gross return; it cannot manufacture return.
 run('fundsUniverseUi.enabled=["large","small","bond"];fundsMarkowitzUi.preference="growth";systemLesson.fundEquityImplementation="active"');
 const before=run('fundsPortfolioAttribution()');
 for(const model of ['capm','marketValue','ff3','ff5']){run('systemLesson.fundModel='+JSON.stringify(model));const m=run('fundsPortfolioAttribution()');near(m.net,before.net);near(m.within,before.within);}
 // Within-class selection plus interaction is a single contribution, not two addends.
 run('fundsAllocationUi.mode="tilt"');const m=run('fundsPortfolioAttribution()');near(m.within,m.parts.reduce((n,r)=>n+(r.benchmarkWeight+(r.actualWeight-r.benchmarkWeight))*r.excess,0));
 run('Object.assign(systemLesson,'+JSON.stringify(savedObj.s)+');Object.assign(fundsMarkowitzUi,'+JSON.stringify(savedObj.ui)+');Object.assign(fundsUniverseUi,'+JSON.stringify(savedObj.u)+');Object.assign(fundsAllocationUi,'+JSON.stringify(savedObj.a)+')');
 if(!process.argv.includes('--views'))console.log('PASS: '+cases+' whole-portfolio attribution cases, unchanged policy benchmark, factor separation and costs deducted once.');
}
