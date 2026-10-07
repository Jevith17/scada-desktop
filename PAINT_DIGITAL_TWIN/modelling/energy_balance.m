function dTdt = energy_balance(Tin, T, mass, inletFlow, heatInput, agitatorPower, heatLoss, Cp)
% CODE 17 — energy_balance.m
% First-principles dynamic thermal energy balance
% dT/dt = (energyIn + heatInput + agitatorPower - heatLoss) / (mass * Cp)

if nargin < 5 || isempty(heatInput), heatInput = 0; end
if nargin < 6 || isempty(agitatorPower), agitatorPower = 0; end
if nargin < 7 || isempty(heatLoss), heatLoss = 0; end
if nargin < 8 || isempty(Cp) || Cp <= 0, Cp = 2100; end % Paint emulsion heat capacity

if mass <= 0
    dTdt = 0;
    return;
end

energyIn = inletFlow * Cp * (Tin - T);
netHeat = energyIn + heatInput + agitatorPower - heatLoss;
dTdt = netHeat / (mass * Cp);
end
