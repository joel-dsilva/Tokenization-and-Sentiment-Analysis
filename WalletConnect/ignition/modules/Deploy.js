const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DeployModule", (m) => {
    // Deploy VibeOracle contract
    const vibeOracle = m.contract("VibeOracle");

    return { vibeOracle };
});
