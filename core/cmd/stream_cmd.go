package cmd

import (
	"bytes"
	"context"
	"encoding/hex"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"connectrpc.com/connect"
	"github.com/ethereum/go-ethereum/common"
	"github.com/spf13/cobra"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"

	"github.com/towns-protocol/towns/core/node/crypto"
	"github.com/towns-protocol/towns/core/node/events"
	"github.com/towns-protocol/towns/core/node/infra"
	"github.com/towns-protocol/towns/core/node/nodes"
	"github.com/towns-protocol/towns/core/node/protocol"
	"github.com/towns-protocol/towns/core/node/protocol/protocolconnect"
	"github.com/towns-protocol/towns/core/node/registries"
	"github.com/towns-protocol/towns/core/node/shared"
	"github.com/towns-protocol/towns/core/node/storage"
)

func runStreamGetEventCmd(cmd *cobra.Command, args []string) error {
	ctx := context.Background() // lint:ignore context.Background() is fine here
	streamID, err := shared.StreamIdFromString(args[0])
	if err != nil {
		return err
	}
	eventHash := common.HexToHash(args[1])
	blockchain, err := crypto.NewBlockchain(
		ctx,
		&cmdConfig.RiverChain,
		nil,
		infra.NewMetricsFactory(nil, "river", "cmdline"),
		nil,
	)
	if err != nil {
		return err
	}

	registryContract, err := registries.NewRiverRegistryContract(
		ctx,
		blockchain,
		&cmdConfig.RegistryContract,
		&cmdConfig.RiverRegistry,
	)
	if err != nil {
		return err
	}

	stream, err := registryContract.StreamRegistry.GetStream(nil, streamID)
	if err != nil {
		return err
	}

	nodes := nodes.NewStreamNodesWithLock(stream.StreamReplicationFactor(), stream.Nodes, common.Address{})
	remoteNodeAddress := nodes.GetStickyPeer()

	remote, err := registryContract.NodeRegistry.GetNode(nil, remoteNodeAddress)
	if err != nil {
		return err
	}

	remoteClient := protocolconnect.NewStreamServiceClient(http.DefaultClient, remote.Url)

	response, err := remoteClient.GetStream(ctx, connect.NewRequest(&protocol.GetStreamRequest{
		StreamId: streamID[:],
		Optional: false,
	}))
	if err != nil {
		return err
	}

	streamAndCookie := response.Msg.GetStream()

	to := streamAndCookie.GetNextSyncCookie().GetMinipoolGen()
	blockRange := int64(100)
	if len(args) == 4 {
		blockRange, err = strconv.ParseInt(args[2], 10, 64)
		if err != nil {
			return err
		}
	}
	from := max(to-blockRange, 0)

	miniblocks, err := remoteClient.GetMiniblocks(ctx, connect.NewRequest(&protocol.GetMiniblocksRequest{
		StreamId:      streamID[:],
		FromInclusive: from,
		ToExclusive:   to,
	}))
	if err != nil {
		return err
	}

	for n, miniblock := range miniblocks.Msg.GetMiniblocks() {
		// Parse header
		info, err := events.NewMiniblockInfoFromProto(
			miniblock, miniblocks.Msg.GetMiniblockSnapshot(from+int64(n)),
			events.NewParsedMiniblockInfoOpts().
				WithExpectedBlockNumber(from+int64(n)),
		)
		if err != nil {
			return err
		}

		for _, event := range info.Proto.GetEvents() {
			if bytes.Equal(eventHash[:], event.GetHash()) {
				var streamEvent protocol.StreamEvent
				if err := proto.Unmarshal(event.Event, &streamEvent); err != nil {
					return err
				}

				fmt.Printf("\n%s\n", protojson.Format(&streamEvent))

				return nil
			}
		}
	}

	fmt.Printf("Event %s not found in stream %s (block range [%d...%d])\n", eventHash, streamID, from, to)

	return nil
}

