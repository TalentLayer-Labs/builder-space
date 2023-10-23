import { IToken, NetworkEnum } from './types';
import { ZERO_ADDRESS } from './utils/constant';

export type Config = {
  networkId: NetworkEnum;
  subgraphUrl: string;
  escrowConfig: { [key: string]: any };
  contracts: { [key: string]: `0x${string}` };
  tokens: { [key: string]: IToken };
};

export const maxDecimals = {
  ETH: 2,
};

export const FEE_RATE_DIVIDER = 10_000;

const mumbai: Config = {
  networkId: NetworkEnum.MUMBAI,
  subgraphUrl: 'https://api.thegraph.com/subgraphs/name/talentlayer/talent-layer-mumbai',
  contracts: {
    talentLayerId: '0x3F87289e6Ec2D05C32d8A74CCfb30773fF549306',
    serviceRegistry: '0x27ED516dC1df64b4c1517A64aa2Bb72a434a5A6D',
    talentLayerReview: '0x050F59E1871d3B7ca97e6fb9DCE64b3818b14B18',
    talentLayerEscrow: '0x4bE920eC3e8552292B2147480111063E0dc36872',
    talentLayerPlatformId: '0xEFD8dbC421380Ee04BAdB69216a0FD97F64CbFD4',
    talentLayerArbitrator: '0x2CA01a0058cfB3cc4755a7773881ea88eCfBba7C',
  },
  escrowConfig: {
    adminFee: '0',
    adminWallet: '0xC01FcDfDE3B2ABA1eab76731493C617FfAED2F10',
    timeoutPayment: 3600 * 24 * 7,
  },
  tokens: {
    [ZERO_ADDRESS]: {
      address: ZERO_ADDRESS,
      symbol: 'MATIC',
      name: 'Matic',
      decimals: 18,
    },
    '0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747': {
      address: '0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747',
      symbol: 'USDC',
      name: 'USDC Stablecoin',
      decimals: 6,
    },
  },
};

const polygon: Config = {
  networkId: NetworkEnum.POLYGON,
  subgraphUrl: 'https://api.thegraph.com/subgraphs/name/talentlayer/talentlayer-polygon',
  contracts: {
    talentLayerId: '0xD7D1B2b0A665F03618cb9a45Aa3070f789cb91f2',
    serviceRegistry: '0xae8Bba1a403816568230d92099ccB87f41BbcA78',
    talentLayerReview: '0x7bBC20c8Fcb75A126810161DFB1511f6D3B1f2bE',
    talentLayerEscrow: '0x21C716673897f4a2A3c12053f3973F51Ce7b0cf6',
    talentLayerPlatformId: '0x09FF07297d48eD9aD870caCE4b33BF30869C1D17',
    talentLayerArbitrator: '0x4502E695A747F1b382a16D6C8AE3FD94DA78e7a0',
  },
  escrowConfig: {
    adminFee: '0',
    adminWallet: '0xC01FcDfDE3B2ABA1eab76731493C617FfAED2F10',
    timeoutPayment: 3600 * 24 * 7,
  },
  tokens: {
    [ZERO_ADDRESS]: {
      address: ZERO_ADDRESS,
      symbol: 'MATIC',
      name: 'Matic',
      decimals: 18,
    },
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      name: 'USDC Stablecoin',
      decimals: 6,
    },
    '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619': {
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      symbol: 'WETH',
      name: 'WETH',
      decimals: 18,
    },
  },
};

const iexec: Config = {
  networkId: NetworkEnum.IEXEC,
  subgraphUrl: 'https://thegraph-sandbox.iex.ec/subgraphs/name/users/talentLayer',
  contracts: {
    talentLayerId: '0xC51537E03f56650C63A9Feca4cCb5a039c77c822',
    serviceRegistry: '0x45E8F869Fd316741A9316f39bF09AD03Df88496f',
    talentLayerReview: '0x6A5BF452108DA389B7B38284E871f538671Ad375',
    talentLayerEscrow: '0x7A534501a6e63448EBC691f27B27B76d4F9b7E17',
    talentLayerPlatformId: '0x05D8A2E01EB06c284ECBae607A2d0c2BE946Bf49',
    talentLayerArbitrator: '0x24cEd045b50cF811862B1c33dC6B1fbC8358F521',
  },
  escrowConfig: {
    adminFee: '0',
    adminWallet: '0x2E6f7222d4d7A71B05E7C35389d23C3dB400851f',
    timeoutPayment: 3600 * 24 * 7,
  },
  tokens: {
    ['0x0000000000000000000000000000000000000000']: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'RLC',
      name: 'iExec RLC',
      decimals: 18,
    },
    '0xe62c28709e4f19bae592a716b891a9b76bf897e4': {
      address: '0xe62c28709e4f19bae592a716b891a9b76bf897e4',
      symbol: 'SERC20',
      name: 'SimpleERC20',
      decimals: 18,
    },
  },
};

const local: Config = {
  networkId: NetworkEnum.LOCAL,
  subgraphUrl: 'http://localhost:8020/',
  contracts: {
    talentLayerId: '0x3F87289e6Ec2D05C32d8A74CCfb30773fF549306',
    serviceRegistry: '0x27ED516dC1df64b4c1517A64aa2Bb72a434a5A6D',
    talentLayerReview: '0x050F59E1871d3B7ca97e6fb9DCE64b3818b14B18',
    talentLayerEscrow: '0x4bE920eC3e8552292B2147480111063E0dc36872',
    talentLayerPlatformId: '0xEFD8dbC421380Ee04BAdB69216a0FD97F64CbFD4',
    talentLayerArbitrator: '0xd6eCCD00F4F411CDf3DCc3009164d0C388b18fd1',
  },
  escrowConfig: {
    timeoutPayment: 3600 * 24 * 7,
  },
  tokens: {
    [ZERO_ADDRESS]: {
      address: ZERO_ADDRESS,
      symbol: 'ETH',
      name: 'ETH',
      decimals: 18,
    },
    '0xfF695df29837B571c4DAE01B5711500f6306E93f': {
      address: '0xfF695df29837B571c4DAE01B5711500f6306E93f',
      symbol: 'ERC20',
      name: 'Simple ERC20',
      decimals: 18,
    },
  },
};

const chains: { [networkId in NetworkEnum]: Config } = {
  [NetworkEnum.LOCAL]: local,
  [NetworkEnum.MUMBAI]: mumbai,
  [NetworkEnum.IEXEC]: iexec,
  [NetworkEnum.POLYGON]: polygon,
};

export const getConfig = (networkId: NetworkEnum) => chains[networkId];
