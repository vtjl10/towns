package nodes

import (
	"context"
	"hash/fnv"
	"net/http"
	"slices"
	"sync"

	"connectrpc.com/connect"
	"connectrpc.com/otelconnect"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"

	"github.com/towns-protocol/towns/core/config"
	"github.com/towns-protocol/towns/core/contracts/river"
	. "github.com/towns-protocol/towns/core/node/base"
	"github.com/towns-protocol/towns/core/node/crypto"
	"github.com/towns-protocol/towns/core/node/logging"
	. "github.com/towns-protocol/towns/core/node/protocol"
	. "github.com/towns-protocol/towns/core/node/protocol/protocolconnect"
	"github.com/towns-protocol/towns/core/node/registries"
	. "github.com/towns-protocol/towns/core/node/shared"
)

type NodeRegistry interface {
	GetNode(address common.Address) (*NodeRecord, error)
	GetAllNodes() []*NodeRecord

	// Returns error for local node.
	GetStreamServiceClientForAddress(address common.Address) (StreamServiceClient, error)
	GetNodeToNodeClientForAddress(address common.Address) (NodeToNodeClient, error)

	// TODO: refactor to provide IsValidNodeAddress(address common.Address) bool functions instead of copying the whole list
	GetValidNodeAddresses() []common.Address

	ChooseStreamNodes(ctx context.Context, streamId StreamId, replFactor int) ([]common.Address, error)
}

type nodeRegistryImpl struct {
	contract         *registries.RiverRegistryContract
	onChainConfig    crypto.OnChainConfiguration
	localNodeAddress common.Address
	httpClient       *http.Client
	connectOpts      []connect.ClientOption

	mu                    sync.RWMutex
	nodesLocked           map[common.Address]*NodeRecord
	appliedBlockNumLocked crypto.BlockNumber

	// All fields below are recalculated from nodesLocked by resetLocked()
	// All fields are immutable, i.e. copy under RWLock can be returned to the caller
	allNodesLocked    []*NodeRecord
	activeNodesLocked []*NodeRecord
	validAddrsLocked  []common.Address
	operatorsLocked   map[common.Address]bool
}

var _ NodeRegistry = (*nodeRegistryImpl)(nil)

func LoadNodeRegistry(
	ctx context.Context,
	contract *registries.RiverRegistryContract,
	localNodeAddress common.Address,
	appliedBlockNum crypto.BlockNumber,
	chainMonitor crypto.ChainMonitor,
	onChainConfig crypto.OnChainConfiguration,
	httpClient *http.Client,
	connectOtelIterceptor *otelconnect.Interceptor,
) (*nodeRegistryImpl, error) {
	log := logging.FromCtx(ctx)

	nodes, err := contract.GetAllNodes(ctx, appliedBlockNum)
	if err != nil {
		return nil, err
	}

	connectOpts := []connect.ClientOption{connect.WithGRPC()}
	if connectOtelIterceptor != nil {
		connectOpts = append(connectOpts, connect.WithInterceptors(connectOtelIterceptor))
	}

	ret := &nodeRegistryImpl{
		contract:              contract,
		onChainConfig:         onChainConfig,
		localNodeAddress:      localNodeAddress,
		httpClient:            httpClient,
		nodesLocked:           make(map[common.Address]*NodeRecord, len(nodes)),
		appliedBlockNumLocked: appliedBlockNum,
		connectOpts:           connectOpts,
	}

	localFound := false
	for _, node := range nodes {
		nn, _ := ret.addNodeLocked(node.NodeAddress, node.Url, node.Status, node.Operator)
		localFound = localFound || nn.local
	}
	ret.resetLocked()

	if localNodeAddress != (common.Address{}) && !localFound {
		return nil, RiverError(
			Err_UNKNOWN_NODE,
			"Local node not found in registry",
			"blockNum",
			appliedBlockNum,
			"localAddress",
			localNodeAddress,
		).LogError(log)
	}

	if config.UseDetailedLog(ctx) {
		log.Infow(
			"Node Registry Loaded from contract",
			"blockNum",
			appliedBlockNum,
			"Nodes",
			ret.allNodesLocked,
			"localAddress",
			localNodeAddress,
		)
	}

	chainMonitor.OnContractWithTopicsEvent(
		appliedBlockNum+1,
		contract.Address,
		[][]common.Hash{{contract.NodeRegistryAbi.Events["NodeAdded"].ID}},
		ret.OnNodeAdded,
	)
	chainMonitor.OnContractWithTopicsEvent(
		appliedBlockNum+1,
		contract.Address,
		[][]common.Hash{{contract.NodeRegistryAbi.Events["NodeRemoved"].ID}},
		ret.OnNodeRemoved,
	)
	chainMonitor.OnContractWithTopicsEvent(
		appliedBlockNum+1,
		contract.Address,
		[][]common.Hash{{contract.NodeRegistryAbi.Events["NodeStatusUpdated"].ID}},
		ret.OnNodeStatusUpdated,
	)
	chainMonitor.OnContractWithTopicsEvent(
		appliedBlockNum+1,
		contract.Address,
		[][]common.Hash{{contract.NodeRegistryAbi.Events["NodeUrlUpdated"].ID}},
		ret.OnNodeUrlUpdated,
	)

	return ret, nil
}

