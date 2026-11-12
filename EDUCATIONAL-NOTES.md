# Educational notes

The map is designed around a few important distinctions. These boundaries apply to the teaching examples, rather than making claims about current prices.

## Policy rates and market rates

The ECB deposit facility rate anchors short-term market conditions. It does not directly set every deposit rate, lending rate or bond yield. Expectations, maturity, credit risk, liquidity, funding and competition also matter. The overnight 2.1%, deposit 2% and other bank quotes are illustrative, not an observed market curve. Required-reserve remuneration and the required-reserve ratio are different concepts.

## Banks and money creation

Banks transform maturities and manage liquidity and repricing mismatches. A new loan normally creates a matching deposit; banks are not limited to lending prior household savings. The loan-pricing branches are alternative representations of the same debt funding basis, never additive charges. In the base case, customer deposits pay 2%, the overnight interbank reference is 2.1%, and five-year bank bonds cost the shared 4.5% reference plus a 0.5 percentage-point bank issuer spread, or 5%. With 80% deposits and 20% bank bonds, current debt funding costs 2.6%; the reconciliation to the overnight alternative is 2.6% − 2.1% = 0.5 percentage points. Part of the funding/liquidity premium is already in these source rates. Credit risk 1, the incremental liquidity buffer 0.3, operations 0.5 and capital/profit 1 add another 2.8 percentage points, giving a variable loan quote of 5.4%. All figures are assumptions.

## QE and reserves

In the fund-seller example, the Eurosystem creates reserve liabilities, the commercial bank receives reserves and credits the fund's deposit, and the fund exchanges a bond for a deposit. When the bank itself sells the bond, settlement does not mechanically create a customer deposit. Required reserves are only one part of bank reserve holdings; reserves are not bank equity or an automatic loan multiplier.

## Government financing

Interest is budget spending. Repaying principal is a financing transaction. Refinancing replaces maturing debt; the deficit increases the debt stock in the simplified example. The annual calculation assumes year-end issuance and refinancing, issuance at par, unchanged cash and no other debt adjustments. The feedback loop holds revenue, non-interest spending and the assumed yield constant. Greater borrowing pressure can raise yields, but the model does not impose an automatic debt-to-yield formula. The new sovereign yield uses the same five-year reference plus the selected sovereign spread: 4.5% + 0.4 percentage points = 4.9% by default. Changing its yield preset changes the same spread used in the government-bond valuation; old debt retains its existing fixed coupon.

## NPV, firm value and financing

The main company lesson follows one initial investment of 100. It produces expected after-tax operating cash of 15 each year for five years, before financing payments, and recovers the full invested capital of 100 at the end of Year 5. Capital stays invested at 100 throughout the five-year period.

The default company uses five-year corporate-bond funding: 40% target debt weight × 6% debt rate × (1 − 25% tax rate) + 60% target equity weight × 9.5% equity return = WACC 7.5%. The target debt/equity ratio is constant in market-value terms and business risk is unchanged. The historic initial outlay is still 40 debt + 60 contributed equity; project NPV accrues to equity. Alternative bank-loan funding uses the actual selected quote from Commercial banks, and all downstream calculations update.

The annual capital charge is 100 × 7.5% = 7.5. Expected operating cash of 15 less this economic opportunity-cost charge leaves annual surplus of 7.5. This is an investment hurdle, not a contractual cash payment to equity holders. The assumed interest tax shield is usable and is applied to debt once.

The present value of five annual surpluses of 7.5 at 7.5% is 30.344137. This equals standard project NPV: the present value of five operating cash flows of 15 plus Year 5 capital recovery of 100, less the initial 100. Firm value is 100 + NPV = 130.344137. Calculations use full precision and displayed figures are rounded.

There are no year-selection buttons or terminal-wealth comparison in the main company lesson. Actual reinvestment at WACC is not required to calculate DCF NPV. Figures are rounded for display; all calculations use unrounded values. Forecast NPV is not a guaranteed realised gain.

## Bonds and equities

For unchanged fixed bond payments, a higher required yield reduces their present value. Both corporate and sovereign bonds use the shared five-year nominal reference, with one issuer spread added. The corporate spread is decomposed into credit and liquidity contributions in the fixed illustrative 2:1 proportion; it is not stacked on the sovereign spread. Equity valuation and the company cost of equity use the same three-factor expected-return example: shared reference + market beta × market premium + value beta × value premium + size beta × size premium. The dividend model retains constant 2% growth and applies the shared reference as a flat long-horizon valuation proxy; its intrinsic value need not equal a traded price.

## Funds, benchmarks and alpha