func runStreamGetMiniblockCmd(cmd *cobra.Command, args []string) error {
	ctx := context.Background() // lint:ignore context.Background() is fine here
	streamID, err := shared.StreamIdFromString(args[0])
	if err != nil {
		return err
	}
	miniblockHash := common.HexToHash(args[1])
	blockchain, err := crypto.NewBlockchain(
		ctx,
		&cmdConfig.RiverChain,
		nil,
		infra.NewMetricsFactory(nil, "river", "cmdline"),
		nil,
	)
	if err != nil {
		return err
	}

	registryContract, err := registries.NewRiverRegistryContract(
		ctx,
		blockchain,
		&cmdConfig.RegistryContract,
		&cmdConfig.RiverRegistry,
	)
	if err != nil {
		return err
	}

	stream, err := registryContract.StreamRegistry.GetStream(nil, streamID)
	if err != nil {
		return err
	}

	nodes := nodes.NewStreamNodesWithLock(stream.StreamReplicationFactor(), stream.Nodes, common.Address{})
	remoteNodeAddress := nodes.GetStickyPeer()

	remote, err := registryContract.NodeRegistry.GetNode(nil, remoteNodeAddress)
	if err != nil {
		return err
	}

	remoteClient := protocolconnect.NewStreamServiceClient(http.DefaultClient, remote.Url)

	response, err := remoteClient.GetStream(ctx, connect.NewRequest(&protocol.GetStreamRequest{
		StreamId: streamID[:],
		Optional: false,
	}))
	if err != nil {
		return err
	}

	streamAndCookie := response.Msg.GetStream()

	to := streamAndCookie.GetNextSyncCookie().GetMinipoolGen()
	blockRange := int64(100)
	if len(args) == 3 {
		blockRange, err = strconv.ParseInt(args[2], 10, 64)
		if err != nil {
			return err
		}
	}
	from := max(to-blockRange, 0)

	miniblocks, err := remoteClient.GetMiniblocks(ctx, connect.NewRequest(&protocol.GetMiniblocksRequest{
		StreamId:      streamID[:],
		FromInclusive: from,
		ToExclusive:   to,
	}))
	if err != nil {
		return err
	}

	for n, miniblock := range miniblocks.Msg.GetMiniblocks() {
		// Parse header
		info, err := events.NewMiniblockInfoFromProto(
			miniblock, miniblocks.Msg.GetMiniblockSnapshot(from+int64(n)),
			events.NewParsedMiniblockInfoOpts().
				WithExpectedBlockNumber(from+int64(n)),
		)
		if err != nil {
			return err
		}

		if info.HeaderEvent().Hash == miniblockHash {
			mbHeader, ok := info.HeaderEvent().Event.Payload.(*protocol.StreamEvent_MiniblockHeader)
			if !ok {
				return fmt.Errorf("unable to parse header event as miniblock header")
			}

			if len(mbHeader.MiniblockHeader.EventHashes) != len(miniblock.Events) {
				return fmt.Errorf("malformatted miniblock: header event count and miniblock event count do not match")
			}

			for i, hash := range mbHeader.MiniblockHeader.EventHashes {
				if !bytes.Equal(miniblock.Events[i].Hash, hash) {
					return fmt.Errorf(
						"event %d hashes do not match: %v v %v in the header",
						i,
						hex.EncodeToString(miniblock.Events[i].Hash),
						hex.EncodeToString(hash),
					)
				}
			}

			fmt.Printf("\nMiniblock\n=========\n%s\n", protojson.Format(miniblock))

			fmt.Printf("\nHeader\n======\n%s\n", protojson.Format(mbHeader.MiniblockHeader))

			return nil
		}
	}

	fmt.Printf("Miniblock hash %s not found in stream %s (block range [%d...%d])\n", miniblockHash, streamID, from, to)

	return nil
}

func formatBytes(bytes int) string {
	const (
		KB = 1 << 10
		MB = 1 << 20
		GB = 1 << 30
		TB = 1 << 40
	)

	switch {
	case bytes < KB:
		return fmt.Sprintf("%d B", bytes)
	case bytes < MB:
		return fmt.Sprintf("%.2f KB", float64(bytes)/KB)
	case bytes < GB:
		return fmt.Sprintf("%.2f MB", float64(bytes)/MB)
	case bytes < TB:
		return fmt.Sprintf("%.2f GB", float64(bytes)/GB)
	default:
		return fmt.Sprintf("%.2f TB", float64(bytes)/TB)
	}
}

