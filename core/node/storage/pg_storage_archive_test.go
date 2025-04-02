package storage

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/require"

	. "github.com/towns-protocol/towns/core/node/base"
	. "github.com/towns-protocol/towns/core/node/protocol"
	. "github.com/towns-protocol/towns/core/node/shared"
	"github.com/towns-protocol/towns/core/node/testutils"
)

func mbDataForNumb(n int64) *WriteMiniblockData {
	return &WriteMiniblockData{
		Data: []byte(fmt.Sprintf("data-%d", n)),
	}
}

func TestArchive(t *testing.T) {
	params := setupStreamStorageTest(t)
	require := require.New(t)

	ctx := params.ctx
	pgStreamStore := params.pgStreamStore
	defer params.closer()

	streamId1 := testutils.FakeStreamId(STREAM_CHANNEL_BIN)

	_, err := pgStreamStore.GetMaxArchivedMiniblockNumber(ctx, streamId1)
	require.Error(err)
	require.Equal(Err_NOT_FOUND, AsRiverError(err).Code)

	err = pgStreamStore.CreateStreamArchiveStorage(ctx, streamId1)
	require.NoError(err)

	err = pgStreamStore.CreateStreamArchiveStorage(ctx, streamId1)
	require.Error(err)
	require.Equal(Err_ALREADY_EXISTS, AsRiverError(err).Code)

	bn, err := pgStreamStore.GetMaxArchivedMiniblockNumber(ctx, streamId1)
	require.NoError(err)
	require.Equal(int64(-1), bn)

	data := []*WriteMiniblockData{
		mbDataForNumb(0),
		mbDataForNumb(1),
		mbDataForNumb(2),
	}

	err = pgStreamStore.WriteArchiveMiniblocks(ctx, streamId1, 1, data)
	require.Error(err)

	err = pgStreamStore.WriteArchiveMiniblocks(ctx, streamId1, 0, data)
	require.NoError(err)

	readMBs, err := pgStreamStore.ReadMiniblocks(ctx, streamId1, 0, 3)
	require.NoError(err)
	require.Len(readMBs, 3)
	require.Equal([]*MiniblockDescriptor{
		{Number: 0, Data: data[0].Data},
		{Number: 1, Data: data[1].Data},
		{Number: 2, Data: data[2].Data},
	}, readMBs)

	data2 := []*WriteMiniblockData{
		mbDataForNumb(3),
		mbDataForNumb(4),
		mbDataForNumb(5),
	}

	bn, err = pgStreamStore.GetMaxArchivedMiniblockNumber(ctx, streamId1)
	require.NoError(err)
	require.Equal(int64(2), bn)

	err = pgStreamStore.WriteArchiveMiniblocks(ctx, streamId1, 2, data2)
	require.Error(err)

	err = pgStreamStore.WriteArchiveMiniblocks(ctx, streamId1, 10, data2)
	require.Error(err)

	err = pgStreamStore.WriteArchiveMiniblocks(ctx, streamId1, 3, data2)
	require.NoError(err)

	readMBs, err = pgStreamStore.ReadMiniblocks(ctx, streamId1, 0, 8)
	require.NoError(err)
	require.Equal([]*MiniblockDescriptor{
		{Number: 0, Data: data[0].Data},
		{Number: 1, Data: data[1].Data},
		{Number: 2, Data: data[2].Data},
		{Number: 3, Data: data2[0].Data},
		{Number: 4, Data: data2[1].Data},
		{Number: 5, Data: data2[2].Data},
	}, readMBs)

	bn, err = pgStreamStore.GetMaxArchivedMiniblockNumber(ctx, streamId1)
	require.NoError(err)
	require.Equal(int64(5), bn)
}