Goals, constraints and desired exposures come before implementation. An index fund can passively track a value index while retaining value exposure. Active allocation can use passive funds. The allocation weights are hypothetical examples, not an optimised personal recommendation.

Benchmark outperformance and model alpha answer different questions. The return example evaluates only the equity sleeve. Its market, value and size contributions are synthetic, not estimates from a regression. FF3 adds size and value to the market; an optional FF5 explanation assumes zero additional loadings here. One period's residual is not an estimated alpha. Matching an intended factor exposure is consistent with a plan, not proof of repeatable skill; an unintended exposure does not by itself prove pure luck. The visible default assumes zero management fees, so its gross and net gaps coincide. If a nonzero fee is supplied, the factor ladder explains the gross gap and the selected-model equation deducts the fee to reconcile to the net gap. Benchmark-relative factor contributions use portfolio minus benchmark loadings. The model rows are attributions of the benchmark gap, not standalone regression alphas for the fund. Fees and benchmark specification matter.

## Households and consumption through time

The main household lesson uses income of €100 today and €100 next year. The threshold and offered-return comparison is quoted per additional €1, rather than mixing a €100 investment example with a €200 lifetime budget. The graph puts consumption today on the horizontal axis and next year on the vertical axis.

The starting required return describes MRS minus one at the income point (100, 100). It is not a guaranteed investment return or a threshold that stays fixed while consumption changes. Log utility, log(C_today) + beta × log(C_later), is calibrated with beta = 1 / starting MRS. Saving s changes consumption to 100 − s today and 100 + (1 + r) × s next year. The constant-utility curve through the optimum is tangent to the straight budget line: MRS = 1 + r. CFA's discounted future/current marginal-utility convention is the reciprocal under certainty.

Borrowing is repaid from next year's income. Maximum borrowing with zero future consumption is 100 / (1 + r), so maximum consumption today is 100 + 100 / (1 + r). This is a budget endpoint, not the optimum: under log utility zero future consumption is unacceptable. At a 0% market rate and 15% starting threshold, optimal borrowing is about €6.98, current consumption €106.98 and future consumption €93.02. Initial MRS is 1.15 and falls to 1 as borrowing shifts consumption toward today.

Both axes stay fixed at 0–250. Required-return presets are 2%, 15% and 30%; market presets are 0%, 3%, 15% and 30%. This deliberately wide teaching range is not current market data. Dashed lines and allocation deltas show the previous selection. Income and payoffs are certain, amounts are real, borrowing and saving use the same rate, and there are no fees or separate credit constraints. These are hypothetical model choices, not personal recommendations. Risky investments require consideration of uncertain payoffs, risk and liquidity.

## Shared Interest rates overview

The expandable panel is a separate stylised macro example at potential output. It keeps six participant nodes; the overview is a mechanism, not a seventh institution. Its conceptual arrows are not cash payments. It links the household's individual saving/borrowing choice to an aggregate private-saving schedule, and company investment and public deficits to financing demand. Private saving also includes retained business saving. A single household's MRS does not mechanically determine aggregate supply.

In illustrative units, S_private(r) = 25 × (r + 1) + saving_shift, I(r) = 115 − 25 × r + investment_shift, and the public deficit is 10 in the base case. Solving S_private = I + deficit gives r* = 2% and financing of 75 (company investment 65 plus deficit 10). More-saving and more-investment scenarios shift the respective schedule by 40; the government deficit is held at 10 in the visible scenarios. They are isolated comparisons with fixed potential income, fixed expectations and no foreign flows. Refinancing maturing debt is not added as new net demand here. Government borrowing does not impose a universal automatic debt-to-yield rule.

“Real” describes inflation adjustment, rather than a separate policy instrument: the natural rate is also a real rate. In New Keynesian theory, the natural real rate is the rate in flexible-price equilibrium and can vary with real shocks. Natural and neutral terminology can differ across models and horizons; this illustration uses one real reference r*. The comparison is real policy > r*: restrictive; equal: neutral; below: accommodative. Changing r* can change the stance even at an unchanged nominal policy setting.

The dashed ECB line is an approximate real policy stance: an illustrative nominal policy setting of 2%, 4% or 6%, minus fixed expected inflation of 2%. It is not a third market-clearing curve or a claim that realised saving and investment remain unequal. Away from r*, income, spending and inflation may adjust. The simple r* comparison is an educational reference, not a complete policy rule; actual r* is unobserved and highly uncertain. All rates and schedules are hypothetical. The overview starts with the same 2% nominal ECB policy setting as the bank example. With expected inflation of 2%, its real policy rate is approximately 0%, below the illustrative 2% natural rate. The household lesson uses a separate, explicitly labelled one-year real return; it is not the overnight nominal policy quote.