func runStreamGetMiniblockNumCmd(cmd *cobra.Command, args []string) error {
	ctx := context.Background() // lint:ignore context.Background() is fine here
	streamID, err := shared.StreamIdFromString(args[0])
	if err != nil {
		return err
	}
	miniblockNum, err := strconv.ParseInt(args[1], 10, 64)
	if err != nil {
		return fmt.Errorf("could not parse miniblockNum: %w", err)
	}

	blockchain, err := crypto.NewBlockchain(
		ctx,
		&cmdConfig.RiverChain,
		nil,
		infra.NewMetricsFactory(nil, "river", "cmdline"),
		nil,
	)
	if err != nil {
		return err
	}

	registryContract, err := registries.NewRiverRegistryContract(
		ctx,
		blockchain,
		&cmdConfig.RegistryContract,
		&cmdConfig.RiverRegistry,
	)
	if err != nil {
		return err
	}

	stream, err := registryContract.StreamRegistry.GetStream(nil, streamID)
	if err != nil {
		return err
	}

	nodes := nodes.NewStreamNodesWithLock(stream.StreamReplicationFactor(), stream.Nodes, common.Address{})
	remoteNodeAddress := nodes.GetStickyPeer()

	remote, err := registryContract.NodeRegistry.GetNode(nil, remoteNodeAddress)
	if err != nil {
		return err
	}

	remoteClient := protocolconnect.NewStreamServiceClient(http.DefaultClient, remote.Url)
	miniblocks, err := remoteClient.GetMiniblocks(ctx, connect.NewRequest(&protocol.GetMiniblocksRequest{
		StreamId:      streamID[:],
		FromInclusive: miniblockNum,
		ToExclusive:   miniblockNum + 1,
	}))
	if err != nil {
		return err
	}

	// There should only be one miniblock here
	if len(miniblocks.Msg.Miniblocks) < 1 {
		fmt.Printf("Miniblock num %d not found in stream %s\n", miniblockNum, streamID)
		return nil
	}

	miniblock := miniblocks.Msg.GetMiniblocks()[0]

	// Parse header
	info, err := events.NewMiniblockInfoFromProto(
		miniblock, miniblocks.Msg.GetMiniblockSnapshot(miniblockNum),
		events.NewParsedMiniblockInfoOpts().
			WithExpectedBlockNumber(miniblockNum),
	)
	if err != nil {
		return err
	}

	mbHeader, ok := info.HeaderEvent().Event.Payload.(*protocol.StreamEvent_MiniblockHeader)
	if !ok {
		return fmt.Errorf("unable to parse header event as miniblock header")
	}

	if len(mbHeader.MiniblockHeader.EventHashes) != len(miniblock.Events) {
		return fmt.Errorf("malformatted miniblock: header event count and miniblock event count do not match")
	}

	fmt.Printf(
		"Miniblock %d (size %s)\n=========\n",
		mbHeader.MiniblockHeader.MiniblockNum,
		formatBytes(proto.Size(miniblock)),
	)
	fmt.Printf("  Timestamp: %v\n", mbHeader.MiniblockHeader.GetTimestamp().AsTime().UTC())
	fmt.Printf("  Events: (%d)\n", len(info.Proto.Events))
	for i, event := range info.Proto.GetEvents() {
		var streamEvent protocol.StreamEvent
		if err := proto.Unmarshal(event.Event, &streamEvent); err != nil {
			return err
		}

		seconds := streamEvent.CreatedAtEpochMs / 1000
		nanoseconds := (streamEvent.CreatedAtEpochMs % 1000) * 1e6 // 1 millisecond = 1e6 nanoseconds
		timestamp := time.Unix(seconds, nanoseconds)
		fmt.Printf(
			"    (%d) %v %v\n",
			i,
			hex.EncodeToString(event.Hash),
			timestamp.UTC(),
		)
		// fmt.Println(protojson.Format(&streamEvent))
	}

	return nil
}

