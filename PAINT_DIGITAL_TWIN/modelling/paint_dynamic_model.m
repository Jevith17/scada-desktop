function state = paint_dynamic_model(input, params)
% CODE 22 — paint_dynamic_model.m
% Coupled digital twin dynamic solver integrating mass balance, energy balance,
% agitator dynamics, valve hydraulics, and paint viscosity evolution.

state = struct();

% 1. Mass Balance
leakage = 0;
if isfield(input, 'LeakageFlow'), leakage = input.LeakageFlow; end
outlet = 0;
if isfield(input, 'OutletFlow'), outlet = input.OutletFlow; end

state.dMdt = tank_mass_balance(input.InletFlow, outlet, leakage);

% 2. Thermal Energy Balance
heatInput = 0;
if isfield(input, 'HeatInput'), heatInput = input.HeatInput; end
agitatorPower = 0;
if isfield(input, 'AgitatorPower'), agitatorPower = input.AgitatorPower; end
heatLoss = 0;
if isfield(input, 'HeatLoss'), heatLoss = input.HeatLoss; end
Cp = 2100;
if isfield(input, 'Cp'), Cp = input.Cp; end
tankMass = 3420;
if isfield(input, 'TankMass'), tankMass = input.TankMass; end
inletTemp = 25.0;
if isfield(input, 'InletTemperature'), inletTemp = input.InletTemperature; end

state.dTdt = energy_balance(inletTemp, input.Temperature, tankMass, ...
    input.InletFlow, heatInput, agitatorPower, heatLoss, Cp);

% 3. Agitator Dynamics
motorCond = 1.0;
if isfield(input, 'MotorCondition'), motorCond = input.MotorCondition; end
gain = 1.0;
if isfield(params, 'agitator') && isfield(params.agitator, 'gain')
    gain = params.agitator.gain;
end
rpmSP = input.AgitatorRPM;
if isfield(input, 'RPMSetpoint'), rpmSP = input.RPMSetpoint; end

state.RPM = agitator_model(rpmSP, motorCond, gain);

% 4. Valve Model
valvePos = 72.0;
if isfield(input, 'ValvePosition'), valvePos = input.ValvePosition; end
cv = 0.25;
if isfield(params, 'valve') && isfield(params.valve, 'coefficient')
    cv = params.valve.coefficient;
end
dp = 1.0;
if isfield(input, 'PressureDrop'), dp = input.PressureDrop; end

state.FlowPrediction = valve_model(valvePos, cv, dp);

% 5. Viscosity Model
tMix = 0;
if isfield(input, 'MixingTime'), tMix = input.MixingTime; end
matAdd = 0;
if isfield(input, 'MaterialAddition'), matAdd = input.MaterialAddition; end
viscCoeffs = [];
if isfield(params, 'viscosity') && isfield(params.viscosity, 'coefficients')
    viscCoeffs = params.viscosity.coefficients;
end

state.Viscosity = viscosity_model(input.Temperature, state.RPM, tMix, matAdd, viscCoeffs);
end