func (n *nodeRegistryImpl) resetLocked() {
	n.allNodesLocked = make([]*NodeRecord, 0, len(n.nodesLocked))
	n.activeNodesLocked = make([]*NodeRecord, 0, len(n.nodesLocked))
	n.validAddrsLocked = make([]common.Address, 0, len(n.nodesLocked))
	n.operatorsLocked = make(map[common.Address]bool, len(n.nodesLocked))

	nodeBlocklist := n.onChainConfig.Get().NodeBlocklist
	for addr, nn := range n.nodesLocked {
		n.allNodesLocked = append(n.allNodesLocked, nn)
		n.validAddrsLocked = append(n.validAddrsLocked, addr)
		n.operatorsLocked[nn.operator] = true
		if nn.Status() == river.NodeStatus_Operational && !slices.Contains(nodeBlocklist, nn.Address()) {
			n.activeNodesLocked = append(n.activeNodesLocked, nn)
		}
	}
}

// addNodeLocked adds a node to the registry if it does not exist.
func (n *nodeRegistryImpl) addNodeLocked(
	addr common.Address,
	url string,
	status uint8,
	operator common.Address,
) (*NodeRecord, bool) {
	if existingNode, ok := n.nodesLocked[addr]; ok {
		return existingNode, false
	}

	// Lock should be taken by the caller
	nn := &NodeRecord{
		address:  addr,
		operator: operator,
		url:      url,
		status:   status,
	}
	if addr == n.localNodeAddress {
		nn.local = true
	} else {
		nn.streamServiceClient = NewStreamServiceClient(n.httpClient, url, n.connectOpts...)
		nn.nodeToNodeClient = NewNodeToNodeClient(n.httpClient, url, n.connectOpts...)
	}
	n.nodesLocked[addr] = nn
	return nn, true
}

// OnNodeAdded can apply INodeRegistry::NodeAdded event against the in-memory node registry.
func (n *nodeRegistryImpl) OnNodeAdded(ctx context.Context, event types.Log) {
	log := logging.FromCtx(ctx)

	var e river.NodeRegistryV1NodeAdded
	if err := n.contract.NodeRegistry.BoundContract().UnpackLog(&e, "NodeAdded", event); err != nil {
		log.Errorw("OnNodeAdded: unable to decode NodeAdded event")
		return
	}

	n.mu.Lock()
	defer n.mu.Unlock()
	nodeRecord, added := n.addNodeLocked(e.NodeAddress, e.Url, e.Status, e.Operator)
	if added {
		n.resetLocked()
		// TODO: add operator to NodeAdded event
		log.Infow(
			"NodeRegistry: NodeAdded",
			"node",
			nodeRecord.address,
			"blockNum",
			event.BlockNumber,
			"operator",
			e.Operator,
		)
	} else {
		log.Errorw("NodeRegistry: Got NodeAdded for node that already exists in NodeRegistry", "blockNum", event.BlockNumber, "node", e.NodeAddress, "operator", e.Operator, "nodes", n.allNodesLocked)
	}
}

