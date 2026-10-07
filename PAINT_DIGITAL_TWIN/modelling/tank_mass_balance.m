function dMdt = tank_mass_balance(inletFlow, outletFlow, leakageFlow)
% CODE 16 — tank_mass_balance.m
% First-principles dynamic mass conservation balance
% dM/dt = inlet mass flow - outlet mass flow - leakage flow

if nargin < 2 || isempty(outletFlow), outletFlow = 0; end
if nargin < 3 || isempty(leakageFlow), leakageFlow = 0; end

dMdt = inletFlow - outletFlow - leakageFlow;
end
