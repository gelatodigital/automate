// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.19 <0.9.0;

import "./Base.t.sol";

import {Automate} from "../../../contracts/Automate.sol";
import {OpsProxy} from "../../../contracts/opsProxy/OpsProxy.sol";
import {OpsProxyFactory} from "../../../contracts/opsProxy/OpsProxyFactory.sol";
import {
    ResolverModule
} from "../../../contracts/taskModules/ResolverModule.sol";
import {ProxyModule} from "../../../contracts/taskModules/ProxyModule.sol";
import {
    SingleExecModule
} from "../../../contracts/taskModules/SingleExecModule.sol";
import {
    Web3FunctionModule
} from "../../../contracts/taskModules/Web3FunctionModule.sol";
import {TriggerModule} from "../../../contracts/taskModules/TriggerModule.sol";
import {
    EIP173Proxy
} from "../../../contracts/vendor/proxy/EIP173/EIP173Proxy.sol";
import {LibDataTypes} from "../../../contracts/libraries/LibDataTypes.sol";

// solhint-disable max-states-count
abstract contract Contracts is BaseTest {
    Automate public automate;
    OpsProxyFactory public opsProxyFactory;
    ResolverModule public resolverModule;
    ProxyModule public proxyModule;
    SingleExecModule public singleExecModule;
    Web3FunctionModule public web3FunctionModule;
    TriggerModule public triggerModule;

    //solhint-disable no-empty-blocks
    constructor() {}

    function setUp() public virtual override {
        super.setUp();

        _deployContracts();
        console.log("automate: ", address(automate));
        console.log("opsProxyFactory: ", address(opsProxyFactory));
        console.log("resolverModule: ", address(resolverModule));
        console.log("proxyModule: ", address(proxyModule));
        console.log("singleExecModule: ", address(singleExecModule));
        console.log("web3FunctionModule: ", address(web3FunctionModule));
        console.log("triggerModule: ", address(triggerModule));

        // Stop pranking deployer
        vm.stopPrank();
    }

    function _deployContracts() internal {
        _deployAutomate();
        _deployOpsProxyFactory();
        _deployModules();
    }

    function _deployAutomate() internal {
        Automate automateImplementation = new Automate(_users.gelato);
        EIP173Proxy proxy = new EIP173Proxy(
            address(automateImplementation),
            _users.deployer,
            bytes("")
        );

        automate = Automate(address(proxy));
    }

    function _deployOpsProxyFactory() internal {
        OpsProxy opsProxyImplementation = new OpsProxy(address(automate));
        OpsProxyFactory opsProxyFactoryImplementation = new OpsProxyFactory(
            address(automate)
        );
        bytes memory initData = abi.encodeWithSelector(
            OpsProxyFactory.initialize.selector,
            address(opsProxyImplementation)
        );
        EIP173Proxy proxy = new EIP173Proxy(
            address(opsProxyFactoryImplementation),
            _users.deployer,
            initData
        );
        opsProxyFactory = OpsProxyFactory(address(proxy));
    }

    function _deployModules() internal {
        resolverModule = new ResolverModule();
        proxyModule = new ProxyModule(opsProxyFactory);
        singleExecModule = new SingleExecModule();
        web3FunctionModule = new Web3FunctionModule();
        triggerModule = new TriggerModule();

        LibDataTypes.Module[] memory modules = new LibDataTypes.Module[](5);
        modules[0] = LibDataTypes.Module.RESOLVER;
        modules[1] = LibDataTypes.Module.PROXY;
        modules[2] = LibDataTypes.Module.SINGLE_EXEC;
        modules[3] = LibDataTypes.Module.WEB3_FUNCTION;
        modules[4] = LibDataTypes.Module.TRIGGER;

        address[] memory modulesAddresses = new address[](5);
        modulesAddresses[0] = address(resolverModule);
        modulesAddresses[1] = address(proxyModule);
        modulesAddresses[2] = address(singleExecModule);
        modulesAddresses[3] = address(web3FunctionModule);
        modulesAddresses[4] = address(triggerModule);

        automate.setModule(modules, modulesAddresses);
    }
}
