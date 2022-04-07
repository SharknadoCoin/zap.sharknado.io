import { IToken } from "../helpers/tokens";
import { ethers, utils } from "ethers";
import { IAllBondData } from "../hooks/bonds";
import { getAddresses, Networks } from "../constants";
import axios from "axios";
import { TraderZapinContract } from "../abi";
import { BigNumber } from "ethers";

export const zapinLpData = async (bond: IAllBondData, token: IToken, tokenAmmount: string, network: Networks, slippage: number) => {
    const addresses = getAddresses(network);

    const sellToken = token.isAvax ? ethers.constants.AddressZero : token.address;
    const buyToken = '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16';

    //const url = `https://api.zapper.fi/v1/zap-in/pool/pancakeswap/transaction?gasPrice=1000000000000&ownerAddress=${addresses.ZAPIN_ADDRESS}&sellAmount=${tokenAmmount}&sellTokenAddress=${sellToken}&poolAddress=${buyToken}&slippagePercentage=${slippage}&network=binance-smart-chain&api_key=96e0cc51-a62e-42ca-acee-910ea7d2a241&skipGasEstimate=true`;
      const url = "https://api.zapper.fi/v1/zap-in/pool/pancakeswap/transaction?gasPrice=1000000000000&ownerAddress=0x25d9Fa3DA06422EC5306A85545f0F30646D30eCd&sellAmount=1000000000000000000&sellTokenAddress=0x55d398326f99059ff775485246999027b3197955&poolAddress=0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16&slippagePercentage=0.2&network=binance-smart-chain&api_key=96e0cc51-a62e-42ca-acee-910ea7d2a241&skipGasEstimate=true";
   
    const { data } = await axios.get(url);

    /* const data = {
        to: "0x25d9Fa3DA06422EC5306A85545f0F30646D30eCd",
        from: "0xc98Bd77ede562BA4c1BC5199BbA2917a2F356E01",
        data: "0x9ca37a0b00000000000000000000000055d398326f99059ff775485246999027b319795500000000000000000000000058f876857a02d6762e0101bb5c46a8c1ed44dc160000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000350c0bc35df437000000000000000000000000def1c0ded9bec7f1a1670819833240f027b25eff00000000000000000000000000000000000000000000000000000000000001200000000000000000000000003ce37278de6388532c3949ce4e886f365b14fb56000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000128c43c9ef600000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000064f069fb54e5b0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000055d398326f99059ff775485246999027b3197955000000000000000000000000bb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c869584cd000000000000000000000000f4e386b070a18419b5d3af56699f8a438dd18e89000000000000000000000000000000000000000000000065b488a78d624c5ab3000000000000000000000000000000000000000000000000",
        value: "0",
        sellTokenAddress: "0x55d398326f99059ff775485246999027b3197955",
        sellTokenAmount: "1000000000000000000",
        buyTokenAddress: "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16",
        minTokens: "261",
        gasPrice: "1000000000000",
        gas: "0",
    }; */

    const zapinInterface = new utils.Interface(TraderZapinContract);

    const { _swapTarget, swapData } = zapinInterface.decodeFunctionData("ZapIn", data.data);

    return [_swapTarget, swapData, data.minTokens];
};

/* export const zapinData = async (bond: IAllBondData, token: IToken, tokenAmmount: string, network: Networks, slippage: number) => {
    const sellToken = token.isAvax ? "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" : token.address;
    const buyToken = bond.getAddressForReserve(network);

    const url = `https://avalanche.api.0x.org/swap/v1/quote?buyToken=${buyToken}&includePriceComparisons=true&intentOnFilling=true&sellAmount=${tokenAmmount}&sellToken=${sellToken}&skipValidation=true&slippagePercentage=${slippage}`;
    const { data } = await axios.get(url);

    const dataBuyAmount = BigNumber.from(data.buyAmount);
    const buyAmount = dataBuyAmount.sub(dataBuyAmount.mul(slippage * 1000).div(1000));

    return [data.to, data.data, buyAmount.toString()];
}; */