// OnNodeRemoved can apply INodeRegistry::NodeRemoved event against the in-memory node registry.
func (n *nodeRegistryImpl) OnNodeRemoved(ctx context.Context, event types.Log) {
	log := logging.FromCtx(ctx)

	var e river.NodeRegistryV1NodeRemoved
	if err := n.contract.NodeRegistry.BoundContract().UnpackLog(&e, "NodeRemoved", event); err != nil {
		log.Errorw("OnNodeRemoved: unable to decode NodeRemoved event")
		return
	}

	n.mu.Lock()
	defer n.mu.Unlock()
	if _, exists := n.nodesLocked[e.NodeAddress]; exists {
		delete(n.nodesLocked, e.NodeAddress)
		n.resetLocked()
		log.Infow("NodeRegistry: NodeRemoved", "blockNum", event.BlockNumber, "node", e.NodeAddress)
	} else {
		log.Errorw("NodeRegistry: Got NodeRemoved for node that does not exist in NodeRegistry",
			"blockNum", event.BlockNumber, "node", e.NodeAddress, "nodes", n.allNodesLocked)
	}
}

// OnNodeStatusUpdated can apply INodeRegistry::NodeStatusUpdated event against the in-memory node registry.
func (n *nodeRegistryImpl) OnNodeStatusUpdated(ctx context.Context, event types.Log) {
	log := logging.FromCtx(ctx)

	var e river.NodeRegistryV1NodeStatusUpdated
	if err := n.contract.NodeRegistry.BoundContract().UnpackLog(&e, "NodeStatusUpdated", event); err != nil {
		log.Errorw("OnNodeStatusUpdated: unable to decode NodeStatusUpdated event")
		return
	}

	n.mu.Lock()
	defer n.mu.Unlock()
	nn := n.nodesLocked[e.NodeAddress]
	if nn != nil {
		newNode := *nn
		newNode.status = e.Status
		n.nodesLocked[e.NodeAddress] = &newNode
		n.resetLocked()
		log.Infow("NodeRegistry: NodeStatusUpdated", "blockNum", event.BlockNumber, "node", nn)
	} else {
		log.Errorw("NodeRegistry: Got NodeStatusUpdated for node that does not exist in NodeRegistry", "blockNum", event.BlockNumber, "node", e.NodeAddress, "nodes", n.allNodesLocked)
	}
}

// OnNodeUrlUpdated can apply INodeRegistry::NodeUrlUpdated events against the in-memory node registry.
func (n *nodeRegistryImpl) OnNodeUrlUpdated(ctx context.Context, event types.Log) {
	log := logging.FromCtx(ctx)

	var e river.NodeRegistryV1NodeUrlUpdated
	if err := n.contract.NodeRegistry.BoundContract().UnpackLog(&e, "NodeUrlUpdated", event); err != nil {
		log.Errorw("OnNodeUrlUpdated: unable to decode NodeUrlUpdated event")
		return
	}

	n.mu.Lock()
	defer n.mu.Unlock()
	nn := n.nodesLocked[e.NodeAddress]
	if nn != nil {
		newNode := *nn
		newNode.url = e.Url
		if !nn.local {
			newNode.streamServiceClient = NewStreamServiceClient(n.httpClient, e.Url, n.connectOpts...)
			newNode.nodeToNodeClient = NewNodeToNodeClient(n.httpClient, e.Url, n.connectOpts...)
		}
		n.nodesLocked[e.NodeAddress] = &newNode
		n.resetLocked()
		log.Infow("NodeRegistry: NodeUrlUpdated", "blockNum", event.BlockNumber, "node", nn)
	} else {
		log.Errorw("NodeRegistry: Got NodeUrlUpdated for node that does not exist in NodeRegistry",
			"blockNum", event.BlockNumber, "node", e.NodeAddress, "nodes", n.allNodesLocked)
	}
}