The nominal pricing inputs are linked in code across Interest rates, Banks, Companies, government financing, bond valuation and equity valuation. Changing the five-year expected short-rate component changes their common five-year reference; changing today's ECB setting changes the overnight reference and assumed deposit remuneration. The example assumes full immediate deposit pass-through, a constant 0.1 percentage-point overnight interbank gap and unchanged issuer/factor premia. These are teaching rules, not forecasts or a complete monetary transmission model. The household MRS diagram remains a separate one-year real consumption-choice illustration. Funds attribution describes synthetic realised returns, which are distinct from these forward-looking required returns.

The natural real rate r* plus expected inflation gives an approximate neutral nominal policy reference, not a traded quote or a formula forcing ECB policy. The current ECB rate may differ from neutral. Markets form an expected future short-rate path; here its five-year average is an explicit selectable assumption, not mechanically inferred from today's policy rate. That average plus one term premium gives the common five-year nominal reference. Inflation is included once in the nominal framework. Thus a current overnight rate of 2.1% can coexist with a five-year reference of 4.5%; their different horizons are visible, while all uses of the five-year reference read the same value.

The shared expected equity risk contributions and the company/equity-valuation models use identical market, value and size exposures and expected premia. The corporate bond branch and detailed corporate valuation use the same aggregate issuer spread. These expected factor contributions are model assumptions, not guarantees or realised alpha; the separate Funds attribution example evaluates ex post performance.

### Horizontal required-return example

The numerical sequence remains one horizontal row. At the base scenario r* is 2%, expected inflation is 2%, and the neutral nominal reference is approximately 4%. Today's ECB nominal setting is 2%, giving a real policy rate near 0% and an overnight market reference of 2.1%. An expected five-year average short rate of 4% + term premium 0.5 percentage points gives the shared five-year nominal reference of 4.5%. Corporate credit 1 + liquidity 0.5 add to a 1.5 percentage-point spread, giving 6% required corporate yield. Equity market beta 1 × expected market premium 4%, value beta 0.5 × premium 1%, and size beta 0.5 × premium 1% contribute 5 percentage points, giving 9.5% cost of equity. The same inputs are used in the company and asset-pricing cards. Presets for five-year expected short rates are 3%, 4% and 5%. Changing r* alone changes the neutral reference and stance comparison; it does not silently invent a new market forecast.

The horizontal example explicitly fixes the market-reference horizon at five years. Its term premium compensates for duration/interest-rate risk relative to rolling short instruments across that horizon; it is distinct from pure compensation for waiting and from issuer credit or liquidity components. Term premia are estimated, can be negative, and need not rise mechanically with maturity. The example adds its positive 0.5 percentage-point term premium once in the five-year reference. The separate risk-premia box now shows credit +1 pp, liquidity +0.5 pp, and expected equity factor contributions: market +4 pp, value +0.5 pp, size +0.5 pp. The equity rows are exposure-weighted contributions, not raw factor premia: market 1×4%, value 0.5×1%, size 0.5×1%. Group totals and final required returns remain unchanged.

## Coverage

The six-participant map is intentionally selective. Insurance, derivatives, payment infrastructure and cross-border/FX channels are not separate main nodes. Connections are schematic relationships, not measured flow volumes. Primary issuance funds issuers; secondary trading pays an existing holder.

### Visible company financing build-up

The company's default two branches both begin at the common 4.5% five-year reference. Corporate bonds add credit 1 and liquidity 0.5 percentage points to reach 6%; equity adds the same three-factor contributions as Interest rates to reach 9.5%. The 40/60 tax-adjusted financing weights produce 1.8 + 5.7 = WACC 7.5%. Selecting Bank loan instead uses the actual bank quote and its source-specific costs. A variable loan uses the current overnight reference; a five-year fixed loan uses the same five-year reference as bonds and equity.

For the bank's fixed quote, only its 80% floating-funded slice is hedged; its 20% five-year bond funding is already fixed. The shared fixed benchmark 4.5% minus the short floating reference 2.1% is 2.4 percentage points. The weighted hedge cost is 80% × 2.4 = 1.92 percentage points. Current funding 2.6% + hedge 1.92 = fixed funding 4.52%; plus unchanged loan charges 2.8 gives a 7.32% fixed loan. Its fixed funding basis relative to the shared 4.5% reference is 0.02 percentage points, which is displayed once. The swap is assumed to use the same floating reference, the deposit/reference basis is constant, the floating slice is equally sized and fully hedgeable, the bank-bond term matches the five-year lock, and all credit, liquidity and other costs are held unchanged. This is a simplified matched-funding illustration, not a twenty-year rate lock or a risk-free funding claim.
