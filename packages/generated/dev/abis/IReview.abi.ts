export default [
  {
    "type": "function",
    "name": "getAllReviews",
    "inputs": [],
    "outputs": [
      {
        "name": "users",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "reviews",
        "type": "tuple[]",
        "internalType": "struct ReviewStorage.Content[]",
        "components": [
          {
            "name": "comment",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "rating",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "createdAt",
            "type": "uint40",
            "internalType": "uint40"
          },
          {
            "name": "updatedAt",
            "type": "uint40",
            "internalType": "uint40"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getReview",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct ReviewStorage.Content",
        "components": [
          {
            "name": "comment",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "rating",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "createdAt",
            "type": "uint40",
            "internalType": "uint40"
          },
          {
            "name": "updatedAt",
            "type": "uint40",
            "internalType": "uint40"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setReview",
    "inputs": [
      {
        "name": "action",
        "type": "uint8",
        "internalType": "enum IReviewBase.Action"
      },
      {
        "name": "data",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "ReviewAdded",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "comment",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "rating",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ReviewDeleted",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ReviewUpdated",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "comment",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "rating",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "ReviewFacet__InvalidCommentLength",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReviewFacet__InvalidRating",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReviewFacet__ReviewAlreadyExists",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReviewFacet__ReviewDoesNotExist",
    "inputs": []
  }
] as const