func runStreamDumpCmd(cmd *cobra.Command, args []string) error {
	ctx := context.Background() // lint:ignore context.Background() is fine here
	streamID, err := shared.StreamIdFromString(args[0])
	if err != nil {
		return err
	}

	blockchain, err := crypto.NewBlockchain(
		ctx,
		&cmdConfig.RiverChain,
		nil,
		infra.NewMetricsFactory(nil, "river", "cmdline"),
		nil,
	)
	if err != nil {
		return err
	}

	registryContract, err := registries.NewRiverRegistryContract(
		ctx,
		blockchain,
		&cmdConfig.RegistryContract,
		&cmdConfig.RiverRegistry,
	)
	if err != nil {
		return err
	}

	stream, err := registryContract.StreamRegistry.GetStream(nil, streamID)
	if err != nil {
		return err
	}

	nodes := nodes.NewStreamNodesWithLock(stream.StreamReplicationFactor(), stream.Nodes, common.Address{})
	remoteNodeAddress := nodes.GetStickyPeer()

	remote, err := registryContract.NodeRegistry.GetNode(nil, remoteNodeAddress)
	if err != nil {
		return err
	}

	remoteClient := protocolconnect.NewStreamServiceClient(http.DefaultClient, remote.Url)

	response, err := remoteClient.GetStream(ctx, connect.NewRequest(&protocol.GetStreamRequest{
		StreamId: streamID[:],
		Optional: false,
	}))
	if err != nil {
		return err
	}

	streamAndCookie := response.Msg.GetStream()

	maxBlock := streamAndCookie.GetNextSyncCookie().GetMinipoolGen()
	blockRange := int64(10)
	if len(args) == 2 {
		blockRange, err = strconv.ParseInt(args[1], 10, 64)
		if err != nil {
			return err
		}
	}
	from := max(maxBlock-blockRange, 0)
	to := maxBlock
	for {
		miniblocks, err := remoteClient.GetMiniblocks(ctx, connect.NewRequest(&protocol.GetMiniblocksRequest{
			StreamId:      streamID[:],
			FromInclusive: from,
			ToExclusive:   to,
		}))
		if err != nil {
			return err
		}

		for n, miniblock := range miniblocks.Msg.GetMiniblocks() {
			// Parse header
			info, err := events.NewMiniblockInfoFromProto(
				miniblock, miniblocks.Msg.GetMiniblockSnapshot(from+int64(n)),
				events.NewParsedMiniblockInfoOpts().
					WithExpectedBlockNumber(from+int64(n)),
			)
			if err != nil {
				return err
			}

			mbHeader, ok := info.HeaderEvent().Event.Payload.(*protocol.StreamEvent_MiniblockHeader)
			if !ok {
				return fmt.Errorf("unable to parse header event as miniblock header")
			}

			if len(mbHeader.MiniblockHeader.EventHashes) != len(miniblock.Events) {
				return fmt.Errorf("malformatted miniblock: header event count and miniblock event count do not match")
			}

			for i, hash := range mbHeader.MiniblockHeader.EventHashes {
				if !bytes.Equal(miniblock.Events[i].Hash, hash) {
					return fmt.Errorf(
						"event %d hashes do not match: %v v %v in the header",
						i,
						hex.EncodeToString(miniblock.Events[i].Hash),
						hex.EncodeToString(hash),
					)
				}
			}

			fmt.Printf(
				"\nMiniblock %d\n=========\n%s",
				mbHeader.MiniblockHeader.MiniblockNum,
				protojson.Format(miniblock),
			)
			fmt.Printf("\n(Parsed Header)\n-------------\n%s\n", protojson.Format(mbHeader.MiniblockHeader))
		}

		from = from + int64(len(miniblocks.Msg.Miniblocks))
		to = min(from+blockRange, maxBlock)

		if len(miniblocks.Msg.Miniblocks) == 0 || from == to {
			break
		}
	}

	if from < maxBlock-1 {
		return fmt.Errorf("unable to download all blocks from stream")
	}

	return nil
}

