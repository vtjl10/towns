/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Signer,
  utils,
  Contract,
  ContractFactory,
  BytesLike,
  Overrides,
} from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type { Member, MemberInterface } from "../Member";

const _abi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "name_",
        type: "string",
        internalType: "string",
      },
      {
        name: "symbol_",
        type: "string",
        internalType: "string",
      },
      {
        name: "baseURI_",
        type: "string",
        internalType: "string",
      },
      {
        name: "merkleRoot_",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "MINT_PRICE",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "TOTAL_SUPPLY",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "_hasMinted",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      {
        name: "to",
        type: "address",
        internalType: "address",
      },
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "baseURI",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "currentTokenId",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getApproved",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isApprovedForAll",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
      {
        name: "operator",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ownerOf",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "privateMint",
    inputs: [
      {
        name: "recipient",
        type: "address",
        internalType: "address",
      },
      {
        name: "allowance",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "proof",
        type: "bytes32[]",
        internalType: "bytes32[]",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "publicMint",
    inputs: [
      {
        name: "recipient",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "safeTransferFrom",
    inputs: [
      {
        name: "from",
        type: "address",
        internalType: "address",
      },
      {
        name: "to",
        type: "address",
        internalType: "address",
      },
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "safeTransferFrom",
    inputs: [
      {
        name: "from",
        type: "address",
        internalType: "address",
      },
      {
        name: "to",
        type: "address",
        internalType: "address",
      },
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setApprovalForAll",
    inputs: [
      {
        name: "operator",
        type: "address",
        internalType: "address",
      },
      {
        name: "approved",
        type: "bool",
        internalType: "bool",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setBaseURI",
    inputs: [
      {
        name: "baseURI_",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "startPublicMint",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "startWaitlistMint",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "supportsInterface",
    inputs: [
      {
        name: "interfaceId",
        type: "bytes4",
        internalType: "bytes4",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokenURI",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transferFrom",
    inputs: [
      {
        name: "from",
        type: "address",
        internalType: "address",
      },
      {
        name: "to",
        type: "address",
        internalType: "address",
      },
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawPayments",
    inputs: [
      {
        name: "payee",
        type: "address",
        internalType: "address payable",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "Approval",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "approved",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ApprovalForAll",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "operator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "approved",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MintStateChanged",
    inputs: [
      {
        name: "caller",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "prevState",
        type: "uint8",
        indexed: true,
        internalType: "enum Member.MintState",
      },
      {
        name: "newState",
        type: "uint8",
        indexed: true,
        internalType: "enum Member.MintState",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Minted",
    inputs: [
      {
        name: "recipient",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "tokenId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "to",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "AlreadyMinted",
    inputs: [],
  },
  {
    type: "error",
    name: "ERC721IncorrectOwner",
    inputs: [
      {
        name: "sender",
        type: "address",
        internalType: "address",
      },
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "ERC721InsufficientApproval",
    inputs: [
      {
        name: "operator",
        type: "address",
        internalType: "address",
      },
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "ERC721InvalidApprover",
    inputs: [
      {
        name: "approver",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "ERC721InvalidOperator",
    inputs: [
      {
        name: "operator",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "ERC721InvalidOwner",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "ERC721InvalidReceiver",
    inputs: [
      {
        name: "receiver",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "ERC721InvalidSender",
    inputs: [
      {
        name: "sender",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "ERC721NonexistentToken",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidMintState",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidProof",
    inputs: [],
  },
  {
    type: "error",
    name: "MaxSupplyReached",
    inputs: [],
  },
  {
    type: "error",
    name: "MintPriceNotPaid",
    inputs: [],
  },
  {
    type: "error",
    name: "NonExistentTokenURI",
    inputs: [],
  },
  {
    type: "error",
    name: "NotAllowed",
    inputs: [],
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "WithdrawTransfer",
    inputs: [],
  },
] as const;

const _bytecode =
  "0x60a060405234801561000f575f5ffd5b506040516124eb3803806124eb83398101604081905261002e91610193565b3384845f61003c83826102ae565b50600161004982826102ae565b5050506001600160a01b03811661007957604051631e4fbdf760e01b81525f600482015260240160405180910390fd5b610082816100a5565b50600761008f83826102ae565b5060805250506009805460ff1916905550610368565b600680546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0905f90a35050565b634e487b7160e01b5f52604160045260245ffd5b5f82601f830112610119575f5ffd5b81516001600160401b03811115610132576101326100f6565b604051601f8201601f19908116603f011681016001600160401b0381118282101715610160576101606100f6565b604052818152838201602001851015610177575f5ffd5b8160208501602083015e5f918101602001919091529392505050565b5f5f5f5f608085870312156101a6575f5ffd5b84516001600160401b038111156101bb575f5ffd5b6101c78782880161010a565b602087015190955090506001600160401b038111156101e4575f5ffd5b6101f08782880161010a565b604087015190945090506001600160401b0381111561020d575f5ffd5b6102198782880161010a565b606096909601519497939650505050565b600181811c9082168061023e57607f821691505b60208210810361025c57634e487b7160e01b5f52602260045260245ffd5b50919050565b601f8211156102a957805f5260205f20601f840160051c810160208510156102875750805b601f840160051c820191505b818110156102a6575f8155600101610293565b50505b505050565b81516001600160401b038111156102c7576102c76100f6565b6102db816102d5845461022a565b84610262565b6020601f82116001811461030d575f83156102f65750848201515b5f19600385901b1c1916600184901b1784556102a6565b5f84815260208120601f198516915b8281101561033c578785015182556020948501946001909201910161031c565b508482101561035957868401515f19600387901b60f8161c191681555b50505050600190811b01905550565b60805161216b6103805f395f610ad1015261216b5ff3fe6080604052600436106101a3575f3560e01c8063715018a6116100e7578063a839e50111610087578063c87b56dd11610062578063c87b56dd14610460578063d92d1bd61461047f578063e985e9c5146104ad578063f2fde38b14610501575f5ffd5b8063a839e50114610412578063b88d4fde14610426578063c002d23d14610445575f5ffd5b8063902d55a5116100c2578063902d55a5146103b757806395d89b41146103cc5780639886a902146103e0578063a22cb465146103f3575f5ffd5b8063715018a61461036557806376c64c62146103795780638da5cb5b1461038d575f5ffd5b806331b3eb941161015257806355f804b31161012d57806355f804b3146102f45780636352211e146103135780636c0360eb1461033257806370a0823114610346575f5ffd5b806331b3eb94146102a357806332a93a3a146102c257806342842e0e146102d5575f5ffd5b8063081812fc11610182578063081812fc1461021f578063095ea7b31461026357806323b872dd14610284575f5ffd5b80629a9b7b146101a757806301ffc9a7146101cf57806306fdde03146101fe575b5f5ffd5b3480156101b2575f5ffd5b506101bc600a5481565b6040519081526020015b60405180910390f35b3480156101da575f5ffd5b506101ee6101e9366004611a45565b610520565b60405190151581526020016101c6565b348015610209575f5ffd5b50610212610604565b6040516101c69190611aac565b34801561022a575f5ffd5b5061023e610239366004611abe565b610693565b60405173ffffffffffffffffffffffffffffffffffffffff90911681526020016101c6565b34801561026e575f5ffd5b5061028261027d366004611af6565b6106c7565b005b34801561028f575f5ffd5b5061028261029e366004611b20565b6106d6565b3480156102ae575f5ffd5b506102826102bd366004611b5e565b6107ca565b6101bc6102d0366004611b5e565b61086e565b3480156102e0575f5ffd5b506102826102ef366004611b20565b6108a4565b3480156102ff575f5ffd5b5061028261030e366004611c3b565b6108be565b34801561031e575f5ffd5b5061023e61032d366004611abe565b6108d2565b34801561033d575f5ffd5b506102126108dc565b348015610351575f5ffd5b506101bc610360366004611b5e565b610968565b348015610370575f5ffd5b506102826109e0565b348015610384575f5ffd5b506102826109f3565b348015610398575f5ffd5b5060065473ffffffffffffffffffffffffffffffffffffffff1661023e565b3480156103c2575f5ffd5b506101bc6109c481565b3480156103d7575f5ffd5b50610212610a0f565b6101bc6103ee366004611c80565b610a1e565b3480156103fe575f5ffd5b5061028261040d366004611d08565b610b45565b34801561041d575f5ffd5b50610282610b50565b348015610431575f5ffd5b50610282610440366004611d43565b610b6b565b348015610450575f5ffd5b506101bc67011c37937e08000081565b34801561046b575f5ffd5b5061021261047a366004611abe565b610b83565b34801561048a575f5ffd5b506101ee610499366004611b5e565b60086020525f908152604090205460ff1681565b3480156104b8575f5ffd5b506101ee6104c7366004611dbe565b73ffffffffffffffffffffffffffffffffffffffff9182165f90815260056020908152604080832093909416825291909152205460ff1690565b34801561050c575f5ffd5b5061028261051b366004611b5e565b610c2c565b5f7fffffffff0000000000000000000000000000000000000000000000000000000082167f80ac58cd0000000000000000000000000000000000000000000000000000000014806105b257507fffffffff0000000000000000000000000000000000000000000000000000000082167f5b5e139f00000000000000000000000000000000000000000000000000000000145b806105fe57507f01ffc9a7000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316145b92915050565b60605f805461061290611dea565b80601f016020809104026020016040519081016040528092919081815260200182805461063e90611dea565b80156106895780601f1061066057610100808354040283529160200191610689565b820191905f5260205f20905b81548152906001019060200180831161066c57829003601f168201915b5050505050905090565b5f61069d82610c8f565b505f8281526004602052604090205473ffffffffffffffffffffffffffffffffffffffff166105fe565b6106d2828233610ced565b5050565b73ffffffffffffffffffffffffffffffffffffffff821661072a576040517f64a0ae920000000000000000000000000000000000000000000000000000000081525f60048201526024015b60405180910390fd5b5f610736838333610cfa565b90508373ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16146107c4576040517f64283d7b00000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff80861660048301526024820184905282166044820152606401610721565b50505050565b6107d2610e71565b60405147905f9073ffffffffffffffffffffffffffffffffffffffff84169083908381818185875af1925050503d805f8114610829576040519150601f19603f3d011682016040523d82523d5f602084013e61082e565b606091505b5050905080610869576040517fd23a9e8900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b505050565b5f61087882610ec4565b610880610f11565b610888610f52565b61089182610f8f565b61089b6002610fee565b6105fe8261104e565b61086983838360405180602001604052805f815250610b6b565b6108c6610e71565b60076106d28282611e7f565b5f6105fe82610c8f565b600780546108e990611dea565b80601f016020809104026020016040519081016040528092919081815260200182805461091590611dea565b80156109605780601f1061093757610100808354040283529160200191610960565b820191905f5260205f20905b81548152906001019060200180831161094357829003601f168201915b505050505081565b5f73ffffffffffffffffffffffffffffffffffffffff82166109b8576040517f89c62b640000000000000000000000000000000000000000000000000000000081525f6004820152602401610721565b5073ffffffffffffffffffffffffffffffffffffffff165f9081526003602052604090205490565b6109e8610e71565b6109f15f611111565b565b6109fb610e71565b610a056001610fee565b6109f16002611187565b60606001805461061290611dea565b5f610a2885610ec4565b610a30610f11565b610a38610f52565b610a4185610f8f565b610a4a8461122a565b6040517fffffffffffffffffffffffffffffffffffffffff000000000000000000000000606087901b166020820152603481018590525f90605401604051602081830303815290604052805190602001209050610afc8484808060200260200160405190810160405280939291908181526020018383602002808284375f920191909152507f000000000000000000000000000000000000000000000000000000000000000092508591506112879050565b610b32576040517f09bde33900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b610b3b8661104e565b9695505050505050565b6106d233838361129c565b610b58610e71565b610b615f610fee565b6109f16001611187565b610b768484846106d6565b6107c43385858585611398565b60605f610b8f836108d2565b73ffffffffffffffffffffffffffffffffffffffff1603610bdc576040517fd872946b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5f60078054610bea90611dea565b905011610c055760405180602001604052805f8152506105fe565b6007604051602001610c179190611f96565b60405160208183030381529060405292915050565b610c34610e71565b73ffffffffffffffffffffffffffffffffffffffff8116610c83576040517f1e4fbdf70000000000000000000000000000000000000000000000000000000081525f6004820152602401610721565b610c8c81611111565b50565b5f8181526002602052604081205473ffffffffffffffffffffffffffffffffffffffff16806105fe576040517f7e27328900000000000000000000000000000000000000000000000000000000815260048101849052602401610721565b610869838383600161158e565b5f8281526002602052604081205473ffffffffffffffffffffffffffffffffffffffff90811690831615610d3357610d33818486611756565b73ffffffffffffffffffffffffffffffffffffffff811615610da657610d5b5f855f5f61158e565b73ffffffffffffffffffffffffffffffffffffffff81165f90815260036020526040902080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0190555b73ffffffffffffffffffffffffffffffffffffffff851615610dee5773ffffffffffffffffffffffffffffffffffffffff85165f908152600360205260409020805460010190555b5f8481526002602052604080822080547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff89811691821790925591518793918516917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef91a4949350505050565b60065473ffffffffffffffffffffffffffffffffffffffff1633146109f1576040517f118cdaa7000000000000000000000000000000000000000000000000000000008152336004820152602401610721565b73ffffffffffffffffffffffffffffffffffffffff8116610c8c576040517fe6c4247b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b67011c37937e08000034146109f1576040517f21e191e200000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6109c4600a54106109f1576040517fd05cb60900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b73ffffffffffffffffffffffffffffffffffffffff81165f9081526008602052604090205460ff1615610c8c576040517fddefae2800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8060028111156110005761100061204a565b60095460ff1660028111156110175761101761204a565b14610c8c576040517fa1f6623900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b73ffffffffffffffffffffffffffffffffffffffff81165f90815260086020526040812080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00166001179055600a8054908190836110ac83612077565b91905055506110bb8382611806565b6040805182815242602082015273ffffffffffffffffffffffffffffffffffffffff8516917f25b428dfde728ccfaddad7e29e4ac23c24ed7fd1a6e3e3f91894a9a073f5dfff910160405180910390a292915050565b6006805473ffffffffffffffffffffffffffffffffffffffff8381167fffffffffffffffffffffffff0000000000000000000000000000000000000000831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0905f90a35050565b6009805460ff81169183917fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff001660018360028111156111c8576111c861204a565b02179055508160028111156111df576111df61204a565b8160028111156111f1576111f161204a565b60405142815233907f7a5907205f46c7df4a68b33c1da8921886b57f025f0ec67a42c38d2c2013a7849060200160405180910390a45050565b5f60095460ff1660028111156112425761124261204a565b148015611250575080600114155b15610c8c576040517f3d693ada00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b5f82611293858461181f565b14949350505050565b73ffffffffffffffffffffffffffffffffffffffff8216611301576040517f5b08ba1800000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff83166004820152602401610721565b73ffffffffffffffffffffffffffffffffffffffff8381165f8181526005602090815260408083209487168084529482529182902080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff001686151590811790915591519182527f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31910160405180910390a3505050565b73ffffffffffffffffffffffffffffffffffffffff83163b15611587576040517f150b7a0200000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff84169063150b7a029061140d9088908890879087906004016120d3565b6020604051808303815f875af1925050508015611465575060408051601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016820190925261146291810190612123565b60015b6114f2573d808015611492576040519150601f19603f3d011682016040523d82523d5f602084013e611497565b606091505b5080515f036114ea576040517f64a0ae9200000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff85166004820152602401610721565b805181602001fd5b7fffffffff0000000000000000000000000000000000000000000000000000000081167f150b7a020000000000000000000000000000000000000000000000000000000014611585576040517f64a0ae9200000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff85166004820152602401610721565b505b5050505050565b80806115af575073ffffffffffffffffffffffffffffffffffffffff821615155b15611702575f6115be84610c8f565b905073ffffffffffffffffffffffffffffffffffffffff83161580159061161157508273ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614155b801561164f575073ffffffffffffffffffffffffffffffffffffffff8082165f9081526005602090815260408083209387168352929052205460ff16155b1561169e576040517fa9fbf51f00000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff84166004820152602401610721565b811561170057838573ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45b505b50505f90815260046020526040902080547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff92909216919091179055565b611761838383611861565b6108695773ffffffffffffffffffffffffffffffffffffffff83166117b5576040517f7e27328900000000000000000000000000000000000000000000000000000000815260048101829052602401610721565b6040517f177e802f00000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8316600482015260248101829052604401610721565b6106d2828260405180602001604052805f815250611925565b5f81815b84518110156118595761184f828683815181106118425761184261213e565b602002602001015161193c565b9150600101611823565b509392505050565b5f73ffffffffffffffffffffffffffffffffffffffff83161580159061191d57508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff1614806118ed575073ffffffffffffffffffffffffffffffffffffffff8085165f9081526005602090815260408083209387168352929052205460ff165b8061191d57505f8281526004602052604090205473ffffffffffffffffffffffffffffffffffffffff8481169116145b949350505050565b61192f838361196b565b610869335f858585611398565b5f818310611956575f828152602084905260409020611964565b5f8381526020839052604090205b9392505050565b73ffffffffffffffffffffffffffffffffffffffff82166119ba576040517f64a0ae920000000000000000000000000000000000000000000000000000000081525f6004820152602401610721565b5f6119c683835f610cfa565b905073ffffffffffffffffffffffffffffffffffffffff811615610869576040517f73c6ac6e0000000000000000000000000000000000000000000000000000000081525f6004820152602401610721565b7fffffffff0000000000000000000000000000000000000000000000000000000081168114610c8c575f5ffd5b5f60208284031215611a55575f5ffd5b813561196481611a18565b5f81518084528060208401602086015e5f6020828601015260207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f83011685010191505092915050565b602081525f6119646020830184611a60565b5f60208284031215611ace575f5ffd5b5035919050565b73ffffffffffffffffffffffffffffffffffffffff81168114610c8c575f5ffd5b5f5f60408385031215611b07575f5ffd5b8235611b1281611ad5565b946020939093013593505050565b5f5f5f60608486031215611b32575f5ffd5b8335611b3d81611ad5565b92506020840135611b4d81611ad5565b929592945050506040919091013590565b5f60208284031215611b6e575f5ffd5b813561196481611ad5565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b5f5f67ffffffffffffffff841115611bc057611bc0611b79565b506040517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f85018116603f0116810181811067ffffffffffffffff82111715611c0d57611c0d611b79565b604052838152905080828401851015611c24575f5ffd5b838360208301375f60208583010152509392505050565b5f60208284031215611c4b575f5ffd5b813567ffffffffffffffff811115611c61575f5ffd5b8201601f81018413611c71575f5ffd5b61191d84823560208401611ba6565b5f5f5f5f60608587031215611c93575f5ffd5b8435611c9e81611ad5565b935060208501359250604085013567ffffffffffffffff811115611cc0575f5ffd5b8501601f81018713611cd0575f5ffd5b803567ffffffffffffffff811115611ce6575f5ffd5b8760208260051b8401011115611cfa575f5ffd5b949793965060200194505050565b5f5f60408385031215611d19575f5ffd5b8235611d2481611ad5565b915060208301358015158114611d38575f5ffd5b809150509250929050565b5f5f5f5f60808587031215611d56575f5ffd5b8435611d6181611ad5565b93506020850135611d7181611ad5565b925060408501359150606085013567ffffffffffffffff811115611d93575f5ffd5b8501601f81018713611da3575f5ffd5b611db287823560208401611ba6565b91505092959194509250565b5f5f60408385031215611dcf575f5ffd5b8235611dda81611ad5565b91506020830135611d3881611ad5565b600181811c90821680611dfe57607f821691505b602082108103611e35577f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b50919050565b601f82111561086957805f5260205f20601f840160051c81016020851015611e605750805b601f840160051c820191505b81811015611587575f8155600101611e6c565b815167ffffffffffffffff811115611e9957611e99611b79565b611ead81611ea78454611dea565b84611e3b565b6020601f821160018114611efe575f8315611ec85750848201515b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff600385901b1c1916600184901b178455611587565b5f848152602081207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08516915b82811015611f4b5787850151825560209485019460019092019101611f2b565b5084821015611f8757868401517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff600387901b60f8161c191681555b50505050600190811b01905550565b5f5f8354611fa381611dea565b600182168015611fba5760018114611fed5761201a565b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff008316865281151582028601935061201a565b865f5260205f205f5b8381101561201257815488820152600190910190602001611ff6565b505081860193505b50507f636f756e63696c6d657461646174610000000000000000000000000000000000825250600f019392505050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602160045260245ffd5b5f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82036120cc577f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5060010190565b73ffffffffffffffffffffffffffffffffffffffff8516815273ffffffffffffffffffffffffffffffffffffffff84166020820152826040820152608060608201525f610b3b6080830184611a60565b5f60208284031215612133575f5ffd5b815161196481611a18565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52603260045260245ffd";

type MemberConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MemberConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Member__factory extends ContractFactory {
  constructor(...args: MemberConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    name_: PromiseOrValue<string>,
    symbol_: PromiseOrValue<string>,
    baseURI_: PromiseOrValue<string>,
    merkleRoot_: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<Member> {
    return super.deploy(
      name_,
      symbol_,
      baseURI_,
      merkleRoot_,
      overrides || {}
    ) as Promise<Member>;
  }
  override getDeployTransaction(
    name_: PromiseOrValue<string>,
    symbol_: PromiseOrValue<string>,
    baseURI_: PromiseOrValue<string>,
    merkleRoot_: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      name_,
      symbol_,
      baseURI_,
      merkleRoot_,
      overrides || {}
    );
  }
  override attach(address: string): Member {
    return super.attach(address) as Member;
  }
  override connect(signer: Signer): Member__factory {
    return super.connect(signer) as Member__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MemberInterface {
    return new utils.Interface(_abi) as MemberInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): Member {
    return new Contract(address, _abi, signerOrProvider) as Member;
  }
}