func (n *nodeRegistryImpl) GetNode(address common.Address) (*NodeRecord, error) {
	n.mu.RLock()
	defer n.mu.RUnlock()
	nn := n.nodesLocked[address]
	if nn == nil {
		return nil, RiverError(Err_UNKNOWN_NODE, "No record for node", "address", address).Func("GetNode")
	}
	return nn, nil
}

func (n *nodeRegistryImpl) GetAllNodes() []*NodeRecord {
	n.mu.RLock()
	defer n.mu.RUnlock()
	return n.allNodesLocked
}

// Returns error for local node.
func (n *nodeRegistryImpl) GetStreamServiceClientForAddress(address common.Address) (StreamServiceClient, error) {
	node, err := n.GetNode(address)
	if err != nil {
		return nil, err
	}

	if node.local {
		return nil, RiverError(Err_INTERNAL, "can't get remote stub for local node")
	}

	return node.streamServiceClient, nil
}

// GetNodeToNodeClientForAddress returns error for local node.
func (n *nodeRegistryImpl) GetNodeToNodeClientForAddress(address common.Address) (NodeToNodeClient, error) {
	node, err := n.GetNode(address)
	if err != nil {
		return nil, err
	}

	if node.local {
		return nil, RiverError(Err_INTERNAL, "can't get remote stub for local node")
	}

	return node.nodeToNodeClient, nil
}

func (n *nodeRegistryImpl) GetValidNodeAddresses() []common.Address {
	n.mu.RLock()
	defer n.mu.RUnlock()
	return n.validAddrsLocked
}

func (n *nodeRegistryImpl) ChooseStreamNodes(ctx context.Context, streamId StreamId, replFactor int) ([]common.Address, error) {
	n.mu.RLock()
	defer n.mu.RUnlock()

	uniqueOperators := false
	if replFactor <= len(n.operatorsLocked) {
		uniqueOperators = true
	} else {
		logging.FromCtx(ctx).Warnw("ChooseStreamNodes: replication factor is greater than number of unique operators", "replication_factor", replFactor, "num_operators", len(n.operatorsLocked))
	}

	if len(n.activeNodesLocked) < replFactor {
		return nil, RiverError(
			Err_BAD_CONFIG,
			"replication factor is greater than number of operational nodes",
			"replication_factor",
			replFactor,
			"num_nodes",
			len(n.activeNodesLocked),
		)
	}

	nodes := slices.Clone(n.activeNodesLocked)
	selectedOperators := make([]common.Address, 0, replFactor)
	addrs := make([]common.Address, 0, replFactor)

	// Knuth shuffle until required number of nodes from different operators is selected
	h := fnv.New64a()
	for i := 0; i < len(nodes); i++ {
		h.Write(streamId[:])
		index := i + int(h.Sum64()%uint64(len(nodes)-i))
		selectedNode := nodes[index]
		nodes[index] = nodes[i]
		nodes[i] = selectedNode

		if uniqueOperators {
			if slices.Contains(selectedOperators, selectedNode.operator) {
				continue
			}
			selectedOperators = append(selectedOperators, selectedNode.operator)
		}

		addrs = append(addrs, selectedNode.Address())
		if len(addrs) == replFactor {
			return addrs, nil
		}
	}

	return nil, RiverError(Err_INTERNAL, "ChooseStreamNodes: should not happen")
}
