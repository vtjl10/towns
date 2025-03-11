export default [
  {
    "type": "function",
    "name": "__WalletLink_init",
    "inputs": [
      {
        "name": "delegateRegistry",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "sclEip6565",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "checkIfLinked",
    "inputs": [
      {
        "name": "rootKey",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "wallet",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "checkIfNonEVMWalletLinked",
    "inputs": [
      {
        "name": "rootKey",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "walletHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "explicitWalletsByRootKey",
    "inputs": [
      {
        "name": "rootKey",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "options",
        "type": "tuple",
        "internalType": "struct IWalletLinkBase.WalletQueryOptions",
        "components": [
          {
            "name": "includeDelegations",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "wallets",
        "type": "tuple[]",
        "internalType": "struct WalletLib.Wallet[]",
        "components": [
          {
            "name": "addr",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "vmType",
            "type": "uint8",
            "internalType": "enum WalletLib.VirtualMachineType"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getDefaultWallet",
    "inputs": [
      {
        "name": "rootWallet",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getDependency",
    "inputs": [
      {
        "name": "dependency",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getLatestNonceForRootKey",
    "inputs": [
      {
        "name": "rootKey",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRootKeyForWallet",
    "inputs": [
      {
        "name": "wallet",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "rootKey",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getWalletsByRootKey",
    "inputs": [
      {
        "name": "rootKey",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "wallets",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getWalletsByRootKeyWithDelegations",
    "inputs": [
      {
        "name": "rootKey",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "wallets",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "linkCallerToRootKey",
    "inputs": [
      {
        "name": "rootWallet",
        "type": "tuple",
        "internalType": "struct IWalletLinkBase.LinkedWallet",
        "components": [
          {
            "name": "addr",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "signature",
            "type": "bytes",
            "internalType": "bytes"
          },
          {
            "name": "message",
            "type": "string",
            "internalType": "string"
          }
        ]
      },
      {
        "name": "nonce",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "linkNonEVMWalletToRootKey",
    "inputs": [
      {
        "name": "wallet",
        "type": "tuple",
        "internalType": "struct IWalletLinkBase.NonEVMLinkedWallet",
        "components": [
          {
            "name": "wallet",
            "type": "tuple",
            "internalType": "struct WalletLib.Wallet",
            "components": [
              {
                "name": "addr",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "vmType",
                "type": "uint8",
                "internalType": "enum WalletLib.VirtualMachineType"
              }
            ]
          },
          {
            "name": "signature",
            "type": "bytes",
            "internalType": "bytes"
          },
          {
            "name": "message",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "extraData",
            "type": "tuple[]",
            "internalType": "struct IWalletLinkBase.VMSpecificData[]",
            "components": [
              {
                "name": "key",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "value",
                "type": "bytes",
                "internalType": "bytes"
              }
            ]
          }
        ]
      },
      {
        "name": "nonce",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "linkWalletToRootKey",
    "inputs": [
      {
        "name": "wallet",
        "type": "tuple",
        "internalType": "struct IWalletLinkBase.LinkedWallet",
        "components": [
          {
            "name": "addr",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "signature",
            "type": "bytes",
            "internalType": "bytes"
          },
          {
            "name": "message",
            "type": "string",
            "internalType": "string"
          }
        ]
      },
      {
        "name": "rootWallet",
        "type": "tuple",
        "internalType": "struct IWalletLinkBase.LinkedWallet",
        "components": [
          {
            "name": "addr",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "signature",
            "type": "bytes",
            "internalType": "bytes"
          },
          {
            "name": "message",
            "type": "string",
            "internalType": "string"
          }
        ]
      },
      {
        "name": "nonce",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "removeCallerLink",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "removeLink",
    "inputs": [
      {
        "name": "wallet",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "rootWallet",
        "type": "tuple",
        "internalType": "struct IWalletLinkBase.LinkedWallet",
        "components": [
          {
            "name": "addr",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "signature",
            "type": "bytes",
            "internalType": "bytes"
          },
          {
            "name": "message",
            "type": "string",
            "internalType": "string"
          }
        ]
      },
      {
        "name": "nonce",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "removeNonEVMWalletLink",
    "inputs": [
      {
        "name": "wallet",
        "type": "tuple",
        "internalType": "struct WalletLib.Wallet",
        "components": [
          {
            "name": "addr",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "vmType",
            "type": "uint8",
            "internalType": "enum WalletLib.VirtualMachineType"
          }
        ]
      },
      {
        "name": "nonce",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setDefaultWallet",
    "inputs": [
      {
        "name": "defaultWallet",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setDependency",
    "inputs": [
      {
        "name": "dependency",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "dependencyAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "Initialized",
    "inputs": [
      {
        "name": "version",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "InterfaceAdded",
    "inputs": [
      {
        "name": "interfaceId",
        "type": "bytes4",
        "indexed": true,
        "internalType": "bytes4"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "InterfaceRemoved",
    "inputs": [
      {
        "name": "interfaceId",
        "type": "bytes4",
        "indexed": true,
        "internalType": "bytes4"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "LinkNonEVMWalletToRootWallet",
    "inputs": [
      {
        "name": "walletHash",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "rootKey",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "LinkWalletToRootKey",
    "inputs": [
      {
        "name": "wallet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "rootKey",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RemoveLink",
    "inputs": [
      {
        "name": "wallet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "secondWallet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RemoveNonEVMWalletLink",
    "inputs": [
      {
        "name": "walletHash",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "rootKey",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SetDefaultWallet",
    "inputs": [
      {
        "name": "rootKey",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "defaultWallet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "Initializable_InInitializingState",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Initializable_NotInInitializingState",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Introspection_AlreadySupported",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Introspection_NotSupported",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidAccountNonce",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "currentNonce",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "Ownable__NotOwner",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "Ownable__ZeroAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WalletLink__AddressMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WalletLink__CannotLinkToRootWallet",
    "inputs": [
      {
        "name": "wallet",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "rootKey",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "WalletLink__CannotLinkToSelf",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WalletLink__CannotRemoveDefaultWallet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WalletLink__CannotRemoveRootWallet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WalletLink__DefaultWalletAlreadySet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WalletLink__InvalidAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WalletLink__InvalidMessage",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WalletLink__InvalidNonEVMAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WalletLink__InvalidSignature",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WalletLink__InvalidVMSpecificData",
    "inputs": [
      {
        "name": "key",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "value",
        "type": "bytes",
        "internalType": "bytes"
      }
    ]
  },
  {
    "type": "error",
    "name": "WalletLink__LinkAlreadyExists",
    "inputs": [
      {
        "name": "wallet",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "rootKey",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "WalletLink__LinkedToAnotherRootKey",
    "inputs": [
      {
        "name": "wallet",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "rootKey",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "WalletLink__MaxLinkedWalletsReached",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WalletLink__NonEVMWalletAlreadyLinked",
    "inputs": [
      {
        "name": "wallet",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "rootKey",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "WalletLink__NonEVMWalletNotLinked",
    "inputs": [
      {
        "name": "wallet",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "rootKey",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "WalletLink__NotLinked",
    "inputs": [
      {
        "name": "wallet",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "rootKey",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "WalletLink__RootKeyMismatch",
    "inputs": [
      {
        "name": "callerRootKey",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "rootKey",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "WalletLink__UnsupportedVMType",
    "inputs": []
  }
] as const
