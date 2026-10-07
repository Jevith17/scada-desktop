function equip = equipment_config()
% equipment_config.m
% Equipment design specifications and ratings
equip = struct();

equip.TK101.tag = 'TK-101';
equip.TK101.type = 'Mixing Tank';
equip.TK101.volume = NaN; % [COMPANY DATA REQUIRED]

equip.M101.tag = 'M-101';
equip.M101.type = 'Agitator Drive Impeller';
equip.M101.ratedRPM = 1200;
equip.M101.ratedPower = 11.0; % kW

equip.P101.tag = 'P-101';
equip.P101.type = 'Monomer Feed Pump';
equip.P101.maxFlow = 30.0; % kg/min

equip.FCV101.tag = 'FCV-101';
equip.FCV101.type = 'Feed Control Valve';
equip.FCV101.cv = NaN; % [COMPANY DATA REQUIRED]
end