func runStreamNodeDumpCmd(cmd *cobra.Command, args []string) error {
	ctx := context.Background() // lint:ignore context.Background() is fine here
	nodeAddress := common.HexToAddress(args[0])
	zeroAddress := common.Address{}
	if nodeAddress == zeroAddress {
		return fmt.Errorf("invalid argument 0: node-address")
	}

	streamId, err := shared.StreamIdFromString(args[1])
	if err != nil {
		return err
	}

	blockchain, err := crypto.NewBlockchain(
		ctx,
		&cmdConfig.RiverChain,
		nil,
		infra.NewMetricsFactory(nil, "river", "cmdline"),
		nil,
	)
	if err != nil {
		return err
	}

	registryContract, err := registries.NewRiverRegistryContract(
		ctx,
		blockchain,
		&cmdConfig.RegistryContract,
		&cmdConfig.RiverRegistry,
	)
	if err != nil {
		return err
	}

	remote, err := registryContract.NodeRegistry.GetNode(nil, nodeAddress)
	if err != nil {
		return err
	}

	remoteClient := protocolconnect.NewStreamServiceClient(http.DefaultClient, remote.Url)

	blockRange := int64(100)
	if len(args) == 3 {
		blockRange, err = strconv.ParseInt(args[2], 10, 64)
		if err != nil {
			return err
		}
	}

	blocksRead := -1
	from := int64(0)
	to := blockRange
	for blocksRead != 0 {
		miniblocks, err := remoteClient.GetMiniblocks(ctx, connect.NewRequest(&protocol.GetMiniblocksRequest{
			StreamId:      streamId[:],
			FromInclusive: from,
			ToExclusive:   to,
		}))
		if err != nil {
			return err
		}

		for n, miniblock := range miniblocks.Msg.GetMiniblocks() {
			// Parse header
			info, err := events.NewMiniblockInfoFromProto(
				miniblock, miniblocks.Msg.GetMiniblockSnapshot(from+int64(n)),
				events.NewParsedMiniblockInfoOpts().
					WithExpectedBlockNumber(from+int64(n)),
			)
			if err != nil {
				return err
			}

			mbHeader, ok := info.HeaderEvent().Event.Payload.(*protocol.StreamEvent_MiniblockHeader)
			if !ok {
				return fmt.Errorf("unable to parse header event as miniblock header")
			}

			fmt.Printf(
				"\nMiniblock %d\n=========\n%s",
				mbHeader.MiniblockHeader.MiniblockNum,
				protojson.Format(miniblock),
			)
			fmt.Printf("\n(Parsed Header)\n-------------\n%s\n", protojson.Format(mbHeader.MiniblockHeader))
		}
		blocksRead = len(miniblocks.Msg.Miniblocks)
		from = from + int64(blocksRead)
		to = from + blockRange
	}

	return nil
}

func runStreamGetCmd(cmd *cobra.Command, args []string) error {
	ctx := context.Background() // lint:ignore context.Background() is fine here
	streamID, err := shared.StreamIdFromString(args[0])
	if err != nil {
		return err
	}

	blockchain, err := crypto.NewBlockchain(
		ctx,
		&cmdConfig.RiverChain,
		nil,
		infra.NewMetricsFactory(nil, "river", "cmdline"),
		nil,
	)
	if err != nil {
		return err
	}

	registryContract, err := registries.NewRiverRegistryContract(
		ctx,
		blockchain,
		&cmdConfig.RegistryContract,
		&cmdConfig.RiverRegistry,
	)
	if err != nil {
		return err
	}

	streamRecord, err := registryContract.StreamRegistry.GetStream(nil, streamID)
	if err != nil {
		return err
	}

	nodes := nodes.NewStreamNodesWithLock(streamRecord.StreamReplicationFactor(), streamRecord.Nodes, common.Address{})
	remoteNodeAddress := nodes.GetStickyPeer()

	remote, err := registryContract.NodeRegistry.GetNode(nil, remoteNodeAddress)
	if err != nil {
		return err
	}

	remoteClient := protocolconnect.NewStreamServiceClient(http.DefaultClient, remote.Url)

	response, err := remoteClient.GetStream(ctx, connect.NewRequest(&protocol.GetStreamRequest{
		StreamId: streamID[:],
		Optional: false,
	}))
	if err != nil {
		return err
	}

	stream := response.Msg.GetStream()
	fmt.Println("MBs: ", len(stream.GetMiniblocks()), " Events: ", len(stream.GetEvents()))

	for i, mb := range stream.GetMiniblocks() {
		info, err := events.NewMiniblockInfoFromProto(
			mb, stream.GetSnapshotByMiniblockIndex(i),
			events.NewParsedMiniblockInfoOpts().
				WithDoNotParseEvents(true),
		)
		if err != nil {
			return err
		}

		fmt.Print(info.Ref, "  ", info.Header().GetTimestamp().AsTime().Local())
		if info.Header().IsSnapshot() {
			fmt.Print(" SNAPSHOT")
		}
		fmt.Println()
	}

	return nil
}

