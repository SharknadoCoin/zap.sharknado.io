import { JsonRpcProvider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { createAsyncThunk, Dispatch } from "@reduxjs/toolkit";
import { messages } from "../../constants/messages";
import { getAddresses, Networks } from "../../constants";
import { IToken } from "../../helpers/tokens";
import { info, success, warning } from "./messages-slice";
import { clearPendingTxn, fetchPendingTxns } from "./pending-txns-slice";
import { metamaskErrorWrap } from "../../helpers/metamask-error-wrap";
import { getGasPrice } from "../../helpers/get-gas-price";
import { ethers } from "ethers";
import { MimTokenContract, ZapinContract, UFXLpContract, FactoryContract, PancakeLpContract, RouterContract, IZAP } from "../../abi";
import { calculateUserBondDetails, fetchAccountSuccess } from "./account-slice";
import { IAllBondData } from "../../hooks/bonds";
/* import { zapinData, zapinLpData } from "../../helpers/zapin-fetch-data"; */
import { trim } from "../../helpers/trim";
import { sleep } from "../../helpers";
import _ from "lodash";

interface IChangeApproval {
    token: IToken;
    provider: StaticJsonRpcProvider | JsonRpcProvider;
    address: string;
    networkID: Networks;
}

export const changeApproval = createAsyncThunk("zapin/changeApproval", async ({ token, provider, address, networkID }: IChangeApproval, { dispatch }) => {
    if (!provider) {
        dispatch(warning({ text: messages.please_connect_wallet }));
        return;
    }
    const addresses = getAddresses(networkID);

    const signer = provider.getSigner();

    const tokenContract = new ethers.Contract(token.address, MimTokenContract, signer);
    
    let approveTx;
    try {
        const gasPrice = await getGasPrice(provider);

        approveTx = await tokenContract.approve(addresses.ZAPIN_ADDRESS, ethers.constants.MaxUint256, { gasPrice });

        const text = "Approve " + token.name;
        const pendingTxnType = "approve_" + token.address;

        dispatch(fetchPendingTxns({ txnHash: approveTx.hash, text, type: pendingTxnType }));
        await approveTx.wait();
        dispatch(success({ text: messages.tx_successfully_send }));
    } catch (err: any) {
        return metamaskErrorWrap(err, dispatch);
    } finally {
        if (approveTx) {
            dispatch(clearPendingTxn(approveTx.hash));
        }
    }

    await sleep(2);

    const tokenAllowance = await tokenContract.allowance(address, addresses.ZAPIN_ADDRESS);

    return dispatch(
        fetchAccountSuccess({
            tokens: {
                [token.name]: {
                    allowance: Number(tokenAllowance),
                },
            },
        }),
    );
});

interface ITokenZapin {
    token: IToken;
    provider: StaticJsonRpcProvider | JsonRpcProvider;
    networkID: Networks;
    /* bond: IAllBondData; */
    slippage: number;
    value: string;
    dispatch: Dispatch<any>;
}
export interface ITokenZapinResponse {
    swapTarget: string;
    swapData: string;
    amount: string;
    value: string;
}

/* export const calcZapinDetails = async ({ token, provider, networkID, bond, value, slippage, dispatch }: ITokenZapin): Promise<ITokenZapinResponse> => {
    let swapTarget: string = "";
    let swapData: string = "";
    let amount: string = "";

    const acceptedSlippage = slippage / 100 || 0.02;

    if (!provider) {
        dispatch(warning({ text: messages.please_connect_wallet }));
        return {
            swapTarget,
            swapData,
            amount,
            value,
        };
    }

    if (acceptedSlippage < 0.001) {
        dispatch(warning({ text: messages.slippage_too_small }));
        return {
            swapTarget,
            swapData,
            amount,
            value,
        };
    }

    if (acceptedSlippage > 1) {
        dispatch(warning({ text: messages.slippage_too_big }));
        return {
            swapTarget,
            swapData,
            amount,
            value,
        };
    }

    const valueInWei = trim(Number(value) * Math.pow(10, token.decimals));

    try {
        if (bond.isLP) {
            [swapTarget, swapData, amount] = await zapinLpData(bond, token, valueInWei, networkID, acceptedSlippage);
        } else {
            [swapTarget, swapData, amount] = await zapinData(bond, token, valueInWei, networkID, acceptedSlippage);
        }
    } catch (err) {
        metamaskErrorWrap(err, dispatch);
    }

    return {
        swapTarget,
        swapData,
        amount,
        value,
    };
}; */

/* interface ILpToken {
    provider: JsonRpcProvider;
    token: IToken;
    networkID: Networks;
    bond: IAllBondData;
    value: string;
} */

/* interface ILpTokenResponse {
    receivedAmount: number;
} */

/* export const lpTokenDetails = async ({ provider, token, networkID, bond, value }: ILpToken): Promise<ILpTokenResponse> => {
    let _reserve0;
    let _reserve1;
    let token0;
    let token1;
    let totalSupply;
    let tokenAmount;
    const pancakeFactory = new ethers.Contract("0x2fcd5B3B7A5088509bAbC9910eD2F1B6Fe5775B6", FactoryContract, provider);
    const pairBNBAddress = await pancakeFactory.getPair("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", token.address);
    const pairBNBContact = new ethers.Contract(pairBNBAddress, PancakeLpContract, provider);
    token0 = await pairBNBContact.token0();
    token1 = await pairBNBContact.token1();
    [_reserve0, _reserve1] = await pairBNBContact.getReserves();
    if (_reserve0 * 1 < _reserve1 * 1) {
        tokenAmount = (_reserve0 / _reserve1) * Number(value) * Math.pow(10, token.decimals);
    } else {
        tokenAmount = (_reserve1 / _reserve0) * Number(value) * Math.pow(10, token.decimals);
    }

    const lpContract = new ethers.Contract(bond.getAddressForReserve(networkID), UFXLpContract, provider);
    token0 = await lpContract.token0();
    token1 = await lpContract.token1();

    let receivedAmount;

    [_reserve0, _reserve1] = await lpContract.getReserves();
    totalSupply = await lpContract.totalSupply();

    if (token0.toLowerCase() == "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c") {
        receivedAmount = (totalSupply * tokenAmount * 9) / _reserve0 / Math.pow(10, 18) / 20.78;
    } else if (token1.toLowerCase() == "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c") {
        receivedAmount = (totalSupply * tokenAmount * 9) / _reserve1 / Math.pow(10, 18) / 20.78;
    } else {
        const routerContract = new ethers.Contract("0x10ED43C718714eb63d5aA57B78B54704E256024E", RouterContract, provider);
        tokenAmount = Math.round(tokenAmount * 0.45);
        [, receivedAmount] = await routerContract.getAmountsOut(tokenAmount.toString(), ["0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", token0]);
        receivedAmount = (totalSupply * receivedAmount) / _reserve0 / Math.pow(10, 18) / 1.039;
    }

    return {
        receivedAmount,
    };
}; */

/* interface IZapinMint {
    provider: StaticJsonRpcProvider | JsonRpcProvider;
    networkID: Networks;
    bond: IAllBondData;
    token: IToken;
    value: string;
    slippage: number;
    address: string;
} */

interface IZap {
    provider: StaticJsonRpcProvider | JsonRpcProvider;
    token: IToken;
    networkID: Networks;
    bond: IAllBondData;
    value: string;
    address: string;
}


export const ZapIn = createAsyncThunk("zapin/zapIn", async ({ provider, bond, token, networkID, value, address }: IZap, { dispatch }) => {
   
    const addresses = getAddresses(networkID);
    var contractAddress = addresses.ZAPIN_ADDRESS;
    const bondAddress = bond.getAddressForReserve(networkID);
    const signer = provider.getSigner();
    let contract = new ethers.Contract(contractAddress, IZAP, signer);
    
    const valueInWei = trim(Number(value) * Math.pow(10, token.decimals));

    let zapinTx;
    let overrides;
    //if (token == "BSC") {zapIn}
    //else {zapInToken}
    
    try {
        if (token.name == "BNB") {
            
            overrides = {
                value: ethers.utils.parseEther(value),  
                gasLimit: 500000
            }
            
            zapinTx = await contract.zapIn(bondAddress, overrides);
        }
        else {
            overrides = { 
                gasLimit: 1000000
            }
            zapinTx = await contract.zapInToken(token.address, valueInWei, bondAddress, overrides);
        }
        dispatch(
            fetchPendingTxns({
                txnHash: zapinTx.hash,
                text: "Zapin ",
                type: "zapin_",
            }),
        );
        await zapinTx.wait();
        /* dispatch(success({ text: messages.tx_successfully_send })); */
        /* await sleep(0.01); */
        // dispatch(info({ text: messages.your_balance_update_soon }));
        /* await sleep(10); */
        /* await dispatch(calculateUserBondDetails({ address, bond, networkID, provider })); */
        // dispatch(info({ text: messages.your_balance_updated }));
        return;
    } catch (err) {
        return metamaskErrorWrap(err, dispatch);
    } finally {
        if (zapinTx) {
            dispatch(clearPendingTxn(zapinTx.hash));
        }
    }

});

/* export const zapinMint = createAsyncThunk("zapin/zapinMint", async ({ provider, networkID, token, value, slippage, address }: IZapinMint, { dispatch }) => {
    if (!provider) {
        dispatch(warning({ text: messages.please_connect_wallet }));
        return;
    }
    const acceptedSlippage = slippage / 100 || 0.02;
    const addresses = getAddresses(networkID);
    // const depositorAddress = address;

    const signer = provider.getSigner();
    const zapinContract = new ethers.Contract(addresses.ZAPIN_ADDRESS, IZAP, signer);

    const valueInWei = trim(Number(value) * Math.pow(10, token.decimals));

    const currentDate = new Date();
    const timestamp = (currentDate.getTime() / 1000).toFixed() + 100000;

    let zapinTx;

    try {
        zapinTx = await zapinContract.Contract(IZAP, 0.0001, "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16");
        await zapinTx.wait(); 

        zapinTx = await zapinContract.ZapIn(token.address, valueInWei, path, path1, path2, 61, timestamp);
        dispatch(
            fetchPendingTxns({
                txnHash: zapinTx.hash,
                text: "Zapin " + token.name,
                type: "zapin_" + token.name + "_" + bond.name,
            }),
        );
        await zapinTx.wait();
        dispatch(success({ text: messages.tx_successfully_send }));
        await sleep(0.01);
        // dispatch(info({ text: messages.your_balance_update_soon }));
        await sleep(10);
        await dispatch(calculateUserBondDetails({ address, bond, networkID, provider }));
        // dispatch(info({ text: messages.your_balance_updated }));
        return;
    } catch (err) {
        return metamaskErrorWrap(err, dispatch);
    } finally {
        if (zapinTx) {
            dispatch(clearPendingTxn(zapinTx.hash));
        }
    }
}); */