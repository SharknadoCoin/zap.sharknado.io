import AvaxIcon from "../assets/tokens/AVAX.svg";
import BnbIcon from "../assets/tokens/BNB.png";
import MimIcon from "../assets/tokens/MIM.svg";
import UsdtEIcon from "../assets/tokens/USDT.e.png";
import WavaxIcon from "../assets/tokens/WAVAX.png";
import YakIcon from "../assets/tokens/busd.png";

export interface IToken {
    name: string;
    address: string;
    img: string;
    isAvax?: boolean;
    decimals: number;
}

export const bnb: IToken = {
    name: "BNB",
    isAvax: true,
    img: BnbIcon,
    address: "",
    decimals: 18,
};/* 
export const wbnb: IToken = {
    name: "WBNB",
    isAvax: true,
    img: WavaxIcon,
    address: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
    decimals: 18,
}; */
export const sea: IToken = {
    name: "SEA",
    img: MimIcon,
    address: "0x26193C7fa4354AE49eC53eA2cEBC513dc39A10aa",
    decimals: 18,
};
export const sss: IToken = {
    name: "SSS",
    img: AvaxIcon,
    address: "0xC3028FbC1742a16A5D69dE1B334cbce28f5d7EB3",
    decimals: 18,
};

export const usdt: IToken = {
    name: "USDT",
    address: "0x55d398326f99059ff775485246999027b3197955",
    img: UsdtEIcon,
    decimals: 18,
};

export const busd: IToken = {
    name: "BUSD",
    address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    img: YakIcon,
    decimals: 18,
};

export default [usdt, busd, bnb, sea, sss];