func runStreamPartitionCmd(cmd *cobra.Command, args []string) error {
	streamID, err := shared.StreamIdFromString(args[0])
	if err != nil {
		return err
	}

	suffix := storage.CreatePartitionSuffix(streamID, 256)
	fmt.Printf("Partition for %v is %v\n", streamID, suffix)

	return nil
}

func init() {
	cmdStream := &cobra.Command{
		Use:   "stream",
		Short: "Access stream data",
	}

	cmdStreamGetEvent := &cobra.Command{
		Use:   "event",
		Short: "Get event <stream-id> <event-hash> [max-block-range]",
		Long: `Dump stream event to stdout.
max-block-range is optional and limits the number of blocks to consider (default=100)`,
		Args: cobra.RangeArgs(2, 3),
		RunE: runStreamGetEventCmd,
	}

	cmdStreamGetMiniblock := &cobra.Command{
		Use:   "miniblock",
		Short: "Get Miniblock <stream-id> <block-hash> [max-block-range]",
		Long: `Dump miniblock content to stdout.
max-block-range is optional and limits the number of blocks to consider (default=100)`,
		Args: cobra.RangeArgs(2, 3),
		RunE: runStreamGetMiniblockCmd,
	}

	cmdStreamGetMiniblockNum := &cobra.Command{
		Use:   "miniblock-num",
		Short: "Get Miniblock <stream-id> <miniblockNum>",
		Long:  `Dump miniblock content to stdout.`,
		Args:  cobra.ExactArgs(2),
		RunE:  runStreamGetMiniblockNumCmd,
	}

	cmdStreamDump := &cobra.Command{
		Use:   "dump",
		Short: "Dump stream contents <stream-id> [max-block-range]",
		Long: `Dump stream content to stdout.
max-block-range is optional and limits the number of blocks to consider (default=100)`,
		Args: cobra.RangeArgs(1, 2),
		RunE: runStreamDumpCmd,
	}

	cmdStreamNodeDump := &cobra.Command{
		Use:   "node-dump",
		Short: "Dump stream contents from node <node-address> <stream-id> <chunk-size>",
		Long:  `Dump stream content to stdout, connecting directly to the requested node.`,
		Args:  cobra.RangeArgs(2, 3),
		RunE:  runStreamNodeDumpCmd,
	}

	cmdStreamGet := &cobra.Command{
		Use:   "get <stream-id>",
		Short: "Get stream contents",
		Long:  `Get stream content from node using GetStream RPC.`,
		Args:  cobra.ExactArgs(1),
		RunE:  runStreamGetCmd,
	}
	cmdStreamGetPartition := &cobra.Command{
		Use:   "part <stream-id>",
		Short: "Get stream stream database partition",
		Long:  `Get partition in database where the stream is stored (assuming 256 total partitions)`,
		Args:  cobra.RangeArgs(1, 1),
		RunE:  runStreamPartitionCmd,
	}

	cmdStream.AddCommand(cmdStreamGetMiniblock)
	cmdStream.AddCommand(cmdStreamGetMiniblockNum)
	cmdStream.AddCommand(cmdStreamGetEvent)
	cmdStream.AddCommand(cmdStreamDump)
	cmdStream.AddCommand(cmdStreamNodeDump)
	cmdStream.AddCommand(cmdStreamGet)
	cmdStream.AddCommand(cmdStreamGetPartition)
	rootCmd.AddCommand(cmdStream)
}
